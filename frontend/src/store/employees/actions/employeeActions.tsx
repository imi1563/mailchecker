import Axios from "axios";
import {
  GET_EMPLOYEES_DETAIL_FAIL,
  GET_EMPLOYEES_DETAIL_REQUEST,
  GET_EMPLOYEES_DETAIL_SUCCESS,
} from "../constants/employeesConstants";

export const getEmployeesDetailAction = (id: any) => async (dispatch: any) => {
  dispatch({ type: GET_EMPLOYEES_DETAIL_REQUEST });

  try {
    const { data } = await Axios.get(`
    ${process.env.REACT_APP_HOST}/emails/getEmployeeData/${id}`);
    dispatch({ type: GET_EMPLOYEES_DETAIL_SUCCESS, payload: data });
    console.log("data", data);
  } catch (error) {
    dispatch({
      type: GET_EMPLOYEES_DETAIL_FAIL,
      payload: error,
    });
  }
};
