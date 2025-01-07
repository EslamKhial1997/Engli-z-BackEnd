const { Router } = require("express");

const { protect, allowedTo } = require("../Service/AuthService");
const {
  getMyTransactions,
  getTotalSalesTransactions,
  getTotalTransactions,
} = require("../Service/TransactionService");
const Routes = Router();
Routes.use(protect);
Routes.route("/").get(
  allowedTo("user", "teacher", "admin", "manager"),
  getMyTransactions
);
Routes.use(allowedTo("teacher", "admin", "manager"));
Routes.route("/total").get(getTotalTransactions);
Routes.route("/sales").get(getTotalSalesTransactions);
module.exports = Routes;
