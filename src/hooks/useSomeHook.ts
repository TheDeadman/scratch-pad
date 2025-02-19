import { useCallback, useContext, useMemo } from "react";
import { ExampleOneContext } from "../contexts/ExampleOneContext";

const useSomeHook = <T extends Number>(formProps: SomeProps<T>) => {
    const {
        isStateValueOne,
        stateValueOne,
        setStateValueOne,
        setStateValueTwo
    } = useContext(ExampleOneContext);

    const getTheValues = useCallback(() => {
        setStateValueOne('1234')
        return {
            isStateValueOne,
            stateValueOne
        }
    }, [isStateValueOne, stateValueOne]);

    return useMemo(() => ({
        getTheValues
    }), [getTheValues]);
}