/**
 * Codemod to:
 * 1. Add "const dispatch = useAppDispatch();" inside the component body.
 * 2. Replace function calls with "dispatch(functionName({ payload }))".
 * 3. Remove the specified function name from a context destructuring statement.
 * 
 * Usage:
 * jscodeshift -t updateFunctionToDispatch.js <path_to_files> --functionName=handleClick --parameters=title,description --contextName=ExampleOneContext
 */
module.exports = function (fileInfo, api, options) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    // Parse options
    const functionName = options.functionName || "setStateValueTwo";
    const parameters = (options.parameters || "stringVal").split(",").map((p) => p.trim());
    const contextName = options.contextName || "useExampleTwoContext";

    if (!functionName || parameters.length === 0 || !contextName) {
        throw new Error(
            "You must specify --functionName, --parameters, and --contextName options for this codemod."
        );
    }

    /**
     * Add "const dispatch = useAppDispatch();" inside a React component
     */
    const addDispatchInsideComponent = (componentBody) => {
        // const hasDispatch = componentBody.some((path) =>
        //     j.VariableDeclarator.check(path.value) &&
        //     path.value.id.name === "dispatch"
        // );

        // if (!hasDispatch) {
        //     const dispatchDeclaration = j.variableDeclaration("const", [
        //         j.variableDeclarator(
        //             j.identifier("dispatch"),
        //             j.callExpression(j.identifier("useAppDispatch"), [])
        //         ),
        //     ]);
        //     componentBody.unshift(dispatchDeclaration);
        // }
    };

    /**
     * Remove the function name from the destructured context.
     */
    const removeFunctionFromDestructuring = () => {
        root.find(j.VariableDeclaration)
            .filter((path) => {
                return (
                    (path.value.declarations[0]?.init?.callee?.name === "useContext" &&
                        path.value.declarations[0]?.init?.arguments[0]?.name === contextName) || (path.value.declarations[0]?.init?.callee?.name === contextName)
                );
            })
            .forEach((path) => {
                const destructuredProperties = path.value.declarations[0]?.id?.properties;
                if (destructuredProperties) {
                    path.value.declarations[0].id.properties = destructuredProperties.filter(
                        (property) => property.key.name !== functionName
                    );
                }
            });
    };

    /**
     * Replace the function calls with dispatch(functionName({ payload })).
     */
    const replaceFunctionCalls = () => {
        root.find(j.CallExpression, { callee: { name: functionName } }).forEach((path) => {
            const args = path.value.arguments;

            // Build the payload object for dispatch
            const payload = j.objectExpression(
                parameters.map((param, index) => {
                    const value = args[index] || j.identifier("undefined");
                    return j.property("init", j.identifier(param), value);
                })
            );

            // Replace the function call with a dispatch statement
            j(path).replaceWith(
                j.callExpression(j.identifier("dispatch"), [
                    j.callExpression(j.identifier(functionName), [payload]),
                ])
            );
        });
    };

    /**
     * Process all React components (arrow functions and function declarations).
     */
    const processReactComponents = () => {
        // Handle arrow function components
        root.find(j.VariableDeclaration)
            .filter((path) => {
                const declarations = path.value.declarations;
                return (
                    declarations &&
                    declarations[0]?.init?.type === "ArrowFunctionExpression"
                );
            })
            .forEach((path) => {
                const functionBody = path.value.declarations[0].init.body.body;
                addDispatchInsideComponent(functionBody);
            });

        // Handle function declarations
        root.find(j.FunctionDeclaration).forEach((path) => {
            const functionBody = path.value.body.body;
            addDispatchInsideComponent(functionBody);
        });
    };

    // Run the transformations
    processReactComponents();
    replaceFunctionCalls();
    removeFunctionFromDestructuring();

    return root.toSource();
};
