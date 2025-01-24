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
    failureRedirect: "/",
  }),

  (req, res) => {
    try {
      const token = generateToken(req.user._id);
      const refresh = generaterefreshToken(req.user._id);

      res.cookie("accessToken", token, {
        path: "/",
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
      res.cookie("refreshToken", refresh, {
        path: "/",
      });
    } catch (err) {
      res.status(500).json({ error: "حدث خطأ في الاتصال" });
    }
  }
);

module.exports = Routes;
