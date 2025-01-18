const express = require("express");
const { createBunny } = require("../Service/BunnyService");
const { protect, allowedTo } = require("../Service/AuthService");
const Routes = express.Router();
Routes.route("/:id").post(protect, allowedTo("teacher", "admin"), createBunny);

module.exports = Routes;
