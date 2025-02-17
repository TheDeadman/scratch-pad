export default function transformer(file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Get options from the command line
  const contextImportPath = options.contextImportPath || 'contexts/examples/ExampleContext';
  const reduxImportPath = options.reduxImportPath || 'exampleSlice.ts';
  const hooksImportPath = options.hooksImportPath || 'store/hooks';

  // Values to be replaced from context
  const contextValuesToReplace = (options.contextValues || '').split(',').map(v => v.trim());

  // Redux selectors mapping (context variable -> Redux selector)
  let reduxSelectors = {};
  try {
    reduxSelectors = options.reduxSelectors || '{}';
  } catch (error) {
    console.error("Invalid JSON format for --reduxSelectors. Ensure it's properly escaped.");
    process.exit(1);
  }

  let contextRemoved = false;
  const usedSelectors = new Set();

  // Step 1: Find and modify `useContext` usage
  root.find(j.VariableDeclarator, {
    id: { type: 'ObjectPattern' },
    init: { callee: { name: 'useContext' } }
  })
    .forEach(path => {
      const objectPattern = path.node.id;
      const newProperties = objectPattern.properties.filter(prop => {
        if (contextValuesToReplace.includes(prop.key.name)) {
          usedSelectors.add(prop.key.name);
          return false;
        }
        return true;
      });

      // If all properties are removed, remove the entire `useContext`
      if (newProperties.length === 0) {
        j(path).remove();
        contextRemoved = true;
      } else {
        objectPattern.properties = newProperties;
      }
    });

  // Step 2: Generate Redux `useAppSelector` calls only for found context variables
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

  // Step 3: Insert Redux selectors **only at the top level of the component**
  if (usedSelectors.size > 0) {
    root.find(j.FunctionDeclaration).forEach(path => {
      if (path.value.body && path.value.body.type === "BlockStatement") {
        const firstNonImportIndex = path.value.body.body.findIndex(node => node.type !== "ImportDeclaration");
        if (firstNonImportIndex !== -1) {
          path.value.body.body.splice(firstNonImportIndex, 0, ...useAppSelectorCalls);
        } else {
          path.value.body.body.unshift(...useAppSelectorCalls);
        }
      }
    });

    root.find(j.VariableDeclarator)
      .filter(path => path.parent.value.type === "VariableDeclaration" && path.parent.parent.value.type === "Program")
      .forEach(path => {
        if (path.node.init && path.node.init.type === "ArrowFunctionExpression" && path.node.init.body.type === "BlockStatement") {
          const body = path.node.init.body.body;
          const firstNonImportIndex = body.findIndex(node => node.type !== "ImportDeclaration");
          if (firstNonImportIndex !== -1) {
            body.splice(firstNonImportIndex, 0, ...useAppSelectorCalls);
          } else {
            body.unshift(...useAppSelectorCalls);
          }
        }
      });
  }

  // Step 4: Update imports (remove old context references)
  root.find(j.ImportDeclaration)
    .forEach(path => {
      if (path.node.source.value === contextImportPath) {
        path.node.specifiers = path.node.specifiers.filter(specifier =>
          specifier.imported && !contextValuesToReplace.includes(specifier.imported.name)
        );

        // If import is empty, remove it
        if (path.node.specifiers.length === 0) {
          j(path).remove();
        }
      }
    });

  // Step 5: Ensure `useAppSelector` import exists only if used
  if (usedSelectors.size > 0) {
    const existingHookImport = root.find(j.ImportDeclaration, {
      source: { value: hooksImportPath }
    });

    if (existingHookImport.length === 0) {
      root.get().node.program.body.unshift(
        j.importDeclaration(
          [j.importSpecifier(j.identifier("useAppSelector"))],
          j.literal(hooksImportPath)
        )
      );
    }
  }

  // Step 6: Ensure Redux selectors import exists only if used
  if (usedSelectors.size > 0) {
    const reduxSelectorImports = Array.from(usedSelectors).map(contextVar =>
      j.importSpecifier(j.identifier(reduxSelectors[contextVar]))
    );

    const existingReduxImport = root.find(j.ImportDeclaration, {
      source: { value: reduxImportPath }
    });

    if (existingReduxImport.length === 0) {
      root.get().node.program.body.unshift(
        j.importDeclaration(reduxSelectorImports, j.literal(reduxImportPath))
      );
    } else {
      existingReduxImport.get().node.specifiers.push(...reduxSelectorImports);
    }
  }

  return root.toSource();
}
