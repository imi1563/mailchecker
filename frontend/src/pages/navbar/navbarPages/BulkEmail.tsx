import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { useSelector, useDispatch } from "react-redux";
import LinearProgress from "@mui/material/LinearProgress";
import {
  verifyBulkEmailsAction,
  verifySingleEmailAction,
} from "../../../store/email/action/emailAction";
import { TextareaAutosize } from "@mui/material";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
interface EmailVerificationResult {
  data: string;
}

const BulkEmail = () => {
  const [open, setOpen] = React.useState(false);

  const verifyBulkEmails = useSelector(
    (state: any) => state.verifyBulkEmailsStore
  );

  const {
    loading: verifyBulkEmailsLoading,
    error: verifyBulkEmailsError,
    verifyBulkEmailsResponse,
  } = verifyBulkEmails;
  console.log("verifyBulkEmailsResponse", verifyBulkEmailsResponse);
  const dispatch = useDispatch();

  const validationSchema = Yup.object({
    email: Yup.string(),
  });

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    setOpen(false);
  };

  const handleSubmit = async (values: any) => {
    dispatch(verifyBulkEmailsAction(values) as any);
  };

  return (
    <>
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
              as={TextareaAutosize}
              name="email"
              label="Enter an Email"
              variant="outlined"
              error={touched.email && errors.email}
              helperText={<ErrorMessage name="email" />}
              minRows={10}
              maxRows={20}
            />

            <Stack spacing={2} direction="column">
              <Button type="submit" variant="contained">
                Submit
              </Button>
            </Stack>
          </Box>
        )}
      </Formik>
      {verifyBulkEmailsLoading && (
        <Box sx={{ width: "100%" }}>
          <LinearProgress />
        </Box>
      )}
      {/* {verifySingleEmailError && <div>{verifySingleEmailError}</div>} */}
      {verifyBulkEmailsResponse && !verifyBulkEmailsLoading && (
        <h4 style={{ color: "green" }}>
          {/* {verifyBulkEmailsResponse?.map((item: String, index: any) => {
            <h4>{String(item[index])}</h4>;
          })} */}
        </h4>
      )}
      {verifyBulkEmailsResponse &&
        verifyBulkEmailsResponse?.map(
          (item: EmailVerificationResult, index: number) => (
            <h4 key={index} style={{ color: "green" }}>
              {item?.data}
            </h4>
          )
        )}
      <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
          Checking your Email
        </Alert>
      </Snackbar>
    </>
  );
};

export default BulkEmail;
