import React, { createContext, FC, PropsWithChildren, useState } from 'react';

export interface ExampleOneState {
    stateValueOne: string | string[];
    stateValueTwo: string | string[];
    isStateValueOne: boolean;
    setStateValueOne: (str: string | string[]) => void;
    setStateValueTwo: (str: string | string[]) => void;
}

export const ExampleOneContext = createContext<ExampleOneState>({
    stateValueOne: '',
    stateValueTwo: '',
    isStateValueOne: false,
    setStateValueOne: () => null,
    setStateValueTwo: () => null,
})

const ExampleOneProvider: FC<PropsWithChildren> = ({ children }) => {
    const [stateValueOne, setStateValueOne] = useState<string | string[]>('')
    const [stateValueTwo, setStateValueTwo] = useState<string | string[]>('')
    const [isStateValueOne, setIsStateValueOne] = useState(false)

    return (
        <ExampleOneContext.Provider value={{ isStateValueOne, setStateValueOne, setStateValueTwo, stateValueOne, stateValueTwo }}>
            {children}
        </ExampleOneContext.Provider>
    )
}

export default ExampleOneProvider;