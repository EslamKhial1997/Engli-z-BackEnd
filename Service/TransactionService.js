const expressAsyncHandler = require("express-async-handler");
const createTransactionModel = require("../Modules/createtransaction");
const FeatureApi = require("../Utils/Feature");
const moment = require("moment");
const createUsersModel = require("../Modules/createUsers");
const createLecturesModel = require("../Modules/createAlecture");
const createSectionModel = require("../Modules/createSection");
const createCouponsModel = require("../Modules/createCoupon");
const { default: axios } = require("axios");
const createCouresModel = require("../Modules/createCouress");
const createPackageModel = require("../Modules/createPackage");
const XOAuth2 = require("nodemailer/lib/xoauth2");
const createTotalsModel = require("../Modules/createTotals");

// Allowed To User
exports.getMyTransactions = expressAsyncHandler(async (req, res) => {
  try {
    // تحديد التصفية الأساسية بناءً على دور المستخدم
    let filter =
      req.user.role === "user"
        ? { user: req.user._id }
        : { user: req.body.user };
    if (req.filterObject) {
      filter = req.filterObject; // إذا كانت هناك تصفية مخصصة، يتم استبدال التصفية
    }
    let path = "تم استخدام الكوبون";
    // تطبيق التصفية باستخدام API Features
    const ApiFeatures = new FeatureApi(
      createTransactionModel.find({ ...filter, ...req.query })
    ).Fillter(createTransactionModel);

    const { MongooseQueryApi, PaginateResult } = ApiFeatures;
    let transactions = await MongooseQueryApi;

    // التحقق من كود القسيمة إذا لم توجد معاملات
    if (req.query["coupon.code"] && transactions.length < 1) {
      transactions = await createCouponsModel.find({
        code: req.query["coupon.code"],
      });
      path = "الكوبون موجود ولم يستخدم";
    }
    res.status(200).json({
      status: "success",
      path: transactions.length < 1 ? "لم يتم انشاء كوبون بهذا الكود" : path,
      results: transactions.length,
      PaginateResult: transactions.length > 0 ? PaginateResult : null,
      data: transactions,
    });
  } catch (error) {
    // التعامل مع الأخطاء
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Allowed To Teacher
exports.getTotalTransactions = expressAsyncHandler(async (req, res, next) => {
  try {
    const package = await createPackageModel.findOne();
    // جلب بيانات BunnyCDN باستخدام axios بشكل صحيح
    const bunny = await axios
      .get(`https://api.bunny.net/videolibrary/${package.libraryID}`, {
        headers: {
          accept: "application/json",
          AccessKey: package.token,
        },
      })
      .then((response) => response.data)
      .catch(() => null);

    // استخدام await لجلب العدد الصحيح للـ users
    const usersActive = await createUsersModel.countDocuments({
      active: "active",
      role: "user",
    });
    const usersinActive = await createUsersModel.countDocuments({
      active: "inactive",
      role: "user",
    });
    const usersBlocked = await createUsersModel.countDocuments({
      active: "block",
      role: "user",
    });
    const coupons = await createCouponsModel.countDocuments({});
    const totalCouresUsers = await createCouresModel.countDocuments({});

    // تجميع عدد العناصر في couresItems
    const couress = await createCouresModel.aggregate([
      {
        $project: {
          couresItemsCount: { $size: "$couresItems" }, // استخدام $size لحساب عدد العناصر
        },
      },
    ]);
    const totalCouresItems = couress.reduce(
      (acc, item) => acc + item.couresItemsCount,
      0
    );

    // جلب العدد الإجمالي للمعاملات
    const couponSold = await createTransactionModel.countDocuments({});
    const totalCouponPrinted = await createTotalsModel.findOne({});
    const lecture = await createLecturesModel.countDocuments({});
    const section = await createSectionModel.countDocuments({});

    // تحديد بداية اليوم، الأسبوع، الشهر والسنة
    const today = new Date();
    today.setHours(0, 0, 0, 0); // بداية اليوم (الساعة 00:00:00)

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // بداية الأسبوع (الأحد)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // بداية الشهر
    const startOfYear = new Date(today.getFullYear(), 0, 1); // بداية السنة

    // استخدام aggregate لجلب تاريخ المعاملات
    const saleHistory = await createTransactionModel.aggregate([
      {
        $lookup: {
          from: "lectures",
          localField: "lecture",
          foreignField: "_id",
          as: "lectureDetails",
        },
      },
      {
        $addFields: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          week: { $week: "$createdAt" },
          day: { $dayOfYear: "$createdAt" },
          priceNumeric: {
            $toDouble: { $arrayElemAt: ["$lectureDetails.price", 0] },
          },
        },
      },
      {
        $facet: {
          day: [
            {
              $match: { createdAt: { $gte: today } },
            },
            {
              $group: {
                _id: null,
                totalDaySold: { $sum: "$priceNumeric" },
              },
            },
          ],
          week: [
            {
              $match: { createdAt: { $gte: startOfWeek } },
            },
            {
              $group: {
                _id: null,
                totalWeekSold: { $sum: "$priceNumeric" },
              },
            },
          ],
          month: [
            {
              $match: { createdAt: { $gte: startOfMonth } },
            },
            {
              $group: {
                _id: null,
                totalMonthSold: { $sum: "$priceNumeric" },
              },
            },
          ],
          year: [
            {
              $match: { createdAt: { $gte: startOfYear } },
            },
            {
              $group: {
                _id: null,
                totalYearSold: { $sum: "$priceNumeric" },
              },
            },
          ],
        },
      },
    ]);

    const totalSalesHistory = {
      day:
        saleHistory[0]?.day?.length > 0
          ? saleHistory[0].day[0].totalDaySold
          : 0,
      week:
        saleHistory[0]?.week?.length > 0
          ? saleHistory[0].week[0].totalWeekSold
          : 0,
      month:
        saleHistory[0]?.month?.length > 0
          ? saleHistory[0].month[0].totalMonthSold
          : 0,
      year:
        saleHistory[0]?.year?.length > 0
          ? saleHistory[0].year[0].totalYearSold
          : 0,
    };

    // تحديث معلومات الحزم في قاعدة البيانات
    if (bunny) {
      await createPackageModel.findByIdAndUpdate(
        package._id,
        {
          $set: {
            usedStorage: (bunny.StorageUsage / (1000 * 1000)).toFixed(1),
            usedTraffic: (bunny.TrafficUsage / (1000 * 1000)).toFixed(1),
          },
        },
        { new: true }
      );
    }

    return res.status(200).json({
      status: "success",
      users: {
        usersActive,
        usersinActive,
        usersBlocked,
        totalUsers: usersActive + usersinActive + usersBlocked,
      },
      lecture,
      section,
      coupons: {
        coupons,
        couponSold,
        couponExpires: totalCouponPrinted.totalCouponsPrinted - couponSold,
        totalCouponPrinted: totalCouponPrinted.totalCouponsPrinted,
      },
      bunny: {
        totalvideos: bunny?.VideoCount || 0,
        StorageUsage: bunny
          ? (bunny.StorageUsage / (1000 * 1000)).toFixed(1) + " MB"
          : "0 MB",
        TrafficUsage: bunny
          ? (bunny.TrafficUsage / (1000 * 1000)).toFixed(1) + " MB"
          : "0 MB",
      },
      couresItems: {
        totalCouresItems,
        totalCouresUsers,
      },
      totalSalesHistory,
    });
  } catch (error) {
    next(error);
  }
});

// Allowed To Teacher
exports.getTotalSalesTransactions = expressAsyncHandler(
  async (req, res, next) => {
    try {
      // استعلام لجلب جميع المعاملات مع تفاصيل المحاضرات
      const transactions = await createTransactionModel.find({});

      // تصنيف المعاملات حسب الشهر وجمع الأسعار
      const groupedByMonth = transactions.reduce((result, transaction) => {
        // استخراج اسم الشهر من createdAt
        const month = new Date(transaction.createdAt).toLocaleString(
          "default",
          {
            month: "long",
          }
        );

        // التأكد من وجود الشهر في الكائن
        if (!result[month]) {
          result[month] = { totalAmount: 0 };
        }

        // إضافة المعاملة إلى الشهر المحدد

        // جمع السعر النهائي من المحاضرة
        const price = transaction?.lecture.price || 0; // استخدم price من المحاضرة إذا كان موجودًا
        result[month].totalAmount += price;

        return result;
      }, {});

      // إرجاع الرد
      res.status(200).json({
        status: "success",
        data: groupedByMonth,
      });
    } catch (error) {
      next(error);
    }
  }
);
