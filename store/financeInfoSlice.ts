import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type FinanceInfoData = {
  accHolder?: string;
  accountNumber?: number;
  confirmAccountNumber?: number;
  bank?: string;
  branch?: string;
  debtsOfFarmer?: string;
  noOfDependents?: string;
  assets?: {
    [parentKey: string]: string[];
  };
  assetsLand?: string[];
  assetsBuilding?: string[];
  assetsVehicle?: string[];
  assetsMachinery?: string[];
  assetsFarmTool?: string;
};

type FormData = {
  inspectionfinance?: FinanceInfoData;
  requestId?: number;
  requestNumber?: string;
};

type FinanceInfoState = {
  data: {
    [jobId: string]: FormData;
  };
  currentRequestId: number | null; // ✅ Added
};

const initialState: FinanceInfoState = {
  data: {},
  currentRequestId: null, // ✅ Added
};

const financeInfoSlice = createSlice({
  name: 'financeInfo',
  initialState,
  reducers: {
    // ✅ NEW: Initialize action with auto-clear
    initializeFinanceInfo: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      
      // ✅ Auto-clear when switching requests
      if (state.currentRequestId !== null && state.currentRequestId !== requestId) {
        console.log(`🗑️ [FinanceInfo] Clearing data for old request ${state.currentRequestId}`);
        delete state.data[state.currentRequestId];
      }
      
      state.currentRequestId = requestId;
      
      if (!state.data[requestId]) {
        state.data[requestId] = {
          requestId,
          inspectionfinance: {},
        };
      }
    },

    setFinanceInfo: (
      state,
      action: PayloadAction<{ jobId: string; data: FormData }>
    ) => {
      const { jobId, data } = action.payload;
      state.data[jobId] = { ...data };
    },

    updateFinanceInfo: (
      state,
      action: PayloadAction<{
        jobId: string;
        updates: Partial<FinanceInfoData>;
      }>
    ) => {
      const { jobId, updates } = action.payload;
      
      if (!state.data[jobId]) {
        state.data[jobId] = {
          inspectionfinance: {},
        };
      }
      
      state.data[jobId] = {
        ...state.data[jobId],
        inspectionfinance: {
          ...(state.data[jobId]?.inspectionfinance || {}),
          ...updates,
        },
      };
    },

    clearFinanceInfo: (state, action: PayloadAction<number>) => {
      delete state.data[action.payload];
    },

    clearAllFinanceInfo: (state) => {
      state.data = {};
      state.currentRequestId = null; // ✅ Added
    },
  },
});

export const { 
  initializeFinanceInfo, // ✅ Export new action
  setFinanceInfo, 
  updateFinanceInfo, 
  clearFinanceInfo,
  clearAllFinanceInfo, // ✅ Export new action
} = financeInfoSlice.actions;

export default financeInfoSlice.reducer;