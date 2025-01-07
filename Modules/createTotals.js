const mongoose = require("mongoose");

const createTotals = new mongoose.Schema(
  {
    totalCouponsPrinted: Number,
  },
  { timestamps: true }
);

const createTotalsModel = mongoose.model("Totals", createTotals);
module.exports = createTotalsModel;
