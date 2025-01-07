const mongoose = require("mongoose");

const createCouresSchema = new mongoose.Schema(
  {
    couresItems: [
      {
        ip: String,
        lacture: {
          type: mongoose.Schema.ObjectId,
          ref: "Lectures",
          require: [true, "معرف المحاضرة مطلوب"],
        },

        coupon: Number,
        expires: Date,
        seen: Number,
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "Users",
      require: [true, "معرف الطالب مطلوب"],
    },
  },
  { timestamps: true }
);

createCouresSchema.pre(/^find/, function (next) {
  this.populate({
    path: "couresItems.lacture",
  });
  next();
});
const createCouresModel = mongoose.model("Couress", createCouresSchema);
module.exports = createCouresModel;
