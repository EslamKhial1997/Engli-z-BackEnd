const { check, param } = require("express-validator");
const { default: slugify } = require("slugify");
const {
  MiddlewareValidator,
} = require("../Middleware/MiddlewareValidatorError");

const createSectionModel = require("../Modules/createSection");
const createTeachersModel = require("../Modules/createTeacher");
const createLecturesModel = require("../Modules/createAlecture");

exports.createLectureValidator = [
  check("price").notEmpty().withMessage("سعر المحاضرة مطلوب"),
  check("lecture")
    .notEmpty()
    .withMessage("اسم المحاضرة مطلوب")
    .custom((val, { req }) => {
      req.body.slug = slugify(val); // إنشاء slug من اسم المحاضرة
      return true;
    }),

  check("section")
    .notEmpty()
    .withMessage("معرف الفصل مطلوب")
    .custom((val) =>
      createSectionModel.findOne({ _id: val }).then((section) => {
        if (!section) {
          return Promise.reject(new Error("لم يتم العثور علي الفصل"));
        }
      })
    ),

  check("lecture")
    .notEmpty()
    .withMessage("اسم المحاضرة مطلوب")
    .custom(async (val, { req }) => {
      const teacher = await createTeachersModel.findById(req.user._id);

      if (teacher.active === false) {
        throw new Error("ليس لديك صلاحيه انشاء محاضرة");
      }
      return true;
    }),

  check("lecture")
    .notEmpty()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    })
    .withMessage("اسم المحاضرة مطلوب"),
  check("section")
    .notEmpty()
    .withMessage("معرف الفصل غير موجود")
    .custom((val) =>
      createSectionModel.findOne({ _id: val }).then((section) => {
        if (!section) {
          return Promise.reject(new Error("لم يتم العثور علي الفصل"));
        }
      })
    ),
  MiddlewareValidator,
];

