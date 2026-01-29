import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type EconomicalData = {
  isSuitaleSize?: "Yes" | "No";
  isFinanceResource?: "Yes" | "No";
  isAltRoutes?: "Yes" | "No";
};

type EconomicalState = {
  data: Record<number, EconomicalData>;
  isExisting: Record<number, boolean>;
  currentRequestId: number | null; // ✅ Added
};

const initialState: EconomicalState = {
  data: {},
  isExisting: {},
  currentRequestId: null, // ✅ Added
};

const economicalSlice = createSlice({
  name: 'economical',
  initialState,
  reducers: {
    // ✅ UPDATED with auto-clear
    initializeEconomical: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      
      // ✅ Auto-clear when switching requests
      if (state.currentRequestId !== null && state.currentRequestId !== requestId) {
        console.log(`🗑️ [Economical] Clearing data for old request ${state.currentRequestId}`);
        delete state.data[state.currentRequestId];
        delete state.isExisting[state.currentRequestId];
      }
      
      state.currentRequestId = requestId;
      
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
    
    clearAllEconomical: (state) => {
      state.data = {};
      state.isExisting = {};
      state.currentRequestId = null; // ✅ Added
    },
  },
});

export const {
  initializeEconomical,
  updateEconomical,
  setEconomical,
  markEconomicalAsExisting,
  clearEconomical,
  clearAllEconomical,
} = economicalSlice.actions;

export default economicalSlice.reducer;