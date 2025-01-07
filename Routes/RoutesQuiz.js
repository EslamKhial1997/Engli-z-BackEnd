const { Router } = require("express");
const { protect, allowedTo } = require("../Service/AuthService");
const {
  createQuiz,
  createQuestion,
  userAnswerchoice,
  getQuizzes,
  getQuizAnswer,
  getQuestions,
  getQuestion,
  getMyQuiz,
  getQuizz,
  existQuiz,
  getMyQuizs,
  activeQuiz,
  updateQuiz,
  deleteQuiz,
  updateQuestion,
  deleteQuestion,
} = require("../Service/QuizService");

const {
  createQuizValidator,
  createQuestionValidator,
  QuizValidator,
} = require("../Resuble/QuizValidationError");

const { UtilsValidator } = require("../Resuble/UtilsValidationError");
const { uploadImage, resizeImage } = require("../Utils/imagesHandler");

const Routes = Router();
Routes.use(protect);

// إضافة كويز جديد
Routes.route("/add-quiz/:id").post(
  allowedTo("admin", "teacher", "manager", "user"),
  createQuizValidator,
  createQuiz
);

// إضافة سؤال جديد
Routes.route("/add-question/:id").post(
  allowedTo("admin", "teacher", "manager"),
  uploadImage,
  createQuestionValidator,
  resizeImage("quiz"),
  createQuestion
);

// جلب جميع الكويزات
Routes.route("/").get(
  allowedTo("admin", "teacher", "manager", "user"),
  getQuizzes
);

// جلب الكويزات الخاصة بالمستخدم
Routes.route("/myquiz").get(
  allowedTo("admin", "teacher", "manager", "user"),
  getMyQuizs
);

// جلب كويز معين خاص بالمستخدم
Routes.route("/myquiz/:id").get(
  allowedTo("admin", "teacher", "manager", "user"),
  getMyQuiz
);

// جلب كويز واحد، تحديثه، أو حذفه
Routes.route("/:id")
  .get(
    allowedTo("admin", "teacher", "manager", "user"),
    UtilsValidator,
    getQuizz
  )
  .put(allowedTo("admin", "teacher"), QuizValidator, updateQuiz)
  .delete(allowedTo("admin", "teacher"), QuizValidator, deleteQuiz);

// إرسال إجابة المستخدم
Routes.route("/user-answer/:id").post(
  allowedTo("user"),
  createQuestionValidator,
  userAnswerchoice
);

// جلب إجابات الكويز
Routes.route("/:id/answers").get(
  allowedTo("admin", "teacher"),
  UtilsValidator,
  getQuizAnswer
);

// جلب جميع الأسئلة لكويز معين
Routes.route("/questions/:id").get(UtilsValidator, getQuestions);

// جلب سؤال واحد
Routes.route("/question/:id/:question").get(UtilsValidator, getQuestion);

// تحديث أو حذف سؤال معين في كويز
Routes.route("/:id/questions/:questionId")
  .put(
    allowedTo("admin", "teacher"),
    uploadImage,
    QuizValidator,
    resizeImage("quiz"),
    updateQuestion
  )
  .delete(allowedTo("admin", "teacher"), QuizValidator, deleteQuestion);

// التحقق من وجود كويز
Routes.route("/exist/:id").post(allowedTo("user"), UtilsValidator, existQuiz);

// تفعيل كويز
Routes.route("/active/:id").put(allowedTo("user"), UtilsValidator, activeQuiz);

module.exports = Routes;
