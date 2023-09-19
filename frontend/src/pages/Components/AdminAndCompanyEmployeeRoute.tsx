import React, { ReactNode } from 'react';

import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminAndCompanyEmployeeRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const userLoginInfo = localStorage.getItem('userLoginInfo')
  ? JSON.parse(localStorage.getItem('userLoginInfo') as any)
  : null;
  console.log("userLoginInfo",userLoginInfo)


  if (userLoginInfo && (userLoginInfo.isAdmin || userLoginInfo.isCompanyEmployee)) {
    return <>{children}</>; 
  } else {
    return <Navigate to="/user-SignIn" />; 
  }
};

export default AdminAndCompanyEmployeeRoute;
