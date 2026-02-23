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
  data: {
    [requestId: string]: PersonalInfo;
  };
  isExisting: {
    [requestId: string]: boolean;
  };
  currentRequestId: number | null; 
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
  currentRequestId: null, 
};

const personalInfoSlice = createSlice({
  name: 'personalInfo',
  initialState,
  reducers: {
    initializePersonalInfo: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      
      if (state.currentRequestId !== null && state.currentRequestId !== requestId) {
        
        delete state.data[state.currentRequestId];
        delete state.isExisting[state.currentRequestId];
      }
      
      state.currentRequestId = requestId;
      
      if (!state.data[requestId]) {
        state.data[requestId] = { ...initialPersonalInfo };
        state.isExisting[requestId] = false;
      }
    },

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

    markAsExisting: (
      state,
      action: PayloadAction<{ requestId: number }>
    ) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    clearPersonalInfo: (
      state,
      action: PayloadAction<{ requestId: string }>
    ) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },

    clearAllPersonalInfo: (state) => {
      state.data = {};
      state.isExisting = {};
      state.currentRequestId = null; 
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