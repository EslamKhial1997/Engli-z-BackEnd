const expressAsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const ApiError = require("../Resuble/ApiErrors");
const FeatureApi = require("../Utils/Feature");

const { filePathImage } = require("../Utils/imagesHandler");
const { default: rateLimit } = require("express-rate-limit");

exports.createOne = (Model) =>
  expressAsyncHandler(async (req, res) => {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 12);
    }
    if (req.body.passwordDB) {
      req.body.passwordDB = await bcrypt.hash(req.body.passwordDB, 12);
    }
    const createDoc = await Model.create(req.body);
    res.status(201).json({ data: createDoc });
  });
exports.getAll = (Model, keyword) =>
  expressAsyncHandler(async (req, res) => {
    let fillter = {};
    if (req.filterObject) {
      fillter = req.filterObject;
    }

    const countDocs = await Model.countDocuments();
    const ApiFeatures = new FeatureApi(Model.find(fillter), req.query)
      .Fillter(Model)
      .Sort()
      .Fields()
      .Search(keyword)
      .Paginate(countDocs);
    const { MongooseQueryApi, PaginateResult } = ApiFeatures;
    const getDoc = await MongooseQueryApi;

    res
      .status(201)
      .json({ results: getDoc.length, PaginateResult, data: getDoc });
  });

exports.getOne = (Model, populateOpt) =>
  expressAsyncHandler(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOpt) {
      query = query.populate(populateOpt);
    }
    const getDocById = await query;
    if (!getDocById)
      next(
        new ApiError(`Sorry Can't get This ID From ID :${req.params.id}`, 404)
      );
    res.status(200).json({ data: getDocById });
  });
exports.getOneCourse = (Model, populateOpt) =>
  expressAsyncHandler(async (req, res, next) => {
    try {
      let query = await Model.findOneAndUpdate(
        { user: req.user._id },
        {
          $pull: {
            couresItems: {
              $or: [{ seen: 0 }, { expires: { $lt: Date.now() } }],
            },
          },
        },
        { new: true }
      ).exec();

      if (!query) {
        return res.status(404).json({ msg: "لايوجد محاضرات متاحة لك" });
      }
      let updatedCourse = await query;

      updatedCourse = await Model.findById(updatedCourse._id);

      if (!updatedCourse) {
        return res.status(404).json({ msg: "المحاضرة غير موجودة" });
      }

      res.status(200).json({
        status: "success",
        totalCoursses: updatedCourse.couresItems.length,
        data: updatedCourse.couresItems,
      });
    } catch (error) {
      res.status(401).json({
        status: "Error",
        msg: "حدث خطأ ما",
      });
    }
  });

exports.updateOne = (Model, filePath) =>
  expressAsyncHandler(async (req, res, next) => {
    try {
      const baseUrl = `${process.env.BASE_URL}/${filePath}/`;

      // العثور على المستند بناءً على ID
      const findDocument = await Model.findById(req.params.id);

      if (!findDocument) {
        return next(
          new ApiError(
            `Sorry, can't find the document with ID: ${req.params.id}`,
            404
          )
        );
      }

      // قائمة بالمفاتيح التي قد تحتوي على مسارات الصور
      const imageKeys = ["image", "avater", "picture", "pdf"];

      // تحقق من كل مفتاح في req.body وقم بحذف الصورة القديمة إذا لزم الأمر
      for (const key of imageKeys) {
        if (req.body[key] !== undefined) {
          // تحقق إذا كان الحقل موجودًا في req.body
          if (findDocument[key] && findDocument[key] !== req.body[key]) {
            const relativePathImage = findDocument[key].split(baseUrl)[1];
            filePathImage(filePath, relativePathImage); // حذف الصورة القديمة
          }
        }
      }

      // تحديث الحقول التي تحتوي على قيم جديدة فقط
      const updateData = req.body;
      for (const key of imageKeys) {
        if (req.body[key] !== undefined) {
          updateData[key] = req.body[key];
        }
      }
      // تحديث المستند بناءً على ID
      const updateDocById = await Model.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!updateDocById) {
        return next(
          new ApiError(
            `Sorry, can't update the document with ID: ${req.params.id}`,
            404
          )
        );
      }

      res.status(200).json({ data: updateDocById });
    } catch (error) {
      next(error);
    }
  });
exports.deleteOne = (Model, filePath) =>
  expressAsyncHandler(async (req, res, next) => {
    try {
      const baseUrl = `${process.env.BASE_URL}/${filePath}/`;

      // العثور على المستند بناءً على ID
      const findDocument = await Model.findById(req.params.id);

      if (!findDocument) {
        return next(
          new ApiError(
            `Sorry, can't find the document with ID: ${req.params.id}`,
            404
          )
        );
      }

      // حذف المستند
      await Model.findOneAndDelete({ _id: req.params.id });

      // قائمة بالمفاتيح التي قد تحتوي على مسارات الصور
      const imageKeys = ["image", "avater", "picture", "pdf"];
      for (const key of imageKeys) {
        if (findDocument[key]) {
          const relativePathImage = findDocument[key].split(baseUrl)[1];
          filePathImage(filePath, relativePathImage); // حذف الصورة القديمة
        }
      }

      res.status(200).json({ status: "Delete Is Success" });
    } catch (error) {
      next(error);
    }
  });
exports.limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  limit: 10, // الحد الأقصى للطلبات
  standardHeaders: true, // استخدام رؤوس HTTP القياسية
  legacyHeaders: false, // تعطيل الرؤوس القديمة
  message:
    "Too many requests For This IPAddress, Please Try Again After 15 minutes",
});
