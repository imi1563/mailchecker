const bcrypt = require("bcryptjs");
const User = require("../model/userModel");
const { generateToken } = require("../middlewares/userMiddleware");

const registerUserController = async (req, res) => {
  try {
    const alreadyExistingUser = await User.findOne({ email: req.body.email });

    if (alreadyExistingUser) {
      console.log("alreadyExistingUser", alreadyExistingUser);
      res.status(400).send({
        success: false,
        error: ` Email:${alreadyExistingUser.email} has already been taken`,
      });
    } else {
      const createdUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
      });

      res.status(200).send({
        success: true,
        data: {
          _id: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
          isSuperAdmin: createdUser.isSuperAdmin,
          isAdmin: createdUser.isAdmin,
          isCompanyEmployee: createdUser.isCompanyEmployee,
          isActiveUser: createdUser.isActiveUser,
          token: generateToken(createdUser),
        },
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(401).send({ success: false, error });
  }
};

const signInUserController = async (req, res) => {
  console.log(req.body);
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user._id,
          name: user.name,
          email: user.email,
          isSuperAdmin: user.isSuperAdmin,
          isAdmin: user.isAdmin,
          isCompanyEmployee: user.isCompanyEmployee,
          isActiveUser: user.isActiveUser,
          token: generateToken(user),
        });
        return;
      }
    }
    res.status(401).send({ message: "Invalid email or password" });
  } catch (error) {
    console.error("Error:", error);
    res.status(401).send({ error });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (error) {
    res.status(400).send({ message: "User do not find" });
  }
};

const setUserRolesController = async (req, res) => {
  try {
    const { _id, isAdmin, isCompanyEmployee } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { isAdmin, isCompanyEmployee },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const userDeleteHandler = async (req, res) => {
  const id = req.params.id;

  console.log("id", id);
  try {
    const deletedUserData = await User.findByIdAndDelete({ _id: id });
    console.log("deletedUserData data ", deletedUserData);
    res.send(deletedUserData);
  } catch (err) {
    console.log("Error Occurred", err);
  }
};

module.exports = {
  registerUserController,
  signInUserController,
  getAllUsers,
  setUserRolesController,
  userDeleteHandler,
};
