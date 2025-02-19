export function findAndModifyUseContext(j, root, contextName, contextValuesToReplace, usedSelectors, contextSettersToReplace, usedSetters) {
    root.find(j.VariableDeclarator, {
        id: { type: 'ObjectPattern' },
        init: { callee: { name: contextName } }
    })
        .forEach(path => {

            // Ensure that we found the Desired context
            // if (path.node.init.arguments[0]?.name === contextName) {
            const objectPattern = path.node.id;
            const newProperties = objectPattern.properties.filter(prop => {
                if (contextValuesToReplace.includes(prop.key.name)) {
                    usedSelectors.add(prop.key.name);
                    return false;
                }
                if (contextSettersToReplace.includes(prop.key.name)) {
                    usedSetters.add(prop.key.name);
                    return false;
                }
                return true;
            });

            // If all properties are removed, remove the entire `useContext`
            if (newProperties.length === 0) {
                objectPattern.properties = newProperties;
                j(path).remove();
            } else {
                objectPattern.properties = newProperties;
            }
            // }
        });
    root.find(j.VariableDeclarator, {
        id: { type: 'ObjectPattern' },
        init: { callee: { name: 'useContext' } }
    })
        .forEach(path => {

            // Ensure that we found the Desired context
            if (path.node.init.arguments[0]?.name === contextName) {
                const objectPattern = path.node.id;
                const newProperties = objectPattern.properties.filter(prop => {
                    if (contextValuesToReplace.includes(prop.key.name)) {
                        usedSelectors.add(prop.key.name);
                        return false;
                    }
                    if (contextSettersToReplace.includes(prop.key.name)) {
                        usedSetters.add(prop.key.name);
                        return false;
                    }
                    return true;
                });

                // If all properties are removed, remove the entire `useContext`
                if (newProperties.length === 0) {
                    objectPattern.properties = newProperties;
                    j(path).remove();
                } else {
                    objectPattern.properties = newProperties;
                }
            }
        });
}