const factory = require("./FactoryHandler");
const createSectionModel = require("../Modules/createSection");
const expressAsyncHandler = require("express-async-handler");
const createUsersModel = require("../Modules/createUsers");
const createClassModel = require("../Modules/createClasses");
const createNotificationsModel = require("../Modules/createNotifiction");
const FeatureApi = require("../Utils/Feature");
const createLecturesModel = require("../Modules/createAlecture");
exports.createSections = expressAsyncHandler(async (req, res) => {
  // تعيين teacher بناءً على دور المستخدم
  req.body.teacher =
    req.user.role === "teacher" ? req.user._id : req.user.teacher._id;

  const classGrade = await createClassModel.findOne({ _id: req.body.class });
  const users = await createUsersModel.find({ grade: classGrade.grade });

  // إنشاء كلاس جديد باستخدام البيانات المرسلة
  const newSection = new createSectionModel({
    ...req.body, // استخدام req.body بشكل صحيح لتمرير البيانات
  });
  await Promise.all(
    users.map(async (user) => {
      const newNotification = new createNotificationsModel({
        user: user._id, // تمرير معرف المستخدم
        type: "new-section",

        newSection: {
          section: newSection._id,
        },

        msg: "تم اضافة فصل جديد",
      });

      // حفظ الإشعار في قاعدة البيانات
      return newNotification.save();
    })
  );
  // حفظ الكلاس الجديد في قاعدة البيانات
  await newSection.save();

  // إرسال استجابة عند نجاح العملية
  res.status(201).json({ msg: "تم اضافة فصل جديد", data: newSection });
});
exports.getSections = expressAsyncHandler(async (req, res) => {
  let filter = {};
  if (req.filterObject) {
    filter = req.filterObject;
  }

  // حساب إجمالي عدد الأقسام
  const countDocs = await createSectionModel.countDocuments();

  // إعداد ميزات الاستعلام
  const ApiFeatures = new FeatureApi(createSectionModel.find(filter), req.query)
    .Fillter(createSectionModel)
    .Sort()
    .Fields()
    .Search()
    .Paginate(countDocs);

  const { MongooseQueryApi, PaginateResult } = ApiFeatures;

  // جلب الأقسام
  const sections = await MongooseQueryApi.lean();

  // إلحاق المحاضرات بكل قسم
  const sectionsWithLectures = await Promise.all(
    sections.map(async (ele) => {
      const lectures = await createLecturesModel
        .find({ section: ele._id })
        .lean();
      const pdf = lectures.map((lecture) => lecture.pdf).length;
      const quiz = lectures.map((lecture) => lecture.quiz).length;
      const video = lectures.map((lecture) => lecture.bunny).length;

      return {
        ...ele,
        lecture: {
          results: lectures.length,
          pdf,
          quiz,
          video,
        },
      };
    })
  );

  res.status(201).json({
    results: sectionsWithLectures.length,
    PaginateResult,
    data: sectionsWithLectures,
  });
});

exports.getSection = expressAsyncHandler(async (req, res, next) => {
  let section = await createSectionModel.findById(req.params.id);

  if (!section)
    next(
      new ApiError(`Sorry Can't get This ID From ID :${req.params.id}`, 404)
    );
  const lectures = await createLecturesModel.find({ section: section._id });
  const pdf = lectures.map((lecture) => lecture.pdf).length;
  const quiz = lectures.map((lecture) => lecture.quiz).length;
  const video = lectures.map((lecture) => lecture.bunny).length;
  res.status(200).json({
    data: section,
    lecture: {
      results: lectures.length,
      pdf,
      quiz,
      video,
    },
  });
});
exports.updateSection = factory.updateOne(createSectionModel, "section");
exports.deleteSection = factory.deleteOne(createSectionModel, "section");
