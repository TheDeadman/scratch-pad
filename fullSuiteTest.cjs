import { isContextUsageFound, isDispatchedFunctionFound, isNamedFunctionFound } from "./helperFunctions/finderHelperFunctions";
import { addSpecifierImport, removeNamedImport } from "./helperFunctions/importHelperFunctions";


export default function transformer(file, api, options) {
    const j = api.jscodeshift;
    const root = j(file.source);

    if (!isNamedFunctionFound(j, root, 'ExampleOneContext') && !isContextUsageFound(j, root, 'ExampleOneContext')) {
        removeNamedImport(j, root, '../contexts/ExampleOneContext', 'ExampleOneContext');
    }

    return root.toSource({ reuseWhitespace: false, quote: 'single' });

}