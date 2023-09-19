import {
  EMAIL_FIND_FAIL,
  EMAIL_FIND_REQUEST,
  EMAIL_FIND_SUCCESS,
  GET_INVALID_EMAILS_FAIL,
  GET_INVALID_EMAILS_REQUEST,
  GET_INVALID_EMAILS_SUCCESS,
  VERIFY_BULK_EMAILS_FAIL,
  VERIFY_BULK_EMAILS_REQUEST,
  VERIFY_BULK_EMAILS_SUCCESS,
  VERIFY_SINGLE_EMAIL_FAIL,
  VERIFY_SINGLE_EMAIL_REQUEST,
  VERIFY_SINGLE_EMAIL_SUCCESS,
} from "../constant/emailConstant";
import Axios from "axios";

export const emailFinderAction = (values: string) => async (dispatch: any) => {
  dispatch({ type: EMAIL_FIND_REQUEST });
  try {
    const { data } = await Axios.post(
      `${process.env.REACT_APP_HOST}/emails/emailFinderMultiple`,
      values
    );
    dispatch({ type: EMAIL_FIND_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: EMAIL_FIND_FAIL,
      payload: error,
    });
  }
};

export const verifySingleEmailAction =
  (email: string) => async (dispatch: any) => {
    dispatch({ type: VERIFY_SINGLE_EMAIL_REQUEST });
    try {
      const { data } = await Axios.post(
        `${process.env.REACT_APP_HOST}/emails/verifySingle`,
        { email }
      );
      dispatch({ type: VERIFY_SINGLE_EMAIL_SUCCESS, payload: data });
    } catch (error) {
      dispatch({
        type: VERIFY_SINGLE_EMAIL_FAIL,
        payload: error,
      });
    }
  };

export const getInvalidEmailsAction = () => async (dispatch: any) => {
  dispatch({ type: GET_INVALID_EMAILS_REQUEST });
  try {
    const { data } = await Axios.get(
      `${process.env.REACT_APP_HOST}/emails/getInvalidEmails`
    );
    dispatch({ type: GET_INVALID_EMAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: GET_INVALID_EMAILS_FAIL,
      payload: error,
    });
  }
};

export const verifyBulkEmailsAction =
  (bulkEmails: string) => async (dispatch: any) => {
    console.log("bulk email", bulkEmails);
    dispatch({ type: VERIFY_BULK_EMAILS_REQUEST });
    try {
      const { data } = await Axios.post(
        `${process.env.REACT_APP_HOST}/emails/bulk`,
        bulkEmails
      );
      dispatch({ type: VERIFY_BULK_EMAILS_SUCCESS, payload: data });
    } catch (error) {
      dispatch({
        type: VERIFY_BULK_EMAILS_FAIL,
        payload: error,
      });
    }
  };
