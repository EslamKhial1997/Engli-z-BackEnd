const mongoose = require("mongoose");

const createStore = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["coupon", "noteBook", "center"],
      default: "coupon",
    },
    address: {
      city: {
        type: String,
        default: "العريش",
      },
      street: {
        type: String,
        required: [true, "اسم الشارع مطلوب"],
      },
      library: {
        type: String,
        required: [true, "اسم المكتبة مطلوب"],
      },
    },
    location: {
      longitute: Number,
      latitude: Number,
    },
  },
  { timestamps: true }
);

const createStoreModel = mongoose.model("Stores", createStore);
module.exports = createStoreModel;
