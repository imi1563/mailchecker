const express = require("express");
const {
  singleEmailVerifier,
  findMultipleEmails,
  multipleFileUploader,
  postedEmployeeData,
  postedCompanyData,
  getCompanyData,
  getEmployeeData,
  getInvalidEmails,
  verifyBulk,
  getCompanyDetailsData,
} = require("../controller/emailControllers");
const multer = require("multer");
const emailRouter = express.Router();

const upload = multer({ dest: "uploads/" });

emailRouter.post("/verifySingle", singleEmailVerifier);
emailRouter.post("/emailFinderMultiple", findMultipleEmails);
emailRouter.post(
  "/uploadFileOfEmails",
  upload.single("file"),
  multipleFileUploader
);

emailRouter.post("/postEmployeeData", postedEmployeeData);

emailRouter.post("/postCompanyData", postedCompanyData);

emailRouter.get("/getCompanyData", getCompanyData);
emailRouter.get("/getEmployeeData/:id", getEmployeeData);
emailRouter.get("/getInvalidEmails", getInvalidEmails);
emailRouter.post("/bulk", verifyBulk);
emailRouter.get("/getCompanyDetailData/:id", getCompanyDetailsData);
module.exports = emailRouter;
