import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  jobRole: string | null;
  empId: string | null;
     userProfile: ProfileData | null;
}
const initialState: AuthState = {
  token: null,
  jobRole: null,
  empId: null,
  userProfile: null
};

interface ProfileData {
  firstName: string;
  lastName: string;
  profileImg: string;
  firstNameSinhala: string;
  lastNameSinhala: string;
  firstNameTamil: string;
  lastNameTamil: string;
  empId: string;
}
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
        setUserProfile: (state, action: PayloadAction<ProfileData>) => {
      state.userProfile = action.payload;
    },
    logoutUser: (state) => {},
  },
});

export const { setUser, logoutUser, setUserProfile } = authSlice.actions;
export default authSlice.reducer;
export const selectUserPersonal = (state: { auth: AuthState }) => state.auth.userProfile;
