
//jscodeshift -t replace-context-with-redux.ts "src/**/*.tsx" \
//--parser=tsx \
//--contextImportPath="contexts/examples/ExampleContext" \
//--reduxImportPath="exampleSlice.ts" \
//--hooksImportPath="store/hooks" \
//--contextValues="exampleValueOne,exampleValueTwo" \
//--reduxSelectors='{"exampleValueOne":"selectExampleValueOne","exampleValueTwo":"selectExampleValueTwo"}'


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
    const reduxSelectors: Record<string, string> = JSON.parse(options.reduxSelectors || '{}');

    // Step 1: Find `useContext` usage
    root.find(j.VariableDeclarator, {
        id: { type: 'ObjectPattern' },
        init: { callee: { name: 'useContext' } }
    })
        .forEach(path => {
            const objectPattern = path.node.id as any;
            const newProperties = objectPattern.properties.filter((prop: any) =>
                !contextValuesToReplace.includes(prop.key.name)
            );

            // If no properties remain, remove the entire declaration
            if (newProperties.length === 0) {
                j(path).remove();
            } else {
                objectPattern.properties = newProperties;
            }
        });

    // Step 2: Add Redux `useAppSelector` calls, preserving TypeScript type annotations
    const useAppSelectorCalls = Object.entries(reduxSelectors).map(([contextVar, reduxSelector]) =>
        j.variableDeclaration("const", [
            j.variableDeclarator(
                j.identifier(contextVar),
                j.callExpression(
                    j.identifier("useAppSelector"),
                    [j.identifier(reduxSelector)]
                )
            )
        ])
    );

    // Insert Redux selector calls after the first useContext call
    root.find(j.VariableDeclaration)
        .filter(path => path.value.declarations.some(decl =>
            decl.init && decl.init.callee && decl.init.callee.name === "useContext"
        ))
        .forEach(path => {
            j(path).insertAfter(useAppSelectorCalls);
        });

    // Step 3: Update imports by removing old context references
    root.find(j.ImportDeclaration)
        .forEach(path => {
            if (path.node.source.value === contextImportPath) {
                path.node.specifiers = path.node.specifiers.filter(specifier =>
                    specifier.imported && !contextValuesToReplace.includes(specifier.imported.name)
                );
            }
        });

    // Step 4: Ensure `useAppSelector` import exists
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

    // Step 5: Ensure Redux selectors import exists
    const reduxSelectorImports = Object.values(reduxSelectors).map(selector =>
        j.importSpecifier(j.identifier(selector))
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

    return root.toSource();
}
