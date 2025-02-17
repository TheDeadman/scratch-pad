import { API, FileInfo, Options, JSCodeshift } from "jscodeshift";

export default function transformer(
    file: FileInfo,
    api: API,
    options: Options
) {
    const j: JSCodeshift = api.jscodeshift;
    const root = j(file.source);

    // Get options from the command line
    const contextImportPath = options.contextImportPath || 'contexts/examples/ExampleContext';
    const reduxImportPath = options.reduxImportPath || 'exampleSlice.ts';
    const hooksImportPath = options.hooksImportPath || 'store/hooks';

    // Values to be replaced from context
    const contextValuesToReplace: string[] = (options.contextValues || '').split(',').map(v => v.trim());

    // Redux selectors mapping (context variable -> Redux selector)
    let reduxSelectors: Record<string, string> = {};
    try {
        reduxSelectors = JSON.parse(options.reduxSelectors || '{}');
    } catch (error) {
        console.error("Invalid JSON format for --reduxSelectors. Ensure it's properly escaped.");
        process.exit(1);
    }

    let contextRemoved = false;
    const usedSelectors = new Set<string>();

    // Step 1: Find and modify `useContext` usage
    root.find(j.VariableDeclarator, {
        id: { type: 'ObjectPattern' },
        init: { callee: { name: 'useContext' } }
    })
        .forEach(path => {
            const objectPattern = path.node.id as any;
            const newProperties = objectPattern.properties.filter((prop: any) => {
                if (contextValuesToReplace.includes(prop.key.name)) {
                    usedSelectors.add(prop.key.name);
                    return false;
                }
                return true;
            });

            // If all properties are removed, remove the entire `useContext`
            if (newProperties.length === 0) {
                j(path).remove();
                contextRemoved = true;
            } else {
                objectPattern.properties = newProperties;
            }
        });

    // Step 2: Generate Redux `useAppSelector` calls
    const useAppSelectorCalls = Array.from(usedSelectors).map((contextVar) => {
        return j.variableDeclaration("const", [
            j.variableDeclarator(
                j.identifier(contextVar),
                j.callExpression(
                    j.identifier("useAppSelector"),
                    [j.identifier(reduxSelectors[contextVar])]
                )
            )
        ]);
    });

    // Step 3: Insert Redux selectors
    if (usedSelectors.size > 0) {
        if (contextRemoved) {
            // If `useContext` is fully removed, insert Redux selectors at the top of the function body
            root.find(j.FunctionDeclaration).forEach(path => {
                path.get('body', 'body').unshift(...useAppSelectorCalls);
            });

            root.find(j.ArrowFunctionExpression).forEach(path => {
                if (path.parent.value.type === 'VariableDeclarator') {
                    path.parent.parent.value.declarations[0].init.body.body.unshift(...useAppSelectorCalls);
                }
            });
        } else {
            // Insert Redux selectors after first `useContext` call
            root.find(j.VariableDeclaration)
                .filter(path => path.value.declarations.some(decl =>
                    decl.init && decl.init.callee && decl.init.callee.name === "useContext"
                ))
                .forEach(path => {
                    j(path).insertAfter(useAppSelectorCalls);
                });
        }
    }

    // Step 4: Update imports (remove old context references)
    root.find(j.ImportDeclaration)
        .forEach(path => {
            if (path.node.source.value === contextImportPath) {
                path.node.specifiers = path.node.specifiers.filter(specifier =>
                    specifier.imported && !contextValuesToReplace.includes(specifier.imported.name)
                );

                // If import is empty, remove it
                if (path.node.specifiers.length === 0) {
                    j(path).remove();
                }
            }
        });

    // Step 5: Ensure `useAppSelector` import exists only if used
    if (usedSelectors.size > 0) {
        const existingHookImport = root.find(j.ImportDeclaration, {
            source: { value: hooksImportPath }
        });

        if (existingHookImport.length === 0) {
            root.get().node.program.body.unshift(
                j.importDeclaration(
                    [j.importSpecifier(j.identifier("useAppSelector"))],
                    j.literal(hooksImportPath)
                )
            );
        }
    }

    // Step 6: Ensure Redux selectors import exists only if used
    if (usedSelectors.size > 0) {
        const reduxSelectorImports = Array.from(usedSelectors).map(contextVar =>
            j.importSpecifier(j.identifier(reduxSelectors[contextVar]))
        );

        const existingReduxImport = root.find(j.ImportDeclaration, {
            source: { value: reduxImportPath }
        });

        if (existingReduxImport.length === 0) {
            root.get().node.program.body.unshift(
                j.importDeclaration(reduxSelectorImports, j.literal(reduxImportPath))
            );
        } else {
            existingReduxImport.get().node.specifiers.push(...reduxSelectorImports);
        }
    }

    return root.toSource();
}
