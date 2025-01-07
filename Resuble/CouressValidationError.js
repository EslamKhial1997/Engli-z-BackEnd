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
    .optional()
    .custom(async (val, { req }) => {
      const lectureModel = await createLecturesModel.findOne({
        _id: req.body.lacture,
      });
      if (!lectureModel) {
        return Promise.reject(new Error(`المحاضرة غير موجودة`));
      }
    }),
  check("coupon")
    .optional()
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

  // التحقق من الباب (القسم) إن وجد
  // check("section")
  //   .optional()
  //   .custom(async (val, { req }) => {
  //     const sectionModel = await createSectionModel.findOne({
  //       _id: req.body.section,
  //     });
  //     if (!sectionModel) {
  //       return Promise.reject(new Error(`الباب غير موجود`));
  //     }

  //     // التحقق مما إذا كان الكوبون ينتمي لهذا القسم

  //     if (req.couponModel && !req.couponModel.section) {
  //       if (
  //         !req.couponModel.section ||
  //         (req.couponModel.section &&
  //           req.couponModel.section._id.toString() !== req.body.section &&
  //           val !== req.body.section)
  //       ) {
  //         return Promise.reject(
  //           new Error(`الكوبون ${req.body.coupon} لا ينتمي لهذا الباب`)
  //         );
  //       }
  //     }
  //     const teacher = await createTeachersModel.findOne();

  //     if (teacher.active === false) {
  //       throw new Error("Teacher not found");
  //     }

  //     // يمكنك إضافة شروط إضافية هنا إذا لزم الأمر
  //     console.log("Teacher info:", teacher);
  //     return true;
  //   }),

  MiddlewareValidator, // استدعاء المدقق الوسيط للتحقق من الأخطاء
];
