import React from "react";
import { useContext } from "react"
import { ExampleOneContext } from "../contexts/ExampleOneContext"


const ExampleComponentOne = () => {
    const {
        isStateValueOne,
        stateValueOne,
        setStateValueOne,
        setStateValueTwo
    } = useContext(ExampleOneContext);

    const someHandler = () => {
        setStateValueOne('testing')
    }

    return (
        <div>
            {stateValueOne}<br />
            <div id="nested-test">
                <button onClick={() => setStateValueOne('1234')}>Testing</button>
                <button onClick={() => setStateValueTwo(['1234', "testing"])}>Testing</button>
            </div>
            {isStateValueOne}<br />
        </div>
    )
}

export default ExampleComponentOne