export function insertAtTopOfComponent(j, root, nodes) {
    // Handle inserting into function components
    root.find(j.FunctionDeclaration).forEach(path => {
        if (path.value.body && path.value.body.type === "BlockStatement" && path.parent.parent.value.type === "Program") {
            // Remove the useAppDispatch call if found so that we can ensure that it is the first item inserted in the component.
            j(path)
                .find(j.VariableDeclaration)
                .filter(declPath => declPath.value.declarations.some(d => d.init?.callee?.name === "useAppDispatch"))
                .remove();

            // Insert useAppDispatch and selectors
            const firstNonImportIndex = path.value.body.body.findIndex(node => node.type !== "ImportDeclaration");
            if (firstNonImportIndex !== -1) {
                path.value.body.body.splice(firstNonImportIndex, 0, ...nodes);
            } else {
                path.value.body.body.unshift(...nodes);
            }
        }
    });

    // Handle inserting into arrow function components
    root.find(j.VariableDeclarator)
        .filter(path => path.parent.value.type === "VariableDeclaration" && path.parent.parent.value.type === "Program")
        .forEach(path => {
            if (path.node.init && path.node.init.type === "ArrowFunctionExpression" && path.node.init.body.type === "BlockStatement") {
                const body = path.node.init.body.body
                // Remove the useAppDispatch call if found so that we can ensure that it is the first item inserted in the component.
                j(path)
                    .find(j.VariableDeclaration)
                    .filter(declPath => declPath.value.declarations.some(d => d.init?.callee?.name === "useAppDispatch"))
                    .remove();

                // Insert useAppDispatch and selectors

                const firstNonImportIndex = body.findIndex(node => node.type !== "ImportDeclaration");
                if (firstNonImportIndex !== -1) {
                    body.splice(firstNonImportIndex, 0, ...nodes);
                } else {
                    body.unshift(...nodes);
                }

            }
        });


    // Handle inserting into memoized components
    root.find(j.VariableDeclarator)
        .filter(path => path.parent.value.type === "VariableDeclaration" && path.parent.parent.value.type === "Program" && path.value.init?.callee?.name === "memo")
        .forEach(path => {
            if (path.node.init && path.node.init.type === "CallExpression") {
                const body = path.node.init.arguments[0].body.body;

                // Remove the useAppDispatch call if found so that we can ensure that it is the first item inserted in the component.
                j(path)
                    .find(j.VariableDeclaration)
                    .filter(declPath => declPath.value.declarations.some(d => d.init?.callee?.name === "useAppDispatch"))
                    .remove();

                // Insert useAppDispatch and selectors
                const firstNonImportIndex = body.findIndex(node => node.type !== "ImportDeclaration");
                if (firstNonImportIndex !== -1) {
                    body.splice(firstNonImportIndex, 0, ...nodes);
                } else {
                    body.unshift(...nodes);
                }
            }
        });
}