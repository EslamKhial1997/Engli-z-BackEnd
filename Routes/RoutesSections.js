const { Router } = require("express");

const { protect, allowedTo } = require("../Service/AuthService");

const {
  createSections,
  getSections,
  getSection,
  updateSection,
  deleteSection,
} = require("../Service/SectionService");
const {
  createSectionsValidator,
} = require("../Resuble/SectionValidationError");
const { uploadImage, resizeImage } = require("../Utils/imagesHandler");
const { UtilsValidator } = require("../Resuble/UtilsValidationError");

const Routes = Router();

Routes.route("/")
  .post(
    protect,
    allowedTo("admin", "teacher"),
    uploadImage,
    createSectionsValidator,
    resizeImage("section"),
    createSections
  )
  .get(getSections);
Routes.route("/:id")
  .get(UtilsValidator, getSection)
  .put(
    protect,
    allowedTo("admin", "teacher"),
    uploadImage,
    UtilsValidator,
    resizeImage("section"),
    updateSection
  )
  .delete(
    protect,
    allowedTo("admin", "teacher"),
    UtilsValidator,
    deleteSection
  );
module.exports = Routes;
