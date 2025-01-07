const mongoose = require("mongoose");

const createNotice = new mongoose.Schema(
  {
    title: String,
    text: String,
  },
  { timestamps: true }
);

const createNoticeModel = mongoose.model("Notice", createNotice);
module.exports = createNoticeModel;
