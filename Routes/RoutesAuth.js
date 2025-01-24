const { Router } = require("express");
const { LoginValidator } = require("../Resuble/AuthvalidatorError");
const {
  SingUp,
  Login,
  forgetPassword,
  restNewPassword,
  verifyEmail,
  signOut,
  
} = require("../Service/AuthService");
require("../config/googleAuth");
const { createUsersValidator } = require("../Resuble/UsersvalidatorError");
const { uploadImage, resizeImageAuth } = require("../Utils/imagesHandler");
const { limiter } = require("../Service/FactoryHandler");
const Routes = Router();
Routes.route("/signup").post(
  limiter,
  uploadImage,
  createUsersValidator,
  resizeImageAuth("admin"),
  SingUp
);

Routes.route("/login").post(limiter, LoginValidator, Login);
Routes.route("/signout").get(signOut);

Routes.post("/forgetPassword", limiter, forgetPassword);

Routes.get("/verify", verifyEmail);
Routes.put("/setNewPassword/:id", restNewPassword("password"));

module.exports = Routes;
