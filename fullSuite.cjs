// jscodeshift -t ./fullSuite.cjs ./src --parser=tsx

import { findAndModifyUseContext } from "./helperFunctions/findAndModifyUseContext";
import { isContextUsageFound, isNamedFunctionFound } from "./helperFunctions/finderHelperFunctions";
import { addSpecifierImport, dedupeAndSortImports, removeNamedImport } from "./helperFunctions/importHelperFunctions";
import { insertAtTopOfComponent } from "./helperFunctions/insertHelperFunctions";

export default function transformer(file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Get options from the command line
  const contextImportPath = options.contextImportPath || '../contexts/ExampleOneContext';
  const contextName = 'ExampleOneContext';
  const reduxImportPath = options.reduxImportPath || 'exampleOneSlice.ts';
  const hooksImportPath = options.hooksImportPath || 'store/hooks';

  // Values to be replaced from context
  const contextValuesToReplace = ['isStateValueOne', 'stateValueOne', 'stateValueTwo'];
  const contextSettersToReplace = ['setStateValueOne'];
  const setterArgumentUpdates = {
    setStateValueOne: ['textValue']
  }
  // const contextSettersToReplace = (options.contextValues || 'setStateValueOne,setStateValueTwo').split(',').map(v => v.trim());

  // Redux selectors mapping (context variable -> Redux selector)
  let reduxSelectors = {};
  try {
    reduxSelectors = {
      isStateValueOne: 'selectOneIsStateValueOne',
      stateValueOne: 'selectOneStateValueOne',
      stateValueTwo: 'selectTwoStateValueTwo'
    };
  } catch (error) {
    console.error("Invalid JSON format for --reduxSelectors. Ensure it's properly escaped.");
    process.exit(1);
  }

  const usedSelectors = new Set();
  const usedSetters = new Set();

  // Step 1: Find and modify `useContext` usage
  findAndModifyUseContext(j, root, contextName, contextValuesToReplace, usedSelectors, contextSettersToReplace, usedSetters);


  // Step 2: Generate Redux `useAppSelector` calls only for found context variables. Insert the app selector calls
  const useAppSelectorCalls = Array.from(usedSelectors).map((contextVar) => {
    console.log("CONTEXT VAR: ", contextVar)
    return j.variableDeclaration("const", [
      j.variableDeclarator(
        j.identifier(contextVar),
        j.callExpression(
          j.identifier("useAppSelector"),
          [j.identifier(reduxSelectors[contextVar])]
        )
      )
    ]);
  });
  insertAtTopOfComponent(j, root, useAppSelectorCalls);


  // Step 4: Generate Redux `dispatch` calls only for found context setters. Ensure useAppDispatch is at the top of the component
  if (usedSetters) {
    const useAppDispatchDeclaration = j.variableDeclaration("const", [
      j.variableDeclarator(
        j.identifier('dispatch'),
        j.callExpression(
          j.identifier("useAppDispatch"), []
        )
      )
    ]);

    insertAtTopOfComponent(j, root, [useAppDispatchDeclaration]);


    Array.from(usedSetters).forEach((contextVar) => {
      // Find all calls to `myFunction(...)`
      root.find(j.CallExpression, { callee: { name: contextVar } })
        .forEach(path => {
          j(path).replaceWith(callPath => {
            let args = callPath.node.arguments;

            // Check to see if we want to move the arguments to a named object.
            if (setterArgumentUpdates[contextVar]) {
              let props = [];
              setterArgumentUpdates[contextVar].forEach((prop, i) => {
                console.log("PROP: ", prop, i)
                props.push(j.objectProperty(j.identifier(prop), args[i]))
              })
              args = [j.objectExpression(props)];
            }

            let newExpression = j.callExpression(
              j.identifier("dispatch"),
              [j.callExpression(j.identifier(contextVar), args)]
            );

            return [newExpression];
          });
        });

    });
  }


  // Step 5: Ensure `useAppSelector` and `useAppDispatch` import exists only if used
  if (isNamedFunctionFound(j, root, 'useAppSelector')) {
    addSpecifierImport(j, root, hooksImportPath, 'useAppSelector');
  }

  if (isNamedFunctionFound(j, root, 'useAppDispatch')) {
    addSpecifierImport(j, root, hooksImportPath, 'useAppDispatch');
  }

  dedupeAndSortImports(j, root, hooksImportPath)

  // Step 6: Import necessary selectors / setters
  if (usedSelectors.size > 0 || usedSetters.size > 0) {

    // Find existing import statement for the given path
    const importCollection = root.find(j.ImportDeclaration, { source: { value: reduxImportPath } });

    if (importCollection.size() > 0) {
      // ✅ Modify existing import
      importCollection.forEach(path => {
        const specifiers = path.node.specifiers;

        Array.from(usedSelectors).forEach(importName => {
          // Check if the named import already exists
          const nameToImport = reduxSelectors[importName];
          const isAlreadyImported = specifiers.some(
            specifier =>
              j.ImportSpecifier.check(specifier) &&
              specifier.imported.name === nameToImport
          );

          // Add the named import if it's not already present
          if (!isAlreadyImported) {
            specifiers.push(j.importSpecifier(j.identifier(nameToImport)));
          }
        });

        Array.from(usedSetters).forEach(importName => {
          // Check if the named import already exists
          const nameToImport = reduxSelectors[importName];

          const isAlreadyImported = specifiers.some(
            specifier =>
              j.ImportSpecifier.check(specifier) &&
              specifier.imported.name === importName
          );

          // Add the named import if it's not already present
          if (!isAlreadyImported) {
            specifiers.push(j.importSpecifier(j.identifier(importName)));
          }
        });
      });
    } else {

      let imports = Array.from(usedSelectors).map(name => j.importSpecifier(j.identifier(reduxSelectors[name])))

      imports = [...imports, ...Array.from(usedSetters).map(name => j.importSpecifier(j.identifier(name)))];
      // ✅ Create a new import statement if none exists
      const newImport = j.importDeclaration(
        imports,
        j.literal(reduxImportPath)
      );

      // Insert at the top of the file
      root.get().node.program.body.unshift(newImport);
    }
  }


  // Step 7: Remove "useContext" if it is no longer used
  if (!isNamedFunctionFound(j, root, 'useContext')) {
    removeNamedImport(j, root, 'react', 'useContext')
  }


  // Step 8: Remove the context import
  if (!isNamedFunctionFound(j, root, contextName) && !isContextUsageFound(j, root, contextName)) {
    removeNamedImport(j, root, contextImportPath, contextName);
  }

  return root.toSource({ reuseWhitespace: false, quote: 'single' });
}
