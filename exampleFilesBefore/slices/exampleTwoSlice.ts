import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ExampleTwoState {
    stateValueOne: string | string[];
    stateValueTwo: string | string[];
    isStateValueOne: boolean;
}

const initialExampleTwoState: ExampleTwoState = {
    isStateValueOne: false,
    stateValueOne: '',
    stateValueTwo: ''
}


const ExampleTwoSlice = createSlice({
    name: 'ExampleTwo',
    initialState: initialExampleTwoState,
    reducers: {
        setStateValueOne: (state, action: PayloadAction<string | string[]>) => {
            state.stateValueOne = action.payload
        },
        setStateValueTwo: (state, action: PayloadAction<string | string[]>) => {
            state.stateValueTwo = action.payload
        },
    },
});

export const { setStateValueOne, setStateValueTwo } = ExampleTwoSlice.actions;
export default ExampleTwoSlice.reducer;

// @ts-ignore
export const selectTwoStateValueOne = (state: RootState) => state.ExampleOne.stateValueOne;
// @ts-ignore
export const selectTwoStateValueTwo = (state: RootState) => state.ExampleOne.stateValueTwo;
// @ts-ignore
export const selectTwoIsStateValueOne = (state: RootState) => state.ExampleOne.isStateValueOne;
