import { EMAIL_FIND_FAIL, EMAIL_FIND_REQUEST, EMAIL_FIND_SUCCESS, GET_INVALID_EMAILS_FAIL, GET_INVALID_EMAILS_REQUEST, GET_INVALID_EMAILS_SUCCESS, VERIFY_BULK_EMAILS_FAIL, VERIFY_BULK_EMAILS_REQUEST, VERIFY_BULK_EMAILS_SUCCESS, VERIFY_SINGLE_EMAIL_FAIL, VERIFY_SINGLE_EMAIL_REQUEST, VERIFY_SINGLE_EMAIL_SUCCESS } from "../constant/emailConstant";

export const emailFinderReducer = (state = {}, action : any) => {
    switch (action.type) {
      case EMAIL_FIND_REQUEST:
        return { loading: true };
      case EMAIL_FIND_SUCCESS:
        return { loading: false, emailFinderResponse: action.payload };
      case EMAIL_FIND_FAIL:
        return { loading: false, error: action.payload };
      default:
        return state;
    }
  };


  export const verifySingleEmailReducer = (state = {}, action : any) => {
    switch (action.type) {
      case VERIFY_SINGLE_EMAIL_REQUEST:
        return { loading: true };
      case VERIFY_SINGLE_EMAIL_SUCCESS:
        return { loading: false, verifySingleEmailResponse: action.payload };
      case VERIFY_SINGLE_EMAIL_FAIL:
        return { loading: false, error: action.payload };
      default:
        return state;
    }
  };


  export const getInvalidEmailsReducer = (state = {}, action : any) => {
    switch (action.type) {
      case GET_INVALID_EMAILS_REQUEST:
        return { loading: true };
      case GET_INVALID_EMAILS_SUCCESS:
        return { loading: false, getInvalidEmailsResponse: action.payload };
      case GET_INVALID_EMAILS_FAIL:
        return { loading: false, error: action.payload };
      default:
        return state;
    }
  };


  export const verifyBulkEmailsReducer = (state = {}, action : any) => {
    switch (action.type) {
      case VERIFY_BULK_EMAILS_REQUEST:
        return { loading: true };
      case VERIFY_BULK_EMAILS_SUCCESS:
        return { loading: false, verifyBulkEmailsResponse: action.payload };
      case VERIFY_BULK_EMAILS_FAIL:
        return { loading: false, error: action.payload };
      default:
        return state;
    }
  };