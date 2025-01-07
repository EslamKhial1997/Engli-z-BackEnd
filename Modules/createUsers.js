const mongoose = require("mongoose");

const createUsers = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Required lastName User"],
    },
    lastName: {
      type: String,
      // required: [true, "Required lastName User"],
    },
    slug: {
      type: String,
    },

    email: {
      type: String,
      required: [true, "Required E-mail User"],
      trim: true,
      unique: [true, "E-mail Must Be Unique"],
    },
    password: {
      type: String,
      // required: [true, "Required Password User"],
      minlength: [6, "Password Too Short To Create"],
    },
    phone: { type: String, unique: true, sparse: true },

    image: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin", "manager"],
      default: "user",
    },

    grade: {
      type: String,
      enum: ["first", "second", "third"],
      default: "first",
    },
    active: {
      type: String,
      enum: ["active", "inactive", "block"],
      default: "inactive",
    },
    verificationToken: String,
    ip: String,
    googleId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);
const ImageURL = (doc) => {
  if (
    doc.image &&
    !doc.image.includes(`${process.env.BASE_URL}/admin`) &&
    !doc.image.includes("https://lh3.googleusercontent.com")
  ) {
    const image = `${process.env.BASE_URL}/admin/${doc.image}`;
    doc.image = image;
  } else {
    doc.image = doc.image;
  }
};
createUsers.post("init", (doc) => {
  ImageURL(doc);
});
createUsers.post("save", (doc) => {
  ImageURL(doc);
});
const createUsersModel = mongoose.model("Users", createUsers);
module.exports = createUsersModel;
