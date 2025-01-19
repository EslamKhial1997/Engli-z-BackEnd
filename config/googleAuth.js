const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const createUsersModel = require("../Modules/createUsers");
const dotenv = require("dotenv");
const createNotificationsModel = require("../Modules/createNotifiction");

dotenv.config({ path: "config.env" });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URL,
      passReqToCallback: true, // تمرير req إلى دالة التحقق
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const clientIp =
          req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        // البحث عن المستخدم
        let user = await createUsersModel.findOne({
          $or: [{ googleId: profile.id }, { email: profile.emails[0].value }],
        });

        if (!user) {
          user = await createUsersModel
            .create({
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.name.givenName,
              image: profile.photos[0].value,
              ip: clientIp,
            })
            .then(() => {
              res.redirect("/dashboard");
            });
          await createNotificationsModel.create({
            type: "signup",
            msg: "تم إضافة طالب جديد",
            studentSignup: {
              studentName: profile.name.givenName,
              studentEmail: profile.emails[0].value,
            },
          });
        } else {
          // تحديث IP إذا كان المستخدم موجودًا
          await createUsersModel.findOneAndUpdate(
            { _id: user._id },
            { ip: clientIp },
            { new: true }
          );
        }
        req.session.isNewUser = isNewUser;
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// تسلسل المستخدم في الـ session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// إلغاء التسلسل عند استرجاع المستخدم
passport.deserializeUser(async (id, done) => {
  try {
    const user = await createUsersModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
