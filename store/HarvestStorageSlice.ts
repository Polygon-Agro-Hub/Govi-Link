import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type HarvestStorageData = {
  hasOwnStorage?: "Yes" | "No";
  ifNotHasFacilityAccess?: "Yes" | "No";
  hasPrimaryProcessingAccess?: "Yes" | "No";
  knowsValueAdditionTech?: "Yes" | "No";
  hasValueAddedMarketLinkage?: "Yes" | "No";
  awareOfQualityStandards?: "Yes" | "No";
};

interface HarvestStorageState {
  data: Record<number, HarvestStorageData>;
  isExisting: Record<number, boolean>;
  currentRequestId: number | null; // ✅ Added
}

const initialState: HarvestStorageState = {
  data: {},
  isExisting: {},
  currentRequestId: null, // ✅ Added
};

const harvestStorageSlice = createSlice({
  name: "harvestStorage",
  initialState,
  reducers: {
    // ✅ UPDATED with auto-clear
    initializeHarvestStorage: (
      state,
      action: PayloadAction<{ requestId: number }>,
    ) => {
      const { requestId } = action.payload;
      
      // ✅ Auto-clear when switching requests
      if (state.currentRequestId !== null && state.currentRequestId !== requestId) {
        console.log(`🗑️ [HarvestStorage] Clearing data for old request ${state.currentRequestId}`);
        delete state.data[state.currentRequestId];
        delete state.isExisting[state.currentRequestId];
      }
      
      state.currentRequestId = requestId;
      
      if (!state.data[requestId]) {
        state.data[requestId] = {};
        state.isExisting[requestId] = false;
      }
    },

    setHarvestStorageInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        data: HarvestStorageData;
        isExisting?: boolean;
      }>,
    ) => {
      const { requestId, data, isExisting } = action.payload;
      state.data[requestId] = data;
      if (isExisting !== undefined) {
        state.isExisting[requestId] = isExisting;
      }
    },

    updateHarvestStorageInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        updates: Partial<HarvestStorageData>;
      }>,
    ) => {
      const { requestId, updates } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = {};
      }
      state.data[requestId] = {
        ...state.data[requestId],
        ...updates,
      };
    },

    clearConditionalField: (
      state,
      action: PayloadAction<{
        requestId: number;
      }>,
    ) => {
      const { requestId } = action.payload;
      if (state.data[requestId]) {
        delete state.data[requestId].ifNotHasFacilityAccess;
      }
    },

    markAsExisting: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    clearHarvestStorageInfo: (
      state,
      action: PayloadAction<{ requestId: number }>,
    ) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },

    clearAllHarvestStorage: (state) => {
      state.data = {};
      state.isExisting = {};
      state.currentRequestId = null; // ✅ Added
    },
  },
});

export const {
  initializeHarvestStorage,
  setHarvestStorageInfo,
  updateHarvestStorageInfo,
  clearConditionalField,
  markAsExisting,
  clearHarvestStorageInfo,
  clearAllHarvestStorage,
} = harvestStorageSlice.actions;

export default harvestStorageSlice.reducer;