/**
 * Codemod to update function calls to dispatch actions with structured payloads and add "const dispatch = useAppDispatch();".
 * Usage: jscodeshift -t updateFunctionToDispatch.js <path_to_files> --functionName=handleClick --parameters=title,description
 */
module.exports = function (fileInfo, api, options) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    // Parse options
    const functionName = options.functionName || "setStateValueOne";
    const parameters = (options.parameters || "stringVal").split(",").map((p) => p.trim());

    if (!functionName || parameters.length === 0) {
        throw new Error(
            "You must specify --functionName and --parameters options for this codemod."
        );
    }

    // Add "const dispatch = useAppDispatch();" at the top of the component if it doesn't exist
    const useAppDispatchDeclaration = j.variableDeclaration("const", [
        j.variableDeclarator(
            j.identifier("dispatch"),
            j.callExpression(j.identifier("useAppDispatch"), [])
        ),
    ]);

    const addDispatchIfNotExists = () => {
        const importUseAppDispatch = root.find(j.ImportDeclaration, {
            source: { value: "react-redux" },
        });

        const body = root.find(j.VariableDeclaration, {
            declarations: [{ id: { name: "dispatch" } }],
        });

        // If "dispatch" is not declared, add it right after the imports
        if (body.size() === 0) {
            root
                .find(j.Program)
                .get("body")
                .unshift(useAppDispatchDeclaration);
        }
    };

    // Run the function to add the dispatch declaration
    addDispatchIfNotExists();

    // Find all calls to the specified function
    root
        .find(j.CallExpression, {
            callee: { name: functionName },
        })
        .forEach((path) => {
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

    return root.toSource();
};
