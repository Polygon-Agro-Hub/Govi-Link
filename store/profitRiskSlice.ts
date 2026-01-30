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
  currentRequestId: number | null; // ✅ Added
};

const initialState: ProfitRiskState = {
  data: {},
  isExisting: {},
  currentRequestId: null, // ✅ Added
};

const profitRiskSlice = createSlice({
  name: 'profitRisk',
  initialState,
  reducers: {
    // ✅ UPDATED with auto-clear
    initializeProfitRisk: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      
      // ✅ Auto-clear when switching requests
      if (state.currentRequestId !== null && state.currentRequestId !== requestId) {
        console.log(`🗑️ [ProfitRisk] Clearing data for old request ${state.currentRequestId}`);
        delete state.data[state.currentRequestId];
        delete state.isExisting[state.currentRequestId];
      }
      
      state.currentRequestId = requestId;
      
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
      state.currentRequestId = null; // ✅ Added
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