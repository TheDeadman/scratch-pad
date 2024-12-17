export default function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    // The import path and named imports to add
    const importPath = 'exampleFiles/slices/exampleOneSlice'; // Replace with your file path
    const namedImportsToAdd = ['selectOneStateValueOne', 'selectTwoStateValueOne']; // Replace with the imports you need

    // Step 1: Check if any of the named imports are used in the file
    const isNamedImportUsed = namedImportsToAdd.some((name) => {
        return root.find(j.Identifier, { name }).size() > 0;
    });

    if (!isNamedImportUsed) {
        // If none of the named imports are used, return the original file
        return file.source;
    }

    // Step 2: Find existing import from the specific path
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
