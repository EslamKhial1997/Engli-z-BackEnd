const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("../config/googleAuth");

const passport = require("passport");
const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });
const Routes = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.DB_URL, {
    expiresIn: "7d",
  });
};
const generaterefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.DB_URL, {
    expiresIn: "90d", // تعيين صلاحية التوكن
  });
};

Routes.use(cookieParser());

Routes.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

Routes.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "https://www.engli-z.com/login",
  }),

  (req, res) => {
    try {
      const token = generateToken(req.user._id);
      const refresh = generaterefreshToken(req.user._id);
      console.log(token)
      res.cookie("accessToken", token, {
        path: "/", 
        httpOnly: true,

      });
      res.cookie("refreshToken", refresh, {
        path: "/", 
        httpOnly: true,

      });
            res.redirect("https://www.engli-z.com");

    } catch (err) {
      res.status(500).json({ error: "حدث خطأ في الاتصال" });
    }
  }
);

module.exports = Routes;
