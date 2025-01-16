const expressAsyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const ApiError = require("../Resuble/ApiErrors");
const createUsersModel = require("../Modules/createUsers");
const createTeachersModel = require("../Modules/createTeacher");
const createNotificationsModel = require("../Modules/createNotifiction");
const sendVerificationEmail = require("../Utils/SendCodeEmail");
const { sanitizeSignUp } = require("../Utils/sanitize");

exports.createFirstManagerAccount = async () => {
  const existingManager = await createUsersModel.findOne({
    email: "manager@gmail.com",
  });
  if (existingManager) {
    console.log("Manager account already exists");
    return;
  }

  const manager = await createUsersModel.create({
    firstName: "manager",
    lastName: "manager",
    email: "manager@gmail.com",
    phone: "01000000000",
    role: "manager",
    active: "active",
    password: await bcrypt.hash("123456789", 12),
    confirmPassword: await bcrypt.hash("123456789", 12),
  });

  console.log("Manager account created successfully");
};

exports.getLoggedUserData = expressAsyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});
exports.SingUp = expressAsyncHandler(async (req, res, next) => {
  try {
    req.body.password = await bcrypt.hash(req.body.password, 12);
    if (req.body.role) req.body.role = "user";

    const admin = await createUsersModel.findOne({ _id: req.body.teacher });

    const notifications = [];

    notifications.push(
      await createNotificationsModel.create({
        type: "signup",
        msg: "تم إضافة طالب جديد",
        studentSignup: {
          studentName: req.body.name,
          studentEmail: req.body.email,
          studentPhone: req.body.phone,
        },
      })
    );

    if (admin) {
      notifications.push(
        await createNotificationsModel.create({
          type: "signup",
          msg: "تم إضافة طالب جديد",
          studentSignup: {
            studentName: req.body.name,
            studentEmail: req.body.email,
            studentPhone: req.body.phone,
          },
        })
      );
    }
    const user = await createUsersModel.create(req.body);

    // تحديث إشعارات المستخدم
    for (const notification of notifications) {
      notification.user = user._id;
      await notification.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.DB_URL, {
      expiresIn: "360d",
    });

    await user.save();

    return res.status(200).json({
      status: "تم اضافة طالب جديد",
      token,
    });
  } catch (error) {
    return next(new ApiError("فشل في عملية التسجيل أو إرسال الإشعارات", 500));
  }
});
const Token = () =>
  expressAsyncHandler((req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        redirectTo: "/login",
      });
    }
    jwt.verify(refreshToken, process.env.DB_URL, (err, user) => {
      if (err)
        return res.status(403).json({
          redirectTo: "/login",
        });

      const accessToken = jwt.sign(
        { userId: user.userId },
        process.env.DB_URL,
        {
          expiresIn: "1m",
        }
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
      }); // 5 دقا
    });
  });
exports.Login = expressAsyncHandler(async (req, res, next) => {
  const clientIp = req.ip || req.headers["x-forwarded-for"]?.split(",").shift();

  let user = null;
  let teacher = null;

  // تحقق من بيانات المستخدم
  if (req.body.password) {
    user = await createUsersModel.findOne({ email: req.body.email });
  } else {
    user = await createUsersModel.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.email }],
    });
  }

  // تحقق من بيانات المعلم
  teacher = await createTeachersModel.findOne({
    $or: [{ email: req.body.email }, { phone: req.body.email }],
  });

  // التحقق من المستخدم
  if (user && (await bcrypt.compare(req.body.password, user.password))) {
    user.ip = clientIp;
    await user.save();

    // إنشاء accessToken و refreshToken للمستخدم
    const accessToken = jwt.sign({ userId: user._id }, process.env.DB_URL, {
      expiresIn: "1m", // صلاحية الـ accessToken 5 دقائق
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
    return res
      .status(200)
      .json({ token: accessToken, refreshToken: refreshToken });
  }

  // التحقق من المعلم
  if (teacher && (await bcrypt.compare(req.body.password, teacher.password))) {
    const accessToken = jwt.sign({ userId: teacher._id }, process.env.DB_URL, {
      expiresIn: "5m", // صلاحية الـ accessToken 5 دقائق
    });
    const refreshToken = jwt.sign({ userId: teacher._id }, process.env.DB_URL, {
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
    return res
      .status(200)
      .json({ token: accessToken, refreshToken: refreshToken });
  }

  // في حالة فشل تسجيل الدخول
  return res.status(500).json({
    status: "Error",
    msg: "خطأ في اسم المستخدم أو كلمة المرور",
  });
});

exports.findOrCreateGoogleUser = async (googleProfile) => {
  try {
    if (
      !googleProfile.id ||
      !googleProfile.emails ||
      !googleProfile.emails[0].value
    ) {
      throw new Error("Invalid Google profile data");
    }

    // احصل على عنوان IP من كائن الطلب
    const clientIp =
      req.ip ||
      req.headers["x-forwarded-for"]?.split(",").shift() ||
      req.connection.remoteAddress;

    // ابحث عن المستخدم بناءً على معرف Google
    let user = await createUsersModel.findOne({ googleId: googleProfile.id });

    // إذا لم يكن المستخدم موجودًا، أنشئ مستخدمًا جديدًا
    if (!user) {
      user = await createUsersModel.create({
        googleId: googleProfile.id,
        email: googleProfile.emails[0].value,
        firstName: googleProfile.displayName,
        ip: clientIp,
      });
    } else {
      // إذا كان المستخدم موجودًا، قم بتحديث عنوان IP
      await createUsersModel.findOneAndUpdate(
        { googleId: googleProfile.id },
        { ip: clientIp },
        { new: true }
      );
    }

    return user;
  } catch (error) {
    console.error("Error in findOrCreateGoogleUser:", error);
    throw error;
  }
};

exports.allowedTo = (...roles) =>
  expressAsyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        res.status(403).json({
          status: "Error",
          msg: "ليس لديك صلاحيه الوصول",
        })
      );
    }
    next();
  });

exports.protect = expressAsyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken;

  // استخراج التوكن من الهيدر
  if (!token) {
    return res.status(401).json({
      statusCode: "Error",
      msg: "لم يتم توفير رمز التفويض",
    });
  }

  try {
    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.DB_URL);
    if (!decoded) {
      return res.status(401).json({
        statusCode: "Error",
        msg: "الرمز غير صالح. يرجى تسجيل الدخول مرة أخرى.",
      });
    }

    // العثور على المستخدم بناءً على الـID المستخرج من التوكن
    const currentUser =
      (await createUsersModel.findById(decoded.userId)) ||
      (await createTeachersModel.findById(decoded.userId));

    if (!currentUser) {
      return res.status(401).json({
        statusCode: "Error",
        msg: "المستخدم غير موجود",
      });
    }

    // التحقق مما إذا قام المستخدم بتغيير كلمة المرور بعد إصدار التوكن
    if (currentUser.passwordChangedAt) {
      const passChangedTimestamp = parseInt(
        currentUser.passwordChangedAt.getTime() / 1000,
        10
      );
      if (passChangedTimestamp > decoded.iat) {
        return res.status(401).json({
          statusCode: "Error",
          msg: "لقد قمت بتغيير كلمة المرور. يرجى تسجيل الدخول مرة أخرى.",
        });
      }
    }

    // تحديد الدور وتعيين النموذج المناسب
    if (
      currentUser.role === "user" ||
      currentUser.role === "admin" ||
      currentUser.role === "manager"
    ) {
      req.model = createUsersModel;
    } else if (currentUser.role === "teacher") {
      req.model = createTeachersModel;
    } else {
      return res.status(403).json({
        statusCode: "Error",
        msg: "تم رفض الوصول. ليس لديك الإذن للقيام بهذا الإجراء.",
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    // التحقق من نوع الخطأ وتخصيص الرسالة
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        statusCode: "Error",
        msg: "التوكن غير صحيح",
      });
    } else if (error.name === "TokenExpiredError") {
      Token();
      return res.status(401).json({
        statusCode: "Error",
        msg: "التوكن منتهي الصلاحيه",
      });
    } else {
      return res.status(500).json({
        statusCode: "Error",
        msg: "حدث خطأ داخلي في الخادم.",
      });
    }
  }
});
exports.verifyEmail = expressAsyncHandler(async (req, res) => {
  try {
    const { token } = req.query;

    const user = await createUsersModel.findOne({ verificationToken: token });
    if (!user) return res.status(400).send("التوكن غير صالح أو منتهي الصلاحية");
    await user.save();

    // return res.redirect("/");
    return res.status(201).send({
      status: "success",
      msg: "تم التحقق من البريد الالكتروني بنجاح",
    });
  } catch (error) {
    res.status(500).send("حدث خطأ أثناء التحقق من البريد الإلكتروني");
  }
});

exports.forgetPassword = expressAsyncHandler(async (req, res, next) => {
  try {
    // البحث عن المستخدم أو المعلم بناءً على البريد الإلكتروني
    let user = await createUsersModel.findOne({ email: req.body.email });
    let teacher = await createTeachersModel.findOne({ email: req.body.email });
    const target = user || teacher;

    // إذا لم يتم العثور على المستخدم أو المعلم، يتم إرسال خطأ
    if (!target) {
      return next(
        new ApiError(`البريد الإلكتروني ${req.body.email} غير موجود.`)
      );
    }

    // إنشاء توكن عشوائي لإعادة تعيين كلمة المرور
    const tokenVerify = crypto.randomBytes(32).toString("hex");
    target.verificationToken = tokenVerify;

    // حفظ التوكن في قاعدة البيانات
    await target.save();

    // إرسال البريد الإلكتروني مع التوكن
    await sendVerificationEmail(target.email, tokenVerify, target.firstName);

    // إرسال رد بالنجاح
    res.status(200).json({ status: "success", msg: "تم إرسال الرمز بنجاح" });
  } catch (error) {
    // معالجة أي أخطاء غير متوقعة
    next(
      new ApiError(
        "حدث خطأ أثناء إرسال البريد الإلكتروني لإعادة تعيين كلمة المرور."
      )
    );
  }
});

exports.restNewPassword = (UserPassword) =>
  expressAsyncHandler(async (req, res, next) => {
    const { setNewPassword } = req.body;
    const { id } = req.params;
    console.log(req.params.id);

    const user = await createUsersModel.findOne({ verificationToken: id });

    const teacher = await createTeachersModel.findOne({
      verificationToken: id,
    });

    if (!user && !teacher) {
      return next(new ApiError(`لايوجد ايميل بهذا الاسم`, 404));
    }

    const target = user || teacher;
    // 3) تحديث كلمة المرور إذا كانت العملية تتعلق بكلمة المرور
    if (UserPassword === "password") {
      target.password = await bcrypt.hash(setNewPassword, 12);
    }
    target.verificationToken = undefined;
    await target.save();

    // 5) إنشاء وإرجاع رمز JWT إذا كانت العملية تتعلق بكلمة المرور
    if (UserPassword === "password") {
      const token = jwt.sign({ userId: target._id }, process.env.DB_URL, {
        expiresIn: "360d",
      });
      return res.status(200).json({ token });
    }

    res
      .status(200)
      .json({ status: "success", msg: "تم تغيير الرقم السري بنجاح" });
  });
