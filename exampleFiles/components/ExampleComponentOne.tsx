import React from "react";
import { useContext } from "react"
import { ExampleOneContext } from "../contexts/ExampleOneContext"


const ExampleComponentOne = () => {
    const { stateValueOne, isStateValueOne, setStateValueOne } = useContext(ExampleOneContext);

    const someHandler = () => {
        setStateValueOne('testing')
    }

    return (
        <div>
            {stateValueOne}<br />
            {isStateValueOne}<br />
        </div>
    )
}

export default ExampleComponentOne