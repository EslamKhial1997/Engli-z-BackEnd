const { Router } = require("express");
const { protect, allowedTo } = require("../Service/AuthService");
const {
  createCash,
  getCashs,
  updateCash,
  deleteCash,
  getCash,
} = require("../Service/CashService");

const Routes = Router();
Routes.use(protect);
Routes.route("/").post(allowedTo("teacher"), createCash).get(getCashs);
Routes.route("/:id")
  .get(getCash)
  .put(allowedTo("teacher"), updateCash)
  .delete(allowedTo("teacher"), deleteCash);

module.exports = Routes;
