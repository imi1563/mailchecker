import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const userLoginInfo = localStorage.getItem('userLoginInfo')
  ? JSON.parse(localStorage.getItem('userLoginInfo') as any)
  : null;
  console.log("userLoginInfo",userLoginInfo)
  // const userSignIn = useSelector((state: any) => state.userSignInStore);
  // const { userLoginInfo } = userSignIn;

  if (userLoginInfo && userLoginInfo.isAdmin) {
    return <>{children}</>; 
  } else {
    return <Navigate to="/user-SignIn" />; 
  }
};

export default AdminRoute;
