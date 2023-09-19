const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      isAdmin: user.isAdmin,
      isCompanyEmployee: user.isCompanyEmployee,
      isActiveUser: user.isActiveUser,
    },
    process.env.JWT_SECRET || "SenewTech1234",
    {
      expiresIn: "30d",
    }
  );
};

const isAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (authorization) {
    const token = authorization.slice(7, authorization.length);
    jwt.verify(
      token,
      process.env.JWT_SECRET || "SenewTech1234",
      (err, decode) => {
        if (err) {
          res.status(401).send({ message: "Invalid Token" });
        } else {
          req.user = decode;
          next();
        }
      }
    );
  } else {
    res.status(401).send({ message: "No Token" });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.isSuperAdmin) {
    next();
  } else {
    res.status(401).send({ message: "Invalid Super Admin Token" });
  }
};
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).send({ message: "Invalid Admin Token" });
  }
};

const isEmployeeOrAdmin = (req, res, next) => {
  if (req.user && (req.user.isCompanyEmployee || req.user.isAdmin)) {
    next();
  } else {
    res.status(401).send({ message: "Invalid Admin/CompanyEmployee Token" });
  }
};

module.exports = {
  generateToken,
  isAuth,
  isAdmin,
  isEmployeeOrAdmin,
  isSuperAdmin,
};
