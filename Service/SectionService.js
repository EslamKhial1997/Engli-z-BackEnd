const factory = require("./FactoryHandler");
const createSectionModel = require("../Modules/createSection");
const expressAsyncHandler = require("express-async-handler");
const createUsersModel = require("../Modules/createUsers");
const createNotificationsModel = require("../Modules/createNotifiction");
const FeatureApi = require("../Utils/Feature");
const createLecturesModel = require("../Modules/createAlecture");
exports.createSections = expressAsyncHandler(async (req, res) => {
  req.body.teacher =
    req.user.role === "teacher" ? req.user._id : req.user.teacher._id;
  const users = await createUsersModel.find({ grade: req.body.class });

  const newSection = new createSectionModel({
    ...req.body,
  });
  await Promise.all(
    users.map(async (user) => {
      const newNotification = new createNotificationsModel({
        user: user._id,
        type: "section",
        section: newSection._id,
        msg: "تم اضافة فصل جديد",
      });

      return newNotification.save();
    })
  );

  await newSection.save();
  const populatedSection = await newSection.populate({
    path: "class",
    select: "name",
  });

  res.status(201).json({ msg: "تم اضافة فصل جديد", data: populatedSection });
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
    .Sort((req.query.sort = "-createdAt"))
    .Fields()
    .Search()
    .Paginate(countDocs);

  const { MongooseQueryApi, PaginateResult } = ApiFeatures;
  const sections = await MongooseQueryApi.lean();
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
