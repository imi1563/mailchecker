import * as React from "react";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import { useSelector, useDispatch } from "react-redux";
import { userSignInAction } from "../../store/user/actions/userActions";
import { useNavigate } from "react-router-dom";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const UserSignIn = () => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const userSignInData = useSelector((state: any) => state.userSignInStore);

  const {
    loading: userSignInLoading,
    error: userSignInError,
    userSignInResponse,
  } = userSignInData;

  console.log("userSignInResponse", userSignInResponse);
  const dispatch = useDispatch();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string().required("Domain is required"),
  });

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    setOpen(false);
  };

  const handleSubmit = async (values: any) => {
    dispatch(userSignInAction(values, navigate) as any);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ textAlign: "center" }}>
        Please Fill Sign In Form
      </Typography>

      <Formik
        initialValues={{
          email: "",
          password: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, touched, errors }) => (
          <Box
            component={Form}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              "& > :not(style)": { m: 1, width: "100ch" },
            }}
            noValidate
            autoComplete="off"
          >
            <Field
              as={TextField}
              name="email"
              label="Enter Your Email"
              variant="outlined"
              error={touched.email && errors.email}
              helperText={<ErrorMessage name="email" />}
            />

            <Field
              as={TextField}
              name="password"
              label="Enter Your Password"
              variant="outlined"
              type="password"
              sx={{ m: 5 }}
              error={touched.password && errors.password}
              helperText={<ErrorMessage name="password" />}
            />
            {userSignInLoading && (
              <Box sx={{ width: "100%" }}>
                <LinearProgress />
              </Box>
            )}
            {/* {userSignInError && <div>{userSignInError}</div>}
            {userSignInResponse && !userSignInLoading && (
              <h4 style={{ color: "green" }}>{userSignInResponse}</h4>
            )} */}
            <Stack spacing={2} direction="column">
              <Button type="submit" variant="contained">
                Submit
              </Button>
            </Stack>
          </Box>
        )}
      </Formik>
      <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
          Finding your Email
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserSignIn;
