const mongoose = require("mongoose");

const createNotifications = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users", // ربط المستخدم بالإشعار
      require: [true, "معرف الطالب مطلوب"],
    },
    type: {
      type: String,
      enum: ["student-signup", "new-lecture", "new-section", "quiz-result"], // أنواع الإشعارات
      required: true,
    },
    msg: String,

    // بيانات الإشعار حسب النوع
    studentSignup: {
      studentName: String,
      studentEmail: String,
      studentPhone: String,
    },
    newLecture: {
      lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lectures",
      },
      section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    },
    newSection: {
      section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    },
  },
  { timestamps: true }
);
createNotifications.pre(/^find/, function (next) {
  this.populate({
    path: "newSection.section",
  });
  next();
});
const createNotificationsModel = mongoose.model(
  "Notifications",
  createNotifications
);
module.exports = createNotificationsModel;
