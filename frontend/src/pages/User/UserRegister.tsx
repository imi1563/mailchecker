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
import { useNavigate } from "react-router-dom";

import { userRegisterAction } from "../../store/user/actions/userActions";
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const UserRegister = () => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const userRegisterData = useSelector((state: any) => state.userRegisterStore);

  const {
    loading: userRegisterLoading,
    error: userRegisterError,
    userRegisterResponse,
  } = userRegisterData;
  console.log("userRegisterResponse", userRegisterResponse);
  console.log("userRegisterError", userRegisterError);

  const dispatch = useDispatch();

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),

    password: Yup.string().required("Password is required"),
  });

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    setOpen(false);
  };

  const handleSubmit = async (values: any) => {
    dispatch(userRegisterAction(values, navigate) as any);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ textAlign: "center" }}>
        Please Fill Registration Form
      </Typography>
      <Formik
        initialValues={{
          name: "",
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
              name="name"
              label="Enter Your Name"
              variant="outlined"
              error={touched.name && errors.name}
              helperText={<ErrorMessage name="name" />}
            />
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
            {userRegisterLoading && (
              <Box sx={{ width: "100%" }}>
                <LinearProgress />
              </Box>
            )}

            <Stack spacing={2} direction="column">
              <Button type="submit" variant="contained">
                Submit
              </Button>
            </Stack>
            {/* {userRegisterError && <div style={{color:"red"}}>{userRegisterError}</div>} */}
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

export default UserRegister;
