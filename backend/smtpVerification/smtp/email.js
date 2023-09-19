const dns = require("dns");
const net = require("net");
const getBestMx = require("./dns/dns");
const getRandomStringFromArray = require("./randomSenderEmial");
const checkDisposable = require("./disposibal/disposible");
const randomSenderEmailAddress = require("./randomSenderEmial");
const { checkSMTP, log, clearLogs } = require("./smtp/smtp");

async function verifyEmail(email, verifyEmail = null) {
  console.log("🚀 ~ file: email.js:10 ~ verifyEmail ~ FirstEmail:", email);

  try {
    // Extract the domain from the email address
    const domain = email.split("@")[1];
    console.log(`Domain: ${domain}`);
    // Resolve MX records for the domain
    // const mxRecords = await getBestMx(domain);
    // console.log('MX Records:', mxRecords);

    // if(!mxRecords){
    //   console.log("MX Record not found")
    //   return
    // }
    // const disposableResponse = await checkDisposable(domain)
    // if (disposableResponse) {
    //   console.log("disposable Response",disposableResponse)
    // }

    // / Resolve MX records for the domain
    const mxRecords = await dns.promises.resolveMx(domain);
    console.log("MX Records:", mxRecords);

    // Sort the MX records by priority
    const sortedRecords = mxRecords.sort((a, b) => a.priority - b.priority);
    console.log("Sorted MX Records:", sortedRecords);
    try {
      let randomSenderEmail = randomSenderEmailAddress;

      const smptResponse = await checkSMTP(
        randomSenderEmail,
        email,
        sortedRecords[0].exchange
      );
      const filteredLogsData = [];

      const smtpResponseLogs = await log();
      // console.log("smtpResponseLogs", smtpResponseLogs);

      filteredLogsData.length = 0;

      filteredLogsData.push(
        ...new Set(
          smtpResponseLogs.filter(
            (item) =>
              !item.startsWith("220") &&
              !item.startsWith("250") &&
              !item.includes("data")
          )
        )
      );

      console.log("filteredLogsData", filteredLogsData);
      clearLogs();

      return { smptResponse, filteredLogsData };
      //  if(smptResponse?.valid){
      //   console.log("SMTP Response Boolean",true)
      //   return true
      //  }
      //  else{
      //   console.log("SMTP Response Boolean",false)
      //   return false
      //  }
    } catch (error) {
      console.log("SMTP Error", error);
      // return false
    }
  } catch (err) {
    console.log(`An error occurred while verifying the email address: ${err}`);
  }
}

module.exports = {
  verifyEmail,
};
