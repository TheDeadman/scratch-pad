// jscodeshift -t ./fullSuite.cjs ./src --parser=tsx

import { isNamedFunctionFound } from "./finderHelperFunctions";
import { addSpecifierImport, dedupeAndSortImports } from "./importHelperFunctions";
import { insertAtTopOfComponent } from "./insertHelperFunctions";

export default function transformer(file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Get options from the command line
  const contextImportPath = options.contextImportPath || '../contexts/ExampleOneContext';
  const contextName = 'ExampleOneContext';
  const reduxImportPath = options.reduxImportPath || 'exampleOneSlice.ts';
  const hooksImportPath = options.hooksImportPath || 'store/hooks';

  // Values to be replaced from context
  const contextValuesToReplace = ['isStateValueOne', 'stateValueOne'];
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
    };
  } catch (error) {
    console.error("Invalid JSON format for --reduxSelectors. Ensure it's properly escaped.");
    process.exit(1);
  }

  let contextRemoved = false;
  const usedSelectors = new Set();
  const usedSetters = new Set();

  // Step 1: Find and modify `useContext` usage
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
          contextRemoved = true;
        } else {
          objectPattern.properties = newProperties;
        }
      }
    });




  // Step 2: Generate Redux `useAppSelector` calls only for found context variables. Insert the app selector calls
  const useAppSelectorCalls = Array.from(usedSelectors).map((contextVar) => {
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


  // // Step 7: Remove "useContext" if it is no longer used
  // // Check if `useContext` is still being used in the file
  // // TODO: Fix... not working
  // const isUseContextUsed = root.find(j.Identifier, { name: 'useContext' }).size() > 1;
  // // `.size() > 1` because one occurrence might be from the import itself

  // if (isUseContextUsed) {
  //   // return root.toSource(); // Exit early, keeping the import
  // } else {
  //   // Find all import declarations from 'react'
  //   root.find(j.ImportDeclaration, { source: { value: 'react' } }).forEach(path => {
  //     const specifiers = path.node.specifiers;

  //     // Remove `useContext` from the named imports
  //     const filteredSpecifiers = specifiers.filter(
  //       specifier => !(j.ImportSpecifier.check(specifier) && specifier.imported.name === 'useContext')
  //     );

  //     if (filteredSpecifiers.length > 0) {
  //       // Update the import statement with the remaining specifiers
  //       path.node.specifiers = filteredSpecifiers;
  //     } else {
  //       // Remove the entire import if it's now empty
  //       j(path).remove();
  //     }
  //   });
  // }


  // // Step 8: Remove the context import
  // root.find(j.ImportDeclaration, { source: { value: contextImportPath } }).forEach(path => {
  //   const specifiers = path.node.specifiers;

  //   // Remove `useContext` from the named imports
  //   const filteredSpecifiers = specifiers.filter(
  //     specifier => !(j.ImportSpecifier.check(specifier) && specifier.imported.name === contextName)
  //   );

  //   if (filteredSpecifiers.length > 0) {
  //     // Update the import statement with the remaining specifiers
  //     path.node.specifiers = filteredSpecifiers;
  //   } else {
  //     // Remove the entire import if it's now empty
  //     j(path).remove();
  //   }
  // });





  // // Step 4: Update imports (remove old context references)
  // root.find(j.ImportDeclaration)
  //   .forEach(path => {
  //     if (path.node.source.value === contextImportPath) {
  //       path.node.specifiers = path.node.specifiers.filter(specifier =>
  //         specifier.imported && !contextValuesToReplace.includes(specifier.imported.name)
  //       );

  //       // If import is empty, remove it
  //       if (path.node.specifiers.length === 0) {
  //         j(path).remove();
  //       }
  //     }
  //   });

  // // Step 5: Ensure `useAppSelector` import exists only if used
  // if (usedSelectors.size > 0) {
  //   const existingHookImport = root.find(j.ImportDeclaration, {
  //     source: { value: hooksImportPath }
  //   });

  //   if (existingHookImport.length === 0) {
  //     root.get().node.program.body.unshift(
  //       j.importDeclaration(
  //         [j.importSpecifier(j.identifier("useAppSelector"))],
  //         j.literal(hooksImportPath)
  //       )
  //     );
  //   }
  // }

  // // Step 6: Ensure Redux selectors import exists only if used
  // if (usedSelectors.size > 0) {
  //   const reduxSelectorImports = Array.from(usedSelectors).map(contextVar =>
  //     j.importSpecifier(j.identifier(reduxSelectors[contextVar]))
  //   );

  //   const existingReduxImport = root.find(j.ImportDeclaration, {
  //     source: { value: reduxImportPath }
  //   });

  //   if (existingReduxImport.length === 0) {
  //     root.get().node.program.body.unshift(
  //       j.importDeclaration(reduxSelectorImports, j.literal(reduxImportPath))
  //     );
  //   } else {
  //     existingReduxImport.get().node.specifiers.push(...reduxSelectorImports);
  //   }
  // }

  // Step 900: Remove the useContext if empty
  root.find(j.VariableDeclarator, {
    id: { type: 'ObjectPattern' },
    init: { callee: { name: 'useContext' } }
  })
    .forEach(path => {

      // Ensure that we found the Desired context
      if (path.node.init.arguments[0]?.name === contextName) {
        const objectPattern = path.node.id;

        // If all properties are removed, remove the entire `useContext`
        if (objectPattern.properties.length === 0) {
          j(path).remove();
          console.log("REMOVING CONTEXT");
        }
      }
    });

  return root.toSource({ reuseWhitespace: false, quote: 'single' });
}
