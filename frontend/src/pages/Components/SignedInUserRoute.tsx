import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: ReactNode;
}

const SignedInUserRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const userLoginInfo = localStorage.getItem('userLoginInfo')
  ? JSON.parse(localStorage.getItem('userLoginInfo') as any)
  : null;
  // const userSignIn = useSelector((state: any) => state.userSignInStore);
  // const { userLoginInfo } = userSignIn;
  if (userLoginInfo ) {
    return <>{children}</>; 
  } else {
    return <Navigate to="/user-SignIn" />; 
  }
};

export default SignedInUserRoute;
