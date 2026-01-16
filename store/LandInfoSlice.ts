import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
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
};

const initialState: LandInfoState = {
  data: {},
  isExisting: {},
};

const landInfoSlice = createSlice({
  name: 'inspectionland',
  initialState,
  reducers: {
    // Initialize land info for a specific requestId
    initializeLandInfo: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
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

    // Set complete land info data
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

    // Update partial land info
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

    // Add image to the images array
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

    // Remove image from the images array by index
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

    // Update all images at once
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

    // Update geo location
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

    // Mark as existing data (UPDATE mode)
    markAsExisting: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    // Load from AsyncStorage
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

    // Reset land info data for a specific requestId
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

    // Clear all land info data
    clearAllLandInfo: (state) => {
      state.data = {};
      state.isExisting = {};
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

// Async thunk for saving to AsyncStorage
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

// Async thunk for loading from AsyncStorage
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