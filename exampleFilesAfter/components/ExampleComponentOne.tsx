import React from "react";
import { selectOneIsStateValueOne, selectOneStateValueOne, setStateValueOne, setStateValueTwo } from "../slices/exampleOneSlice";
import { useAppDispatch, useAppSelector } from 'store/hooks';



const ExampleComponentOne = () => {
    const dispatch = useAppDispatch();
    const isStateValueOne = useAppSelector(selectOneIsStateValueOne);
    const stateValueOne = useAppSelector(selectOneStateValueOne);

    const someHandler = () => {
        dispatch(setStateValueOne({ stringVal: 'testing' }))
    }

    return (
        <div>
            {stateValueOne}<br />
            <div id="nested-test">
                <button onClick={() => dispatch(setStateValueOne({ stringVal: '1234' }))}>Testing</button>
                <button onClick={() => dispatch(setStateValueTwo({ stringVal: ['1234', "testing"] }))}>Testing</button>
                <button onClick={() => someHandler()}>Other</button>
            </div>
            {isStateValueOne}<br />
        </div>
    )
}

export default ExampleComponentOne