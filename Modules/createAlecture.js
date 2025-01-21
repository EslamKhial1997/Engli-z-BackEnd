const mongoose = require("mongoose");

const createLectures = new mongoose.Schema(
  {
    lecture: {
      type: String,
    },
    price: {
      type: Number,
      default: 0,
      required: [true, "سعر المحاضرة مطلوب"],
    },

    video: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
    bunny: {
      dateUploaded: String,
      views: Number,
      averageWatchTime: Number,
      totalWatchTime: Number,
    },

    pdf: {
      type: String,
    },
    guid: {
      type: String,
    },
    quiz: {
      type: mongoose.Schema.ObjectId,
      ref: "Quiz",
    },
    section: {
      type: mongoose.Schema.ObjectId,
      ref: "Section",
      required: [true, "معرف الفصل مطلوب"],
    },
  },
  { timestamps: true }
);
createLectures.pre(/^find/, function (next) {
  this.populate({
    path: "section",
    select: "name description",
  }).populate({
    path: "quiz",
    select: { questions: 0, results: 0, time: 0 },
  });

  next();
});

const ImageURL = (doc) => {
  if (doc.pdf && !doc.pdf.includes(`${process.env.BASE_URL}/lecture`)) {
    const pdf = `${process.env.BASE_URL}/lecture/${doc.pdf}`;
    doc.pdf = pdf;
  }
};
createLectures.post("init", (doc) => {
  ImageURL(doc);
});
createLectures.post("save", (doc) => {
  ImageURL(doc);
});

createLectures.pre("findOneAndDelete", async function (next) {
  const lectureId = this.getQuery()._id;

  // حذف المحاضرة من الكورسات المرتبطة
  await mongoose.model("Couress").updateMany(
    { "couresItems.lacture": lectureId }, // استخدام "lacture" بدلاً من "lecture"
    { $pull: { couresItems: { lacture: lectureId } } } // التأكد من تحديث العنصر بشكل صحيح
  );
  await mongoose.model("Quiz").deleteMany({ lecture: lectureId });
  await mongoose.model("Coupons").deleteMany({ lecture: lectureId });
  next();
});

const createLecturesModel = mongoose.model("Lectures", createLectures);
module.exports = createLecturesModel;
