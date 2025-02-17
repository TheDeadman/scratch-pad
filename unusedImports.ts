import { API, FileInfo, Options, JSCodeshift } from "jscodeshift";

export default function transformer(
    file: FileInfo,
    api: API,
    options: Options
) {
    const j: JSCodeshift = api.jscodeshift;
    const root = j(file.source);

    // Step 1: Collect all import specifiers
    const importedIdentifiers = new Set<string>();
    root.find(j.ImportDeclaration).forEach(path => {
        path.node.specifiers?.forEach(specifier => {
            if (specifier.type === "ImportSpecifier" || specifier.type === "ImportDefaultSpecifier" || specifier.type === "ImportNamespaceSpecifier") {
                importedIdentifiers.add(specifier.local?.name || "");
            }
        });
    });

    // Step 2: Identify used variables
    const usedIdentifiers = new Set<string>();
    root.find(j.Identifier).forEach(path => {
        if (!path.parentPath.value || path.parentPath.value.type !== "ImportSpecifier") {
            usedIdentifiers.add(path.node.name);
        }
    });

    // Step 3: Remove unused imports
    root.find(j.ImportDeclaration)
        .forEach(path => {
            path.node.specifiers = path.node.specifiers?.filter(specifier => {
                return usedIdentifiers.has(specifier.local?.name || "");
            }) || [];

            // If no specifiers remain, remove the whole import statement
            if (path.node.specifiers.length === 0) {
                j(path).remove();
            }
        });

    return root.toSource();
}
