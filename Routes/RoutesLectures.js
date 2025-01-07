const { Router } = require("express");

const { protect, allowedTo } = require("../Service/AuthService");

const {
  createLectures,
  getLectures,
  getLecture,
  updateLecture,
  deleteLecture,
  resizeImage,
  UploadVideo,
  deleteVideo,
} = require("../Service/LectureService");
const { createLectureValidator } = require("../Resuble/LectureValidationError");
const { uploadPDF } = require("../Utils/imagesHandler");
const { UtilsValidator } = require("../Resuble/UtilsValidationError");

const Routes = Router();

Routes.route("/")
  .post(
    protect,
    allowedTo("admin", "teacher"),
    uploadPDF,
    createLectureValidator,
    resizeImage,
    createLectures
  )
  .get(getLectures);
Routes.route("/:id")
  .get(UtilsValidator, getLecture)
  .put(
    protect,
    allowedTo("admin", "teacher"),
    uploadPDF,
    UtilsValidator,
    resizeImage,
    updateLecture
  )
  .delete(
    protect,
    allowedTo("admin", "teacher"),
    UtilsValidator,
    deleteLecture
  );
Routes.route("/video/:id").delete(deleteVideo);

module.exports = Routes;
