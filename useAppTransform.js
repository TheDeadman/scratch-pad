module.exports = function (file, api, options) {
    const j = api.jscodeshift;
    const root = j(file.source);

    // If you need TS parsing, either specify via CLI:
    //   jscodeshift --parser=ts -t transform.ts file.ts
    // or do:
    //   const parser = options.parser || 'ts';
    //   and then pass { parser } to jscodeshift calls, etc.

    const HOOKS = ['useAppSelector', 'useAppDispatch'];
    const usedHooks = new Set();

    // 1. Find any usage of these hooks in the code (identifier references).
    root
        .find(j.Identifier)
        .filter((path) => HOOKS.includes(path.value.name))
        .forEach((path) => {
            usedHooks.add(path.value.name);
        });

    if (usedHooks.size === 0) {
        // No references in this file
        return file.source;
    }

    // 2. Remove these hooks from *any* existing import declaration that is not from "store/hooks".
    root.find(j.ImportDeclaration).forEach((importPath) => {
        const { node } = importPath;
        if (node.source.value !== 'store/hooks') {
            // Filter out specifiers that match our hooks
            if (node.specifiers && node.specifiers.length > 0) {
                node.specifiers = node.specifiers.filter(
                    (specifier) =>
                        !(
                            specifier.type === 'ImportSpecifier' &&
                            HOOKS.includes(specifier.imported.name)
                        )
                );
            }
        }
    });

    // 3. Ensure that these hooks are imported from "store/hooks".
    //    We search for any import declarations where
    //    (source.value === 'store/hooks')
    //    AND (importKind is 'value' or 'type' or not present).
    let storeHooksImport = root.find(j.ImportDeclaration, (node) => {
        return (
            node.source.value === 'store/hooks' &&
            (
                // If importKind isn't present, or is 'value' or 'type'
                node.importKind === undefined ||
                node.importKind === 'value' ||
                node.importKind === 'type'
            )
        );
    });

    if (storeHooksImport.size() === 0) {
        // If we don't find an existing import from "store/hooks", create it
        // By default, we'll create a normal (value) import.
        const newImport = j.importDeclaration(
            [...usedHooks].map((h) => j.importSpecifier(j.identifier(h))),
            j.stringLiteral('store/hooks')
        );
        root.get().node.program.body.unshift(newImport);
    } else {
        // If an import from "store/hooks" exists, add the missing specifiers
        // Use `.nodes()` to avoid issues with `.get('node')`
        const storeHooksImportNode = storeHooksImport.nodes()[0];
        if (!storeHooksImportNode) {
            return file.source; // Safety check: if there's truly no node, exit
        }

        // Ensure specifiers is at least an empty array
        storeHooksImportNode.specifiers = storeHooksImportNode.specifiers || [];

        // Build a set of already-imported identifiers
        const existingSpecifiers = new Set(
            storeHooksImportNode.specifiers
                .filter((s) => s.type === 'ImportSpecifier')
                .map((s) => s.imported.name)
        );

        // For each used hook, if it's not in the import, add it
        usedHooks.forEach((hookName) => {
            if (!existingSpecifiers.has(hookName)) {
                storeHooksImportNode.specifiers.push(j.importSpecifier(j.identifier(hookName)));
            }
        });
    }

    return root.toSource();
};
