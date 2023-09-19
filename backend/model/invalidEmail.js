const mongoose = require("mongoose");
const { Schema } = require("mongoose");

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

const invalidEmailSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String },
    invalidEmailDomain: { type: String },
    acceptAll: { type: String },
    updatedTimeStamps: Date,
    SMTPResponseCode: { type: Number },
    SMTPResponseCodesDescription: [{ type: String }],
  },
  {
    timestamps: { createdAt: "created_at" },
  }
);

invalidEmailSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  const emailParts = extractNameFromEmail(this.email);
  this.firstName = emailParts.firstName;
  this.lastName = emailParts.lastName;

  next();
});

const invalidEmail = mongoose.model("invalidEmail", invalidEmailSchema);
module.exports = invalidEmail;
