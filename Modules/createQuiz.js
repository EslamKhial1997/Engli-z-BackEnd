const mongoose = require("mongoose");

// نموذج السؤال
const questionSchema = new mongoose.Schema({
  text: String, // نص السؤال
  options: [String], // الخيارات
  correctAnswer: Number, // الإجابة الصحيحة
  image: String,
  correctText: String,
  answers: [], // نوع السؤال
});

const quizSchema = new mongoose.Schema({
  timer: Number,
  active: {
    type: Boolean,
    default: false,
  },
  time: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "Users",
      },
      startTime: Date,
    },
  ],
  title: String, // عنوان الاختبار
  questions: [questionSchema], // قائمة الأسئلة

  lecture: {
    type: mongoose.Schema.ObjectId,
    ref: "Lectures",
  },
  results: [],
});

quizSchema.pre(/^find/, function (next) {
  this.populate({
    path: "questions",
  });
  next();
});

const ImageURL = (doc) => {
  if (doc.image && !doc.image.includes(`${process.env.BASE_URL}/quiz`)) {
    doc.image = `${process.env.BASE_URL}/quiz/${doc.image}`;
  }
};
questionSchema.post("init", (doc) => {
  ImageURL(doc);
});
questionSchema.post("save", (doc) => {
  ImageURL(doc);
});
const createQuizModel = mongoose.model("Quiz", quizSchema);

// تصدير النماذج
module.exports = createQuizModel;
