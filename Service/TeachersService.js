const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const factory = require("./FactoryHandler");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../Resuble/ApiErrors");
const createTeachersModel = require("../Modules/createTeacher");
const createClassModel = require("../Modules/createClasses");
const createSectionModel = require("../Modules/createSection");
const createLecturesModel = require("../Modules/createAlecture");
const createUsersModel = require("../Modules/createUsers");
exports.createFirstTeacher = async () => {
  try {
    // التحقق مما إذا كان هناك باقة موجودة مسبقًا
    const existingTeacher = await createTeachersModel.find({});
    if (existingTeacher.length > 0) {
      console.log("Teacher account already exists");
      return;
    }

    // إنشاء الباقة الجديدة
    await createTeachersModel.create({
      name: "teacher",
      description: "description",
      subject: "subject",
      email: "teacher@gmail.com",
      password: await bcrypt.hash("123456789", 12),
      confirmPassword: await bcrypt.hash("123456789", 12),
      phone: "0123456789",
      active: true,
      role: "teacher",
    });

    console.log("Teacher account created successfully");
  } catch (error) {
    console.error("Error creating Teacher account:", error);
  }
};

exports.createTeachers = expressAsyncHandler(async (req, res, next) => {
  req.body.password = await bcrypt.hash(req.body.password, 12);

  const teacherExsist = await createTeachersModel.findOne();

  if (teacherExsist) {
    return next(new ApiError("غير مسموح بأنشاء اكثر من مدرس", 404));
  }
  const teacher = await createTeachersModel.create(req.body);

  await teacher.save();
  res.status(200).json({
    status: "success",
    data: teacher,
  });
});

exports.getTeachers = factory.getAll(createTeachersModel);
exports.getAllDataTeacher = expressAsyncHandler(async (req, res, next) => {
  const teacher = await createTeachersModel.findById(req.params.id);
  const gallery = await createGalleryModel.find({
    teacher: req.params.id,
  });
  const classes = await createClassModel.find({
    teacher: req.params.id,
  });
  const section = await createSectionModel.find({
    class: { $in: classes.map((cls) => cls._id) },
  });
  const lecutre = await createLecturesModel.find({
    section: { $in: section.map((cls) => cls._id) },
  });
  res.status(201).json({
    data: {
      teacher,
      gallery,
      classes,
      section,
      lecutre,
    },
  });
});
exports.getTeacher = factory.getOne(createTeachersModel);
exports.updateTeacher = factory.updateOne(createTeachersModel, "teacher");
exports.deleteTeacher = factory.deleteOne(createTeachersModel, "teacher");

exports.getMeTeacher = factory.getOne(createTeachersModel);

exports.updateLoggedTeacherPassword = expressAsyncHandler(async (req, res) => {
  const Teacher = await createTeachersModel.findByIdAndUpdate(
    req.Teacher._id,
    {
      password: await bcrypt.hash(req.body.password, 12),
    },
    {
      new: true,
    }
  );
  const token = jwt.sign({ TeacherId: Teacher._id }, process.env.DB_URL, {
    expiresIn: "90d",
  });
  res.status(200).json({ data: Teacher, token });
});
exports.approvedUser = expressAsyncHandler(async (req, res, next) => {
  // العثور على المعلم والدفعة لتحديد النقاط قبل الحذف
  const totalUsers = await createUsersModel.countDocuments({
    active: { $in: ["active", "block"] },
  });
  if (totalUsers > 150) {
    return next(
      new ApiError(
        " تم الوصول للحد الاقصي من تنشيط الطلاب يرجي التواصل مع الدعم الفني",
        404
      )
    );
  }
  const status = await createUsersModel.findById(req.params.id);
  const user = await createUsersModel.findOneAndUpdate(
    { _id: req.params.id }, // البحث عن المستخدم حسب الـ id
    {
      $set:
        status.active === "inactive"
          ? { active: "active" }
          : status.active === "block"
          ? { active: "active" }
          : { active: "block" },
    }, // تحديث حقل point
    { new: true } // إرجاع المستند المحدث
  );

  if (!user) {
    return next(new ApiError("الطالب غير موجود", 404));
  }

  res.status(200).json({
    status: " العملية تمت بنجاح",
    data: user,
  });
});
