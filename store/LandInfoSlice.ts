import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LandImage = {
  uri: string;
  name: string;
  type: string;
};

export type GeoLocation = {
  latitude: number;
  longitude: number;
  locationName?: string;
};

export type LandInfoData = {
  landDiscription: string;
  isOwnByFarmer?: "Yes" | "No";
  ownershipStatus?: string;
  images?: LandImage[];
  geoLocation?: GeoLocation;
};

type LandInfoState = {
  data: Record<string, LandInfoData>;
  isExisting: Record<string, boolean>;
  currentRequestId: number | null; // ✅ Added
};

const initialState: LandInfoState = {
  data: {},
  isExisting: {},
  currentRequestId: null, // ✅ Added
};

const landInfoSlice = createSlice({
  name: 'inspectionland',
  initialState,
  reducers: {
    // ✅ UPDATED with auto-clear
    initializeLandInfo: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      
      // ✅ Auto-clear when switching requests
      if (state.currentRequestId !== null && state.currentRequestId !== requestId) {
        console.log(`🗑️ [LandInfo] Clearing data for old request ${state.currentRequestId}`);
        delete state.data[state.currentRequestId];
        delete state.isExisting[state.currentRequestId];
      }
      
      state.currentRequestId = requestId;
      
      if (!state.data[requestId]) {
        state.data[requestId] = {
          landDiscription: '',
          isOwnByFarmer: undefined,
          ownershipStatus: undefined,
          images: [],
          geoLocation: undefined,
        };
        state.isExisting[requestId] = false;
      }
    },

    setLandInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        data: LandInfoData;
        isExisting: boolean;
      }>
    ) => {
      const { requestId, data, isExisting } = action.payload;
      state.data[requestId] = data;
      state.isExisting[requestId] = isExisting;
    },

    updateLandInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        updates: Partial<LandInfoData>;
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

    addImage: (
      state,
      action: PayloadAction<{
        requestId: number;
        image: LandImage;
      }>
    ) => {
      const { requestId, image } = action.payload;
      if (state.data[requestId]) {
        if (!state.data[requestId].images) {
          state.data[requestId].images = [];
        }
        state.data[requestId].images!.push(image);
      }
    },

    removeImage: (
      state,
      action: PayloadAction<{
        requestId: number;
        index: number;
      }>
    ) => {
      const { requestId, index } = action.payload;
      if (state.data[requestId]?.images) {
        state.data[requestId].images = state.data[requestId].images!.filter(
          (_, i) => i !== index
        );
      }
    },

    setImages: (
      state,
      action: PayloadAction<{
        requestId: number;
        images: LandImage[];
      }>
    ) => {
      const { requestId, images } = action.payload;
      if (state.data[requestId]) {
        state.data[requestId].images = images;
      }
    },

    setGeoLocation: (
      state,
      action: PayloadAction<{
        requestId: number;
        geoLocation: GeoLocation;
      }>
    ) => {
      const { requestId, geoLocation } = action.payload;
      if (state.data[requestId]) {
        state.data[requestId].geoLocation = geoLocation;
      }
    },

    markAsExisting: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    loadLandInfoFromStorage: (
      state,
      action: PayloadAction<{
        requestId: number;
        data: LandInfoData;
      }>
    ) => {
      const { requestId, data } = action.payload;
      state.data[requestId] = data;
      state.isExisting[requestId] = true;
    },

    resetLandInfoData: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      state.data[requestId] = {
        landDiscription: '',
        isOwnByFarmer: undefined,
        ownershipStatus: undefined,
        images: [],
        geoLocation: undefined,
      };
      state.isExisting[requestId] = false;
    },

    clearAllLandInfo: (state) => {
      state.data = {};
      state.isExisting = {};
      state.currentRequestId = null; // ✅ Added
    },
  },
});

export const {
  initializeLandInfo,
  setLandInfo,
  updateLandInfo,
  addImage,
  removeImage,
  setImages,
  setGeoLocation,
  markAsExisting,
  loadLandInfoFromStorage,
  resetLandInfoData,
  clearAllLandInfo,
} = landInfoSlice.actions;

export default landInfoSlice.reducer;

export const saveLandInfoToStorage = async (
  requestId: number,
  data: LandInfoData
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      `landinfo_${requestId}`,
      JSON.stringify(data)
    );
    console.log(`💾 Saved land info to AsyncStorage for requestId: ${requestId}`);
  } catch (error) {
    console.error('Failed to save land info to AsyncStorage:', error);
  }
};

export const loadLandInfoFromStorageAsync = async (
  requestId: number
): Promise<LandInfoData | null> => {
  try {
    const stored = await AsyncStorage.getItem(`landinfo_${requestId}`);
    if (stored) {
      console.log(`📂 Loaded land info from AsyncStorage for requestId: ${requestId}`);
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Failed to load land info from AsyncStorage:', error);
    return null;
  }
};