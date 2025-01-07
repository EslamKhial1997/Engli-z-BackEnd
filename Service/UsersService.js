const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../Resuble/ApiErrors");
const factory = require("./FactoryHandler");
const createUsersModel = require("../Modules/createUsers");
const { UploadSingleImage } = require("../Middleware/UploadImageMiddleware");
const fs = require("fs");
const createTeachersModel = require("../Modules/createTeacher");
const createPackageModel = require("../Modules/createPackage");

exports.uploadImage = UploadSingleImage("image");
exports.fsRemove = async (filePath) => {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(" Faild Delete:", err);
    } else {
      console.log("Delete Is Success in local filesystem");
    }
  });
};

exports.createUsers = expressAsyncHandler(async (req, res) => {
  try {
    const package = await createPackageModel.findOne();
    if (!package) {
      return res.status(404).json({
        status: "Error",
        msg: "الخطط غير موجودة في النظام",
      });
    }

    const admin = await createUsersModel
      .find({ role: "admin" })
      .countDocuments();
    if (package.pricing.assistant <= admin) {
      return res.status(200).json({
        status: "Error",
        msg: ` لايمكن انشاء اكتر من ${package.pricing.assistant} ادمن  بناءا علي خطتك الحالية`,
      });
    }
    req.body.password = await bcrypt.hash(req.body.password, 12);
    req.body.teacher = req.user._id;
    req.body.role = "admin";
    const user = await createUsersModel.create(req.body);

    await user.save();
    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      msg: "حدث خطأ أثناء إنشاء المستخدم",
    });
  }
});

exports.getUsers = factory.getAll(createUsersModel);
exports.getUser = (model) => factory.getOne(model);
exports.deleteUser = factory.deleteOne(createUsersModel, "admin");

exports.updateLoggedUserPassword = (model) =>
  expressAsyncHandler(async (req, res) => {
    const user = await model.findByIdAndUpdate(
      req.user._id,
      {
        password: await bcrypt.hash(req.body.password, 12),
      },
      {
        new: true,
      }
    );
    const token = jwt.sign({ userId: user._id }, process.env.DB_URL, {
      expiresIn: "90d",
    });
    res.status(200).json({ data: user, token });
  });
exports.updateUser = factory.updateOne(createUsersModel, "admin");
exports.paidToTeacher = expressAsyncHandler(async (req, res, next) => {
  const teacher = await createTeachersModel.findById(req.params.id);
  if (!teacher) {
    return next(new ApiError("Teacher Not Found"));
  }
  teacher.paid.push(req.body);
  await teacher.save(); // Save the updated teacher document to the database

  res.status(200).json({
    status: "success",
    data: teacher,
  });
});
