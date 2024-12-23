/**
 * Remove empty destructurings of useContext, e.g. `const {} = useContext(...)`.
 *
 * Usage:
 *   jscodeshift -t removeEmptyUseContext.js <file or directory>
 */
module.exports = function removeEmptyUseContext(fileInfo, { j }, options) {
    const root = j(fileInfo.source);

    root
        .find(j.VariableDeclaration)
        .filter((path) => {
            // We only remove a VariableDeclaration if **any** of its declarators
            // match our pattern: empty object pattern = call to `useContext`.
            return path.node.declarations.some((declarator) => {
                // Check that the left side is an empty object pattern: `const {} = ...`
                const isEmptyObjectPattern =
                    j.ObjectPattern.check(declarator.id) &&
                    declarator.id.properties.length === 0;

                if (!isEmptyObjectPattern) return false;

                // Check that the right side is a call: `useContext(...)`
                const init = declarator.init;
                const isUseContextCall =
                    j.CallExpression.check(init) &&
                    j.Identifier.check(init.callee) &&
                    init.callee.name === 'useContext';

                return isEmptyObjectPattern && isUseContextCall;
            });
        })
        // Remove any matching variable declarations entirely
        .remove();

    return root.toSource(options);
};
