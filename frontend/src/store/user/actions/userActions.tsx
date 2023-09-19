import Axios from "axios";

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

import { notifyError, notifySuccess } from "../../../pages/Components/Toastify";
import { Portal } from "@mui/material";

export const userRegisterAction =
  (values: any, navigate: any) => async (dispatch: any) => {
    dispatch({ type: USER_REGISTER_REQUEST });

    try {
      const { data } = await Axios.post(
        `
      ${process.env.REACT_APP_HOST}/user/registerUser`,
        values
      );
      dispatch({ type: USER_REGISTER_SUCCESS, payload: data });
      console.log("data", data);
      notifySuccess("You have been registered successfully");
      navigate("/user-SignIn");
    } catch (error: any) {
      console.log("my error", error);
      const message = error?.response?.data?.error
        ? error?.response?.data?.error
        : error?.message;
      dispatch({
        type: USER_REGISTER_FAIL,
        payload: message,
      });
    }
  };

export const userSignInAction =
  (values: any, navigate: any) => async (dispatch: any) => {
    dispatch({ type: USER_SIGNIN_REQUEST });

    try {
      const { data } = await Axios.post(
        `
        ${process.env.REACT_APP_HOST}/user/signInUser`,
        values
      );
      dispatch({ type: USER_SIGNIN_SUCCESS, payload: data });
      localStorage.setItem("userLoginInfo", JSON.stringify(data));
      notifySuccess("You have been Signed In successfully");
      navigate("/");
    } catch (error: any) {
      console.log("my error", error);
      const message = error?.response?.data?.error
        ? error?.response?.data?.error
        : error?.message;
      notifyError(message);
      dispatch({
        type: USER_SIGNIN_FAIL,
        payload: message,
      });
    }
  };

export const logOutHandlerAction = (navigate: any) => async (dispatch: any) => {
  localStorage.removeItem("userLoginInfo");
  notifySuccess("You have been LogOut successfully");
  navigate("/single-Email-Verify");
};

export const getUsersListAction = () => async (dispatch: any) => {
  dispatch({ type: GET_USERS_LIST_REQUEST });
  const userLoginInfo = localStorage.getItem("userLoginInfo")
    ? JSON.parse(localStorage.getItem("userLoginInfo") as any)
    : null;

  try {
    const { data } = await Axios.get(
      `
        ${process.env.REACT_APP_HOST}/user/getUserList`,
      {
        headers: { Authorization: `Bearer ${userLoginInfo?.token}` },
      }
    );
    dispatch({ type: GET_USERS_LIST_SUCCESS, payload: data });
    console.log("data", data);
  } catch (error: any) {
    const message =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    dispatch({
      type: GET_USERS_LIST_FAIL,
      payload: message,
    });
  }
};

export const setUserRolesAction = (userRoles: any) => async (dispatch: any) => {
  dispatch({ type: SET_USER_ROLE_REQUEST });
  const userLoginInfo = localStorage.getItem("userLoginInfo")
    ? JSON.parse(localStorage.getItem("userLoginInfo") as any)
    : null;
  console.log("userRoles", userRoles);

  try {
    const { data } = await Axios.patch(
      `
       ${process.env.REACT_APP_HOST}/user/setUserRoles`,
      userRoles,
      {
        headers: { Authorization: `Bearer ${userLoginInfo.token}` },
      }
    );
    dispatch({ type: SET_USER_ROLE_SUCCESS, payload: data });
    console.log("updated user", data);
    notifySuccess("User Roles  have been updated successfully");
  } catch (error: any) {
    const message =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    dispatch({
      type: SET_USER_ROLE_FAIL,
      payload: message,
    });
  }
};

export const deleteUserAction = (id: any) => async (dispatch: any) => {
  dispatch({ type: DELETE_USER_REQUEST });
  const userLoginInfo = localStorage.getItem("userLoginInfo")
    ? JSON.parse(localStorage.getItem("userLoginInfo") as any)
    : null;

  try {
    const { data } = await Axios.delete(
      `
        ${process.env.REACT_APP_HOST}/user/deleteUser/${id}`,
      {
        headers: { Authorization: `Bearer ${userLoginInfo.token}` },
      }
    );
    dispatch({ type: DELETE_USER_SUCCESS, payload: data });
    console.log("Deleted user", data);
    notifySuccess("User has been Deleted successfully");
  } catch (error: any) {
    const message =
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message;
    notifyError(message);
    dispatch({
      type: DELETE_USER_FAIL,
      payload: message,
    });
  }
};
