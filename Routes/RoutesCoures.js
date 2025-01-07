const express = require("express");
const { protect, allowedTo } = require("../Service/AuthService");
const {
  createCoures,
  getCoures,
  deleteSpecificCourseItem,
  updateSpecificCourseItemSeen,
} = require("../Service/CouresService");
const { createCourseValidator } = require("../Resuble/CouressValidationError");
const { UtilsValidator } = require("../Resuble/UtilsValidationError");
const { limiter } = require("../Service/FactoryHandler");

const Routes = express.Router();
Routes.use(protect);
Routes.route("/")
  .post(limiter,allowedTo("user"), createCourseValidator, createCoures)
  .get(protect, allowedTo("user"), getCoures);

Routes.route("/:id")
  .delete(UtilsValidator, deleteSpecificCourseItem)
  .put(UtilsValidator, updateSpecificCourseItemSeen);

module.exports = Routes;
