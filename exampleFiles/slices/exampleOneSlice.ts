import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ExampleOneState {
    stateValueOne: string | string[];
    stateValueTwo: string | string[];
    isStateValueOne: boolean;
}

const initialExampleOneState: ExampleOneState = {
    isStateValueOne: false,
    stateValueOne: '',
    stateValueTwo: ''
}


const ExampleOneSlice = createSlice({
    name: 'ExampleOne',
    initialState: initialExampleOneState,
    reducers: {
        setStateValueOne: (state, action: PayloadAction<{ stringVal: string | string[] }>) => {
            state.stateValueOne = action.payload.stringVal;
        },
        setStateValueTwo: (state, action: PayloadAction<{ stringVal: string | string[] }>) => {
            state.stateValueTwo = action.payload.stringVal;
        },
    },
});

export const { setStateValueOne, setStateValueTwo } = ExampleOneSlice.actions;
export default ExampleOneSlice.reducer;

// @ts-ignore
export const selectOneStateValueOne = (state: RootState) => state.ExampleOne.stateValueOne;
// @ts-ignore
export const selectOneStateValueTwo = (state: RootState) => state.ExampleOne.stateValueTwo;
// @ts-ignore
export const selectOneIsStateValueOne = (state: RootState) => state.ExampleOne.isStateValueOne;
