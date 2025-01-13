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
    expiresIn: "365d", // تعيين صلاحية التوكن
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

      res.cookie("access_token", token, {
        path: "/",
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
      if (req.session.isNewUser) {
        res.redirect("/completeData");
      } else {
        res.redirect("/");
      }
    } catch (err) {
      res.status(500).json({ error: "حدث خطأ في الاتصال" });
    }
  }
);

module.exports = Routes;
