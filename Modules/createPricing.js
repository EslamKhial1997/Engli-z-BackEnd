const { default: mongoose } = require("mongoose");

const createPricing = new mongoose.Schema(
  {
    title: {
      type: String,
      enum: ["Basic", "Standard", "Advanced", "Premium", "Elite"],
      default: "Basic",
    },
    price: { type: Number, required: [true, "السعر مطلوب"] },
    student: { type: Number, required: [true, "عدد الطلاب مطلوب"] },
    upload: { type: Number, required: [true, "سعه التحميل مطلوبه"] },
    traffic: { type: Number, required: [true, "سعه الزيارات مطلوبه"] },
    domain: {
      type: Boolean,
      default: false,
    },
    allowed: String,
    assistant: { type: Number, required: [true, "عدد المساعدين مطلوب"] },
  },
  { timestamps: true }
);
const createPricingModel = mongoose.model("Pricing", createPricing);
module.exports = createPricingModel;
