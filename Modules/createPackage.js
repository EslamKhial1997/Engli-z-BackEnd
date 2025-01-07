const mongoose = require("mongoose");

const createPackage = new mongoose.Schema(
  {
    pricing: {
      type: mongoose.Schema.ObjectId,
      ref: "Pricing",
      require: [true, "معرف الخطة مطلوب"],
    },
    libraryID: { type: Number, required: [true, "معرف المكتبة مطلوب"] },
    apiKey: { type: String, required: [true, "رقم المعرف مطلوب"] },
    token: { type: String, required: [true, "رقم المعرف مطلوب"] },
    usedStorage: { type: Number, default: 0 },
    usedTraffic: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
createPackage.pre(/^find/, function (next) {
  this.populate({
    path: "pricing",
  });
  next();
});
const createPackageModel = mongoose.model("Package", createPackage);
module.exports = createPackageModel;
