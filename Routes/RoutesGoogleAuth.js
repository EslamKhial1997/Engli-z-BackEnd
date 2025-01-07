const express = require("express");
const jwt = require("jsonwebtoken");

require("../config/googleAuth");

const passport = require("passport");
const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });
const Routes = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.DB_URL, {
    expiresIn: "365d",
  });
};

Routes.get(
  "/google",

  passport.authenticate("google", { scope: ["profile", "email"] })
);

Routes.get(
  "/google/callback",
  (req, res, next) => {
    req.domain = req.headers.referer; 
    next(); // الانتقال إلى المعالج التالي
  },
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    try {
      const token = generateToken(req.user._id);
      res.cookie("access_token", token
        // , { httpOnly: true }
      );

      const redirectDomain = req.domain;
      res.redirect(redirectDomain);
    } catch (err) {
      res.status(500).json({ error: "حدث خطأ في الاتصال" });
    }
  }
);

module.exports = Routes;
