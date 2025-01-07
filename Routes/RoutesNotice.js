const { Router } = require("express");
const { protect, allowedTo } = require("../Service/AuthService");
const { createNotice, getNotice } = require("../Service/NoticeService");

const Routes = Router();
Routes.use(protect);
Routes.use(allowedTo("manager"));
Routes.route("/").post(createNotice).get(getNotice);

module.exports = Routes;
