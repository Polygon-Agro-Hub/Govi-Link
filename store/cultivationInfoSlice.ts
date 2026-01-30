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
  data: {
    [requestId: number]: CultivationInfoData;
  };
  isExisting: {
    [requestId: number]: boolean;
  };
  currentRequestId: number | null; // ✅ Added
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
  currentRequestId: null, // ✅ Added
};

const cultivationInfoSlice = createSlice({
  name: 'cultivationInfo',
  initialState,
  reducers: {
    // ✅ UPDATED with auto-clear
    initializeCultivationInfo: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      
      // ✅ Auto-clear when switching requests
      if (state.currentRequestId !== null && state.currentRequestId !== requestId) {
        console.log(`🗑️ [CultivationInfo] Clearing data for old request ${state.currentRequestId}`);
        delete state.data[state.currentRequestId];
        delete state.isExisting[state.currentRequestId];
      }
      
      state.currentRequestId = requestId;
      
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialCultivationInfo };
        state.isExisting[requestId] = false;
      }
    },

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

    markCultivationAsExisting: (
      state,
      action: PayloadAction<{ requestId: number }>
    ) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    clearCultivationInfo: (
      state,
      action: PayloadAction<{ requestId: number }>
    ) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },

    clearAllCultivationInfo: (state) => {
      state.data = {};
      state.isExisting = {};
      state.currentRequestId = null; // ✅ Added
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
