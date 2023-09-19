import { Route, Routes } from "react-router-dom";
import "./App.css";
import ResponsiveAppBar from "./pages/navbar/navar";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import SingleEmail from "./pages/navbar/navbarPages/SingleEmail";
import BulkEmail from "./pages/navbar/navbarPages/BulkEmail";
import EmailFinder from "./pages/navbar/navbarPages/EmailFinder";
import Deliverability from "./pages/navbar/navbarPages/Deliverability";
import ApiPage from "./pages/navbar/navbarPages/ApiPage";
import CompanyDetail from "./pages/CompanyDetail/CompanyDetail";
import EmployeesDetail from "./pages/Employees/EmployeeDetails";
import InvalidEmails from "./pages/InvalidEmails/InvalidEmails";
import UserRegister from "./pages/User/UserRegister";
import RoleAssign from "./pages/Admin/RoleAssign";
import UserSignIn from "./pages/User/UserSignIn";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminRoute from "./pages/Components/AdminRoute";
import AdminAndCompanyEmployeeRoute from "./pages/Components/AdminAndCompanyEmployeeRoute";
import CDesign from "./pages/CompanyDetail/CompanyMainDesign";
import CompanyDetailPage from "./pages/CompanyDetail/CompanyDetailPage";
import CompanyMainDesign from "./pages/CompanyDetail/CompanyMainDesign";

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid spacing={2}>
        <ResponsiveAppBar />

        <Grid sx={{ m: 2 }}>
          <Routes>
            {/* <Route path="/" exact element={HomePage} /> */}
            <Route
              path="/bulk"
              element={
                <AdminRoute>
                  {" "}
                  <BulkEmail />
                </AdminRoute>
              }
            />
            {/* <Route path="/cDesign" element={<CDesign />} /> */}
            <Route
              path="/email-finder"
              element={
                <AdminAndCompanyEmployeeRoute>
                  {" "}
                  <EmailFinder />
                </AdminAndCompanyEmployeeRoute>
              }
            />
            <Route
              path="/single-Email-Verify"
              element={
                <AdminAndCompanyEmployeeRoute>
                  <SingleEmail />
                </AdminAndCompanyEmployeeRoute>
              }
            />
            <Route path="/deliverability" element={<Deliverability />} />
            <Route path="/api" element={<ApiPage />} />
            <Route
              path="/invalid-Emails"
              element={
                <AdminRoute>
                  <InvalidEmails />
                </AdminRoute>
              }
            />
            <Route
              path="/company-Data"
              element={
                <AdminRoute>
                  <CompanyMainDesign />
                </AdminRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <AdminRoute>
                  <EmployeesDetail />
                </AdminRoute>
              }
            />

            <Route
              path="/company-Detail/:id"
              element={
                <AdminRoute>
                  <CompanyDetailPage />
                </AdminRoute>
              }
            />
            <Route path="/user-Register" element={<UserRegister />} />
            <Route path="/user-SignIn" element={<UserSignIn />} />
            <Route
              path="/admin-Role"
              element={
                <AdminRoute>
                  <RoleAssign />
                </AdminRoute>
              }
            />
          </Routes>
        </Grid>
      </Grid>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
    </Box>
  );
}

export default App;
