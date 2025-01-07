const { check } = require("express-validator");
const {
  MiddlewareValidator,
} = require("../Middleware/MiddlewareValidatorError");

exports.createCouponValidator = [
  check("count").notEmpty().withMessage("عدد الكوبونات مطلوبة"),
  check("seen").notEmpty().withMessage("عدد المشاهدات مطلوبة"),
  check("expires").notEmpty().withMessage("الصلاحية مطلوبة"),
  check("lecture")
    .isMongoId()
    .optional()
    .withMessage("معرف المحاضرة غير موجود"),
  MiddlewareValidator,
];
