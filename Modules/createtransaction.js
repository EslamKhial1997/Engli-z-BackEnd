const mongoose = require("mongoose");

// تعريف مخطط العمليات
const createTransaction = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "Users",
      require: [true, "معرف الطالب مطلوب"],
    },
    lecture: {
      type: mongoose.Schema.ObjectId,
      ref: "Lectures",
      require: [true, "معرف المحاضرة مطلوب"],
    },
    coupon: {
      code: String,
      price: Number,
      createBy: String,
    },
  },
  { timestamps: true }
);

// إعداد middlewares للتعبئة المسبقة
createTransaction.pre(/^find/, function (next) {
  this.populate({
    path: "lecture",
    select: "-bunny -section -video -description -pdf -seen",
  }).populate({ path: "user", select: "firstName lastName phone , email" });
  next();
});

// إنشاء النموذج
const createTransactionModel = mongoose.model(
  "Transactions",
  createTransaction
);

module.exports = createTransactionModel;
