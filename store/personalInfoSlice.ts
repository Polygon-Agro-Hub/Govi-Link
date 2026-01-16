// store/slices/personalInfoSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PersonalInfo = {
  firstName: string;
  lastName: string;
  otherName: string;
  callName: string;
  phone1: string;
  phone2: string;
  familyPhone: string;
  landHome: string;
  landWork: string;
  email1: string;
  email2: string;
  house: string;
  street: string;
  cityName: string;
  district: string | null;
  province: string | null;
  country: string;
};

interface PersonalInfoState {
  // Store data by requestId
  data: {
    [requestId: string]: PersonalInfo;
  };
  // Track which requests have existing backend data (UPDATE vs INSERT)
  isExisting: {
    [requestId: string]: boolean;
  };
}

const initialPersonalInfo: PersonalInfo = {
  firstName: '',
  lastName: '',
  otherName: '',
  callName: '',
  phone1: '',
  phone2: '',
  familyPhone: '',
  landHome: '',
  landWork: '',
  email1: '',
  email2: '',
  house: '',
  street: '',
  cityName: '',
  district: null,
  province: null,
  country: 'Sri Lanka',
};

const initialState: PersonalInfoState = {
  data: {},
  isExisting: {},
};

const personalInfoSlice = createSlice({
  name: 'personalInfo',
  initialState,
  reducers: {
    // Initialize personal info for a request
    initializePersonalInfo: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialPersonalInfo };
        state.isExisting[requestId] = false;
      }
    },

    // Update specific fields
    updatePersonalInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        updates: Partial<PersonalInfo>;
      }>
    ) => {
      const { requestId, updates } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialPersonalInfo };
      }
      state.data[requestId] = {
        ...state.data[requestId],
        ...updates,
      };
    },

    // Set complete personal info (used when loading from backend)
    setPersonalInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        data: PersonalInfo;
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

    // Clear personal info for a request
    clearPersonalInfo: (
      state,
      action: PayloadAction<{ requestId: string }>
    ) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },

    // Clear all personal info data
    clearAllPersonalInfo: (state) => {
      state.data = {};
      state.isExisting = {};
    },
  },
});

export const {
  initializePersonalInfo,
  updatePersonalInfo,
  setPersonalInfo,
  markAsExisting,
  clearPersonalInfo,
  clearAllPersonalInfo,
} = personalInfoSlice.actions;

export default personalInfoSlice.reducer;