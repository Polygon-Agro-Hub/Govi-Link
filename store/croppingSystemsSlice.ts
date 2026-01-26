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
};

const initialState: CroppingSystemsState = {
  data: {},
  isExisting: {},
};

const croppingSystemsSlice = createSlice({
  name: 'croppingSystems',
  initialState,
  reducers: {
    initializeCroppingSystems: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
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
    
    // Clear data for a specific requestId
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
    
    // Clear all cropping systems data
    clearAllCroppingSystems: (state) => {
      state.data = {};
      state.isExisting = {};
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