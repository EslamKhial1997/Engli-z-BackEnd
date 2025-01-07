const mongoose = require("mongoose");

const createTeachers = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Required Name Teacher "],
    },
    description: {
      type: String,
    },
    subject: {
      type: String,
    },
    slug: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Required E-mail "],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Required Password "],
      minlength: [6, "Password Too Short To Create"],
    },

    phone: {
      type: String,
      required: [true, "Required Phone User"],
      unique: [true, "Phone Must Be Unique"],
    },
    image: {
      type: String,
    },
    package: {
      type: mongoose.Schema.ObjectId,
      ref: "Package",
    },
    active: {
      type: Boolean,
      default: true,
    },

    role: {
      type: String,

      default: "teacher",
    },
    code: {
      type: String,
    },
    codeExpires: {
      type: String,
    },
    ip: String,
  },
  { timestamps: true }
);
createTeachers.pre(/^find/, function (next) {
  this.populate({
    path: "package",
    select: "plan  maxStorage maxTraffic",
  });
  next();
});
const ImageURL = (doc) => {
  if (doc.image && !doc.image.includes(`${process.env.BASE_URL}/teacher`)) {
    const image = `${process.env.BASE_URL}/teacher/${doc.image}`;
    doc.image = image;
  }
};
createTeachers.post("init", (doc) => {
  ImageURL(doc);
});
createTeachers.post("save", (doc) => {
  ImageURL(doc);
});

const createTeachersModel = mongoose.model("Teachers", createTeachers);
module.exports = createTeachersModel;
