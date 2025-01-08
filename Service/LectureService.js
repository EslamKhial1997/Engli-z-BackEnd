const factory = require("./FactoryHandler");
const createLecturesModel = require("../Modules/createAlecture");
const expressAsyncHandler = require("express-async-handler");
const createUsersModel = require("../Modules/createUsers");
const createNotificationsModel = require("../Modules/createNotifiction");
const ApiError = require("../Resuble/ApiErrors");
const FeatureApi = require("../Utils/Feature");
const createPackageModel = require("../Modules/createPackage");
const { default: axios } = require("axios");
const { filePathImage } = require("../Utils/imagesHandler");

exports.resizeImage = expressAsyncHandler(async (req, res, next) => {
  if (req.file) {
    req.body.pdf = req.file.filename;
  }

  next();
});

exports.createLectures = expressAsyncHandler(async (req, res, next) => {
  try {
    // تعيين معرف المدرس
    req.body.teacher =
      req.user.role === "teacher" ? req.user._id : req.user.teacher._id;

    // التحقق من حدود التخزين وحركة المرور
    const package = await createPackageModel.findOne({});
    if (
      package.usedStorage >= package.pricing.upload ||
      package.usedTraffic >= package.pricing.traffic
    ) {
      return next(
        new ApiError(
          "تم الوصول للحد الأقصى من المساحة المتاحة للمحاضرات. للمزيد من التفاصيل يرجى التواصل مع الدعم الفني.",
          404
        )
      );
    }

    // إنشاء الفيديو على BunnyCDN
    const response = await axios.post(
      `https://video.bunnycdn.com/library/${package.libraryID}/videos`,
      { title: req.body.lecture },
      {
        headers: {
          "Content-Type": "application/json",
          AccessKey: package.apiKey,
        },
      }
    );

    // تعيين GUID من استجابة BunnyCDN
    req.body.guid = response.data.guid;

    // إنشاء المحاضرة في قاعدة البيانات
    const newLecture = new createLecturesModel({
      ...req.body,
    });

    // حفظ المحاضرة
    await newLecture.save();

    // جلب القسم المرتبط بالمحاضرة مع البيانات المعبأة
    const populatedLecture = await newLecture.populate({
      path: "section",  // حقل "section" في المحاضرة
      select: "name description",  // تحديد الحقول التي نريد تعبئتها
    });

    // العثور على المستخدمين المرتبطين بالصف
    const users = await createUsersModel.find({
      grade: populatedLecture.section.class.grade,
    });

    // إنشاء الإشعارات لجميع المستخدمين
    await Promise.all(
      users.map(async (user) => {
        const newNotification = new createNotificationsModel({
          user: user._id,
          type: "new-lecture",
          data: {
            newLecture: {
              lecture: populatedLecture._id,
              section: populatedLecture.section._id,
            },
          },
          msg: "تم إضافة محاضرة جديدة.",
        });

        return newNotification.save();
      })
    );

    // إعادة المحاضرة المعبأة في الاستجابة
    res.status(201).json({ status: "Success", data: populatedLecture });
  } catch (error) {
    // معالجة الأخطاء
    console.error(error);
    next(
      new ApiError("حدث خطأ أثناء إنشاء المحاضرة. يرجى المحاولة لاحقًا.", 500)
    );
  }
});


exports.getLectures = expressAsyncHandler(async (req, res) => {
  try {
    let filter = {};
    if (req.filterObject) {
      filter = req.filterObject;
    }

    const countDocs = await createLecturesModel.countDocuments(filter);
    const ApiFeatures = new FeatureApi(
      createLecturesModel.find(filter),
      req.query
    )
      .Fillter(createLecturesModel)
      .Sort()
      .Fields()
      .Search()
      .Paginate(countDocs);

    const { MongooseQueryApi, PaginateResult } = ApiFeatures;
    const getDoc = await MongooseQueryApi.lean(); // استخدام lean لتحسين الأداء

    // تعديل الحقل pdf ليكون true أو false فقط
    const updatedDocs = getDoc.map((doc) => ({
      ...doc,
      pdf: !!doc.pdf, // تحويل الحقل pdf إلى قيمة منطقية
    }));

    res.status(201).json({
      results: updatedDocs.length,
      PaginateResult,
      data: updatedDocs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "حدث خطأ أثناء جلب المحاضرات" });
  }
});

exports.getLecture = expressAsyncHandler(async (req, res, next) => {
  try {
    // البحث عن بيانات المحاضرة
    const lectureQuery = await createLecturesModel.findById(req.params.id);
    if (!lectureQuery) {
      return next(
        new ApiError(`لايوجد محاضرة لهذا المعرف : ${req.params.id}`, 404)
      );
    }

    // جلب بيانات الحزمة
    const package = await createPackageModel.findOne();
    if (!package) {
      return next(new ApiError(`لايوجد بيانات للحزمة`, 500));
    }

    let bunnyData = {
      views: 0,
      storageSize: "0 MB",
      averageWatchTime: "0 دقيقة",
      totalWatchTime: "0 دقيقة",
      thumbnailUrl: "لايوجد",
    };

    try {
      const response = await axios.get(
        `https://video.bunnycdn.com/library/${package.libraryID}/videos/${lectureQuery.guid}/play`,
        {
          headers: {
            accept: "application/json",
            AccessKey: package.apiKey,
          },
        }
      );
      bunnyData = {
        views: response.data.video.views || 0,
        storageSize:
          ((response.data.video.storageSize || 0) / (1000 * 1000)).toFixed(1) +
          " MB",
        averageWatchTime:
          ((response.data.video.averageWatchTime || 0) / 60).toFixed(1) +
          " دقيقة",
        totalWatchTime:
          ((response.data.video.totalWatchTime || 0) / 60).toFixed(1) +
          " دقيقة",
        thumbnailUrl: response.data.thumbnailUrl || "لايوجد",
      };
    } catch (error) {
      console.error(`Error fetching BunnyCDN data: ${error.message}`);
    }

    // إرجاع البيانات النهائية
    res.status(200).json({
      data: lectureQuery,
      bunny: bunnyData,
    });
  } catch (error) {
    next(new ApiError(`خطأ أثناء معالجة الطلب: ${error.message}`, 500));
  }
});

exports.updateLecture = factory.updateOne(createLecturesModel, "lecture");
exports.deleteLecture = expressAsyncHandler(async (req, res, next) => {
  try {
    const baseUrl = `${process.env.BASE_URL}/lecture/`;
    const package = await createPackageModel.findOne();
    // العثور على المستند بناءً على ID
    const findDocument = await createLecturesModel.findById(req.params.id);

    if (!findDocument) {
      return next(
        new ApiError(
          `Sorry, can't find the document with ID: ${req.params.id}`,
          404
        )
      );
    }

    // حذف المستند من قاعدة البيانات
    await createLecturesModel.findByIdAndDelete(req.params.id);

    // حذف ملف PDF إذا كان موجوداً
    if (findDocument.pdf) {
      const relativePathImage = findDocument.pdf.split(baseUrl)[1];
      filePathImage("lecture", relativePathImage); // حذف الملف القديم
    }
    if (findDocument && findDocument.guid) {
      try {
        await axios.delete(
          `https://video.bunnycdn.com/library/${package.libraryID}/videos/${findDocument.guid}`,
          {
            headers: {
              accept: "application/json",
              AccessKey: package.apiKey,
            },
          }
        );
      } catch (error) {
        return next(new ApiError("خطأ في سيرفر الفيديوهات أثناء الحذف", 500));
      }
    }

    res.status(200).json({ status: " Success", msg: "تم حذف المحاضرة بنجاح" });
  } catch (error) {
    next(error);
  }
});
exports.deleteVideo = expressAsyncHandler(async (req, res, next) => {
  const findDocument = await createLecturesModel.findById(req.params.id);
  const package = await createPackageModel.findOne();
  try {
    await axios.delete(
      `https://video.bunnycdn.com/library/${package.libraryID}/videos/${findDocument.guid}`,
      {
        headers: {
          accept: "application/json",
          AccessKey: package.apiKey,
        },
      }
    );
    res.status(200).json({ status: " Success", msg: "تم حذف الفيديو بنجاح" });
  } catch (error) {
    return next(new ApiError("خطأ في سيرفر الفيديوهات أثناء الحذف", 500));
  }
});
