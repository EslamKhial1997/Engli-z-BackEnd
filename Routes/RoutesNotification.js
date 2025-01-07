const { Router } = require("express");

const {
  getMyNotifications,
  deleteNotification,
} = require("../Service/NotificationService");
const { protect } = require("../Service/AuthService");

const Routes = Router();
Routes.use(protect);
Routes.route("/").get(getMyNotifications);
Routes.route("/:id").delete(deleteNotification);
module.exports = Routes;
