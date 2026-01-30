import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type IDProofInfo = {
  pType: string;
  pNumber: string;
  frontImg: string | null;
  backImg: string | null;
};

interface IDProofState {
  data: {
    [requestId: string]: IDProofInfo;
  };
  isExisting: {
    [requestId: string]: boolean;
  };
  currentRequestId: number | null; // ✅ Added
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
  currentRequestId: null, // ✅ Added
};

const idProofSlice = createSlice({
  name: 'idProof',
  initialState,
  reducers: {
    // ✅ UPDATED with auto-clear
    initializeIDProof: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      
      // ✅ Auto-clear when switching requests
      if (state.currentRequestId !== null && state.currentRequestId !== requestId) {
        console.log(`🗑️ [IDProof] Clearing data for old request ${state.currentRequestId}`);
        delete state.data[state.currentRequestId];
        delete state.isExisting[state.currentRequestId];
      }
      
      state.currentRequestId = requestId;
      
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialIDProofInfo };
        state.isExisting[requestId] = false;
      }
    },

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

    markAsExisting: (
      state,
      action: PayloadAction<{ requestId: number }>
    ) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    clearIDProof: (
      state,
      action: PayloadAction<{ requestId: string }>
    ) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },

    clearAllIDProof: (state) => {
      state.data = {};
      state.isExisting = {};
      state.currentRequestId = null; // ✅ Added
    },

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