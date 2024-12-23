/**
 * A jscodeshift transform that:
 * 1. Detects references to `useAppSelector` or `useAppDispatch`.
 * 2. Ensures they are imported from "store/hooks".
 * 3. Removes them from all other imports.
 *
 * Usage:
 *   jscodeshift -t use-app-transform.js <fileOrDirectory>
 */

module.exports = function (file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    // These are the hooks we care about:
    const HOOKS = ['useAppSelector', 'useAppDispatch'];

    // Track usage of these hooks so we know whether to add them
    let usedHooks = new Set();

    // 1. Find any usage of these hooks in the code (identifier references).
    root
        .find(j.Identifier)
        .filter((path) => HOOKS.includes(path.value.name))
        .forEach((path) => {
            usedHooks.add(path.value.name);
        });

    if (usedHooks.size === 0) {
        // No references in this file; no changes to do
        return file.source;
    }

    // 2. Remove these hooks from *any* existing import declaration that is not from "store/hooks".
    root.find(j.ImportDeclaration).forEach((importPath) => {
        const { node } = importPath;
        if (node.source.value !== 'store/hooks') {
            // Filter out specifiers that match our hooks
            node.specifiers = node.specifiers
                ? node.specifiers.filter(
                    (specifier) =>
                        !(
                            specifier.type === 'ImportSpecifier' &&
                            HOOKS.includes(specifier.imported.name)
                        )
                )
                : node.specifiers;
        }
    });

    // 3. Ensure that these hooks are imported from "store/hooks".
    // Check if there's already an import from "store/hooks"
    let storeHooksImport = root
        .find(j.ImportDeclaration, { source: { value: 'store/hooks' } })
        .at(0);

    if (!storeHooksImport.size()) {
        // If we don't find an existing import from "store/hooks", create it
        const newImport = j.importDeclaration(
            [...usedHooks].map((h) => j.importSpecifier(j.identifier(h))),
            j.stringLiteral('store/hooks')
        );
        // Insert at top of file
        root.get().node.program.body.unshift(newImport);
    } else {
        // If an import from "store/hooks" exists, add the missing specifiers
        const storeHooksImportNode = storeHooksImport.get('node').value;

        // Safely default specifiers to an empty array if missing
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
