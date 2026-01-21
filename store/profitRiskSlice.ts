import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ProfitRiskData = {
  profit?: string;
  isProfitable?: "Yes" | "No";
  isRisk?: "Yes" | "No";
  risk?: string;
  solution?: string;
  manageRisk?: "Yes" | "No";
  worthToTakeRisk?: string;
};

type ProfitRiskState = {
  data: {
    [requestId: number]: ProfitRiskData;
  };
  isExisting: {
    [requestId: number]: boolean;
  };
};

const initialState: ProfitRiskState = {
  data: {},
  isExisting: {},
};

const profitRiskSlice = createSlice({
  name: 'profitRisk',
  initialState,
  reducers: {
    initializeProfitRisk: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = {
          profit: '',
          isProfitable: undefined,
          isRisk: undefined,
          risk: '',
          solution: '',
          manageRisk: undefined,
          worthToTakeRisk: '',
        };
        state.isExisting[requestId] = false;
      }
    },
    
    setProfitRisk: (
      state,
      action: PayloadAction<{
        requestId: number;
        data: ProfitRiskData;
        isExisting?: boolean;
      }>
    ) => {
      const { requestId, data, isExisting } = action.payload;
      state.data[requestId] = { ...data };
      if (isExisting !== undefined) {
        state.isExisting[requestId] = isExisting;
      }
    },
    
    updateProfitRisk: (
      state,
      action: PayloadAction<{
        requestId: number;
        updates: Partial<ProfitRiskData>;
      }>
    ) => {
      const { requestId, updates } = action.payload;
      if (state.data[requestId]) {
        state.data[requestId] = {
          ...state.data[requestId],
          ...updates,
        };
      }
    },
    
    markProfitRiskAsExisting: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    clearProfitRisk: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },

    clearAllProfitRisk: (state) => {
      state.data = {};
      state.isExisting = {};
    },
  },
});

export const {
  initializeProfitRisk,
  setProfitRisk,
  updateProfitRisk,
  markProfitRiskAsExisting,
  clearProfitRisk,
  clearAllProfitRisk,
} = profitRiskSlice.actions;

export default profitRiskSlice.reducer;