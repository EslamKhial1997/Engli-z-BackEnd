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

// استخدام cookieParser لتحليل الكوكيز
Routes.use(cookieParser());

// مسار تسجيل الدخول باستخدام جوجل
Routes.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);


// مسار التوجيه بعد التوثيق بنجاح من جوجل
Routes.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "https://www.engli-z.com/login" }),

  (req, res) => {
    try {
      const token = generateToken(req.user._id); // توليد التوكن باستخدام id المستخدم
      console.log("التوكن:", token); // طباعة التوكن الفعلي في الـ console

      // تعيين التوكن في الكوكي
      res.cookie("access_token", token, {
        path: "/", // تعيين المسار المناسب للكوكي
        maxAge: 365 * 24 * 60 * 60 * 1000, // تعيين مدة صلاحية الكوكي (365 يوم)
      });

      // إعادة التوجيه إلى الصفحة الرئيسية في الفرونت إند
      res.redirect("https://www.engli-z.com/");
    } catch (err) {
      console.error("حدث خطأ في توليد التوكن:", err); // طباعة الخطأ في الـ console
      res.status(500).json({ error: "حدث خطأ في الاتصال" });
    }
  }
);

module.exports = Routes;
