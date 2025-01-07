const mongoose = require("mongoose");

const createClass = new mongoose.Schema(
  {
    name: {
      type: "string",
      required: [true, "معرف الصف مطلوب"],
    },
    grade: {
      type: String,
      enum: ["first", "second", "third"],
      default: "first",
    },
    image: {
      type: String,
    },
   
  },
  { timestamps: true }
);

const ImageURL = (doc) => {
  if (doc.image && !doc.image.includes(`${process.env.BASE_URL}/class`)) {
    const image = `${process.env.BASE_URL}/class/${doc.image}`;
    doc.image = image;
  }
};
createClass.post("init", (doc) => {
  ImageURL(doc);
});
createClass.post("save", (doc) => {
  ImageURL(doc);
});
const createClassModel = mongoose.model("Class", createClass);
module.exports = createClassModel;
