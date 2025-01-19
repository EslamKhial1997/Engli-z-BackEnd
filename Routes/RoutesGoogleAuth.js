const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("../config/googleAuth");

const passport = require("passport");
const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });
const Routes = express.Router();

// const generateToken = (userId) => {
//   return jwt.sign({ userId }, process.env.DB_URL, {
//     expiresIn: "365d", // تعيين صلاحية التوكن
//   });
// };

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
      const accessToken = jwt.sign({ userId: user._id }, process.env.DB_URL, {
        expiresIn: "1d", // صلاحية الـ accessToken 5 دقائق
      });
      const refreshToken = jwt.sign({ userId: user._id }, process.env.DB_URL, {
        expiresIn: "7d", // صلاحية الـ refreshToken 7 أيام
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
      }); // 5 دقائق
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
      }); // 24 ساعة
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
