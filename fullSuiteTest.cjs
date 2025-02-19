import { isDispatchedFunctionFound, isNamedFunctionFound } from "./finderHelperFunctions";
import { addSpecifierImport } from "./importHelperFunctions";


export default function transformer(file, api, options) {
    const j = api.jscodeshift;
    const root = j(file.source);

    if (isNamedFunctionFound(j, root, 'useAppSelector')) {
        addSpecifierImport(j, root, 'store/hooks', 'useAppSelector')
    }

    return root.toSource({ reuseWhitespace: false, quote: 'single' });

}