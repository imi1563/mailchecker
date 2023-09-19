import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { useSelector, useDispatch } from "react-redux";
import LinearProgress from "@mui/material/LinearProgress";
import { verifySingleEmailAction } from "../../../store/email/action/emailAction";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const SingleEmail = () => {
  const [open, setOpen] = React.useState(false);

  const verifySingleEmailData = useSelector(
    (state: any) => state.verifySingleEmailStore
  );

  const {
    loading: verifySingleEmailLoading,
    error: verifySingleEmailError,
    verifySingleEmailResponse,
  } = verifySingleEmailData;
  console.log("verifySingleEmailResponse", verifySingleEmailResponse);
  const dispatch = useDispatch();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    setOpen(false);
  };

  const handleSubmit = async (values: any) => {
    dispatch(verifySingleEmailAction(values) as any);
  };
  const SMTPResponseCodeDescriptions =
    verifySingleEmailResponse?.invalidEmailDetailData
      ?.SMTPResponseCodesDescription;
  console.log("smtp response", SMTPResponseCodeDescriptions);

  return (
    <Box>
      <Typography variant="h4" sx={{ textAlign: "center" }}>
        Verify Single Email
      </Typography>
      <Formik
        initialValues={{
          email: "",
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
              label="Enter an Email"
              variant="outlined"
              error={touched.email && errors.email}
              helperText={<ErrorMessage name="email" />}
            />

            <Stack spacing={2} direction="column">
              <Button type="submit" variant="contained">
                Submit
              </Button>
            </Stack>
            {verifySingleEmailResponse && !verifySingleEmailLoading && (
              <>
                <h4 style={{ color: "green" }}>
                  {verifySingleEmailResponse?.data}
                </h4>
              </>
            )}
            {SMTPResponseCodeDescriptions &&
              SMTPResponseCodeDescriptions.map(
                (item: string, index: number) => <h4 key={index}>{item}</h4>
              )}
          </Box>
        )}
      </Formik>
      {verifySingleEmailLoading && (
        <Box sx={{ width: "100%" }}>
          <LinearProgress />
        </Box>
      )}
      {/* {verifySingleEmailError && <div>{verifySingleEmailError}</div>} */}

      <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
          Checking your Email
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SingleEmail;
