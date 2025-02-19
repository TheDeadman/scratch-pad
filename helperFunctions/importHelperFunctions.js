
export function ensureNamedImport(j, root, functionName, importPath) {
    // Check if the function is used anywhere in the file
    const isFunctionUsed = root.find(j.Identifier, { name: functionName }).size() > 1;
    // `.size() > 1` because one occurrence might be from an existing import

    // Find import statements from the specified importPath
    const importCollection = root.find(j.ImportDeclaration, { source: { value: importPath } });

    if (isFunctionUsed) {
        console.log("used");
        // ✅ Ensure the function is imported
        if (importCollection.size() > 0) {
            // Modify existing import
            importCollection.forEach(path => {
                const specifiers = path.node.specifiers;

                // Check if the function is already imported
                const isAlreadyImported = specifiers.some(
                    specifier =>
                        j.ImportSpecifier.check(specifier) &&
                        specifier.imported.name === functionName
                );

                // Add the import if missing
                if (!isAlreadyImported) {
                    specifiers.push(j.importSpecifier(j.identifier(functionName)));
                }
            });
        } else {
            // Create a new import statement
            const newImport = j.importDeclaration(
                [j.importSpecifier(j.identifier(functionName))],
                j.literal(importPath)
            );

            // Insert at the top of the file
            root.get().node.program.body.unshift(newImport);
        }
    } else {
        console.log("not used")
        // ❌ Remove the function import if it exists
        importCollection.forEach(path => {
            path.node.specifiers = path.node.specifiers.filter(
                specifier => !(j.ImportSpecifier.check(specifier) && specifier.imported.name === functionName)
            );

            // If no specifiers remain, remove the entire import statement
            if (path.node.specifiers.length === 0) {
                j(path).remove();
            }
        });
    }
}


export function createImportStatement(j, root, importPath) {
    root.get().node.program.body.unshift(
        j.importDeclaration(
            [],
            j.literal(importPath)
        )
    );
}

export function isImportStatementPresent(j, root, importPath) {
    return root.find(j.ImportDeclaration, {
        source: { value: importPath }
    }).size() > 0;
}

export function addSpecifierImport(j, root, importPath, newSpecifier) {
    if (!isImportStatementPresent(j, root, importPath)) {
        createImportStatement(j, root, importPath)
    }
    root.find(j.ImportDeclaration, {
        source: { value: importPath }
    }).forEach(node => {
        // loop through the specifiers to see if the import is needed
        let isSpecifierFound = false;
        node.value.specifiers.forEach(specifier => {
            if (specifier.imported.name === newSpecifier) {
                isSpecifierFound = true;
            }
        });
        // if (!isSpecifierFound) {
        node.value.specifiers.push(j.importSpecifier(j.identifier(newSpecifier)));
        // }
    });
}

export function dedupeAndSortImports(j, root, importPath) {
    root.find(j.ImportDeclaration, {
        source: { value: importPath }
    }).forEach(node => {
        let specifierSet = node.value.specifiers;
        node.value.specifiers = specifierSet.filter((obj, index, selfArray) => {
            return index === selfArray.findIndex(o => o.imported.name === obj.imported.name);
        }).sort((a, b) => a.imported.name.localeCompare(b.imported.name));
    });
}

export function removeNamedImport(j, root, importPath, importName) {
    root.find(j.ImportDeclaration, { source: { value: importPath } }).forEach(path => {
        const specifiers = path.node.specifiers;

        // Remove `useContext` from the named imports
        const filteredSpecifiers = specifiers.filter(
            specifier => !(j.ImportSpecifier.check(specifier) && specifier.imported.name === importName)
        );

        if (filteredSpecifiers.length > 0) {
            // Update the import statement with the remaining specifiers
            path.node.specifiers = filteredSpecifiers;
        } else {
            // Remove the entire import if it's now empty
            j(path).remove();
        }
    });
}