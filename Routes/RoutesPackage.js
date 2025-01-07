const { Router } = require("express");

const { protect, allowedTo } = require("../Service/AuthService");
const { UtilsValidator } = require("../Resuble/UtilsValidationError");
const {
  getPackages,
  updatePackage,
  createPackage,
} = require("../Service/PackageService");
const Routes = Router();
Routes.use(protect);
Routes.route("/").post(allowedTo("manager"), createPackage).get(getPackages);
Routes.route("/:id").put(allowedTo("manager"), UtilsValidator, updatePackage);
module.exports = Routes;
