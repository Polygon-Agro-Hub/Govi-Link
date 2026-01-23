// store/slices/cultivationInfoSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Selection = "yes" | "no" | null;

export type CultivationInfoData = {
  soilType: string;
  ph: number;
  temperature?: Selection;
  rainfall?: Selection;
  sunShine?: Selection;
  humidity?: Selection;
  windVelocity?: Selection;
  windDirection?: Selection;
  zone?: Selection;
  isCropSuitale?: "Yes" | "No";
  soilfertility?: string;
  waterSources?: string[];
  otherWaterSource?: string;
  waterImage?: { uri: string; name: string; type: string } | null;
  isRecevieRainFall?: "Yes" | "No";
  isRainFallSuitableCrop?: "Yes" | "No";
  isRainFallSuitableCultivation?: "Yes" | "No";
  isElectrocityAvailable?: "Yes" | "No";
  ispumpOrirrigation?: "Yes" | "No";
  [key: string]: any;
};

interface CultivationInfoState {
  // Store data by requestId
  data: {
    [requestId: number]: CultivationInfoData;
  };
  // Track which requests have existing backend data (UPDATE vs INSERT)
  isExisting: {
    [requestId: number]: boolean;
  };
}

const initialCultivationInfo: CultivationInfoData = {
  soilType: '',
  ph: 0,
  temperature: null,
  rainfall: null,
  sunShine: null,
  humidity: null,
  windVelocity: null,
  windDirection: null,
  zone: null,
  isCropSuitale: undefined,
  soilfertility: '',
  waterSources: [],
  otherWaterSource: '',
  waterImage: null,
  isRecevieRainFall: undefined,
  isRainFallSuitableCrop: undefined,
  isRainFallSuitableCultivation: undefined,
  isElectrocityAvailable: undefined,
  ispumpOrirrigation: undefined,
};

const initialState: CultivationInfoState = {
  data: {},
  isExisting: {},
};

const cultivationInfoSlice = createSlice({
  name: 'cultivationInfo',
  initialState,
  reducers: {
    // Initialize cultivation info for a request
    initializeCultivationInfo: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialCultivationInfo };
        state.isExisting[requestId] = false;
      }
    },

    // Update specific fields
    updateCultivationInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        updates: Partial<CultivationInfoData>;
      }>
    ) => {
      const { requestId, updates } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialCultivationInfo };
      }
      state.data[requestId] = {
        ...state.data[requestId],
        ...updates,
      };
    },

    // Set complete cultivation info (used when loading from backend)
    setCultivationInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        data: CultivationInfoData;
        isExisting?: boolean;
      }>
    ) => {
      const { requestId, data, isExisting = false } = action.payload;
      state.data[requestId] = data;
      state.isExisting[requestId] = isExisting;
    },

    // Mark as existing data (for UPDATE operations)
    markCultivationAsExisting: (
      state,
      action: PayloadAction<{ requestId: number }>
    ) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    // Clear cultivation info for a request
    clearCultivationInfo: (
      state,
      action: PayloadAction<{ requestId: number }>
    ) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },

    // Clear all cultivation info data
    clearAllCultivationInfo: (state) => {
      state.data = {};
      state.isExisting = {};
    },
  },
});

export const {
  initializeCultivationInfo,
  updateCultivationInfo,
  setCultivationInfo,
  markCultivationAsExisting,
  clearCultivationInfo,
  clearAllCultivationInfo,
} = cultivationInfoSlice.actions;

export default cultivationInfoSlice.reducer;