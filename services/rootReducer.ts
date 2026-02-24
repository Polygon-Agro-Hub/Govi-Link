import { combineReducers } from 'redux';
import authReducer from '@/store/authSlice';

const appReducer = combineReducers({
  auth: authReducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === 'auth/logoutUser') {
    state = undefined; 
  }
  return appReducer(state, action);
};

export default rootReducer;
