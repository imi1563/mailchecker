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

import { emailFinderAction } from "../../../store/email/action/emailAction";
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const EmailFinder = () => {
  const [open, setOpen] = React.useState(false);

  const companyData = useSelector((state: any) => state.emailFinderStore);

  const {
    loading: emailFinderLoading,
    error: emailFinderError,
    emailFinderResponse,
  } = companyData;
  const dispatch = useDispatch();

  const validationSchema = Yup.object({
    fullName: Yup.string().required("Full Name is required"),
    domain: Yup.string().required("Domain is required"),
  });

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    setOpen(false);
  };

  const handleSubmit = async (values: any) => {
    dispatch(emailFinderAction(values) as any);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ textAlign: "center" }}>
        Find Email
      </Typography>
      <Formik
        initialValues={{
          fullName: "",
          domain: "",
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
              name="fullName"
              label="Enter Full Name"
              variant="outlined"
              error={touched.fullName && errors.fullName}
              helperText={<ErrorMessage name="fullName" />}
            />

            <Field
              as={TextField}
              name="domain"
              label="Enter a Domain"
              variant="outlined"
              sx={{ m: 5 }}
              error={touched.domain && errors.domain}
              helperText={<ErrorMessage name="domain" />}
            />

            {/* {emailFinderError && <div>{emailFinderError}</div>} */}

            <Stack spacing={2} direction="column">
              <Button type="submit" variant="contained">
                Submit
              </Button>
            </Stack>
            {emailFinderResponse && !emailFinderLoading && (
              <h4 style={{ color: "green" }}>{emailFinderResponse}</h4>
            )}
          </Box>
        )}
      </Formik>
      {emailFinderLoading && (
        <Box sx={{ width: "100%" }}>
          <LinearProgress />
        </Box>
      )}
      <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
          Finding your Email
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmailFinder;
