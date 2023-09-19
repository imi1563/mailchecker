import {
  DELETE_USER_FAIL,
  DELETE_USER_REQUEST,
  DELETE_USER_SUCCESS,
  GET_USERS_LIST_FAIL,
  GET_USERS_LIST_REQUEST,
  GET_USERS_LIST_SUCCESS,
  SET_USER_ROLE_FAIL,
  SET_USER_ROLE_REQUEST,
  SET_USER_ROLE_SUCCESS,
  USER_REGISTER_FAIL,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_SIGNIN_FAIL,
  USER_SIGNIN_REQUEST,
  USER_SIGNIN_SUCCESS,
} from "../constants/userConstants";

export const userRegisterReducer = (state = {}, action: any) => {
  switch (action.type) {
    case USER_REGISTER_REQUEST:
      return { loading: true };
    case USER_REGISTER_SUCCESS:
      return { loading: false, userRegisterResponse: action.payload };
    case USER_REGISTER_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const userSignInReducer = (state = {}, action: any) => {
  switch (action.type) {
    case USER_SIGNIN_REQUEST:
      return { loading: true };
    case USER_SIGNIN_SUCCESS:
      return { loading: false, userLoginInfo: action.payload };
    case USER_SIGNIN_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const getUsersListReducer = (state = {}, action: any) => {
  switch (action.type) {
    case GET_USERS_LIST_REQUEST:
      return { loading: true };
    case GET_USERS_LIST_SUCCESS:
      return { loading: false, getUsersListResponse: action.payload };
    case GET_USERS_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const setUserRolesReducer = (state = {}, action: any) => {
  switch (action.type) {
    case SET_USER_ROLE_REQUEST:
      return { loading: true };
    case SET_USER_ROLE_SUCCESS:
      return { loading: false, setUserRolesResponse: action.payload };
    case SET_USER_ROLE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const deleteUserReducer = (state = {}, action: any) => {
  switch (action.type) {
    case DELETE_USER_REQUEST:
      return { loading: true };
    case DELETE_USER_SUCCESS:
      return { loading: false, deleteUserResponse: action.payload };
    case DELETE_USER_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
