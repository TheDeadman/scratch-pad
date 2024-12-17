import { useAppDispatch } from "@hooks/useAppDispatch";
import React from "react";
import { useContext } from "react"
import { ExampleOneContext } from "../contexts/ExampleOneContext"
import { useExampleTwoContext } from "../contexts/ExampleTwoContext";


const ExampleComponentTwo = () => {
    const { stateValueOne, isStateValueOne, setStateValueOne } = useContext(ExampleOneContext);
    const { setStateValueTwo, stateValueTwo } = useExampleTwoContext();

    const someHandler = () => {
        setStateValueOne('testing')
    }

    const someOtherHandler = () => {
        dispatch(setStateValueTwo({
            stringVal: ['testing', 'testingTwo']
        }))
    }

    const anythingHere = () => {
        console.log("TEST");
    }

    function anythingHereTwo() {
        console.log("TEST")
    }
    return (
        (<div>
            <div>
                {stateValueOne}<br />
                {isStateValueOne}<br />
            </div>
            <div id="nested-test">
                <button onClick={() => setStateValueOne('1234')}>Testing</button>
                <button onClick={() => dispatch(setStateValueTwo({
                    stringVal: ['1234', "testing"]
                }))}>Testing</button>
            </div>
            <div>
                {stateValueTwo}<br />
            </div>
        </div>)
    );
}

export default ExampleComponentTwo