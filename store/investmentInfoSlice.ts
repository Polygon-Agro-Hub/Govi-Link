// store/slices/investmentInfoSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type InvestmentInfoData = {
  expected: number;
  purpose: string;
  repaymentMonth: number;
};

interface InvestmentInfoState {
  data: {
    [requestId: number]: InvestmentInfoData;
  };
  isExisting: {
    [requestId: number]: boolean;
  };
}

const initialInvestmentInfo: InvestmentInfoData = {
  expected: 0,
  purpose: '',
  repaymentMonth: 0,
};

const initialState: InvestmentInfoState = {
  data: {},
  isExisting: {},
};

const investmentInfoSlice = createSlice({
  name: 'investmentInfo',
  initialState,
  reducers: {
    // Initialize investment info for a request
    initializeInvestmentInfo: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialInvestmentInfo };
        state.isExisting[requestId] = false;
      }
    },

    // Update specific fields
    updateInvestmentInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        updates: Partial<InvestmentInfoData>;
      }>
    ) => {
      const { requestId, updates } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialInvestmentInfo };
      }
      state.data[requestId] = {
        ...state.data[requestId],
        ...updates,
      };
    },

    // Set complete investment info (used when loading from backend)
    setInvestmentInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        data: InvestmentInfoData;
        isExisting?: boolean;
      }>
    ) => {
      const { requestId, data, isExisting = false } = action.payload;
      state.data[requestId] = data;
      state.isExisting[requestId] = isExisting;
    },

    // Mark as existing data (for UPDATE operations)
    markInvestmentAsExisting: (
      state,
      action: PayloadAction<{ requestId: number }>
    ) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    // Clear investment info for a request
    clearInvestmentInfo: (
      state,
      action: PayloadAction<{ requestId: number }>
    ) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },

    // Clear all investment info data
    clearAllInvestmentInfo: (state) => {
      state.data = {};
      state.isExisting = {};
    },
  },
});

export const {
  initializeInvestmentInfo,
  updateInvestmentInfo,
  setInvestmentInfo,
  markInvestmentAsExisting,
  clearInvestmentInfo,
  clearAllInvestmentInfo,
} = investmentInfoSlice.actions;

export default investmentInfoSlice.reducer;