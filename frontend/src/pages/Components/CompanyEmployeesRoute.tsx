import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: ReactNode;
}

const CompanyEmployeesRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const userLoginInfo = localStorage.getItem('userLoginInfo')
  ? JSON.parse(localStorage.getItem('userLoginInfo') as any)
  : null;
  // const userSignIn = useSelector((state: any) => state.userSignIn);
  // const { userInfo } = userSignIn;
  if (userLoginInfo && userLoginInfo.isCompanyEmployee) {
    return <>{children}</>; 
  } else {
    return <Navigate to="/user-SignIn" />; 
  }
};

export default CompanyEmployeesRoute;