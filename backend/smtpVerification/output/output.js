// output.js
const OrderedLevels = ["regex", "typo", "disposable", "mx", "smtp"];

const createOutput = (failLevel, failReason, errorCode = null) => {
  const out = { valid: true, validators: {} };

  if (failLevel) {
    out.reason = failLevel;
    out.valid = false;
  }

  let valid = true;

  for (let i = 0; i < OrderedLevels.length; i++) {
    const level = OrderedLevels[i];
    const levelOut = { valid };

    if (level === failLevel) {
      valid = false;
      levelOut.valid = false;
      levelOut.reason = failReason;
      levelOut.errorCode = errorCode; // Add the errorCode property
    }

    out.validators[level] = levelOut;
  }

  return out;
};

module.exports = createOutput;
