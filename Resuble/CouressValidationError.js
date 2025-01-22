const { check } = require("express-validator");
const {
  MiddlewareValidator,
} = require("../Middleware/MiddlewareValidatorError");

const createSectionModel = require("../Modules/createSection");
const createCouponsModel = require("../Modules/createCoupon");
const createLecturesModel = require("../Modules/createAlecture");
const createTeachersModel = require("../Modules/createTeacher");

exports.createCourseValidator = [
  // التحقق من المحاضرة إن وجدت
  check("lacture")
    .notEmpty()
    .custom(async (val, { req }) => {
      const lectureModel = await createLecturesModel.findOne({
        _id: req.body.lacture,
      });
      if (!lectureModel) {
        return Promise.reject(new Error(`المحاضرة غير موجودة`));
      }
    }),
  check("coupon")
    .notEmpty().withMessage("الكوبون مطلوب")
    .custom(async (val, { req }) => {
      const coupon = await createCouponsModel.findOneAndUpdate(
        {
          code: req.body.coupon,
          expires: { $gt: Date.now() },
          lecture: req.body.lacture,
        },
        { $set: { locked: true } }
      );
      if (!coupon) {
        return Promise.reject(
          new Error(
            `الكوبون ${req.body.coupon} منتهي الصلاحية او لاينتمي لهذه المحاضره`
          )
        );
      }
    }),


  MiddlewareValidator, 
];
