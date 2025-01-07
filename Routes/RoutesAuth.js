const { Router } = require("express");
const jwt = require("jsonwebtoken");
const { LoginValidator } = require("../Resuble/AuthvalidatorError");
const {
  SingUp,
  Login,
  forgetPassword,
  restNewPassword,
  verifyEmail,
} = require("../Service/AuthService");
require("../config/googleAuth");
const { createUsersValidator } = require("../Resuble/UsersvalidatorError");
const { uploadImage, resizeImageAuth } = require("../Utils/imagesHandler");
const { limiter } = require("../Service/FactoryHandler");
const Routes = Router();
// مسار تسجيل المستخدم الجديد
Routes.route("/signup").post(
  limiter,
  uploadImage,
  createUsersValidator,
  resizeImageAuth("admin"),
  SingUp
);

// مسار تسجيل الدخول
Routes.route("/login").post(limiter, LoginValidator, Login);

// مسار نسيان كلمة المرور
Routes.post("/forgetPassword", limiter, forgetPassword);

// مسار التحقق من البريد الإلكتروني
Routes.get("/verify", verifyEmail);

// مسار إعادة تعيين كلمة المرور
Routes.put("/setNewPassword/:id", restNewPassword("password"));

module.exports = Routes;
