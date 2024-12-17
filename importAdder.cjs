export default function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    // The import path and named imports to add
    const importPath = './myModule'; // Replace with your file path
    const namedImportsToAdd = ['myFunction', 'myConstant']; // Replace with the imports you need

    // Find existing import from the specific path
    const existingImport = root.find(j.ImportDeclaration, {
        source: { value: importPath },
    });

    if (existingImport.size()) {
        // Case 1: Import already exists
        existingImport.forEach(path => {
            const specifiers = path.node.specifiers;

            // Add the named imports if they don't already exist
            namedImportsToAdd.forEach(name => {
                if (!specifiers.some(s => s.imported && s.imported.name === name)) {
                    specifiers.push(
                        j.importSpecifier(j.identifier(name))
                    );
                }
            });
        });
    } else {
        // Case 2: Import doesn't exist, create a new one
        const newImport = j.importDeclaration(
            namedImportsToAdd.map(name => j.importSpecifier(j.identifier(name))),
            j.literal(importPath)
        );

        // Insert the new import at the top of the file
        root.get().node.program.body.unshift(newImport);
    }

    return root.toSource();
}
