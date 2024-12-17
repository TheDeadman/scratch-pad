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
        setStateValueTwo(['testing', 'testingTwo'])
    }

    return (
        <div>

            <div>
                {stateValueOne}<br />
                {isStateValueOne}<br />
            </div>
            <div>
                {stateValueTwo}<br />
            </div>
        </div>
    )
}

export default ExampleComponentTwo