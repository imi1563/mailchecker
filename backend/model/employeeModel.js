const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const { getGender } = require("gender-detection-from-name");

function extractNameFromEmail(email) {
  const parts = email.split("@")[0].split(".");
  const firstName = parts[0];
  let lastName = null;

  if (parts.length > 1) {
    lastName = parts.slice(1).join(" ");
    if (lastName.split(" ").length > 1) {
      lastName = lastName.split(" ")[1];
    }
  }
  return {
    firstName,
    lastName,
  };
}

function extractDomain(email) {
  const matches = email.match(/@([^.]+)/);
  return matches ? matches[1] : null;
}

function getGenderFromName(name) {
  const genderDetail = getGender(name);
  return genderDetail;
}

const employeeSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    gender: String,
    companyDomain: [{ type: String }],
    jobTitle: { type: String },
    email: { type: String, unique: true },
    employeeEmailFormate: { type: String },
    updatedTimeStamps: Date,
    server: String,
    validCategory: { type: String },
    linkedinProfileUrl: String,
    location: String,
    durationIncurrentRole: { type: String },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
  },
  {
    timestamps: { createdAt: "created_at" },
  }
);

employeeSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  const emailParts = extractNameFromEmail(this.email);
  this.firstName = emailParts.firstName;
  this.lastName = emailParts.lastName;
  this.companyDomain = [extractDomain(this.email)];
  this.gender = getGenderFromName(this.firstName);
  this.updatedTimeStamps = new Date();
  next();
});

employeeSchema.methods.updateLastFetchedTime = async function () {
  this.updatedTimeStamps = new Date();
  await this.save();
  console.log("Updated last fetched time.");
};
const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
