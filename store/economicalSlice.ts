import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type EconomicalData = {
  isSuitaleSize?: "Yes" | "No";
  isFinanceResource?: "Yes" | "No";
  isAltRoutes?: "Yes" | "No";
};

type EconomicalState = {
  data: Record<number, EconomicalData>;
  isExisting: Record<number, boolean>;
};

const initialState: EconomicalState = {
  data: {},
  isExisting: {},
};

const economicalSlice = createSlice({
  name: 'economical',
  initialState,
  reducers: {
    initializeEconomical: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = {
          isSuitaleSize: undefined,
          isFinanceResource: undefined,
          isAltRoutes: undefined,
        };
        state.isExisting[requestId] = false;
      }
    },
    updateEconomical: (
      state,
      action: PayloadAction<{ requestId: number; updates: Partial<EconomicalData> }>
    ) => {
      const { requestId, updates } = action.payload;
      if (state.data[requestId]) {
        state.data[requestId] = {
          ...state.data[requestId],
          ...updates,
        };
      } else {
        state.data[requestId] = updates;
      }
    },
    setEconomical: (
      state,
      action: PayloadAction<{ requestId: number; data: EconomicalData; isExisting: boolean }>
    ) => {
      const { requestId, data, isExisting } = action.payload;
      state.data[requestId] = data;
      state.isExisting[requestId] = isExisting;
    },
    markEconomicalAsExisting: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },
    clearEconomical: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },
  },
});

export const {
  initializeEconomical,
  updateEconomical,
  setEconomical,
  markEconomicalAsExisting,
  clearEconomical,
} = economicalSlice.actions;

export default economicalSlice.reducer;