const { check } = require("express-validator");
const {
  MiddlewareValidator,
} = require("../Middleware/MiddlewareValidatorError");

const createLecturesModel = require("../Modules/createAlecture");
const createQuizModel = require("../Modules/createQuiz");

exports.createQuizValidator = [
  check("id")
  .notEmpty()
  .withMessage("يجب إدخال معرف المحاضرة")
  .custom(async (val) => {
    // Check if the lecture exists and if a quiz already exists for the lecture
    const lecture = await createLecturesModel.findOne({ _id: val });
    if (!lecture) {
      throw new Error("المحاضرة غير موجودة");
    }

    const existingQuiz = await createQuizModel.findOne({ lecture: val });
    if (existingQuiz) {
      throw new Error("لا يمكن إنشاء أكثر من اختبار في نفس المحاضرة");
    }
  }),
  check("timer") // التحقق مباشرة من الـ 'id'
    .notEmpty()
    .withMessage("يجب إدخال وقت الاختبار"), // رسالة خطأ أوضح,
  MiddlewareValidator,
];
exports.createQuestionValidator = [
  check("id") // التحقق مباشرة من الـ 'id'
    .notEmpty()
    .withMessage("يجب إدخال معرف الاختبار")
    .custom((val) =>
      createQuizModel
        .findOne({ _id: val }) // استخدم 'val' التي تمثل الـ ID
        .then((quiz) => {
          if (!quiz) {
            return Promise.reject(new Error("الاختبار غير موجود")); // إرجاع رفض إذا لم يتم العثور على المحاضرة
          }
        })
    ),
  MiddlewareValidator,
];

exports.QuizValidator = [
  check("id")
    .isMongoId()
    .withMessage("الـ ID المدخل غير صالح")
    .custom((val) =>
      createQuizModel
        .findOne({ _id: val }) // البحث عن الاختبار باستخدام الـ ID
        .then((quiz) => {
          if (!quiz) {
            return Promise.reject("الاختبار غير موجود"); // إرجاع رفض إذا لم يتم العثور على الاختبار
          }

          if (quiz.active) {
            return Promise.reject(
              "ليس لديك صلاحية التعديل أو الحذف بعد تنشيط الاختبار"
            );
          }
        })
    ),
  MiddlewareValidator,
];
