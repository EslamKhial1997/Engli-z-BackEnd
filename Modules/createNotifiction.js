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
      enum: ["signup", "section"],
      required: true,
    },
    msg: String,

    studentSignup: {
      studentName: String,
      studentEmail: String,
      studentPhone: String,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    },
  },
  { timestamps: true }
);
createNotifications.pre(/^find/, function (next) {
  this.populate({
    path: "section",
  });
  next();
});
const createNotificationsModel = mongoose.model(
  "Notifications",
  createNotifications
);
module.exports = createNotificationsModel;
