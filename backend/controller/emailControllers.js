var validator = require("validator");
const parse = require("csv-parser");
const fs = require("fs");
const randomstring = require("randomstring");
const emailFinder = require("./email");
const smtpVerifier = require("../smtpVerification/email");
const dns = require("dns");

const Employee = require("../model/employeeModel");
const Company = require("../model/companyModel");
const invalidEmail = require("../model/invalidEmail");
const { CLIENT_RENEG_LIMIT } = require("tls");
const findDNSFunction = require("../smtpVerification/findDNSRecord");
const { clearLogs } = require("../smtpVerification/smtp/smtp");

const input = {
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
};

const singleEmailVerifier = async (req, res) => {
  const mail = req.body.email;
  console.log("mail", mail);

  const domain = mail.email.split("@")[1];
  console.log("dom", domain);

  var email = mail.email.trim();

  const validEmail = validator.isEmail(email);

  if (!validEmail) {
    res.send({ success: false, data: `Email : ${email} Format is not valid` });
    return;
  }

  const emailData = {
    companyDomain: domain,
    email: email,
    employeeEmailFormate: "",
    jobTitle: "",
    server: "",
    validCategory: "",
    linkedinProfileUrl: "",
    location: "",
    durationIncurrentRole: "",
    company: "",
  };

  const invalidEmailData = {
    email: email,
    SMTPResponseCode: "",
    invalidEmailDomain: domain,
    acceptAll: "",
    SMTPResponseCodesDescription: [],
  };
  const companyData = {
    companyName: "",
    companyDomain: domain,

    socialIcons: [],
    companySize: "",
    employeeSize: "",
    industry: "",
    headquarterLocation: "",
    phoneNumber: "03003331234",
    companyEmailFormate: "",
    acceptAll: "no",
    ValidCategory: "",
  };

  try {
    const dnsFUN = await findDNSFunction(domain);
    console.log("my DNS Function", dnsFUN);
    if (dnsFUN) {
      const existingDomain = await Company.findOne({
        companyDomain: domain,
      });
      console.log("existing domain", existingDomain);

      if (existingDomain) {
        let result = {};
        try {
          const companyId = existingDomain._id;

          const employeesCoun = await Employee.find({ company: companyId });

          let totalCount = employeesCoun.length;
          let categoryCounts = {};
          for (let employee of employeesCoun) {
            let category = employee.validCategory;
            if (categoryCounts.hasOwnProperty(category)) {
              categoryCounts[category]++;
            } else {
              categoryCounts[category] = 1;
            }
          }

          for (let category in categoryCounts) {
            let percentage = (categoryCounts[category] / totalCount) * 100;
            result[category] = percentage;
          }

          await Company.findByIdAndUpdate(
            companyId,
            { validCategory: result },
            { new: true }
          );
        } catch (error) {
          console.log(error);
        }
        console.log("Result of sorting", result);

        const validCategoriesFromCompany = Object.keys(result).sort(
          (a, b) => result[b] - result[a]
        );
        console.log(
          "valid Categories From Company",
          validCategoriesFromCompany
        );
        // Domain exists
        const existingEmail = await Employee.findOne({ email: email });
        console.log("existingEmail Result", existingEmail);

        if (existingEmail) {
          console.log("inside existing email");
          let currentTime = new Date();
          let updatedTimestamps = existingEmail.updatedTimeStamps;
          let timeDifference = currentTime - updatedTimestamps;

          let differenceInDays = timeDifference / (1000 * 60 * 60 * 24);
          console.log("differenceInDays", differenceInDays);
          // await existingEmail.updateLastFetchedTime();
          //differenceInDays = 100;
          if (differenceInDays > 180) {
            if (existingEmail.validCategory == "smtp") {
              console.log("first1");
              const { smptResponse: isSmtpValid, filteredLogsData } =
                await smtpVerifier.verifyEmail(email);
              if (isSmtpValid.valid) {
                console.log("smtpVerifier");
                res.send({ success: true, data: `${email} is valid` });
              } else {
                if (existingDomain.acceptAll == "no") {
                  const isGlxValid = await emailFinder.checkGmail(email, input);
                  if (
                    isGlxValid.can_connect_smtp &&
                    isGlxValid.is_deliverable
                  ) {
                    await Employee.updateOne(
                      { _id: existingEmail._id },
                      { $set: { validCategory: "glx" } }
                    );
                    res.send({ success: true, data: `${email} is valid` });
                  } else {
                    await Employee.deleteOne({ _id: existingEmail._id });
                    invalidEmailData.acceptAll = "no";
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    await invalidEmail.create(invalidEmailData);

                    res.send({
                      success: false,
                      data: `${email} is not valid`,
                      invalidEmailDetailData: invalidEmailData,
                    });
                  }
                } else if (existingDomain.acceptAll == "yes") {
                  const isGlxValid = await emailFinder.checkGmail(email, input);
                  if (
                    isGlxValid.can_connect_smtp &&
                    isGlxValid.is_deliverable
                  ) {
                    await Employee.updateOne(
                      { _id: existingEmail._id },
                      { $set: { validCategory: "glx" } }
                    );
                    res.send({ success: true, data: `${email} is valid` });
                  } else {
                    let isUnameValid = await emailFinder.UnameValid(email);
                    isUnameValid = false;
                    if (isUnameValid) {
                      res.send({ success: true, data: `${email} is valid` });
                    } else {
                      const isGmailValid = await emailFinder.gmail(email);
                      if (isGmailValid.valid) {
                        await Employee.updateOne(
                          { _id: existingEmail._id },
                          { $set: { validCategory: "gmail" } }
                        );
                        res.send({ success: true, data: `${email} is valid` });
                      } else {
                        const isOutlookValid = await emailFinder.outlook(email);
                        if (isOutlookValid) {
                          await Employee.updateOne(
                            { _id: existingEmail._id },
                            { $set: { validCategory: "outlook" } }
                          );
                          res.send({
                            success: true,
                            data: `${email} is valid`,
                          });
                        } else {
                          await Employee.deleteOne({ _id: existingEmail._id });
                          invalidEmailData.acceptAll = "yes";
                          invalidEmailData.SMTPResponseCode =
                            isSmtpValid?.validators?.smtp?.errorCode;
                          invalidEmailData.SMTPResponseCodesDescription =
                            filteredLogsData;
                          await invalidEmail.create(invalidEmailData);

                          res.send({
                            success: false,
                            data: `${email} is not valid`,
                            invalidEmailDetailData: invalidEmailData,
                          });
                        }
                      }
                    }
                  }
                } else {
                  await Employee.deleteOne({ _id: existingEmail._id });
                  invalidEmailData.acceptAll = "no";
                  invalidEmailData.SMTPResponseCode =
                    isSmtpValid?.validators?.smtp?.errorCode;
                  invalidEmailData.SMTPResponseCodesDescription =
                    filteredLogsData;
                  await invalidEmail.create(invalidEmailData);
                  res.send({
                    success: false,
                    data: `${email} is not valid`,
                    invalidEmailDetailData: invalidEmailData,
                  });
                }
              }
            } else if (existingEmail.validCategory == "gmail") {
              console.log("inside gmail");
              const isGmailValid = await emailFinder.gmail(email);
              if (isGmailValid) {
                res.send({ success: true, data: `${email} is valid` });
              } else {
                if (existingDomain.acceptAll == "no") {
                  const isGlxValid = await emailFinder.checkGmail(email, input);
                  if (
                    isGlxValid.can_connect_smtp &&
                    isGlxValid.is_deliverable
                  ) {
                    await Employee.updateOne(
                      { _id: existingEmail._id },
                      { $set: { validCategory: "glx" } }
                    );
                    res.send({ success: true, data: `${email} is valid` });
                  } else {
                    const { smptResponse: isSmtpValid, filteredLogsData } =
                      await smtpVerifier.verifyEmail(email);
                    console.log("issmtp", isSmtpValid);
                    if (isSmtpValid.valid) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "smtp" } }
                      );
                      res.send({ success: true, data: `${email} is valid` });
                    } else {
                      await Employee.deleteOne({ _id: existingEmail._id });
                      invalidEmailData.acceptAll = "no";
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;

                      await invalidEmail.create(invalidEmailData);
                      res.send({
                        success: false,
                        data: `${email} is not valid`,
                        invalidEmailDetailData: invalidEmailData,
                      });
                    }
                  }
                } else if (existingDomain.acceptAll == "yes") {
                  const isGlxValid = await emailFinder.checkGmail(email, input);
                  if (
                    isGlxValid.can_connect_smtp &&
                    isGlxValid.is_deliverable
                  ) {
                    await Employee.updateOne(
                      { _id: existingEmail._id },
                      { $set: { validCategory: "glx" } }
                    );
                    res.send({ success: true, data: `${email} is valid` });
                  } else {
                    const isOutlookValid = await emailFinder.outlook(email);
                    if (isOutlookValid) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "outlook" } }
                      );
                      res.send({ success: true, data: `${email} is valid` });
                    } else {
                      await Employee.deleteOne({ _id: existingEmail._id });
                      invalidEmailData.acceptAll = "yes";
                      invalidEmailData.acceptAll = "no";
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      await invalidEmail.create(invalidEmailData);
                      res.send({
                        success: false,
                        data: `${email} is not valid`,
                        invalidEmailDetailData: invalidEmailData,
                      });
                    }
                  }
                }
              }
            } else if (existingEmail.validCategory == "glx") {
              console.log("inside glx");
              const isGlxValid = await emailFinder.checkGmail(email, input);
              if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                res.send({ success: true, data: `${email} is valid` });
              } else {
                if (existingDomain.acceptAll == "yes") {
                  const isGmailValid = await emailFinder.gmail(email);
                  if (isGmailValid) {
                    await Employee.updateOne(
                      { _id: existingEmail._id },
                      { $set: { validCategory: "gmail" } }
                    );

                    res.send({ success: true, data: `${email} is valid` });
                  } else {
                    const isOutlookValid = await emailFinder.outlook(email);
                    if (isOutlookValid) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "outlook" } }
                      );
                      res.send({ success: true, data: `${email} is valid` });
                    } else {
                      await Employee.deleteOne({ _id: existingEmail._id });
                      invalidEmailData.acceptAll = "yes";
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      await invalidEmail.create(invalidEmailData);

                      res.send({
                        success: false,
                        data: `${email} is not valid`,
                        invalidEmailDetailData: invalidEmailData,
                      });
                    }
                  }
                } else if (existingDomain.acceptAll == "no") {
                  const { smptResponse: isSmtpValid, filteredLogsData } =
                    await smtpVerifier.verifyEmail(email);
                  console.log("issmtp", isSmtpValid);
                  if (isSmtpValid.valid) {
                    await Employee.updateOne(
                      { _id: existingEmail._id },
                      { $set: { validCategory: "smtp" } }
                    );
                    res.send({ success: true, data: `${email} is valid` });
                  } else {
                    await Employee.deleteOne({ _id: existingEmail._id });

                    invalidEmailData.acceptAll = "no";
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    await invalidEmail.create(invalidEmailData);
                    res.send({
                      success: false,
                      data: `${email} is not valid`,
                      invalidEmailDetailData: invalidEmailData,
                    });
                  }
                }
              }
            } else if (existingEmail.validCategory == "outlook") {
              console.log("inside outlook");
              const isOutlookValid = await emailFinder.outlook(email);
              if (isOutlookValid) {
                res.send({ success: true, data: `${email} is valid` });
              } else {
                if (existingDomain.acceptAll == "yes") {
                  const isGmailValid = await emailFinder.gmail(email);
                  if (isGmailValid) {
                    await Employee.updateOne(
                      { _id: existingEmail._id },
                      { $set: { validCategory: "gmail" } }
                    );
                    res.send({ success: true, data: `${email} is valid` });
                  } else {
                    const isGlxValid = await emailFinder.checkGmail(
                      email,
                      input
                    );
                    if (
                      isGlxValid.can_connect_smtp &&
                      isGlxValid.is_deliverable
                    ) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "glx" } }
                      );
                      res.send({ success: true, data: `${email} is valid` });
                    } else {
                      await Employee.deleteOne({ _id: existingEmail._id });
                      invalidEmailData.acceptAll = "yes";
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      await invalidEmail.create(invalidEmailData);
                      res.send({
                        success: false,
                        data: `${email} is not valid`,
                        invalidEmailDetailData: invalidEmailData,
                      });
                    }
                  }
                } else if (existingDomain.acceptAll == "no") {
                  const isGlxValid = await emailFinder.checkGmail(email, input);
                  if (
                    isGlxValid.can_connect_smtp &&
                    isGlxValid.is_deliverable
                  ) {
                    await Employee.updateOne(
                      { _id: existingEmail._id },
                      { $set: { validCategory: "glx" } }
                    );
                    res.send({ success: true, data: `${email} is valid` });
                  } else {
                    const { smptResponse: isSmtpValid, filteredLogsData } =
                      await smtpVerifier.verifyEmail(email);
                    if (isSmtpValid.valid) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "smtp" } }
                      );
                      res.send({ success: true, data: `${email} is valid` });
                    } else {
                      await Employee.deleteOne({ _id: existingEmail._id });
                      invalidEmailData.acceptAll = "no";
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      await invalidEmail.create(invalidEmailData);
                      res.send({
                        success: false,
                        data: `${email} is not valid`,
                        invalidEmailDetailData: invalidEmailData,
                      });
                    }
                  }
                }
              }
            }
          } else {
            console.log("its valid  email");
            res.send({ success: true, data: `${email} is valid` });
          }
        } else {
          console.log("email not exists section");
          const existingInvalidEmail = await invalidEmail.findOne({
            email: email,
          });
          console.log("Invalid Exists Result : ", existingInvalidEmail);
          if (existingInvalidEmail) {
            res.send({
              success: false,
              data: `${email} is not valid`,
              invalidEmailDetailData: existingInvalidEmail,
            });
          } else if (existingDomain.acceptAll == "yes") {
            const sortedMethods = validCategoriesFromCompany.filter(
              (key) => key !== "smtp"
            );
            console.log("Required Result:", sortedMethods);
            const validMethods = ["glx", "gmail", "outlook"];
            const remainingMethods = validMethods.filter(
              (method) => !sortedMethods.includes(method)
            );

            let isValid = false;

            for (const method of sortedMethods) {
              if (method === "glx") {
                console.log("inside glx");
                const isGlxValid = await emailFinder.checkGmail(email, input);
                console.log("isGlxValid", isGlxValid);
                if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                  emailData.validCategory = "glx";
                  isValid = true;
                  break;
                }
              } else if (method === "gmail") {
                console.log("inside gmail");
                const isGmailValid = await emailFinder.gmail(email);
                console.log("isGmailValid", isGmailValid);
                if (isGmailValid) {
                  emailData.validCategory = "gmail";
                  isValid = true;
                  break;
                }
              } else if (method === "outlook") {
                console.log("inside outlook");
                const isOutlookValid = await emailFinder.outlook(email);
                console.log("isOutlookValid", isOutlookValid);
                if (isOutlookValid) {
                  emailData.validCategory = "outlook";
                  isValid = true;
                  break;
                }
              }
            }

            if (!isValid) {
              for (const method of remainingMethods) {
                if (method === "glx") {
                  console.log("inside glx");
                  const isGlxValid = await emailFinder.checkGmail(email, input);
                  console.log("isGlxValid", isGlxValid);
                  if (
                    isGlxValid.can_connect_smtp &&
                    isGlxValid.is_deliverable
                  ) {
                    emailData.validCategory = "glx";
                    isValid = true;
                    break;
                  }
                } else if (method === "gmail") {
                  console.log("inside gmail");
                  const isGmailValid = await emailFinder.gmail(email);
                  console.log("isGmailValid", isGmailValid);
                  if (isGmailValid) {
                    emailData.validCategory = "gmail";
                    isValid = true;
                    break;
                  }
                } else if (method === "outlook") {
                  console.log("inside outlook");
                  const isOutlookValid = await emailFinder.outlook(email);
                  console.log("isOutlookValid", isOutlookValid);
                  if (isOutlookValid) {
                    emailData.validCategory = "outlook";
                    isValid = true;
                    break;
                  }
                }
              }
            }

            if (isValid) {
              emailData.company = existingDomain._id;
              await Employee.create(emailData);
              res.send({ success: true, data: `${email} is valid` });
            } else {
              invalidEmailData.acceptAll = "yes";
              await invalidEmail.create(invalidEmailData);

              res.send({
                success: false,
                data: `${email} is not valid`,
                invalidEmailDetailData: invalidEmailData,
              });
            }
          } else if (existingDomain.acceptAll == "no") {
            console.log("accept all no section");
            const keysToExclude = ["outlook", "gmail"];

            const sortedMethods = validCategoriesFromCompany.filter(
              (key) => !keysToExclude.includes(key)
            );
            console.log("Required Result:", sortedMethods);

            if (sortedMethods[0] === "glx") {
              const isGlxValid = await emailFinder.checkGmail(email, input);
              if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                emailData.validCategory = "glx";
                emailData.company = existingDomain._id;
                await Employee.create(emailData);
                res.send({ success: true, data: `${email} is valid` });
              } else {
                const { smptResponse: isSmtpValid, filteredLogsData } =
                  await smtpVerifier.verifyEmail(email);
                console.log("issmtp", isSmtpValid);
                if (isSmtpValid.valid) {
                  emailData.validCategory = "smtp";
                  emailData.company = existingDomain._id;
                  await Employee.create(emailData);
                  res.send({ success: true, data: `${email} is valid` });
                } else {
                  invalidEmailData.acceptAll = "no";
                  invalidEmailData.SMTPResponseCode =
                    isSmtpValid?.validators?.smtp?.errorCode;
                  invalidEmailData.SMTPResponseCodesDescription =
                    filteredLogsData;
                  await invalidEmail.create(invalidEmailData);
                  res.send({
                    success: false,
                    data: `${email} is not valid`,
                    invalidEmailDetailData: invalidEmailData,
                  });
                }
              }
            } else if (sortedMethods[0] === "smtp") {
              console.log("smtp sortedmethod");
              const { smptResponse: isSmtpValid, filteredLogsData } =
                await smtpVerifier.verifyEmail(email);
              console.log("issmtp", isSmtpValid);
              if (isSmtpValid.valid) {
                emailData.validCategory = "smtp";
                emailData.company = existingDomain._id;
                await Employee.create(emailData);

                res.send({ success: true, data: `${email} is valid` });
              } else {
                const isGlxValid = await emailFinder.checkGmail(email, input);
                if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                  emailData.validCategory = "glx";
                  emailData.company = existingDomain._id;
                  await Employee.create(emailData);

                  res.send({ success: true, data: `${email} is valid` });
                }
                invalidEmailData.SMTPResponseCode =
                  isSmtpValid?.validators?.smtp?.errorCode;
                invalidEmailData.SMTPResponseCodesDescription =
                  filteredLogsData;
                await invalidEmail.create(invalidEmailData);
                res.send({
                  success: false,
                  data: `${email} is not valid`,
                  invalidEmailDetailData: invalidEmailData,
                });
              }
            } else {
              const isGlxValid = await emailFinder.checkGmail(email, input);
              if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                emailData.validCategory = "glx";
                emailData.company = existingDomain._id;
                await Employee.create(emailData);
                res.send({ success: true, data: `${email} is valid` });
              } else {
                const { smptResponse: isSmtpValid, filteredLogsData } =
                  await smtpVerifier.verifyEmail(email);
                console.log("issmtp", isSmtpValid);
                if (isSmtpValid.valid) {
                  emailData.validCategory = "smtp";
                  emailData.company = existingDomain._id;
                  await Employee.create(emailData);
                  res.send({ success: true, data: `${email} is valid` });
                } else {
                  invalidEmailData.acceptAll = "no";
                  invalidEmailData.SMTPResponseCode =
                    isSmtpValid?.validators?.smtp?.errorCode;
                  invalidEmailData.SMTPResponseCodesDescription =
                    filteredLogsData;
                  await invalidEmail.create(invalidEmailData);
                  res.send({
                    success: false,
                    data: `${email} is not valid`,
                    invalidEmailDetailData: invalidEmailData,
                  });
                }
              }
            }
          }
        }
      } else {
        // This Part Done
        console.log("Domain Not Exists Section");

        let companyResult;
        try {
          companyResult = await Company.create(companyData);
        } catch (error) {
          console.log("error", error);
        }

        console.log("created company", companyResult);
        const { smptResponse: isEmailValid, filteredLogsData } =
          await smtpVerifier.verifyEmail(email);
        console.log("Orig Email Result from Smpt:", isEmailValid);
        if (isEmailValid.valid) {
          const emailAddress = `${randomstring.generate(10)}@${domain}`;
          const { smptResponse: isCatch, filteredLogsData } =
            await smtpVerifier.verifyEmail(emailAddress);
          console.log("accept all Result", isCatch);

          if (isCatch.valid) {
            companyData.acceptAll = "yes";
            await Company.updateOne(
              { _id: companyResult._id },
              { $set: { acceptAll: "yes" } }
            );

            const isGlxValid = await emailFinder.checkGmail(email, input);

            console.log("glx result", isGlxValid);
            if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
              emailData.validCategory = "glx";
              emailData.company = companyResult._id;
              await Employee.create(emailData);

              res.send({ success: true, data: `${email} is valid` });
            } else {
              const isEmailValid = await emailFinder.gmail(email);
              console.log("gmail result", isEmailValid);
              if (isEmailValid) {
                emailData.validCategory = "gmail";
                emailData.company = companyResult._id;
                await Employee.create(emailData);

                res.send({ success: true, data: `${email} is valid` });
              } else {
                const isOutlookValid = await emailFinder.outlook(email);
                console.log("outlook result", isOutlookValid);
                if (isOutlookValid) {
                  emailData.validCategory = "outlook";
                  emailData.company = companyResult._id;
                  await Employee.create(emailData);
                  res.send({ success: true, data: `${email} is valid` });
                } else {
                  console.log("Invalid section");
                  invalidEmailData.acceptAll = "yes";

                  invalidEmailData.SMTPResponseCode =
                    isEmailValid?.validators?.smtp?.errorCode;
                  invalidEmailData.SMTPResponseCodesDescription =
                    filteredLogsData;

                  await invalidEmail.create(invalidEmailData);
                  res.send({
                    success: false,
                    data: `${email} is not valid`,
                    invalidEmailDetailData: invalidEmailData,
                  });
                }
              }
            }
          } else {
            console.log("orig valid but not accept all");
            emailData.validCategory = "smtp";
            await Company.updateOne(
              { _id: companyResult._id },
              { $set: { acceptAll: "no" } }
            );

            emailData.company = companyResult._id;

            await Employee.create(emailData);
            res.send({ success: true, data: `${email} is valid` });
          }
        } else {
          console.log("orig invalid from smtp");
          invalidEmailData.SMTPResponseCode =
            isEmailValid?.validators?.smtp?.errorCode;
          invalidEmailData.SMTPResponseCodesDescription = filteredLogsData;
          invalidEmailData.acceptAll = "no";

          await invalidEmail.create(invalidEmailData);
          res.send({
            success: false,
            data: `${email} is not valid`,
            invalidEmailDetailData: invalidEmailData,
          });
        }
      }
    } else {
      res.send({ success: false, data: `Domain is not valid` });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({ success: false, error });
  }
};

const findMultipleEmails = async (req, res) => {
  const fullName = req.body.fullName;
  const domain = req.body.domain;
  console.log("body:", req.body);
  const nameParts = fullName.trim().split(" ");

  if (nameParts.length < 2 || nameParts[1].trim() === "") {
    return res.status(400).send({
      success: false,
      info: "Please provide both the first and last name.",
    });
  }

  const Emails = emailFinder.generateEmailVariationsRows(fullName, domain);
  const emails = Emails.map((obj) => obj.email);

  const existingDomain = await Company.findOne({
    companyDomain: domain,
  });

  console.log(emails);
  console.log(domain);
  const emailData = {
    companyDomain: domain,
    email: "",
    employeeEmailFormate: "",
    jobTitle: "",
    server: "",
    validCategory: "",
    linkedinProfileUrl: "",
    location: "",
    durationIncurrentRole: "",
    company: "",
  };

  const invalidEmailData = {
    email: "",
    SMTPResponseCode: "",
    invalidEmailDomain: domain,
    acceptAll: "no",
  };
  const companyData = {
    companyName: "senewtech",
    companyDomain: domain,
    socialIcons: [],
    companySize: "",
    employeeSize: "",
    industry: "",
    headquarterLocation: "",
    phoneNumber: "03003331234",
    companyEmailFormate: "",
    acceptAll: "no",
    ValidCategory: "smtp",
  };
  const dnsFUN = await findDNSFunction(domain);
  console.log("my DNS Function", dnsFUN);
  if (dnsFUN) {
    if (existingDomain) {
      const validEmailsFromDb = await Employee.find({
        company: existingDomain._id,
      });
      let validCategoryResult = {};
      let emailFormateResult = {};
      try {
        let totalCount = validEmailsFromDb.length;
        let categoryCountsValid = {};
        let categoryCountsEmail = {};
        for (let employee of validEmailsFromDb) {
          let validCategory = employee.validCategory;
          if (categoryCountsValid.hasOwnProperty(validCategory)) {
            categoryCountsValid[validCategory]++;
          } else {
            categoryCountsValid[validCategory] = 1;
          }
          let employeeEmailFormate = employee.employeeEmailFormate;
          if (categoryCountsEmail.hasOwnProperty(employeeEmailFormate)) {
            categoryCountsEmail[employeeEmailFormate]++;
          } else {
            categoryCountsEmail[employeeEmailFormate] = 1;
          }
        }

        for (let category in categoryCountsValid) {
          let percentage = (categoryCountsValid[category] / totalCount) * 100;
          validCategoryResult[category] = percentage;
        }
        for (let category in categoryCountsEmail) {
          let percentage = (categoryCountsEmail[category] / totalCount) * 100;
          emailFormateResult[category] = percentage;
        }
        await Company.findByIdAndUpdate(
          existingDomain._id,
          {
            validCategory: validCategoryResult,
            companyEmailFormate: emailFormateResult,
          },
          { new: true }
        );
      } catch (error) {
        console.log(error);
      }

      let validEmailSet = new Set(
        validEmailsFromDb.map((entry) => entry.email)
      );

      let matchingEmail = emails.find((email) => validEmailSet.has(email));
      const inValidEmailsFromDb = await invalidEmail.find({
        invalidEmailDomain: domain,
      });

      let inValidEmailSet = new Set(
        inValidEmailsFromDb.map((entry) => entry.email)
      );
      let notMatchingInvalidEmails = emails.filter(
        (email) => !inValidEmailSet.has(email)
      );

      let notMatchingInvalidEmailsWithFormat = notMatchingInvalidEmails.map(
        (email) => {
          const emailObject = Emails.find((obj) => obj.email === email);
          return {
            email: email,
            emailFormate: emailObject ? emailObject.emailFormate : "unknown",
          };
        }
      );

      const validCategoriesFromCompany = Object.keys(validCategoryResult).sort(
        (a, b) => validCategoryResult[b] - validCategoryResult[a]
      );

      const sortedEmailFormats = Object.keys(emailFormateResult).sort(
        (a, b) => emailFormateResult[b] - emailFormateResult[a]
      );

      const existingSortedItems = notMatchingInvalidEmailsWithFormat.filter(
        (item) => sortedEmailFormats.includes(item.emailFormate)
      );

      console.log("existingSortedItems items", existingSortedItems);

      const remainingSortedItems = notMatchingInvalidEmailsWithFormat.filter(
        (item) => !sortedEmailFormats.includes(item.emailFormate)
      );

      console.log("remainingSortedItems items", remainingSortedItems);

      if (matchingEmail) {
        res.send({ success: true, data: `${matchingEmail} is valid` });
      } else {
        if (existingDomain.acceptAll === "no") {
          console.log("accept all no section");
          const keysToExclude = ["outlook", "gmail"];
          console.log("validCategoriesFromCompany", validCategoriesFromCompany);
          const sortedMethods = validCategoriesFromCompany.filter(
            (key) => !keysToExclude.includes(key)
          );
          console.log("Required Result:", sortedMethods);
          let inValidEmailArray = [];

          let isValid = false;

          for (let item of existingSortedItems) {
            console.log("first the loop");
            if (sortedMethods.length > 0) {
              console.log("existing domain category");
              if (sortedMethods[0] === "glx") {
                const isGlxValid = await emailFinder.checkGmail(
                  item.email,
                  input
                );
                console.log("isGlxValid", isGlxValid);
                if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                  emailData.validCategory = "glx";
                  emailData.email = item.email;
                  const foundEmailFormat = Emails.find(
                    (obj) => obj.email === item.email
                  )?.emailFormate;
                  if (foundEmailFormat) {
                    emailData.employeeEmailFormate = foundEmailFormat;
                    emailData.company = existingDomain._id;

                    await Employee.create(emailData);
                  }
                  res.send({ success: true, data: `${item.email} is valid` });
                  isValid = true;
                  break;
                } else {
                  const { smptResponse: isSmtpValid, filteredLogsData } =
                    await smtpVerifier.verifyEmail(item.email);
                  console.log("issmtp", isSmtpValid);
                  if (isSmtpValid.valid) {
                    emailData.validCategory = "smtp";
                    emailData.email = item.email;
                    const foundEmailFormat = Emails.find(
                      (obj) => obj.email === item.email
                    )?.emailFormate;
                    if (foundEmailFormat) {
                      emailData.employeeEmailFormate = foundEmailFormat;
                      emailData.company = existingDomain._id;

                      await Employee.create(emailData);
                    }
                    res.send({ success: true, data: `${item.email} is valid` });
                    isValid = true;
                    break;
                  } else {
                    let invalidEmailData = {
                      email: item.email,
                      SMTPResponseCode: "",
                      invalidEmailDomain: domain,
                      acceptAll: "no",
                    };
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    inValidEmailArray.push(invalidEmailData);
                  }
                }
              } else if (sortedMethods[0] === "smtp") {
                console.log("smtp sortedmethod");
                const isSmtpValid = await smtpVerifier.verifyEmail(item.email);
                console.log("issmtp", isSmtpValid);
                if (isSmtpValid.valid) {
                  emailData.validCategory = "smtp";
                  emailData.email = item.email;
                  const foundEmailFormat = Emails.find(
                    (obj) => obj.email === item.email
                  )?.emailFormate;
                  if (foundEmailFormat) {
                    emailData.employeeEmailFormate = foundEmailFormat;
                    emailData.company = existingDomain._id;

                    await Employee.create(emailData);
                  }
                  res.send({ success: true, data: `${item.email} is valid` });
                  isValid = true;
                  break;
                } else {
                  const isGlxValid = await emailFinder.checkGmail(
                    item.email,
                    input
                  );
                  if (
                    isGlxValid.can_connect_smtp &&
                    isGlxValid.is_deliverable
                  ) {
                    emailData.validCategory = "glx";
                    emailData.email = item.email;
                    const foundEmailFormat = Emails.find(
                      (obj) => obj.email === item.email
                    )?.emailFormate;
                    if (foundEmailFormat) {
                      emailData.employeeEmailFormate = foundEmailFormat;
                      emailData.company = existingDomain._id;

                      await Employee.create(emailData);
                    }
                    res.send({ success: true, data: `${item.email} is valid` });
                    isValid = true;
                    break;
                  }
                  let invalidEmailData = {
                    email: item.email,
                    SMTPResponseCode: "",
                    invalidEmailDomain: domain,
                    acceptAll: "no",
                  };
                  invalidEmailData.SMTPResponseCode =
                    isSmtpValid?.validators?.smtp?.errorCode;
                  invalidEmailData.SMTPResponseCodesDescription =
                    filteredLogsData;
                  inValidEmailArray.push(invalidEmailData);
                }
              } else {
                let invalidEmailData = {
                  email: item.email,
                  SMTPResponseCode: isSmtpValid?.validators?.smtp?.errorCode,
                  invalidEmailDomain: domain,
                  acceptAll: "no",
                };
                invalidEmailData.SMTPResponseCode =
                  isSmtpValid?.validators?.smtp?.errorCode;
                invalidEmailData.SMTPResponseCodesDescription =
                  filteredLogsData;
                inValidEmailArray.push(invalidEmailData);
              }
            } else {
              const isGlxValid = await emailFinder.checkGmail(
                item.email,
                input
              );
              if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                emailData.validCategory = "glx";
                emailData.email = item.email;
                const foundEmailFormat = Emails.find(
                  (obj) => obj.email === item.email
                )?.emailFormate;
                console.log("foundEmailFormat", foundEmailFormat);
                if (foundEmailFormat) {
                  emailData.employeeEmailFormate = foundEmailFormat;
                  emailData.company = existingDomain._id;

                  await Employee.create(emailData);
                }
                res.send({ success: true, data: `${item.email} is valid` });
                isValid = true;
                break;
              } else {
                const isSmtpValid = await smtpVerifier.verifyEmail(item.email);
                console.log("issmtp", isSmtpValid);
                if (isSmtpValid.valid) {
                  emailData.validCategory = "smtp";
                  emailData.email = item.email;
                  const foundEmailFormat = Emails.find(
                    (obj) => obj.email === item.email
                  )?.emailFormate;
                  if (foundEmailFormat) {
                    emailData.employeeEmailFormate = foundEmailFormat;
                    emailData.company = existingDomain._id;

                    await Employee.create(emailData);
                  }
                  res.send({ success: true, data: `${item.email} is valid` });
                  isValid = true;
                  break;
                } else {
                  let invalidEmailData = {
                    email: item.email,
                    SMTPResponseCode: "",
                    invalidEmailDomain: domain,
                    acceptAll: "no",
                  };
                  invalidEmailData.SMTPResponseCode =
                    isSmtpValid?.validators?.smtp?.errorCode;
                  invalidEmailData.SMTPResponseCodesDescription =
                    filteredLogsData;

                  inValidEmailArray.push(invalidEmailData);
                }
              }
            }
          }
          console.log("outside the loop");
          if (!isValid) {
            console.log("inside the loop");
            for (let item of remainingSortedItems) {
              console.log("innerest loop");
              if (sortedMethods.length > 0) {
                console.log("existing domain valid category true");
                console.log("sortedMethods", sortedMethods);
                if (sortedMethods[0] === "glx") {
                  console.log("glx true");
                  const isGlxValid = await emailFinder.checkGmail(
                    item.email,
                    input
                  );
                  console.log("isGlxValid", isGlxValid);
                  if (
                    isGlxValid.can_connect_smtp &&
                    isGlxValid.is_deliverable
                  ) {
                    emailData.validCategory = "glx";
                    emailData.email = item.email;
                    const foundEmailFormat = Emails.find(
                      (obj) => obj.email === item.email
                    )?.emailFormate;
                    if (foundEmailFormat) {
                      emailData.employeeEmailFormate = foundEmailFormat;
                      emailData.company = existingDomain._id;

                      await Employee.create(emailData);
                    }

                    res.send({ success: true, data: `${item.email} is valid` });
                    isValid = true;
                    break;
                  } else {
                    const { smptResponse: isSmtpValid, filteredLogsData } =
                      await smtpVerifier.verifyEmail(item.email);
                    console.log("issmtp", isSmtpValid);
                    if (isSmtpValid.valid) {
                      emailData.validCategory = "smtp";
                      emailData.email = item.email;
                      const foundEmailFormat = Emails.find(
                        (obj) => obj.email === item.email
                      )?.emailFormate;
                      if (foundEmailFormat) {
                        emailData.employeeEmailFormate = foundEmailFormat;
                        emailData.company = existingDomain._id;

                        await Employee.create(emailData);
                      }

                      res.send({
                        success: true,
                        data: `${item.email} is valid`,
                      });
                      isValid = true;
                      break;
                    } else {
                      let invalidEmailData = {
                        email: item.email,
                        SMTPResponseCode: "",
                        invalidEmailDomain: domain,
                        acceptAll: "no",
                      };
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      inValidEmailArray.push(invalidEmailData);
                    }
                  }
                } else if (sortedMethods[0] === "smtp") {
                  console.log("smtp sortedmethod");
                  const isSmtpValid = await smtpVerifier.verifyEmail(
                    item.email
                  );
                  console.log("issmtp", isSmtpValid);
                  if (isSmtpValid.valid) {
                    emailData.validCategory = "smtp";
                    emailData.email = item.email;
                    const foundEmailFormat = Emails.find(
                      (obj) => obj.email === item.email
                    )?.emailFormate;
                    if (foundEmailFormat) {
                      emailData.employeeEmailFormate = foundEmailFormat;
                      emailData.company = existingDomain._id;

                      await Employee.create(emailData);
                    }
                    res.send({ success: true, data: `${item.email} is valid` });
                    isValid = true;
                    break;
                  } else {
                    const isGlxValid = await emailFinder.checkGmail(
                      item.email,
                      input
                    );
                    if (
                      isGlxValid.can_connect_smtp &&
                      isGlxValid.is_deliverable
                    ) {
                      emailData.validCategory = "glx";
                      emailData.email = item.email;
                      const foundEmailFormat = Emails.find(
                        (obj) => obj.email === item.email
                      )?.emailFormate;
                      if (foundEmailFormat) {
                        emailData.employeeEmailFormate = foundEmailFormat;
                        emailData.company = existingDomain._id;

                        await Employee.create(emailData);
                      }
                      res.send({
                        success: true,
                        data: `${item.email} is valid`,
                      });
                      isValid = true;
                      break;
                    }
                    let invalidEmailData = {
                      email: item.email,
                      SMTPResponseCode: "",
                      invalidEmailDomain: domain,
                      acceptAll: "no",
                    };
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;

                    inValidEmailArray.push(invalidEmailData);
                  }
                } else {
                  let invalidEmailData = {
                    email: item.email,
                    SMTPResponseCode: "",
                    invalidEmailDomain: domain,
                    acceptAll: "no",
                  };
                  invalidEmailData.SMTPResponseCode =
                    isSmtpValid?.validators?.smtp?.errorCode;
                  invalidEmailData.SMTPResponseCodesDescription =
                    filteredLogsData;
                  inValidEmailArray.push(invalidEmailData);
                }
              } else {
                console.log("above glx");
                const isGlxValid = await emailFinder.checkGmail(
                  item.email,
                  input
                );
                console.log("isGlxValid", isGlxValid);
                if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                  emailData.validCategory = "glx";
                  emailData.email = item.email;
                  const foundEmailFormat = Emails.find(
                    (obj) => obj.email === item.email
                  )?.emailFormate;
                  console.log("foundEmailFormat", foundEmailFormat);
                  if (foundEmailFormat) {
                    emailData.employeeEmailFormate = foundEmailFormat;
                    emailData.company = existingDomain._id;

                    await Employee.create(emailData);
                  }

                  res.send({ success: true, data: `${item.email} is valid` });
                  isValid = true;
                  break;
                } else {
                  const { smptResponse: isSmtpValid, filteredLogsData } =
                    await smtpVerifier.verifyEmail(item.email);
                  console.log("issmtp", isSmtpValid);
                  if (isSmtpValid.valid) {
                    emailData.validCategory = "smtp";
                    emailData.email = item.email;
                    const foundEmailFormat = Emails.find(
                      (obj) => obj.email === item.email
                    )?.emailFormate;
                    if (foundEmailFormat) {
                      emailData.employeeEmailFormate = foundEmailFormat;
                      emailData.company = existingDomain._id;

                      await Employee.create(emailData);
                    }

                    res.send({ success: true, data: `${item.email} is valid` });
                    isValid = true;
                    break;
                  } else {
                    let invalidEmailData = {
                      email: item.email,
                      SMTPResponseCode: "",
                      invalidEmailDomain: domain,
                      acceptAll: "no",
                    };
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;

                    inValidEmailArray.push(invalidEmailData);
                    isValid = false;
                  }
                }
              }
            }
          }
          if (isValid) {
            console.log("its  valid");
            if (inValidEmailArray.length > 0) {
              console.log("inValidEmailArray", inValidEmailArray);
              for (const invEmail of inValidEmailArray) {
                await invalidEmail.create(invEmail);
              }
            }
          } else {
            if (inValidEmailArray.length > 0) {
              console.log("inValidEmailArray", inValidEmailArray);
              for (const invEmail of inValidEmailArray) {
                await invalidEmail.create(invEmail);
              }
            }

            res.send(`Not Found`);
          }
        } else if (existingDomain.acceptAll === "yes") {
          const sortedMethods = validCategoriesFromCompany.filter(
            (key) => key !== "smtp"
          );
          console.log("Required Result:", sortedMethods);
          const validMethods = ["glx", "gmail", "outlook"];
          const remainingMethods = validMethods.filter(
            (method) => !sortedMethods.includes(method)
          );
          let inValidEmailArray = [];
          let isValid = false;
          for (let item of existingSortedItems) {
            console.log("first the loop");

            if (sortedMethods.length > 0) {
              for (const method of sortedMethods) {
                if (method === "glx") {
                  console.log("inside glx");

                  const isGlxValid = await emailFinder.checkGmail(
                    item.email,
                    input
                  );
                  console.log("isGlxValid", isGlxValid);
                  if (
                    isGlxValid.can_connect_smtp &&
                    isGlxValid.is_deliverable
                  ) {
                    emailData.validCategory = "glx";
                    emailData.email = item.email;
                    const foundEmailFormat = Emails.find(
                      (obj) => obj.email === item.email
                    )?.emailFormate;
                    if (foundEmailFormat) {
                      emailData.employeeEmailFormate = foundEmailFormat;
                      emailData.company = existingDomain._id;

                      await Employee.create(emailData);
                    }

                    res.send({ success: true, data: `${item.email} is valid` });
                    isValid = true;
                    break;
                  } else {
                    let invalidEmailData = {
                      email: item.email,
                      SMTPResponseCode: "",
                      invalidEmailDomain: domain,
                      acceptAll: "yes",
                    };
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    inValidEmailArray.push(invalidEmailData);
                  }
                } else if (method === "gmail") {
                  console.log("inside gmail");

                  const isGmailValid = await emailFinder.gmail(item.email);
                  console.log("isGmailValid", isGmailValid);
                  if (isGmailValid) {
                    emailData.validCategory = "gmail";
                    emailData.email = item.email;
                    const foundEmailFormat = Emails.find(
                      (obj) => obj.email === item.email
                    )?.emailFormate;
                    if (foundEmailFormat) {
                      emailData.employeeEmailFormate = foundEmailFormat;
                      emailData.company = existingDomain._id;

                      await Employee.create(emailData);
                    }

                    res.send({ success: true, data: `${item.email} is valid` });
                    isValid = true;
                    break;
                  } else {
                    let invalidEmailData = {
                      email: item.email,
                      SMTPResponseCode: "",
                      invalidEmailDomain: domain,
                      acceptAll: "yes",
                    };
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;

                    inValidEmailArray.push(invalidEmailData);
                  }
                } else if (method === "outlook") {
                  console.log("inside outlook");

                  const isOutlookValid = await emailFinder.outlook(item.email);
                  console.log("isOutlookValid", isOutlookValid);
                  if (isOutlookValid) {
                    emailData.validCategory = "outlook";
                    emailData.email = item.email;
                    const foundEmailFormat = Emails.find(
                      (obj) => obj.email === item.email
                    )?.emailFormate;
                    if (foundEmailFormat) {
                      emailData.employeeEmailFormate = foundEmailFormat;
                      emailData.company = existingDomain._id;

                      await Employee.create(emailData);
                    }

                    res.send({ success: true, data: `${item.email} is valid` });
                    isValid = true;
                    break;
                  } else {
                    let invalidEmailData = {
                      email: item.email,
                      SMTPResponseCode: "",
                      invalidEmailDomain: domain,
                      acceptAll: "yes",
                    };
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    inValidEmailArray.push(invalidEmailData);
                  }
                }
              }

              if (!isValid) {
                for (const method of remainingMethods) {
                  inValidEmailArray.length = 0;
                  if (method === "glx") {
                    console.log("inside glx");

                    const isGlxValid = await emailFinder.checkGmail(
                      item.email,
                      input
                    );
                    console.log("isGlxValid", isGlxValid);
                    if (
                      isGlxValid.can_connect_smtp &&
                      isGlxValid.is_deliverable
                    ) {
                      emailData.validCategory = "glx";
                      emailData.email = item.email;
                      const foundEmailFormat = Emails.find(
                        (obj) => obj.email === item.email
                      )?.emailFormate;
                      if (foundEmailFormat) {
                        emailData.employeeEmailFormate = foundEmailFormat;
                        emailData.company = existingDomain._id;

                        await Employee.create(emailData);
                      }
                      res.send({
                        success: true,
                        data: `${item.email} is valid`,
                      });
                      isValid = true;
                      break;
                    } else {
                      let invalidEmailData = {
                        email: item.email,
                        SMTPResponseCode: "",
                        invalidEmailDomain: domain,
                        acceptAll: "yes",
                      };
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      inValidEmailArray.push(invalidEmailData);
                    }
                  } else if (method === "gmail") {
                    console.log("inside gmail");

                    const isGmailValid = await emailFinder.gmail(item.email);
                    console.log("isGmailValid", isGmailValid);
                    if (isGmailValid) {
                      emailData.validCategory = "gmail";
                      emailData.email = item.email;
                      const foundEmailFormat = Emails.find(
                        (obj) => obj.email === item.email
                      )?.emailFormate;
                      if (foundEmailFormat) {
                        emailData.employeeEmailFormate = foundEmailFormat;
                        emailData.company = existingDomain._id;

                        await Employee.create(emailData);
                      }

                      res.send({
                        success: true,
                        data: `${item.email} is valid`,
                      });
                      isValid = true;
                      break;
                    } else {
                      let invalidEmailData = {
                        email: item.email,
                        SMTPResponseCode: "",
                        invalidEmailDomain: domain,
                        acceptAll: "yes",
                      };
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;

                      inValidEmailArray.push(invalidEmailData);
                    }
                  } else if (method === "outlook") {
                    console.log("inside outlook");

                    const isOutlookValid = await emailFinder.outlook(
                      item.email
                    );
                    console.log("isOutlookValid", isOutlookValid);
                    if (isOutlookValid) {
                      emailData.validCategory = "outlook";
                      emailData.email = item.email;
                      const foundEmailFormat = Emails.find(
                        (obj) => obj.email === item.email
                      )?.emailFormate;
                      if (foundEmailFormat) {
                        emailData.employeeEmailFormate = foundEmailFormat;
                        emailData.company = existingDomain._id;

                        await Employee.create(emailData);
                      }

                      res.send({
                        success: true,
                        data: `${item.email} is valid`,
                      });
                      isValid = true;
                      break;
                    } else {
                      let invalidEmailData = {
                        email: item.email,
                        SMTPResponseCode: "",
                        invalidEmailDomain: domain,
                        acceptAll: "yes",
                      };
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      inValidEmailArray.push(invalidEmailData);
                    }
                  }
                }
              }
            } else {
              const isGlxValid = await emailFinder.checkGmail(
                item.email,
                input
              );

              console.log("glx result", isGlxValid);
              if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                emailData.validCategory = "glx";
                emailData.email = item.email;
                const foundEmailFormat = Emails.find(
                  (obj) => obj.email === item.email
                )?.emailFormate;
                if (foundEmailFormat) {
                  emailData.employeeEmailFormate = foundEmailFormat;
                  emailData.company = existingDomain._id;

                  await Employee.create(emailData);
                }

                res.send({ success: true, data: `${item.email} is valid` });
                isValid = true;
                break;
              } else {
                const isEmailValid = await emailFinder.gmail(item.email);
                console.log("gmail result", isEmailValid);
                if (isEmailValid) {
                  emailData.validCategory = "gmail";
                  emailData.email = item.email;
                  const foundEmailFormat = Emails.find(
                    (obj) => obj.email === item.email
                  )?.emailFormate;
                  if (foundEmailFormat) {
                    emailData.employeeEmailFormate = foundEmailFormat;
                    emailData.company = existingDomain._id;

                    await Employee.create(emailData);
                  }

                  res.send({ success: true, data: `${item.email} is valid` });
                  isValid = true;
                  break;
                } else {
                  const isOutlookValid = await emailFinder.outlook(item.email);
                  console.log("outlook result", isOutlookValid);
                  if (isOutlookValid) {
                    emailData.validCategory = "outlook";
                    emailData.email = item.email;
                    const foundEmailFormat = Emails.find(
                      (obj) => obj.email === item.email
                    )?.emailFormate;
                    if (foundEmailFormat) {
                      emailData.employeeEmailFormate = foundEmailFormat;
                      emailData.company = existingDomain._id;

                      await Employee.create(emailData);
                    }

                    res.send({ success: true, data: `${item.email} is valid` });
                    isValid = true;
                    break;
                  } else {
                    let invalidEmailData = {
                      email: item.email,
                      SMTPResponseCode: "",
                      invalidEmailDomain: domain,
                      acceptAll: "yes",
                    };
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    inValidEmailArray.push(invalidEmailData);
                  }
                }
              }
            }
          }
          console.log("outside the loop1");
          if (!isValid) {
            console.log("inside the loop1");
            for (let item of remainingSortedItems) {
              console.log("innerest loop1");
              if (sortedMethods.length > 0) {
                for (const method of sortedMethods) {
                  if (method === "glx") {
                    console.log("inside glx");

                    const isGlxValid = await emailFinder.checkGmail(
                      item.email,
                      input
                    );
                    console.log("isGlxValid", isGlxValid);
                    if (
                      isGlxValid.can_connect_smtp &&
                      isGlxValid.is_deliverable
                    ) {
                      emailData.validCategory = "glx";
                      emailData.email = item.email;
                      const foundEmailFormat = Emails.find(
                        (obj) => obj.email === item.email
                      )?.emailFormate;
                      if (foundEmailFormat) {
                        emailData.employeeEmailFormate = foundEmailFormat;
                        emailData.company = existingDomain._id;

                        await Employee.create(emailData);
                      }
                      res.send(`${item.email} is valid`);
                      isValid = true;
                      break;
                    } else {
                      let invalidEmailData = {
                        email: item.email,
                        SMTPResponseCode: "",
                        invalidEmailDomain: domain,
                        acceptAll: "yes",
                      };
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      inValidEmailArray.push(invalidEmailData);
                    }
                  } else if (method === "gmail") {
                    console.log("inside gmail");

                    const isGmailValid = await emailFinder.gmail(item.email);
                    console.log("isGmailValid", isGmailValid);
                    if (isGmailValid) {
                      emailData.validCategory = "gmail";
                      emailData.email = item.email;
                      const foundEmailFormat = Emails.find(
                        (obj) => obj.email === item.email
                      )?.emailFormate;
                      if (foundEmailFormat) {
                        emailData.employeeEmailFormate = foundEmailFormat;
                        emailData.company = existingDomain._id;

                        await Employee.create(emailData);
                      }
                      res.send({
                        success: true,
                        data: `${item.email} is valid`,
                      });
                      isValid = true;
                      break;
                    } else {
                      let invalidEmailData = {
                        email: item.email,
                        SMTPResponseCode: "",
                        invalidEmailDomain: domain,
                        acceptAll: "yes",
                      };
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      inValidEmailArray.push(invalidEmailData);
                    }
                  } else if (method === "outlook") {
                    console.log("inside outlook");

                    const isOutlookValid = await emailFinder.outlook(
                      item.email
                    );
                    console.log("isOutlookValid", isOutlookValid);
                    if (isOutlookValid) {
                      emailData.validCategory = "outlook";
                      emailData.email = item.email;
                      const foundEmailFormat = Emails.find(
                        (obj) => obj.email === item.email
                      )?.emailFormate;
                      if (foundEmailFormat) {
                        emailData.employeeEmailFormate = foundEmailFormat;
                        emailData.company = existingDomain._id;

                        await Employee.create(emailData);
                      }
                      res.send({
                        success: true,
                        data: `${item.email} is valid`,
                      });
                      isValid = true;
                      break;
                    } else {
                      let invalidEmailData = {
                        email: item.email,
                        SMTPResponseCode: "",
                        invalidEmailDomain: domain,
                        acceptAll: "yes",
                      };
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      inValidEmailArray.push(invalidEmailData);
                    }
                  }
                }

                if (!isValid) {
                  for (const method of remainingMethods) {
                    if (method === "glx") {
                      console.log("inside glx");

                      const isGlxValid = await emailFinder.checkGmail(
                        item.email,
                        input
                      );
                      console.log("isGlxValid", isGlxValid);
                      if (
                        isGlxValid.can_connect_smtp &&
                        isGlxValid.is_deliverable
                      ) {
                        emailData.validCategory = "glx";
                        emailData.email = item.email;
                        const foundEmailFormat = Emails.find(
                          (obj) => obj.email === item.email
                        )?.emailFormate;
                        if (foundEmailFormat) {
                          emailData.employeeEmailFormate = foundEmailFormat;
                          emailData.company = existingDomain._id;

                          await Employee.create(emailData);
                        }
                        res.send({
                          success: true,
                          data: `${item.email} is valid`,
                        });
                        isValid = true;
                        break;
                      } else {
                        let invalidEmailData = {
                          email: item.email,
                          SMTPResponseCode: "",
                          invalidEmailDomain: domain,
                          acceptAll: "yes",
                        };
                        invalidEmailData.SMTPResponseCode =
                          isSmtpValid?.validators?.smtp?.errorCode;
                        invalidEmailData.SMTPResponseCodesDescription =
                          filteredLogsData;
                        inValidEmailArray.push(invalidEmailData);
                      }
                    } else if (method === "gmail") {
                      console.log("inside gmail");

                      const isGmailValid = await emailFinder.gmail(item.email);
                      console.log("isGmailValid", isGmailValid);
                      if (isGmailValid) {
                        emailData.validCategory = "gmail";
                        emailData.email = item.email;
                        const foundEmailFormat = Emails.find(
                          (obj) => obj.email === item.email
                        )?.emailFormate;
                        if (foundEmailFormat) {
                          emailData.employeeEmailFormate = foundEmailFormat;
                          emailData.company = existingDomain._id;

                          await Employee.create(emailData);
                        }

                        res.send({
                          success: true,
                          data: `${item.email} is valid`,
                        });
                        isValid = true;
                        break;
                      } else {
                        let invalidEmailData = {
                          email: item.email,
                          SMTPResponseCode: "",
                          invalidEmailDomain: domain,
                          acceptAll: "yes",
                        };
                        invalidEmailData.SMTPResponseCode =
                          isSmtpValid?.validators?.smtp?.errorCode;
                        invalidEmailData.SMTPResponseCodesDescription =
                          filteredLogsData;
                        inValidEmailArray.push(invalidEmailData);
                      }
                    } else if (method === "outlook") {
                      console.log("inside outlook");

                      const isOutlookValid = await emailFinder.outlook(
                        item.email
                      );
                      console.log("isOutlookValid", isOutlookValid);
                      if (isOutlookValid) {
                        emailData.validCategory = "outlook";
                        emailData.email = item.email;
                        const foundEmailFormat = Emails.find(
                          (obj) => obj.email === item.email
                        )?.emailFormate;
                        if (foundEmailFormat) {
                          emailData.employeeEmailFormate = foundEmailFormat;
                          emailData.company = existingDomain._id;

                          await Employee.create(emailData);
                        }
                        res.send({
                          success: true,
                          data: `${item.email} is valid`,
                        });
                        isValid = true;
                        break;
                      } else {
                        let invalidEmailData = {
                          email: item.email,
                          SMTPResponseCode: "",
                          invalidEmailDomain: domain,
                          acceptAll: "yes",
                        };
                        invalidEmailData.SMTPResponseCode =
                          isSmtpValid?.validators?.smtp?.errorCode;
                        invalidEmailData.SMTPResponseCodesDescription =
                          filteredLogsData;
                        inValidEmailArray.push(invalidEmailData);
                      }
                    }
                  }
                }
              } else {
                console.log("innerest glx form");
                const isGlxValid = await emailFinder.checkGmail(
                  item.email,
                  input
                );

                console.log("glx result", isGlxValid);
                if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                  emailData.validCategory = "glx";
                  emailData.email = item.email;
                  const foundEmailFormat = Emails.find(
                    (obj) => obj.email === item.email
                  )?.emailFormate;
                  if (foundEmailFormat) {
                    emailData.employeeEmailFormate = foundEmailFormat;
                    emailData.company = existingDomain._id;

                    await Employee.create(emailData);
                  }

                  res.send({ success: true, data: `${item.email} is valid` });
                  isValid = true;
                  break;
                } else {
                  const isEmailValid = await emailFinder.gmail(item.email);
                  console.log("gmail result", isEmailValid);
                  if (isEmailValid) {
                    emailData.validCategory = "gmail";
                    emailData.email = item.email;
                    const foundEmailFormat = Emails.find(
                      (obj) => obj.email === item.email
                    )?.emailFormate;
                    if (foundEmailFormat) {
                      emailData.employeeEmailFormate = foundEmailFormat;
                      emailData.company = existingDomain._id;

                      await Employee.create(emailData);
                    }

                    res.send({ success: true, data: `${item.email} is valid` });
                    isValid = true;
                    break;
                  } else {
                    const isOutlookValid = await emailFinder.outlook(
                      item.email
                    );
                    console.log("outlook result", isOutlookValid);
                    if (isOutlookValid) {
                      emailData.validCategory = "outlook";
                      emailData.email = item.email;
                      const foundEmailFormat = Emails.find(
                        (obj) => obj.email === item.email
                      )?.emailFormate;
                      if (foundEmailFormat) {
                        emailData.employeeEmailFormate = foundEmailFormat;
                        emailData.company = existingDomain._id;

                        await Employee.create(emailData);
                      }

                      res.send({
                        success: true,
                        data: `${item.email} is valid`,
                      });
                      isValid = true;
                      break;
                    } else {
                      let invalidEmailData = {
                        email: item.email,
                        SMTPResponseCode: "",
                        invalidEmailDomain: domain,
                        acceptAll: "yes",
                      };
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      inValidEmailArray.push(invalidEmailData);
                    }
                  }
                }
              }
            }
          }
          const uniqueEmails = [];
          const emailSet = new Set();

          for (const item of inValidEmailArray) {
            if (!emailSet.has(item.email)) {
              emailSet.add(item.email);
              uniqueEmails.push(item);
            }
          }

          if (isValid) {
            if (uniqueEmails.length > 0) {
              console.log("inValidEmailArray2", uniqueEmails);
              for (const invEmail of uniqueEmails) {
                await invalidEmail.create(invEmail);
              }
            }
          } else {
            if (uniqueEmails.length > 0) {
              console.log("inValidEmailArray4", uniqueEmails);
              for (const invEmail of uniqueEmails) {
                await invalidEmail.create(invEmail);
              }
            }
            res.send(`Not Found`);
          }
        } else {
          console.log("its invalid email");
          res.send(`Do not found anything`);
        }
      }
    } else {
      let companyResult;
      try {
        companyResult = await Company.create(companyData);
      } catch (error) {
        console.log("error", error);
      }
      const emailAddress = `${randomstring.generate(10)}@${domain}`;
      const isCatch = await smtpVerifier.verifyEmail(emailAddress);
      console.log("accept all Result", isCatch);
      const validEmailsArray = [];
      const invalidEmailsArray = [];
      if (isCatch.valid) {
        console.log("inside catch all");
        companyData.acceptAll = "yes";
        await Company.updateOne(
          { _id: companyResult._id },
          { $set: { acceptAll: "yes" } }
        );
        for (let email of emails) {
          const isGlxValid = await emailFinder.checkGmail(email, input);
          console.log("catch yes and checking glx", isGlxValid);
          if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
            emailData.validCategory = "glx";
            emailData.email = email;
            const foundEmailFormat = Emails.find(
              (obj) => obj.email === email
            )?.emailFormate;
            if (foundEmailFormat) {
              emailData.employeeEmailFormate = foundEmailFormat;
              emailData.company = companyResult._id;
              validEmailsArray.push(emailData);
              await Employee.create(emailData);
              break;
            }
          } else {
            const invalidEmailObject = {
              email: email,
              SMTPResponseCode: "",
              invalidEmailDomain: domain,
              acceptAll: "yes",
            };
            invalidEmailObject.SMTPResponseCode =
              isSmtpValid?.validators?.smtp?.errorCode;
            invalidEmailObject.SMTPResponseCodesDescription = filteredLogsData;

            invalidEmailsArray.push(invalidEmailObject);
          }
        }
        if (validEmailsArray.length > 0) {
          for (const invEmail of invalidEmailsArray) {
            await invalidEmail.create(invEmail);
          }
          res.send({
            success: true,
            data: `${validEmailsArray[0].email} is valid`,
          });
        } else {
          validEmailsArray.length = 0;
          invalidEmailsArray.length = 0;
          for (let email of emails) {
            const isGmailValid = await emailFinder.gmail(email);
            if (isGmailValid) {
              emailData.validCategory = "gmail";

              emailData.email = email;
              const foundEmailFormat = Emails.find(
                (obj) => obj.email === email
              )?.emailFormate;
              if (foundEmailFormat) {
                emailData.employeeEmailFormate = foundEmailFormat;
                emailData.company = companyResult._id;
                validEmailsArray.push(emailData);
                await Employee.create(emailData);
                break;
              }
            } else {
              const invalidEmailObject = {
                email: email,
                SMTPResponseCode: "",
                invalidEmailDomain: domain,
                acceptAll: "yes",
              };
              invalidEmailObject.SMTPResponseCode =
                isSmtpValid?.validators?.smtp?.errorCode;
              invalidEmailObject.SMTPResponseCodesDescription =
                filteredLogsData;

              invalidEmailsArray.push(invalidEmailObject);
            }
          }
          if (validEmailsArray.length > 0) {
            for (const invEmail of invalidEmailsArray) {
              await invalidEmail.create(invEmail);
            }
            res.send({
              success: true,
              data: `${validEmailsArray[0].email} is valid`,
            });
          } else {
            validEmailsArray.length = 0;
            invalidEmailsArray.length = 0;
            for (let email of emails) {
              const isOutlookValid = await emailFinder.outlook(email);
              if (isOutlookValid) {
                emailData.validCategory = "outlook";

                emailData.email = email;
                const foundEmailFormat = Emails.find(
                  (obj) => obj.email === email
                )?.emailFormate;
                if (foundEmailFormat) {
                  emailData.employeeEmailFormate = foundEmailFormat;
                  emailData.company = companyResult._id;
                  validEmailsArray.push(emailData);
                  await Employee.create(emailData);
                  break;
                }
              } else {
                const invalidEmailObject = {
                  email: email,
                  SMTPResponseCode: "",
                  invalidEmailDomain: domain,
                  acceptAll: "yes",
                };
                invalidEmailObject.SMTPResponseCode =
                  isSmtpValid?.validators?.smtp?.errorCode;
                invalidEmailObject.SMTPResponseCodesDescription =
                  filteredLogsData;

                invalidEmailsArray.push(invalidEmailObject);
              }
            }
            if (validEmailsArray.length > 0) {
              res.send(`${validEmailsArray[0].email} is valid`);
              for (const invEmail of invalidEmailsArray) {
                await invalidEmail.create(invEmail);
              }
            } else {
              for (const invEmail of invalidEmailsArray) {
                await invalidEmail.create(invEmail);
              }
            }
          }
        }
      } else {
        companyData.acceptAll = "no";
        await Company.updateOne(
          { _id: companyResult._id },
          { $set: { acceptAll: "no" } }
        );

        for (let email of emails) {
          const isGlxValid = await emailFinder.checkGmail(email, input);
          console.log("Cath no glx checking");
          if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
            emailData.validCategory = "glx";
            emailData.email = email;
            const foundEmailFormat = Emails.find(
              (obj) => obj.email === email
            )?.emailFormate;
            console.log("found Email Formate1", foundEmailFormat);
            if (foundEmailFormat) {
              emailData.employeeEmailFormate = foundEmailFormat;
              emailData.company = companyResult._id;
              validEmailsArray.push(emailData);
              await Employee.create(emailData);
              break;
            }
          } else {
            const invalidEmailObject = {
              email: email,
              SMTPResponseCode: "",
              invalidEmailDomain: domain,
              acceptAll: "no",
            };
            invalidEmailsArray.push(invalidEmailObject);
          }
        }
        if (validEmailsArray.length > 0) {
          for (const invEmail of invalidEmailsArray) {
            await invalidEmail.create(invEmail);
          }
          res.send({
            success: true,
            data: `${validEmailsArray[0].email} is valid`,
          });
        } else {
          validEmailsArray.length = 0;
          invalidEmailsArray.length = 0;
          for (let email of emails) {
            const { smptResponse: isSmtpValid, filteredLogsData } =
              await smtpVerifier.verifyEmail(email);
            if (isSmtpValid.valid) {
              emailData.validCategory = "smtp";

              emailData.email = email;
              const foundEmailFormat = Emails.find(
                (obj) => obj.email === email
              )?.emailFormate;
              console.log("found Email Formate2", foundEmailFormat);
              if (foundEmailFormat) {
                emailData.employeeEmailFormate = foundEmailFormat;
                emailData.company = companyResult._id;
                validEmailsArray.push(emailData);
                await Employee.create(emailData);
                break;
              }
            } else {
              const invalidEmailObject = {
                email: email,
                SMTPResponseCode: isSmtpValid?.validators?.smtp?.errorCode,
                invalidEmailDomain: domain,
                acceptAll: "no",
              };
              invalidEmailObject.SMTPResponseCode =
                isSmtpValid?.validators?.smtp?.errorCode;
              invalidEmailObject.SMTPResponseCodesDescription =
                filteredLogsData;

              invalidEmailsArray.push(invalidEmailObject);
            }
          }
          if (validEmailsArray.length > 0) {
            res.send(`${validEmailsArray[0].email} is valid`);
            for (const invEmail of invalidEmailsArray) {
              await invalidEmail.create(invEmail);
            }
          } else {
            for (const invEmail of invalidEmailsArray) {
              await invalidEmail.create(invEmail);
            }
            res.send(`Not Found`);
          }
        }
      }

      console.log("validEmailsArray", validEmailsArray);
      console.log("invalidEmailsArray", invalidEmailsArray);
    }
  } else {
    res.send("Domain is not Valid");
  }
};

const multipleFileUploader = async (req, res) => {
  try {
    if (!req.file) {
      res.render("fileUpload", { info: "No file uploaded" });
      return;
    }

    if (req.file.mimetype !== "text/csv") {
      fs.unlinkSync(req.file.path);
      res.render("fileUpload", { info: "Only CSV files are allowed" });
      return;
    }

    const filePath = req.file.path;

    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({ delimiter: "," }));

    const records = [];
    parser.on("data", (record) => {
      records.push(record);
    });

    await new Promise((resolve, reject) => {
      parser.on("end", () => {
        if (records.length < 2) {
          fs.unlinkSync(filePath);
          reject(new Error("The File Must Contains at least 2 records"));
        } else {
          resolve();
        }
      });
    });

    for (const item of records) {
      const { domain, email } = item;

      const [record, created] = await DataModel.findOrCreate({
        where: {
          [Op.and]: [{ domain }, { email }],
        },
        defaults: {
          domain,
          email,
        },
      });

      if (!created) {
        console.log("Email and domain already exist:", email, domain);
      }
    }

    fs.unlinkSync(filePath);
    res.render("fileUpload", { info: "File uploaded successfully." });
  } catch (error) {
    res.render("fileUpload", {
      info: "An error occurred while processing the file.",
    });
  }
};
//Get Company Data
const getCompanyData = async (req, res) => {
  try {
    const data = await Company.find();

    res.json(data);
  } catch (err) {
    console.log("Error Occurred", err);
  }
};
//get Employee Data
const getEmployeeData = async (req, res) => {
  const id = req.params.id;

  console.log("id", id);
  try {
    const empData = await Employee.find({ company: id });
    // console.log("emp data ", empData[0].firstName, empData[0].lastName);
    res.send(empData);
  } catch (err) {
    console.log("Error Occurred", err);
  }
};
//Bulk Email Verification
const verifyBulk = async (req, res) => {
  const email = req.body.email;
  const lines = email.split(/\n/);
  console.log("lines", lines);
  const output = lines
    .filter((line) => /\S/.test(line))
    .map((line) => line.trim());
  console.log("out", output);
  let counter = 0;
  try {
    const validEmailsArray = [];
    const inValidEmailsArray = [];
    for (let email of output) {
      console.log("count : ", counter++);
      const domain = email.split("@")[1];
      console.log(domain);

      const emailData = {
        companyDomain: domain,
        email: email,
        employeeEmailFormate: "",
        jobTitle: "",
        server: "",
        validCategory: "",
        linkedinProfileUrl: "",
        location: "",
        durationIncurrentRole: "",
        company: "",
      };
      const invalidEmailData = {
        email: email,
        SMTPResponseCode: "",
        invalidEmailDomain: domain,
        acceptAll: "",
        SMTPResponseCodesDescription: [],
      };

      const companyData = {
        companyName: "senewtech",
        companyDomain: domain,

        socialIcons: [],
        companySize: "",
        employeeSize: "",
        industry: "",
        headquarterLocation: "",
        phoneNumber: "03003331234",
        companyEmailFormate: "",
        acceptAll: "no",
        ValidCategory: "smtp",
      };

      try {
        const existingDomain = await Company.findOne({
          companyDomain: domain,
        });
        console.log("existing domain", existingDomain);

        if (existingDomain) {
          let result = {};
          try {
            const companyId = existingDomain._id;

            const employeesCoun = await Employee.find({ company: companyId });

            let totalCount = employeesCoun.length;
            let categoryCounts = {};
            for (let employee of employeesCoun) {
              let category = employee.validCategory;
              if (categoryCounts.hasOwnProperty(category)) {
                categoryCounts[category]++;
              } else {
                categoryCounts[category] = 1;
              }
            }

            for (let category in categoryCounts) {
              let percentage = (categoryCounts[category] / totalCount) * 100;
              result[category] = percentage;
            }

            await Company.findByIdAndUpdate(
              companyId,
              { validCategory: result },
              { new: true }
            );
          } catch (error) {
            console.log(error);
          }

          // const myCategoryData = existingDomain.validCategory
          //   ? existingDomain.validCategory
          //   : { GLX: 100 };
          // console.log("data", myCategoryData);

          const validCategoriesFromCompany = Object.keys(result).sort(
            (a, b) => result[b] - result[a]
          );
          console.log(
            "valid Categories From Company",
            validCategoriesFromCompany
          );
          // Domain exists
          const existingEmail = await Employee.findOne({ email: email });
          console.log("existingEmail Result", existingEmail);

          if (existingEmail) {
            console.log(`${email} exists in db`);
            let currentTime = new Date();
            let updatedTimestamps = existingEmail.updatedTimeStamps;
            let timeDifference = currentTime - updatedTimestamps;

            let differenceInDays = timeDifference / (1000 * 60 * 60 * 24);
            console.log("differenceInDays", differenceInDays);
            // await existingEmail.updateLastFetchedTime();
            //differenceInDays = 100;
            if (differenceInDays > 180) {
              if (existingEmail.validCategory == "smtp") {
                console.log("first1");
                const { smptResponse: isSmtpValid, filteredLogsData } =
                  await smtpVerifier.verifyEmail(email);
                if (isSmtpValid.valid) {
                  console.log("smtpVerifier");
                  validEmailsArray.push({
                    success: true,
                    data: `${email} is valid`,
                  });
                  //res.send(`${email} is valid`);
                } else {
                  if (existingDomain.acceptAll == "no") {
                    const isGlxValid = await emailFinder.checkGmail(
                      email,
                      input
                    );
                    if (
                      isGlxValid.can_connect_smtp &&
                      isGlxValid.is_deliverable
                    ) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "glx" } }
                      );
                      validEmailsArray.push({
                        success: true,
                        data: `${email} is valid`,
                      });

                      //res.send(`${email} is valid`);
                    } else {
                      await Employee.deleteOne({ _id: existingEmail._id });
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      await invalidEmail.create(invalidEmailData);
                      inValidEmailsArray.push({
                        success: false,
                        data: `${email} is not valid`,
                      });

                      //res.send(`${email} is not valid`);
                    }
                  } else if (existingDomain.acceptAll == "yes") {
                    const isGlxValid = await emailFinder.checkGmail(
                      email,
                      input
                    );
                    if (
                      isGlxValid.can_connect_smtp &&
                      isGlxValid.is_deliverable
                    ) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "glx" } }
                      );
                      validEmailsArray.push({
                        success: true,
                        data: `${email} is valid`,
                      });
                      // res.send(`${email} is valid`);
                    } else {
                      let isUnameValid = await emailFinder.UnameValid(email);
                      isUnameValid = false;
                      if (isUnameValid) {
                        validEmailsArray.push({
                          success: true,
                          data: `${email} is valid`,
                        });

                        // res.send(`${email} is valid`);
                      } else {
                        const isGmailValid = await emailFinder.gmail(email);
                        if (isGmailValid.valid) {
                          await Employee.updateOne(
                            { _id: existingEmail._id },
                            { $set: { validCategory: "gmail" } }
                          );
                          validEmailsArray.push({
                            success: true,
                            data: `${email} is valid`,
                          });

                          //res.send(`${email} is valid`);
                        } else {
                          const isOutlookValid = await emailFinder.outlook(
                            email
                          );
                          if (isOutlookValid) {
                            await Employee.updateOne(
                              { _id: existingEmail._id },
                              { $set: { validCategory: "outlook" } }
                            );
                            validEmailsArray.push({
                              success: true,
                              data: `${email} is valid`,
                            });

                            // res.send(`${email} is valid`);
                          } else {
                            await Employee.deleteOne({
                              _id: existingEmail._id,
                            });
                            invalidEmailData.SMTPResponseCode =
                              isSmtpValid?.validators?.smtp?.errorCode;
                            invalidEmailData.SMTPResponseCodesDescription =
                              filteredLogsData;
                            await invalidEmail.create(invalidEmailData);
                            inValidEmailsArray.push({
                              success: false,
                              data: `${email} is not valid`,
                            });

                            // res.send(`${email} is not valid`);
                          }
                        }
                      }
                    }
                  } else {
                    await Employee.deleteOne({ _id: existingEmail._id });
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    await invalidEmail.create(invalidEmailData);

                    inValidEmailsArray.push({
                      success: false,
                      data: `${email} is not valid`,
                    });
                    //res.send(`${email} is not valid`);
                  }
                }
              } else if (existingEmail.validCategory == "gmail") {
                console.log("inside gmail");
                const isGmailValid = await emailFinder.gmail(email);
                if (isGmailValid) {
                  validEmailsArray.push({
                    success: true,
                    data: `${email} is valid`,
                  });
                  // res.send(`${email} is valid`);
                } else {
                  if (existingDomain.acceptAll == "no") {
                    const isGlxValid = await emailFinder.checkGmail(
                      email,
                      input
                    );
                    if (
                      isGlxValid.can_connect_smtp &&
                      isGlxValid.is_deliverable
                    ) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "glx" } }
                      );
                      validEmailsArray.push({
                        success: true,
                        data: `${email} is valid`,
                      });
                      //res.send(`${email} is valid`);
                    } else {
                      const { smptResponse: isSmtpValid, filteredLogsData } =
                        await smtpVerifier.verifyEmail(email);
                      console.log("issmtp", isSmtpValid);
                      if (isSmtpValid.valid) {
                        await Employee.updateOne(
                          { _id: existingEmail._id },
                          { $set: { validCategory: "smtp" } }
                        );
                        validEmailsArray.push({
                          success: true,
                          data: `${email} is valid`,
                        });
                        // res.send(`${email} is valid`);
                      } else if (
                        isSmtpValid?.validators?.smtp?.errorCode === "451"
                      ) {
                        await Employee.deleteOne({ _id: existingEmail._id });
                        invalidEmailData.SMTPResponseCode = "451";

                        invalidEmailData.SMTPResponseCode =
                          isSmtpValid?.validators?.smtp?.errorCode;
                        invalidEmailData.SMTPResponseCodesDescription =
                          filteredLogsData;
                        await invalidEmail.create(invalidEmailData);
                        inValidEmailsArray.push({
                          success: false,
                          data: `${email} is in Gray List`,
                        });
                        // res.status(200).send({
                        //   success: true,
                        //   data: `Email : ${email} is in Gray List`,
                        // });
                      } else if (
                        isSmtpValid?.validators?.smtp?.errorCode == "550"
                      ) {
                        await Employee.deleteOne({ _id: existingEmail._id });
                        invalidEmailData.SMTPResponseCode = "550";

                        invalidEmailData.SMTPResponseCode =
                          isSmtpValid?.validators?.smtp?.errorCode;
                        invalidEmailData.SMTPResponseCodesDescription =
                          filteredLogsData;
                        await invalidEmail.create(invalidEmailData);
                        inValidEmailsArray.push({
                          success: false,
                          data: `${email} is Unknown`,
                        });
                        // res.status(200).send({
                        //   success: true,
                        //   data: `Email : ${email} is unknown`,
                        // });
                      } else if (
                        isSmtpValid?.validators?.smtp?.errorCode == "521"
                      ) {
                        await Employee.deleteOne({ _id: existingEmail._id });
                        invalidEmailData.SMTPResponseCode = "521";
                        invalidEmailData.SMTPResponseCode =
                          isSmtpValid?.validators?.smtp?.errorCode;
                        invalidEmailData.SMTPResponseCodesDescription =
                          filteredLogsData;
                        await invalidEmail.create(invalidEmailData);
                        inValidEmailsArray.push({
                          success: false,
                          data: `${email} do not received request from dummy server`,
                        });
                        // res.status(200).send({
                        //   success: true,
                        //   data: `Email : ${email} do not receive request from dummy server`,
                        // });
                      } else {
                        await Employee.deleteOne({ _id: existingEmail._id });
                        invalidEmailData.SMTPResponseCode =
                          isSmtpValid?.validators?.smtp?.errorCode;
                        invalidEmailData.SMTPResponseCodesDescription =
                          filteredLogsData;
                        await invalidEmail.create(invalidEmailData);
                        inValidEmailsArray.push({
                          success: false,
                          data: `${email} is not valid`,
                        });
                        // res.status(200).send({
                        //   success: false,
                        //   data: `Email : ${email} is not valid`,
                        // });
                      }
                    }
                  } else if (existingDomain.acceptAll == "yes") {
                    const isGlxValid = await emailFinder.checkGmail(
                      email,
                      input
                    );
                    if (
                      isGlxValid.can_connect_smtp &&
                      isGlxValid.is_deliverable
                    ) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "glx" } }
                      );
                      validEmailsArray.push({
                        success: true,
                        data: `${email} is valid`,
                      });
                      //res.send(`${email} is valid`);
                    } else {
                      const isOutlookValid = await emailFinder.outlook(email);
                      if (isOutlookValid) {
                        await Employee.updateOne(
                          { _id: existingEmail._id },
                          { $set: { validCategory: "outlook" } }
                        );
                        validEmailsArray.push({
                          success: true,
                          data: `${email} is valid`,
                        });
                        //  res.send(`${email} is valid`);
                      } else {
                        await Employee.deleteOne({ _id: existingEmail._id });
                        invalidEmailData.SMTPResponseCode =
                          isSmtpValid?.validators?.smtp?.errorCode;
                        invalidEmailData.SMTPResponseCodesDescription =
                          filteredLogsData;
                        await invalidEmail.create(invalidEmailData);
                        inValidEmailsArray.push({
                          success: false,
                          data: `${email} is not valid`,
                        });
                        // res.send(`${email} is not valid`);
                      }
                    }
                  }
                }
              } else if (existingEmail.validCategory == "glx") {
                console.log("inside glx");
                const isGlxValid = await emailFinder.checkGmail(email, input);
                if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                  validEmailsArray.push({
                    success: true,
                    data: `${email} is valid`,
                  });
                  //res.send(`${email} is valid`);
                } else {
                  if (existingDomain.acceptAll == "yes") {
                    const isGmailValid = await emailFinder.gmail(email);
                    if (isGmailValid) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "gmail" } }
                      );
                      validEmailsArray.push({
                        success: true,
                        data: `${email} is valid`,
                      });
                      // res.send(`${email} is valid`);
                    } else {
                      const isOutlookValid = await emailFinder.outlook(email);
                      if (isOutlookValid) {
                        await Employee.updateOne(
                          { _id: existingEmail._id },
                          { $set: { validCategory: "outlook" } }
                        );
                        validEmailsArray.push({
                          success: true,
                          data: `${email} is valid`,
                        });
                        //res.send(`${email} is valid`);
                      } else {
                        await Employee.deleteOne({ _id: existingEmail._id });
                        invalidEmailData.SMTPResponseCode =
                          isSmtpValid?.validators?.smtp?.errorCode;
                        invalidEmailData.SMTPResponseCodesDescription =
                          filteredLogsData;
                        await invalidEmail.create(invalidEmailData);
                        inValidEmailsArray.push({
                          success: false,
                          data: `${email} is not valid`,
                        });
                        //res.send(`${email} is not valid`);
                      }
                    }
                  } else if (existingDomain.acceptAll == "no") {
                    const { smptResponse: isSmtpValid, filteredLogsData } =
                      await smtpVerifier.verifyEmail(email);
                    console.log("issmtp", isSmtpValid);
                    if (isSmtpValid.valid) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "smtp" } }
                      );
                      validEmailsArray.push({
                        success: true,
                        data: `${email} is valid`,
                      });
                      // res.send(`${email} is valid`);
                    } else if (
                      isSmtpValid?.validators?.smtp?.errorCode === "451"
                    ) {
                      await Employee.deleteOne({ _id: existingEmail._id });
                      invalidEmailData.SMTPResponseCode = "451";

                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      await invalidEmail.create(invalidEmailData);

                      inValidEmailsArray.push({
                        success: false,
                        data: `${email} is in Gray List`,
                      });
                      //   res.status(200).send({
                      //     success: true,
                      //     data: `Email : ${email} is in Gray List`,
                      //   });
                    } else if (
                      isSmtpValid?.validators?.smtp?.errorCode == "550"
                    ) {
                      await Employee.deleteOne({ _id: existingEmail._id });
                      invalidEmailData.SMTPResponseCode = "550";
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      await invalidEmail.create(invalidEmailData);

                      inValidEmailsArray.push({
                        success: false,
                        data: `${email} is Unknown`,
                      });
                      //   res.status(200).send({
                      //     success: true,
                      //     data: `Email : ${email} is unknown`,
                      //   });
                    } else if (
                      isSmtpValid?.validators?.smtp?.errorCode == "521"
                    ) {
                      await Employee.deleteOne({ _id: existingEmail._id });
                      invalidEmailData.SMTPResponseCode = "521";
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      await invalidEmail.create(invalidEmailData);

                      inValidEmailsArray.push({
                        success: false,
                        data: `${email} do not receive request from dummy server`,
                      });
                      //   res.status(200).send({
                      //     success: true,
                      //     data: `Email : ${email} do not receive request from dummy server`,
                      //   });
                    } else {
                      await Employee.deleteOne({ _id: existingEmail._id });
                      invalidEmailData.SMTPResponseCode =
                        isSmtpValid?.validators?.smtp?.errorCode;
                      invalidEmailData.SMTPResponseCodesDescription =
                        filteredLogsData;
                      await invalidEmail.create(invalidEmailData);

                      inValidEmailsArray.push({
                        success: false,
                        data: `${email} is not valid`,
                      });
                      //   res.status(200).send({
                      //     success: false,
                      //     data: `Email : ${email} is not valid`,
                      //   });
                    }
                  }
                }
              } else if (existingEmail.validCategory == "outlook") {
                console.log("inside outlook");
                const isOutlookValid = await emailFinder.outlook(email);
                if (isOutlookValid) {
                  validEmailsArray.push({
                    success: true,
                    data: `${email} is valid`,
                  });
                  //res.send(`${email} is valid`);
                } else {
                  if (existingDomain.acceptAll == "yes") {
                    const isGmailValid = await emailFinder.gmail(email);
                    if (isGmailValid) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "gmail" } }
                      );
                      validEmailsArray.push({
                        success: true,
                        data: `${email} is valid`,
                      });
                      //res.send(`${email} is valid`);
                    } else {
                      const isGlxValid = await emailFinder.checkGmail(
                        email,
                        input
                      );
                      if (
                        isGlxValid.can_connect_smtp &&
                        isGlxValid.is_deliverable
                      ) {
                        await Employee.updateOne(
                          { _id: existingEmail._id },
                          { $set: { validCategory: "glx" } }
                        );
                        validEmailsArray.push({
                          success: true,
                          data: `${email} is valid`,
                        });
                        //res.send(`${email} is valid`);
                      } else {
                        await Employee.deleteOne({ _id: existingEmail._id });

                        invalidEmailData.SMTPResponseCode =
                          isSmtpValid?.validators?.smtp?.errorCode;
                        invalidEmailData.SMTPResponseCodesDescription =
                          filteredLogsData;
                        await invalidEmail.create(invalidEmailData);
                        inValidEmailsArray.push({
                          success: false,
                          data: `${email} is not valid`,
                        });
                        //res.send(`${email} is not valid`);
                      }
                    }
                  } else if (existingDomain.acceptAll == "no") {
                    const isGlxValid = await emailFinder.checkGmail(
                      email,
                      input
                    );
                    if (
                      isGlxValid.can_connect_smtp &&
                      isGlxValid.is_deliverable
                    ) {
                      await Employee.updateOne(
                        { _id: existingEmail._id },
                        { $set: { validCategory: "glx" } }
                      );
                      validEmailsArray.push({
                        success: true,
                        data: `${email} is valid`,
                      });
                      // res.send(`${email} is valid`);
                    } else {
                      const { smptResponse: isSmtpValid, filteredLogsData } =
                        await smtpVerifier.verifyEmail(email);
                      if (isSmtpValid.valid) {
                        await Employee.updateOne(
                          { _id: existingEmail._id },
                          { $set: { validCategory: "smtp" } }
                        );
                        validEmailsArray.push({
                          success: true,
                          data: `${email} is valid`,
                        });
                        //res.send(`${email} is valid`);
                      } else {
                        await Employee.deleteOne({ _id: existingEmail._id });
                        invalidEmailData.SMTPResponseCode =
                          isSmtpValid?.validators?.smtp?.errorCode;
                        invalidEmailData.SMTPResponseCodesDescription =
                          filteredLogsData;
                        await invalidEmail.create(invalidEmailData);
                        inValidEmailsArray.push({
                          success: false,
                          data: `${email} is not valid`,
                        });
                        // res.send(`${email} is not valid`);
                      }
                    }
                  }
                }
              }
            } else {
              console.log("its valid  email");
              validEmailsArray.push({
                success: true,
                data: `${email} is valid`,
              });
              // res.send(`${email} is valid`);
            }
          } else {
            console.log("email not exists section");
            const existingInvalidEmail = await invalidEmail.findOne({
              email: email,
            });
            console.log("Invalid Exists Result : ", existingInvalidEmail);
            if (existingInvalidEmail) {
              inValidEmailsArray.push({
                success: false,
                data: `${email} is not valid`,
              });
              //res.send(`${email} is not valid`);
            } else if (existingDomain.acceptAll == "yes") {
              invalidEmailData.acceptAll = "yes";
              const sortedMethods = validCategoriesFromCompany.filter(
                (key) => key !== "smtp"
              );
              console.log("Required Result:", sortedMethods);
              const validMethods = ["glx", "gmail", "outlook"];
              const remainingMethods = validMethods.filter(
                (method) => !sortedMethods.includes(method)
              );

              let isValid = false;

              for (const method of sortedMethods) {
                if (method === "glx") {
                  console.log("inside glx");
                  const isGlxValid = await emailFinder.checkGmail(email, input);
                  console.log("isGlxValid", isGlxValid);
                  if (
                    isGlxValid.can_connect_smtp &&
                    isGlxValid.is_deliverable
                  ) {
                    emailData.validCategory = "glx";
                    isValid = true;
                    // validEmailsArray.push(`${email} is valid`);
                  }
                } else if (method === "gmail") {
                  console.log("inside gmail");
                  const isGmailValid = await emailFinder.gmail(email);
                  console.log("isGmailValid", isGmailValid);
                  if (isGmailValid) {
                    emailData.validCategory = "gmail";
                    isValid = true;
                    // validEmailsArray.push(`${email} is valid`);
                  }
                } else if (method === "outlook") {
                  console.log("inside outlook");
                  const isOutlookValid = await emailFinder.outlook(email);
                  console.log("isOutlookValid", isOutlookValid);
                  if (isOutlookValid) {
                    emailData.validCategory = "outlook";
                    isValid = true;
                    // validEmailsArray.push(`${email} is valid`);
                  }
                }
              }

              if (!isValid) {
                for (const method of remainingMethods) {
                  if (method === "glx") {
                    console.log("inside glx");
                    const isGlxValid = await emailFinder.checkGmail(
                      email,
                      input
                    );
                    console.log("isGlxValid", isGlxValid);
                    if (
                      isGlxValid.can_connect_smtp &&
                      isGlxValid.is_deliverable
                    ) {
                      emailData.validCategory = "glx";
                      isValid = true;
                      // validEmailsArray.push(`${email} is valid`);
                    }
                  } else if (method === "gmail") {
                    console.log("inside gmail");
                    const isGmailValid = await emailFinder.gmail(email);
                    console.log("isGmailValid", isGmailValid);
                    if (isGmailValid) {
                      emailData.validCategory = "gmail";
                      isValid = true;
                      // validEmailsArray.push(`${email} is valid`);
                    }
                  } else if (method === "outlook") {
                    console.log("inside outlook");
                    const isOutlookValid = await emailFinder.outlook(email);
                    console.log("isOutlookValid", isOutlookValid);
                    if (isOutlookValid) {
                      emailData.validCategory = "outlook";
                      isValid = true;
                      // validEmailsArray.push(`${email} is valid`);
                    }
                  }
                }
              }

              if (isValid) {
                emailData.company = existingDomain._id;
                await Employee.create(emailData);
                validEmailsArray.push({
                  success: true,
                  data: `${email} is valid`,
                });
                //res.send(`${email} is valid`);
              } else {
                invalidEmailData.SMTPResponseCode =
                  isSmtpValid?.validators?.smtp?.errorCode;
                invalidEmailData.SMTPResponseCodesDescription =
                  filteredLogsData;
                await invalidEmail.create(invalidEmailData);
                inValidEmailsArray.push({
                  success: false,
                  data: `${email} is not valid`,
                });
                // res.send(`${email} is not valid`);
              }
            } else if (existingDomain.acceptAll == "no") {
              invalidEmailData.acceptAll = "no";
              console.log("accept all no section");
              const keysToExclude = ["outlook", "gmail"];

              const sortedMethods = validCategoriesFromCompany.filter(
                (key) => !keysToExclude.includes(key)
              );
              console.log("Required Result:", sortedMethods);

              if (sortedMethods[0] === "glx") {
                const isGlxValid = await emailFinder.checkGmail(email, input);
                if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                  emailData.validCategory = "glx";
                  emailData.company = existingDomain._id;
                  await Employee.create(emailData);
                  validEmailsArray.push({
                    success: true,
                    data: `${email} is valid`,
                  });
                  // res.send(`${email} is valid`);
                } else {
                  const { smptResponse: isSmtpValid, filteredLogsData } =
                    await smtpVerifier.verifyEmail(email);
                  console.log("issmtp", isSmtpValid);
                  if (isSmtpValid.valid) {
                    emailData.validCategory = "smtp";
                    emailData.company = existingDomain._id;
                    await Employee.create(emailData);
                    validEmailsArray.push({
                      success: true,
                      data: `${email} is valid`,
                    });
                    // res.send(`${email} is valid`);
                  } else if (
                    isSmtpValid?.validators?.smtp?.errorCode === "451"
                  ) {
                    invalidEmailData.SMTPResponseCode = "451";

                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    await invalidEmail.create(invalidEmailData);

                    inValidEmailsArray.push({
                      success: false,
                      data: `${email} is in Gray List`,
                    });
                    // res.status(200).send(`Email : ${email} is in Gray List`);
                  } else if (
                    isSmtpValid?.validators?.smtp?.errorCode == "550"
                  ) {
                    invalidEmailData.SMTPResponseCode = "550";
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    await invalidEmail.create(invalidEmailData);

                    inValidEmailsArray.push({
                      success: false,
                      data: `${email} is Unknwon`,
                    });
                    //res.status(200).send(`Email : ${email} is unknown`);
                  } else if (
                    isSmtpValid?.validators?.smtp?.errorCode == "521"
                  ) {
                    invalidEmailData.SMTPResponseCode = "521";

                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    await invalidEmail.create(invalidEmailData);

                    inValidEmailsArray.push({
                      success: false,
                      data: `${email} do not receive request from dummy server`,
                    });
                    // res
                    //   .status(200)
                    //   .send(
                    //     `Email : ${email} do not receive request from dummy server`
                    //   );
                  } else {
                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    await invalidEmail.create(invalidEmailData);

                    inValidEmailsArray.push({
                      success: false,
                      data: `${email} is not valid`,
                    });
                    // res.status(200).send(`Email : ${email} is not valid`);
                  }
                }
              } else if (sortedMethods[0] === "smtp") {
                console.log("smtp sortedmethod");
                const { smptResponse: isSmtpValid, filteredLogsData } =
                  await smtpVerifier.verifyEmail(email);
                console.log("issmtp", isSmtpValid);
                if (isSmtpValid.valid) {
                  emailData.validCategory = "smtp";
                  emailData.company = existingDomain._id;
                  await Employee.create(emailData);
                  validEmailsArray.push({
                    success: true,
                    data: `${email} is valid`,
                  });
                  // res.send(`${email} is valid`);
                } else if (isSmtpValid?.validators?.smtp?.errorCode === "451") {
                  invalidEmailData.SMTPResponseCode = "451";

                  invalidEmailData.SMTPResponseCode =
                    isSmtpValid?.validators?.smtp?.errorCode;
                  invalidEmailData.SMTPResponseCodesDescription =
                    filteredLogsData;
                  await invalidEmail.create(invalidEmailData);

                  inValidEmailsArray.push({
                    success: false,
                    data: `${email} is in Gray List`,
                  });
                  //res.status(200).send(`Email : ${email} is in Gray List`);
                } else if (isSmtpValid?.validators?.smtp?.errorCode == "550") {
                  invalidEmailData.SMTPResponseCode = "550";
                  invalidEmailData.SMTPResponseCode =
                    isSmtpValid?.validators?.smtp?.errorCode;
                  invalidEmailData.SMTPResponseCodesDescription =
                    filteredLogsData;
                  await invalidEmail.create(invalidEmailData);

                  inValidEmailsArray.push({
                    success: false,
                    data: `${email} mailbox not found`,
                  });
                  //res.status(200).send(`Email : ${email} is Mailbox not found`);
                } else if (isSmtpValid?.validators?.smtp?.errorCode == "521") {
                  invalidEmailData.SMTPResponseCode = "521";

                  invalidEmailData.SMTPResponseCode =
                    isSmtpValid?.validators?.smtp?.errorCode;
                  invalidEmailData.SMTPResponseCodesDescription =
                    filteredLogsData;
                  await invalidEmail.create(invalidEmailData);

                  inValidEmailsArray.push({
                    success: false,
                    data: `${email} do not receive request from dummy server`,
                  });
                  //   res
                  //     .status(200)
                  //     .send(
                  //       `Email : ${email} do not receive request from dummy server`
                  //     );
                } else {
                  const isGlxValid = await emailFinder.checkGmail(email, input);
                  if (
                    isGlxValid.can_connect_smtp &&
                    isGlxValid.is_deliverable
                  ) {
                    emailData.validCategory = "glx";
                    emailData.company = existingDomain._id;
                    await Employee.create(emailData);
                    validEmailsArray.push({
                      success: true,
                      data: `${email} is valid`,
                    });
                    //res.send(`${email} is valid from glx`);
                  }

                  invalidEmailData.SMTPResponseCode =
                    isSmtpValid?.validators?.smtp?.errorCode;
                  invalidEmailData.SMTPResponseCodesDescription =
                    filteredLogsData;
                  await invalidEmail.create(invalidEmailData);

                  inValidEmailsArray.push({
                    success: false,
                    data: `${email} is not valid`,
                  });
                  // res.status(200).send(`Email : ${email} is not valid`);
                }
              } else {
                await invalidEmail.create(invalidEmailData);

                inValidEmailsArray.push({
                  success: false,
                  data: `${email} is not valid`,
                });
                //res.send(`${email} is not valid`);
              }
            }
          }
        } else {
          // This Part Done
          console.log("Domain Not Exists Section...........");

          let companyResult;
          try {
            companyResult = await Company.create(companyData);
          } catch (error) {
            console.log("error", error);
          }

          console.log("created company", companyResult);
          const { smptResponse: isSmtpValid, filteredLogsData } =
            await smtpVerifier.verifyEmail(email);
          console.log("Orig Email Result from Smpt:", isSmtpValid);
          if (isSmtpValid.valid) {
            const emailAddress = `${randomstring.generate(10)}@${domain}`;
            const isCatch = await smtpVerifier.verifyEmail(emailAddress);
            console.log("accep all Result", isCatch);

            if (isCatch.valid) {
              invalidEmailData.acceptAll = "yes";
              companyData.acceptAll = "yes";
              await Company.updateOne(
                { _id: companyResult._id },
                { $set: { acceptAll: "yes" } }
              );

              const isGlxValid = await emailFinder.checkGmail(email, input);

              console.log("glx result", isGlxValid);
              if (isGlxValid.can_connect_smtp && isGlxValid.is_deliverable) {
                emailData.validCategory = "glx";
                emailData.company = companyResult._id;
                await Employee.create(emailData);
                validEmailsArray.push({
                  success: true,
                  data: `${email} is valid`,
                });
                //res.send(`${email} is valid`);
              } else {
                const isEmailValid = await emailFinder.gmail(email);
                console.log("gmail result", isEmailValid);
                if (isEmailValid) {
                  emailData.validCategory = "gmail";
                  emailData.company = companyResult._id;
                  await Employee.create(emailData);
                  validEmailsArray.push({
                    success: true,
                    data: `${email} is valid`,
                  });
                  //res.send(`${email} is valid`);
                } else {
                  const isOutlookValid = await emailFinder.outlook(email);
                  console.log("outlook result", isOutlookValid);
                  if (isOutlookValid) {
                    emailData.validCategory = "outlook";
                    emailData.company = companyResult._id;
                    await Employee.create(emailData);
                    validEmailsArray.push({
                      success: true,
                      data: `${email} is valid`,
                    });
                    //res.send(`${email} is valid`);
                  } else {
                    // emailData.validCategory = "smtp";
                    // emailData.company = companyResult._id;
                    // await Employee.create(emailData);
                    // res.send(`${email} is valid`);

                    console.log("Invalid section............");

                    invalidEmailData.SMTPResponseCode =
                      isSmtpValid?.validators?.smtp?.errorCode;
                    invalidEmailData.SMTPResponseCodesDescription =
                      filteredLogsData;
                    await invalidEmail.create(invalidEmailData);
                    inValidEmailsArray.push({
                      success: false,
                      data: `${email} is not valid`,
                    });
                    // res.send(`${email} is not valid`);
                  }
                }
              }
            } else {
              console.log("orig valid but not accept all");
              emailData.validCategory = "smtp";
              await Company.updateOne(
                { _id: companyResult._id },
                { $set: { acceptAll: "no" } }
              );

              emailData.company = companyResult._id;

              await Employee.create(emailData);
              validEmailsArray.push({
                success: true,
                data: `${email} is valid`,
              });
              //res.send(`${email} is valid`);
            }
          } else {
            console.log("orig invalid from smtp");
            invalidEmailData.acceptAll = "no";
            invalidEmailData.SMTPResponseCode =
              isSmtpValid?.validators?.smtp?.errorCode;
            invalidEmailData.SMTPResponseCodesDescription = filteredLogsData;
            await invalidEmail.create(invalidEmailData);

            inValidEmailsArray.push({
              success: false,
              data: `${email} is not valid`,
            });
            //res.send(`${email} is not valid`);
          }
        }
      } catch (error) {
        console.log(error);
        // res.status(400).send({ success: false, error });
      }
    }
    console.log("valid....", validEmailsArray);
    console.log("invalid...", inValidEmailsArray);
    const emailsResult = [...validEmailsArray, ...inValidEmailsArray];

    res.send(emailsResult);
  } catch (err) {
    console.log(err);
  }
};

//get Invalid Emails
const getInvalidEmails = async (req, res) => {
  const invalideEmails = await invalidEmail.find();
  console.log("res", invalideEmails);
  res.send(invalideEmails);
};
//get company DetailData
const getCompanyDetailsData = async (req, res) => {
  console.log("query", req.params.id);

  try {
    const companyDetail = await Company.findById({ _id: req.params.id });
    console.log("companyDetail:", companyDetail);
    res.status(200).send(companyDetail);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};
const postedEmployeeData = async (req, res) => {
  console.log("post Employee Data sent", req.body);
  const reqBody = req.body;
  try {
    const createdEmployee = await Employee.create(reqBody);
    res.status(200).send({ success: true, createdEmployee });
  } catch (error) {
    res.status(400).send({ success: false, error });
  }
};

const postedCompanyData = async (req, res) => {
  console.log("post Employee Data sent", req.body);
  const reqBody = req.body;
  try {
    const createdEmployee = await Company.create(reqBody);
    res.status(200).send({ success: true, createdEmployee });
  } catch (error) {
    res.status(400).send({ success: false, error });
  }
};
const changeFormateInCompanyModel = async () => {
  try {
    const companies = await Company.find({}, "companyDomain");
    for (const company of companies) {
      const companyDomain = company.companyDomain;
      const matchingEmployees = await Employee.find(
        { companyDomain: companyDomain },
        "email"
      );
      // console.log(`Company Domain: ${companyDomain}`);
      // console.log('Matching Employees:',matchingEmployees);

      const matchedEmails = matchingEmployees.map((employee) => employee.email);
      console.log(matchedEmails);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
// changeFormateInCompanyModel()

async function name(email, email2) {
  try {
    const { smptResponse: isSmtpValid, filteredLogsData } =
      await smtpVerifier.verifyEmail(email);
    console.log("issmtp", isSmtpValid);
    console.log("filteredLogsData1", filteredLogsData);

    if (isSmtpValid.valid) {
      console.log(`${email} is valid`);
    } else {
      const {
        smptResponse: isSmtpValids,
        filteredLogsData: filteredLogsDatas,
      } = await smtpVerifier.verifyEmail(email2);
      console.log("filteredLogsDatas2", filteredLogsDatas);
      console.log("issmtp", email2);
      console.log(`${email} is not valid`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
// name("imrasan@senewtech.com", "hamsaassdza@senewtech.com");

module.exports = {
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
};
