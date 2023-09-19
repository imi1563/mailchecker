import { GET_EMPLOYEES_DETAIL_FAIL, GET_EMPLOYEES_DETAIL_REQUEST, GET_EMPLOYEES_DETAIL_SUCCESS } from "../constants/employeesConstants";



export const getEmployeesDetailReducer = (state = {}, action : any) => {
    switch (action.type) {
      case GET_EMPLOYEES_DETAIL_REQUEST:
        return { loading: true };
      case GET_EMPLOYEES_DETAIL_SUCCESS:
        return { loading: false, getEmployeesDetailResponse: action.payload };
      case GET_EMPLOYEES_DETAIL_FAIL:
        return { loading: false, error: action.payload };
      default:
        return state;
    }
  };