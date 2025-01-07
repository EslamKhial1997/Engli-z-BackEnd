const { Router } = require("express");
const { createUsersValidator } = require("../Resuble/UsersvalidatorError");
const {
  createUsers,
  getUsers,
  updateUser,
  deleteUser,
  getUser,
  uploadImage,

  updateLoggedUserPassword,
} = require("../Service/UsersService");
const {
  protect,
  allowedTo,
  getLoggedUserData,
} = require("../Service/AuthService");
const { resizeImageAuth } = require("../Utils/imagesHandler");
const createUsersModel = require("../Modules/createUsers");
const { UtilsValidator } = require("../Resuble/UtilsValidationError");

const Routes = Router();
Routes.use(protect);
Routes.get("/getMe", getLoggedUserData, (req, res, next) => {
  const model = req.model;
  getUser(model)(req, res, next);
});
Routes.put(
  "/updateMe",
  uploadImage,
  resizeImageAuth("admin"),
  getLoggedUserData,
  updateUser
);
Routes.put("/changeUserPassword", getLoggedUserData, (req, res, next) => {
  const model = req.model;
  updateLoggedUserPassword(model)(req, res, next);
});

Routes.route("/")
  .post(
    allowedTo("teacher", "manager"),
    uploadImage,
    createUsersValidator,
    resizeImageAuth("admin"),
    createUsers
  )
  .get(allowedTo("manager", "admin", "teacher"), getUsers);
Routes.route("/:id")
  .get(UtilsValidator, getUser(createUsersModel))
  .delete(allowedTo("manager", "teacher"), UtilsValidator, deleteUser)
  .put(
    allowedTo("admin", "teacher"),
    uploadImage,
    UtilsValidator,
    resizeImageAuth("admin"),

    updateUser
  );
module.exports = Routes;
