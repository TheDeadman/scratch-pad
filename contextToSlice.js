const { parse } = require('recast');

module.exports = function transform(fileInfo, api) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    // Helper to generate Redux slice
    const createReduxSlice = (contextName, state, actions) => {
        const sliceName = contextName.replace(/Context$/, '').toLowerCase();
        const stateString = JSON.stringify(state, null, 2);
        const actionsString = actions
            .map(
                (action) => `
        ${action}: (state, action) => {
          // Add logic for '${action}' here
        },
      `
            )
            .join('\n');

        return `
import { createSlice } from '@reduxjs/toolkit';

const initialState = ${stateString};

const ${sliceName}Slice = createSlice({
  name: '${sliceName}',
  initialState,
  reducers: {
    ${actionsString}
  },
});

export const { ${actions.join(', ')} } = ${sliceName}Slice.actions;
export default ${sliceName}Slice.reducer;
    `;
    };

    // Locate React Context and its Provider
    root.find(j.VariableDeclaration).forEach((path) => {
        const declaration = path.node.declarations[0];
        if (declaration.init?.callee?.name === 'createContext') {
            const contextName = declaration.id.name;

            // Find Provider definition
            const providerDef = root.find(j.FunctionDeclaration).filter((funcPath) => {
                return funcPath.node.id.name === `${contextName}Provider`;
            });

            if (providerDef.length) {
                // Extract initial state and actions
                let initialState = {};
                let actions = [];

                providerDef.find(j.VariableDeclaration).forEach((varPath) => {
                    const varDecl = varPath.node.declarations[0];
                    if (varDecl.id.name === 'state') {
                        initialState = parse(varDecl.init.value);
                    }
                    if (varDecl.id.name === 'dispatch') {
                        actions = varPath.parentPath.node.body.body
                            .filter((stmt) => stmt.type === 'FunctionDeclaration')
                            .map((func) => func.id.name);
                    }
                });

                // Replace context with Redux slice
                const reduxSlice = createReduxSlice(contextName, initialState, actions);

                // Inject Redux slice file
                const reduxSliceFileName = `${contextName.replace(/Context$/, '')}Slice.js`;
                // Write reduxSlice to the new file (you may need a custom script here)
                console.log(`Generate file: ${reduxSliceFileName}\n${reduxSlice}`);
            }
        }
    });

    return root.toSource();
};
