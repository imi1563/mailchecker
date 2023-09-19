const mongoose = require("mongoose");
const { Schema } = require("mongoose");

function extractNamePercentageFromEmail(email) {
  const parts = email.split("@")[0].split(".");
  const firstName = parts[0];
  let lastName = null;
  if (parts.length > 1) {
    lastName = parts.slice(1).join(" ");
    if (lastName.split(" ").length > 1) {
      lastName = lastName.split(" ")[1];
    }
  }
  if (lastName !== null) {
    return "50% First Name , 50% Last Name";
  } else {
    return "100% First Name , 0% Last Name";
  }
}

function validatePhoneNumber(input_str) {
  const strippedNumber = input_str.replace(/^0+/, "");
  var re = /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/;
  return re.test(strippedNumber);
}
const companySchema = new Schema(
  {
    companyName: { type: String },
    companyDomain: [{ type: String, unique: true, sparse: true }],
    socialIcons: [{ type: String }],
    companySize: { type: String },
    employeeSize: { type: Number },
    industry: { type: String },
    headquarterLocation: { type: String },
    phoneNumber: {
      type: String,
      validate: {
        validator: validatePhoneNumber,
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },

    companyEmailFormate: {
      type: Map,
      of: Number,
    },
    acceptAll: { type: String },
    validCategory: {
      type: Map,
      of: Number,
    },
  },
  {
    timestamps: { createdAt: "created_at" },
  }
);
companySchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  next();
});

const Company = mongoose.model("Company", companySchema);
module.exports = Company;
