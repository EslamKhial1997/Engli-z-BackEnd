const mongoose = require("mongoose");

const createCash = new mongoose.Schema(
  {
    customerService: { type: String, required: [true, "رقم الموبايل مطلوب"] },
    cashNumber: String,
  },
  { timestamps: true }
);

const createCashModel = mongoose.model("Cash", createCash);
module.exports = createCashModel;
