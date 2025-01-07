const { Router } = require("express");

const { protect, allowedTo } = require("../Service/AuthService");
const { UtilsValidator } = require("../Resuble/UtilsValidationError");
const {
  createPricing,
  getPricings,
  getPricing,
  deletePricing,
  updatePricing,
} = require("../Service/PricingService");
const Routes = Router();
Routes.use(protect);
Routes.route("/")
  .post(allowedTo("manager"), createPricing)
  .get(allowedTo("manager", "teacher"), getPricings);
Routes.route("/:id")
  .get(allowedTo("manager", "teacher"), getPricing)
  .put(allowedTo("manager"), UtilsValidator, updatePricing)
  .delete(allowedTo("manager"), deletePricing);
module.exports = Routes;
