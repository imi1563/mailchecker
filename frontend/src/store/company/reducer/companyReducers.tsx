import { GET_COMPANY_DATA_FAIL, GET_COMPANY_DATA_REQUEST, GET_COMPANY_DATA_SUCCESS, GET_COMPANY_DETAIL_DATA_FAIL, GET_COMPANY_DETAIL_DATA_REQUEST, GET_COMPANY_DETAIL_DATA_SUCCESS } from "../constants/companyConstants";


export const getCompanyDataReducer = (state = {}, action : any) => {
    switch (action.type) {
      case GET_COMPANY_DATA_REQUEST:
        return { loading: true };
      case GET_COMPANY_DATA_SUCCESS:
        return { loading: false, getCompanyDataResponse: action.payload };
      case GET_COMPANY_DATA_FAIL:
        return { loading: false, error: action.payload };
      default:
        return state;
    }
  };

  export const getCompanyDetailReducer = (state = {}, action : any) => {
    switch (action.type) {
      case GET_COMPANY_DETAIL_DATA_REQUEST:
        return { loading: true };
      case GET_COMPANY_DETAIL_DATA_SUCCESS:
        return { loading: false, getCompanyDetailsResponse: action.payload };
      case GET_COMPANY_DETAIL_DATA_FAIL:
        return { loading: false, error: action.payload };
      default:
        return state;
    }
  };