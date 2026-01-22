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
  currentRequestId: number | null; // ✅ Added
}

const initialInvestmentInfo: InvestmentInfoData = {
  expected: 0,
  purpose: '',
  repaymentMonth: 0,
};

const initialState: InvestmentInfoState = {
  data: {},
  isExisting: {},
  currentRequestId: null, // ✅ Added
};

const investmentInfoSlice = createSlice({
  name: 'investmentInfo',
  initialState,
  reducers: {
    // ✅ UPDATED with auto-clear
    initializeInvestmentInfo: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      
      // ✅ Auto-clear when switching requests
      if (state.currentRequestId !== null && state.currentRequestId !== requestId) {
        console.log(`🗑️ [InvestmentInfo] Clearing data for old request ${state.currentRequestId}`);
        delete state.data[state.currentRequestId];
        delete state.isExisting[state.currentRequestId];
      }
      
      state.currentRequestId = requestId;
      
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialInvestmentInfo };
        state.isExisting[requestId] = false;
      }
    },

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

    markInvestmentAsExisting: (
      state,
      action: PayloadAction<{ requestId: number }>
    ) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    clearInvestmentInfo: (
      state,
      action: PayloadAction<{ requestId: number }>
    ) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },

    clearAllInvestmentInfo: (state) => {
      state.data = {};
      state.isExisting = {};
      state.currentRequestId = null; // ✅ Added
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