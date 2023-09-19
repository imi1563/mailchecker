const dns = require("dns");

async function findDNSFunction(domain) {
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (mxRecords) {
      return true;
    } else {
      console.log("yes Mx Record does not Exist");
      return false;
    }
  } catch (error) {
    console.log(error);

    return false;
  }
}

module.exports = findDNSFunction;
