const factory = require("./FactoryHandler");
const expressAsyncHandler = require("express-async-handler");
const ApiError = require("../Resuble/ApiErrors");
const createCouponsModel = require("../Modules/createCoupon");
const createTotalsModel = require("../Modules/createTotals");

exports.createCoupon = expressAsyncHandler(async (req, res) => {
  try {
    // التحقق من المدخلات الأساسية
    const { count, expires, lecture, seen } = req.body;

    if (!count || !expires) {
      return res.status(400).json({ msg: "العدد وتاريخ الانتهاء مطلوبان" });
    }

    if (!req.user || !req.user.name) {
      return res.status(401).json({ msg: "المستخدم غير مصرح له" });
    }

    const coupons = [];
    const expirationDate = new Date(
      new Date().getTime() + expires * 24 * 60 * 60 * 1000
    );

    // إنشاء الأكواد
    for (let i = 0; i < count; i++) {
      const code = Math.floor(
        1000000000 + Math.random() * 9000000000
      ).toString(); // توليد كود مكون من 10 أرقام
      coupons.push({
        code,
        expires: expirationDate,
        lecture,
        seen,
        createdBy: req.user.name,
      });
    }

    // إدخال الأكواد في قاعدة البيانات
    const insertedCoupons = await createCouponsModel.insertMany(coupons);

    // استخدام populate لجلب بيانات المحاضرة
    const populatedCoupons = await createCouponsModel
      .find({
        _id: { $in: insertedCoupons.map((coupon) => coupon._id) },
      })
      .populate("lecture");
    await createTotalsModel.create({
      totalCouponsPrinted: populatedCoupons.length,
    });
    res.status(201).json({ status: "Success", data: populatedCoupons });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "حدث خطأ أثناء إنشاء الأكواد" });
  }
});

exports.getCoupons = factory.getAll(createCouponsModel);

exports.checkCoupon = async (req, res, next) => {
  const promoCodeDocument = await createCouponsModel.findOne({
    code: { $regex: new RegExp(req.query.code, "i") },
  });
  //Check if the code is already valid
  if (promoCodeDocument.expires < Date.now()) {
    return next(new ApiError(400, "الكوبون منتهي الصلاحيه"));
  }
  res.status(200).json({
    msg: "تم التحقق بنجاح",
    data: promoCodeDocument,
  });
};

exports.getCoupon = factory.getOne(createCouponsModel);
// exports.updateCoupon = factory.updateOne(createCouponsModel);
// exports.deleteCoupon = factory.deleteOne(createCouponsModel);
