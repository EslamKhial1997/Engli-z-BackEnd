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
  getVideo,
} = require("../Service/LectureService");
const { createLectureValidator } = require("../Resuble/LectureValidationError");
const { uploadPDF } = require("../Utils/imagesHandler");
const { UtilsValidator } = require("../Resuble/UtilsValidationError");
const { createBunny } = require("../Service/BunnyService");

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
Routes.route("/:id").post(  protect,
  allowedTo("admin", "teacher"),createBunny)
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
Routes.route("/video/:id")
  .get(protect, getVideo)
  .delete(protect, allowedTo("admin", "teacher"), deleteVideo);

module.exports = Routes;
