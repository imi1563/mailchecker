const express = require("express");
const {
  registerUserController,
  signInUserController,
  getAllUsers,
  setUserRolesController,
  userDeleteHandler,
} = require("../controller/userController");
const { isAuth, isAdmin } = require("../middlewares/userMiddleware");

const userRouter = express.Router();

userRouter.post("/registerUser", registerUserController);
userRouter.post("/signInUser", signInUserController);
userRouter.get("/getUserList", isAuth, isAdmin, getAllUsers);
userRouter.patch("/setUserRoles", isAuth, isAdmin, setUserRolesController);
userRouter.delete("/deleteUser/:id", isAuth, isAdmin, userDeleteHandler);

module.exports = userRouter;
