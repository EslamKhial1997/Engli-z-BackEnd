const { Router } = require("express");

const { protect, allowedTo } = require("../Service/AuthService");

const { uploadImage, resizeImage } = require("../Utils/imagesHandler");
const {
  createSlider,
  getSliders,
  getSlider,
  updateSlider,
  deleteSlider,
} = require("../Service/SliderService");
const { UtilsValidator } = require("../Resuble/UtilsValidationError");

const Routes = Router();

Routes.route("/")
  .post(
    protect,
    allowedTo("admin", "manager"),
    uploadImage,
    resizeImage("slider"),
    createSlider
  )
  .get(getSliders);
Routes.route("/:id")
  .get(UtilsValidator,getSlider)
  .put(
    protect,
    allowedTo("admin", "manager"),
    uploadImage,
    UtilsValidator,
    resizeImage("slider"),
    updateSlider
  )
  .delete(protect, allowedTo("admin", "manager"),UtilsValidator, deleteSlider);
module.exports = Routes;
