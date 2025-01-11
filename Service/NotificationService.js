const expressAsyncHandler = require("express-async-handler");
const createNotificationsModel = require("../Modules/createNotifiction");
const factory = require("./FactoryHandler");
const FeatureApi = require("../Utils/Feature");

exports.getMyNotifications = expressAsyncHandler(async (req, res, next) => {
  // بداية الفلتر بفلتر المستخدم إن وجد
  let filter = req.filterObject || {};

  // تحديد فلتر بناءً على الدور
  if (req.user.role === "user") {
    filter = {
      ...filter,
      user: req.user.id, // إضافة شرط المستخدم
      type: { $ne: "signup" }, // استبعاد الإشعارات من نوع "signup"
    };
  } else {
    filter = {
      ...filter,
      type: "signup", // إشعارات التسجيل للمسؤول فقط
    };
  }

  try {
    // حساب عدد الوثائق المطابقة للفلتر
    const countDocs = await createNotificationsModel.countDocuments(filter);
 
    // إذا كانت هناك وثائق، نقوم بعمل استعلام
    const ApiFeatures = new FeatureApi(createNotificationsModel.find(filter), req.query)
      .Fillter(createNotificationsModel)
      .Sort(req.query.sort="-createdAt")
      .Fields()
      .Search() // إذا كانت هناك كلمة بحث
      .Paginate(countDocs);

    const { MongooseQueryApi, PaginateResult } = ApiFeatures;
    const getDoc = await MongooseQueryApi;

    if (getDoc.length === 0) {
      return res.status(404).json({ message: "لا توجد إشعارات" });
    }

    res.status(200).json({
      message: "تم جلب الإشعارات بنجاح",
      total: countDocs,
      results: PaginateResult,
      data: getDoc,
    });
  } catch (error) {
    next(error); // إرجاع أي خطأ يحدث أثناء الاستعلام
  }
});


exports.deleteNotification = factory.deleteOne(createNotificationsModel);
