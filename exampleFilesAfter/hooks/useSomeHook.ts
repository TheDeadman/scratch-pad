
import { useCallback, useMemo } from "react";
import { selectOneIsStateValueOne, selectOneStateValueOne } from "../slices/exampleOneSlice";
import { useAppDispatch, useAppSelector } from 'store/hooks';

const useSomeHook = <T extends Number>(formProps: SomeProps<T>) => {

    const isStateValueOne = useAppSelector(selectOneIsStateValueOne);
    const stateValueOne = useAppSelector(selectOneStateValueOne);

    const getTheValues = useCallback(() => {
        return {
            isStateValueOne,
            stateValueOne
        }
    }, [isStateValueOne, stateValueOne]);

    return useMemo(() => ({
        getTheValues
    }), [getTheValues]);
}