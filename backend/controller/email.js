const AT_SIGN = "@";
const DOT_SIGN = ".";
const SPACE_SIGN = " ";
const UNDERSCORE_SIGN = "_";
const { Keyboard } = require("puppeteer");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const HOTMAIL_OUTLOOK_SING_IN_URL = "https://login.microsoftonline.com/";
const GMAIL_SIGN_IN_URL =
  "https://accounts.google.com/v3/signin/identifier?dsh=S1929594387%3A1686033443208667&continue=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dgmail%2Bsign%2Bin%26rlz%3D1C1BNSD_enPK1051PK1051%26oq%3Dgmail%2Bsign%2Bin%26aqs%3Dchrome..69i57j69i64.3462j0j1%26sourceid%3Dchrome%26ie%3DUTF-8&ec=GAZAAQ&ffgf=1&hl=en&ifkv=Af_xneEN9gDHcRvohTr9fE1qx8SeqTvfLqOC9FLBTIGESUAWwnBH_LUK3kGva5AMBd85qP4hv2LY&passive=true&flowName=GlifWebSignIn&flowEntry=ServiceLogin";
const username = "cnhjfhlo-rotate";
const password = "jx9lodr1mr50";

let browser;

async function launchBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-gpu",
        "--enable-webgl",
        "--window-size=800,800",
        `--proxy-server=http://p.webshare.io:80`,
      ],
    });
  }
}

async function outlook(email) {
  console.log("outlook called", email);
  try {
    await launchBrowser();
    const page = await browser.newPage();
    await page.authenticate({ username, password });
    await page.goto(HOTMAIL_OUTLOOK_SING_IN_URL);
    await page.waitForSelector("#i0116");
    await page.focus("#i0116");
    await page.keyboard.type(email);
    await page.click("#idSIButton9");
    await page.waitForTimeout(4000);
    const urls = await page.url();
    // console.log(urls);

    const [forgotPassElement, loginDescriptionElement] = await Promise.all([
      await page.waitForSelector("#i0118", { timeout: 1000 }).catch(() => null),
      await page
        .waitForSelector("#loginDescription", { timeout: 1000 })
        .catch(() => null),
    ]);

    if (forgotPassElement !== null) {
      const forgotPasswordText = await page.$eval(
        "#idA_PWD_ForgotPassword",
        (element) => element.textContent
      );
      console.log("pass ", forgotPasswordText);

      if (
        forgotPasswordText == "Forgot password?" ||
        forgotPasswordText == "Forgot my password" ||
        forgotPasswordText == "Forgotten my password"
      ) {
        return true;
      }
    } else if (loginDescriptionElement !== null) {
      const loginDescription = await page.$eval(
        "#loginDescription",
        (element) => element.textContent
      );
      console.log(loginDescription);
      if (loginDescription.includes("It looks like this email")) {
        return true;
      }
    } else {
      console.log(
        "Neither '#idA_PWD_ForgotPassword' nor '#loginDescription' appeared on the page."
      );
      return false;
    }
  } catch (error) {
    return false;
  }
}

async function gmail(email) {
  try {
    await launchBrowser();

    const page = await browser.newPage();
    await page.authenticate({ username, password });
    await page.goto(GMAIL_SIGN_IN_URL);
    await page.waitForSelector("#identifierId");
    await page.focus("#identifierId");
    await page.keyboard.type(email);
    await page.click("#identifierNext");
    await page.waitForTimeout(4000);

    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      const passwordInputName = await passwordInput.evaluate((element) =>
        element.getAttribute("name")
      );
      console.log(passwordInputName);
      if (passwordInputName === "Passwd") {
        return true;
      }
    } else {
      const textElement = await page.$(".R1xbyb");
      if (textElement) {
        const text = await page.$eval(".R1xbyb", (element) =>
          element.textContent.trim()
        );

        if (text.includes("An account owned")) {
          return true;
        } else {
          return false;
        }
      }
    }

    return false; // Default return if no matching elements or conditions found
  } catch (error) {
    console.error("Error occurred:", error);
    return false;
  }
}

function generateEmailVariationsRows(personName, domain) {
  const nameParts = personName.trim().split(SPACE_SIGN);

  if (nameParts.length < 2 || nameParts[1].trim() === "") {
    console.log("Please provide both the first and last name.");
    return []; // Return an empty array if last name is missing
  }

  const [first, last] = personName.toLowerCase().split(SPACE_SIGN);
  const f = first[0];
  const l = last[0];

  const atDomain = AT_SIGN + domain;

  const variations = [];

  //first@domain.com
  variations.push({ email: first + atDomain, emailFormate: "firstName" });

  //first.last@domain.com
  variations.push({
    email: first + DOT_SIGN + last + atDomain,
    emailFormate: "firstNameDotLastName",
  });

  //flast@domain.com
  variations.push({
    email: f + last + atDomain,
    emailFormate: "fLastName",
  });

  //firstlast@domain.com
  variations.push({
    email: first + last + atDomain,
    emailFormate: "firstNameLastName",
  });

  //last@domain.com
  variations.push({ email: last + atDomain, emailFormate: "lastName" });

  //firstl@domain.com
  variations.push({ email: first + l + atDomain, emailFormate: "firstNameL" });

  //last.first@domain.com
  variations.push({
    email: last + DOT_SIGN + first + atDomain,
    emailFormate: "lastNameDotfirstName",
  });

  //lastfirst@domain.com
  variations.push({
    email: last + first + atDomain,
    emailFormate: "lastNamefirstName",
  });

  //first_last@domain.com
  variations.push({
    email: first + UNDERSCORE_SIGN + last + atDomain,

    emailFormate: "firstNameUnderScorelastName",
  });

  return variations;
}

async function checkGmail(email, input) {
  console.log("GLX called");
  const axios = require("axios").default;
  const GLXU_PAGE = "https://mail.google.com/mail/gxlu?email=";
  const url = `${GLXU_PAGE}${email}`;
  const headers = {
    "User-Agent": input.userAgent,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };
  const options = {
    headers: headers,
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 303,
    timeout: 2000, // increase the timeout value to 5 seconds
  };
  const response = await axios.head(url, options);
  const emailExists = response.headers.hasOwnProperty("set-cookie");

  const Default = {
    property1: "default value 1",
    property2: "default value 2",
    // ...and so on
  };

  return {
    status: response.status,
    can_connect_smtp: true,
    is_deliverable: emailExists,
    ...Default,
  };
}
module.exports = {
  gmail,
  outlook,
  generateEmailVariationsRows,
  checkGmail,
};
