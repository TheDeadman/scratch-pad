
export function isSelectorFunctionFound(j, root, functionName) {
    let isFound = false;
    if (root.find(j.VariableDeclarator, {
        init: { callee: { name: 'useAppSelector' } }
    }).forEach(selectorFunction => {
        if (selectorFunction.value.init.arguments[0]?.name === functionName) {
            isFound = true;
        }
    }));

    if (isFound) {
        console.log("Found");
    } else {
        console.log("not found")
    }
}

export function isDispatchedFunctionFound(j, root, functionName) {
    let isFound = false;
    if (root.find(j.CallExpression, {
        callee: { name: 'dispatch' }
    }).forEach(selectorFunction => {
        if (selectorFunction.value.arguments[0]?.callee?.name === functionName) {
            isFound = true;
        }
    }));

    if (isFound) {
        console.log("Found");
    } else {
        console.log("not found")
    }
}


export function isNamedFunctionFound(j, root, functionName) {
    let isFound = false;
    if (root.find(j.VariableDeclarator, {
        init: { callee: { name: functionName } }
    }).size() > 0) {
        isFound = true;
    };

    if (root.find(j.CallExpression, { callee: { name: functionName } }).size() > 0) {
        isFound = true;
    }


    if (isFound) {
        console.log("Found");
    } else {
        console.log("not found")
    }

    return isFound;
}