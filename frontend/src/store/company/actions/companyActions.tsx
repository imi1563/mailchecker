import Axios from "axios";
import {
  GET_COMPANY_DATA_FAIL,
  GET_COMPANY_DATA_REQUEST,
  GET_COMPANY_DATA_SUCCESS,
  GET_COMPANY_DETAIL_DATA_FAIL,
  GET_COMPANY_DETAIL_DATA_REQUEST,
  GET_COMPANY_DETAIL_DATA_SUCCESS,
} from "../constants/companyConstants";

export const getCompanyDataAction = () => async (dispatch: any) => {
  dispatch({ type: GET_COMPANY_DATA_REQUEST });
  try {
    const { data } = await Axios.get(
      `http://${process.env.HOST}/emails/getCompanyData`
    );
    dispatch({ type: GET_COMPANY_DATA_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: GET_COMPANY_DATA_FAIL,
      payload: error,
    });
  }
};
export const getCompanyDetailAction = (id: any) => async (dispatch: any) => {
  dispatch({ type: GET_COMPANY_DETAIL_DATA_REQUEST });
  try {
    const { data } = await Axios.get(
      `http://${process.env.HOST}/emails/getCompanyDetailData/${id}`
    );
    dispatch({ type: GET_COMPANY_DETAIL_DATA_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: GET_COMPANY_DETAIL_DATA_FAIL,
      payload: error,
    });
  }
};
