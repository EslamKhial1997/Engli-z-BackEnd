const express = require("express");
const cookieParser = require("cookie-parser");
const { createBunny } = require("../Service/BunnyService");
const Routes = express.Router();
Routes.use(cookieParser());
Routes.get("/:id", createBunny);

module.exports = Routes;
