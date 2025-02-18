import React from "react";
import { selectOneIsStateValueOne, selectOneStateValueOne, setStateValueOne } from "../slices/exampleOneSlice";
import { selectTwoStateValueTwo, setStateValueTwo } from "../slices/exampleTwoSlice";
import { useAppDispatch, useAppSelector } from 'store/hooks';


const ExampleComponentTwo = () => {
    const dispatch = useAppDispatch();
    const isStateValueOne = useAppSelector(selectOneIsStateValueOne);
    const stateValueOne = useAppSelector(selectOneStateValueOne);
    const stateValueTwo = useAppSelector(selectTwoStateValueTwo);

    const someHandler = () => {
        dispatch(setStateValueOne({ stringVal: 'testing' }));
    }

    const someOtherHandler = () => {
        dispatch(setStateValueTwo(['testing', 'testingTwo']));
    }

    const anythingHere = () => {
        console.log("TEST");
    }

    function anythingHereTwo() {
        console.log("TEST")
    }
    return (
        <div>

            <div>
                {stateValueOne}<br />
                {isStateValueOne}<br />
            </div>
            <div id="nested-test">
                <button onClick={() => dispatch(setStateValueOne({ stringVal: '1234' }))}>Testing</button>
                <button onClick={() => dispatch(setStateValueTwo(['1234', "testing"]))}>Testing</button>
                <button onClick={() => someHandler()}>Other</button>
            </div>
            <div>
                {stateValueTwo}<br />
            </div>
        </div>
    )
}

export default ExampleComponentTwo