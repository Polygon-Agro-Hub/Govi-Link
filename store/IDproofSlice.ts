// store/idProofSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type IDProofInfo = {
  pType: string;
  pNumber: string;
  frontImg: string | null; // URI string (file:// or https://)
  backImg: string | null;  // URI string (file:// or https://)
};

interface IDProofState {
  data: {
    [requestId: string]: IDProofInfo;
  };
  isExisting: {
    [requestId: string]: boolean;
  };
}

const initialIDProofInfo: IDProofInfo = {
  pType: '',
  pNumber: '',
  frontImg: null,
  backImg: null,
};

const initialState: IDProofState = {
  data: {},
  isExisting: {},
};

const idProofSlice = createSlice({
  name: 'idProof',
  initialState,
  reducers: {
    // Initialize ID proof for a request
    initializeIDProof: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialIDProofInfo };
        state.isExisting[requestId] = false;
      }
    },

    // Update specific fields
    updateIDProof: (
      state,
      action: PayloadAction<{
        requestId: number;
        updates: Partial<IDProofInfo>;
      }>
    ) => {
      const { requestId, updates } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialIDProofInfo };
      }
      state.data[requestId] = {
        ...state.data[requestId],
        ...updates,
      };
    },

    // Set complete ID proof info (used when loading from backend)
    setIDProof: (
      state,
      action: PayloadAction<{
        requestId: number;
        data: IDProofInfo;
        isExisting?: boolean;
      }>
    ) => {
      const { requestId, data, isExisting = false } = action.payload;
      state.data[requestId] = data;
      state.isExisting[requestId] = isExisting;
    },

    // Mark as existing data (for UPDATE operations)
    markAsExisting: (
      state,
      action: PayloadAction<{ requestId: number }>
    ) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    // Clear ID proof for a request
    clearIDProof: (
      state,
      action: PayloadAction<{ requestId: string }>
    ) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },

    // Clear all ID proof data
    clearAllIDProof: (state) => {
      state.data = {};
      state.isExisting = {};
    },

    // Load from AsyncStorage
    loadIDProofFromStorage: (
      state,
      action: PayloadAction<{
        requestId: number;
        data: IDProofInfo;
      }>
    ) => {
      const { requestId, data } = action.payload;
      state.data[requestId] = data;
    },

    // Reset ID proof when type changes
    resetIDProofData: (
      state,
      action: PayloadAction<{
        requestId: number;
        pType: string;
      }>
    ) => {
      const { requestId, pType } = action.payload;
      state.data[requestId] = {
        pType,
        pNumber: '',
        frontImg: null,
        backImg: null,
      };
    },
  },
});

export const {
  initializeIDProof,
  updateIDProof,
  setIDProof,
  markAsExisting,
  clearIDProof,
  clearAllIDProof,
  loadIDProofFromStorage,
  resetIDProofData,
} = idProofSlice.actions;

export default idProofSlice.reducer;