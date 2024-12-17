import React, { createContext, FC, PropsWithChildren, useContext, useState } from 'react';

export interface ExampleTwoState {
    stateValueOne: string | string[];
    stateValueTwo: string | string[];
    isStateValueOne: boolean;
    setStateValueOne: (str: string) => void;
    setStateValueTwo: (str: string) => void;
}

export const ExampleTwoContext = createContext<ExampleTwoState>({
    stateValueOne: '',
    stateValueTwo: '',
    isStateValueOne: false,
    setStateValueOne: () => null,
    setStateValueTwo: () => null,
})

const ExampleTwoProvider: FC<PropsWithChildren> = ({ children }) => {
    const [stateValueOne, setStateValueOne] = useState('')
    const [stateValueTwo, setStateValueTwo] = useState('')
    const [isStateValueOne, setIsStateValueOne] = useState(false)

    return (
        <ExampleTwoContext.Provider value={{ isStateValueOne, setStateValueOne, setStateValueTwo, stateValueOne, stateValueTwo }}>
            {children}
        </ExampleTwoContext.Provider>
    )
}

export const useExampleTwoContext = () => {
    const context = useContext(ExampleTwoContext);

    return context;
}

export default ExampleTwoProvider;