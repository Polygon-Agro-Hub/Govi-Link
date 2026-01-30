import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CroppingSystemsData = {
  opportunity?: string[];
  otherOpportunity?: string;
  hasKnowlage?: "Yes" | "No";
  prevExperince?: string;
  opinion?: string;
};

type CroppingSystemsState = {
  data: {
    [requestId: number]: CroppingSystemsData;
  };
  isExisting: {
    [requestId: number]: boolean;
  };
  currentRequestId: number | null; // ✅ Added
};

const initialState: CroppingSystemsState = {
  data: {},
  isExisting: {},
  currentRequestId: null, // ✅ Added
};

const croppingSystemsSlice = createSlice({
  name: 'croppingSystems',
  initialState,
  reducers: {
    // ✅ UPDATED with auto-clear
    initializeCroppingSystems: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      
      // ✅ Auto-clear when switching requests
      if (state.currentRequestId !== null && state.currentRequestId !== requestId) {
        console.log(`🗑️ [CroppingSystems] Clearing data for old request ${state.currentRequestId}`);
        delete state.data[state.currentRequestId];
        delete state.isExisting[state.currentRequestId];
      }
      
      state.currentRequestId = requestId;
      
      if (!state.data[requestId]) {
        state.data[requestId] = {
          opportunity: [],
          otherOpportunity: '',
          hasKnowlage: undefined,
          prevExperince: '',
          opinion: '',
        };
        state.isExisting[requestId] = false;
      }
    },
    
    setCroppingSystems: (
      state,
      action: PayloadAction<{
        requestId: number;
        data: CroppingSystemsData;
        isExisting?: boolean;
      }>
    ) => {
      const { requestId, data, isExisting } = action.payload;
      state.data[requestId] = { ...data };
      if (isExisting !== undefined) {
        state.isExisting[requestId] = isExisting;
      }
    },
    
    updateCroppingSystems: (
      state,
      action: PayloadAction<{
        requestId: number;
        updates: Partial<CroppingSystemsData>;
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
    
    markCroppingAsExisting: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },
    
    clearCroppingSystems: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      state.data[requestId] = {
        opportunity: [],
        otherOpportunity: '',
        hasKnowlage: undefined,
        prevExperince: '',
        opinion: '',
      };
      state.isExisting[requestId] = false;
    },
    
    clearAllCroppingSystems: (state) => {
      state.data = {};
      state.isExisting = {};
      state.currentRequestId = null; // ✅ Added
    },
  },
});

export const {
  initializeCroppingSystems,
  setCroppingSystems,
  updateCroppingSystems,
  markCroppingAsExisting,
  clearCroppingSystems,
  clearAllCroppingSystems,
} = croppingSystemsSlice.actions;

export default croppingSystemsSlice.reducer;