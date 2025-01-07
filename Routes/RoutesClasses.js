const { Router } = require("express");

const { protect, allowedTo } = require("../Service/AuthService");

const {
  createClasses,
  getClassess,
  getClass,
  updateClass,
  deleteClass,
} = require("../Service/ClassService");
const { createClassValidator } = require("../Resuble/ClassValidationError");
const { uploadImage, resizeImage } = require("../Utils/imagesHandler");
const { UtilsValidator } = require("../Resuble/UtilsValidationError");

const Routes = Router();

Routes.route("/")
  .post(
    protect,
    allowedTo("admin", "teacher"),
    uploadImage,
    createClassValidator,
    resizeImage("class"),
    createClasses
  )
  .get(getClassess);
Routes.route("/:id")
  .get(UtilsValidator, getClass)
  .put(
    protect,
    allowedTo("admin", "teacher"),
    uploadImage,
    UtilsValidator,
    resizeImage("class"),
    updateClass
  )
  .delete(allowedTo("admin", "teacher"), UtilsValidator, deleteClass);
module.exports = Routes;
