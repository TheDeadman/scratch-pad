/**
 * Codemod to update function calls to dispatch actions with structured payloads.
 * Usage: jscodeshift -t updateFunctionToDispatch.js <path_to_files> --functionName=handleClick --parameters=title,description
 */
module.exports = function (fileInfo, api, options) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    // Parse options
    const functionName = options.functionName || "handleClick";
    const parameters = (options.parameters || "").split(",").map((p) => p.trim());

    if (!functionName || parameters.length === 0) {
        throw new Error(
            "You must specify --functionName and --parameters options for this codemod."
        );
    }

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
