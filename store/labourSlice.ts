import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type LabourData = {
  isManageFamilyLabour?: "Yes" | "No";
  isFamilyHiredLabourEquipped?: "Yes" | "No";
  hasAdequateAlternativeLabour?: "Yes" | "No";
  areThereMechanizationOptions?: "Yes" | "No";
  isMachineryAvailable?: "Yes" | "No";
  isMachineryAffordable?: "Yes" | "No";
  isMachineryCostEffective?: "Yes" | "No";
};

interface LabourState {
  data: Record<string, LabourData>;
  isExisting: Record<string, boolean>;
}

const initialState: LabourState = {
  data: {},
  isExisting: {},
};

const labourSlice = createSlice({
  name: "labourInfo",
  initialState,
  reducers: {
    initializeLabour: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = {};
        state.isExisting[requestId] = false;
      }
    },

    setLabourInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        data: LabourData;
        isExisting?: boolean;
      }>,
    ) => {
      const { requestId, data, isExisting } = action.payload;
      state.data[requestId] = data;
      if (isExisting !== undefined) {
        state.isExisting[requestId] = isExisting;
      }
    },

    updateLabourInfo: (
      state,
      action: PayloadAction<{
        requestId: number;
        updates: Partial<LabourData>;
      }>,
    ) => {
      const { requestId, updates } = action.payload;
      if (!state.data[requestId]) {
        state.data[requestId] = {};
      }
      state.data[requestId] = {
        ...state.data[requestId],
        ...updates,
      };
    },

    clearConditionalFields: (
      state,
      action: PayloadAction<{
        requestId: number;
        familyLabourAnswer: "Yes" | "No";
      }>,
    ) => {
      const { requestId, familyLabourAnswer } = action.payload;
      if (state.data[requestId]) {
        if (familyLabourAnswer === "Yes") {
          delete state.data[requestId].hasAdequateAlternativeLabour;
        } else {
          delete state.data[requestId].isFamilyHiredLabourEquipped;
        }
      }
    },

    markAsExisting: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      state.isExisting[requestId] = true;
    },

    clearLabourInfo: (state, action: PayloadAction<{ requestId: number }>) => {
      const { requestId } = action.payload;
      delete state.data[requestId];
      delete state.isExisting[requestId];
    },
  },
});

export const {
  initializeLabour,
  setLabourInfo,
  updateLabourInfo,
  clearConditionalFields,
  markAsExisting,
  clearLabourInfo,
} = labourSlice.actions;

export default labourSlice.reducer;