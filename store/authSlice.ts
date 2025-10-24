import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  jobRole: string | null;
  empId: string | null;
}
const initialState: AuthState = {
  token: null,
  jobRole: null,
  empId: null,
};
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{ token: string; role: string; empId: string }>
    ) => {
 const { token, role, empId } = action.payload;
         console.log("Dispatching setUser action:");
          console.log("login redux:", role);
           // ✅ Cleaner assignment
      state.token = token;
      state.jobRole = role;
      state.empId = empId;
    },
    logoutUser: (state) => {
      state.token = null;
      state.jobRole = null;
      state.empId = null;
    },
  },
});

export const { setUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;
