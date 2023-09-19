import { createStore, compose, applyMiddleware, combineReducers } from "redux";
import thunk from "redux-thunk";
import {
  emailFinderReducer,
  getInvalidEmailsReducer,
  verifyBulkEmailsReducer,
  verifySingleEmailReducer,
} from "./email/reducer/emailReducer";
import {
  getCompanyDataReducer,
  getCompanyDetailReducer,
} from "./company/reducer/companyReducers";
import { getEmployeesDetailReducer } from "./employees/reducers/employeesReducers";
import {
  deleteUserReducer,
  getUsersListReducer,
  setUserRolesReducer,
  userRegisterReducer,
  userSignInReducer,
} from "./user/reducers/userReducers";

const initialState: any = {
  userSignIn: {
    userLoginInfo: localStorage.getItem("userLoginInfo")
      ? JSON.parse(localStorage.getItem("userLoginInfo") as string)
      : null,
  },
};
const reducer = combineReducers({
  emailFinderStore: emailFinderReducer,
  verifySingleEmailStore: verifySingleEmailReducer,
  getCompanyDataStore: getCompanyDataReducer,
  getEmployeesDetailStore: getEmployeesDetailReducer,
  getInvalidEmailsStore: getInvalidEmailsReducer,
  userRegisterStore: userRegisterReducer,
  userSignInStore: userSignInReducer,
  getUsersListStore: getUsersListReducer,
  setUserRolesStore: setUserRolesReducer,
  verifyBulkEmailsStore: verifyBulkEmailsReducer,
  deleteUserStore: deleteUserReducer,
  getCompanyDetailStore: getCompanyDetailReducer,
});
const composeEnhancer = compose;
const store = createStore(
  reducer,
  initialState,
  composeEnhancer(applyMiddleware(thunk))
);

export default store;
