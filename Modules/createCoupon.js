const mongoose = require("mongoose");

const createCoupons = new mongoose.Schema(
  {
    code: Number,
    expires: {
      type: Date,
    },
    createdBy: String,
    seen: Number,
    lecture: {
      type: mongoose.Schema.ObjectId,
      ref: "Lectures",
    },
    locked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

createCoupons.pre(/^find/, function (next) {
  this.populate({
    path: "lecture",
  });
  next();
});

// Delete Coupon After Expires Date
createCoupons.index({ expires: 10 }, { expireAfterSeconds: 0 });
const createCouponsModel = mongoose.model("Coupons", createCoupons);
module.exports = createCouponsModel;
