const mongoose = require("mongoose");

const createSection = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Section Name Is Required"],
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    class: {
      type: mongoose.Schema.ObjectId,
      ref: "Class",
      required: [true, "Class ID Is Required"],
    },
  },
  { timestamps: true }
);
createSection.pre(/^find/, function (next) {
  this.populate({
    path: "class",
    select: "name  grade",
  });
  next();
});
createSection.pre("findOneAndDelete", async function (next) {
  const sectionId = this.getQuery()._id;
  const lectures = await mongoose
    .model("Lectures")
    .find({ section: sectionId }, "_id");

  // استخراج معرفات المحاضرات
  const lectureIds = lectures.map((lecture) => lecture._id);
  await mongoose
    .model("Couress")
    .updateMany(
      { "couresItems.lacture": { $in: lectureIds } },
      { $pull: { couresItems: { lacture: { $in: lectureIds } } } }
    );
  await mongoose.model("Lectures").deleteMany({ section: sectionId });
  await mongoose.model("Quiz").deleteMany({ lecture: { $in: lectureIds } });

  next();
});

// معالجة الصورة وإضافة المسار الكامل
const ImageURL = (doc) => {
  if (doc.image && !doc.image.includes(`${process.env.BASE_URL}/section`)) {
    const image = `${process.env.BASE_URL}/section/${doc.image}`;
    doc.image = image;
  }
};

// معالجة بعد إحضار وثيقة واحدة
createSection.post("init", (doc) => {
  ImageURL(doc);
});

// معالجة عند الحفظ
createSection.post("save", (doc) => {
  ImageURL(doc);
});

// معالجة النتائج بعد البحث
createSection.post(/^find/, async function (docs) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => ImageURL(doc));
  } else if (docs) {
    ImageURL(docs);
  }
});

const createSectionModel = mongoose.model("Section", createSection);
module.exports = createSectionModel;
