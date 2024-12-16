/**
 * Codemod to replace specific fields from useContext with Redux selectors.
 * Usage: jscodeshift -t replaceContextWithSelector.js <path_to_files> --contextName=ExampleContext --field=fieldTwo --selector=selectFieldTwo
 */
module.exports = function (fileInfo, api, options) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    // Parse options
    const contextName = options.contextName || "ExampleContext";
    const fieldToReplace = options.field || "fieldTwo";
    const selectorName = options.selector || "selectFieldTwo";

    // Find the useContext call for the specified context
    const useContextDeclaration = root.find(j.VariableDeclaration).filter((path) => {
        const declaration = path.value.declarations[0];
        return (
            j.VariableDeclarator.check(declaration) &&
            j.ObjectPattern.check(declaration.id) &&
            j.CallExpression.check(declaration.init) &&
            declaration.init.callee.name === "useContext" &&
            declaration.init.arguments[0]?.name === contextName
        );
    });

    // If no matching useContext declaration is found, skip transformation
    if (useContextDeclaration.size() === 0) {
        return fileInfo.source;
    }

    // Replace the specific field with a Redux selector
    useContextDeclaration.forEach((path) => {
        const objectPattern = path.value.declarations[0].id;

        // Find and remove the fieldToReplace from the destructuring
        const remainingProperties = objectPattern.properties.filter(
            (prop) => prop.key.name !== fieldToReplace
        );

        // Update the original useContext destructuring
        objectPattern.properties = remainingProperties;

        // Insert the Redux selector assignment above the useContext declaration
        const selectorDeclaration = j.variableDeclaration("const", [
            j.variableDeclarator(
                j.identifier(fieldToReplace),
                j.callExpression(j.identifier("useAppSelector"), [
                    j.identifier(selectorName),
                ])
            ),
        ]);

        j(path).insertBefore(selectorDeclaration);
    });

    return root.toSource();
};
