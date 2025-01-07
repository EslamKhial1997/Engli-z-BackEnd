const { Router } = require("express");

const { updateLoggedUserPassword } = require("../Service/UsersService");
const { protect, allowedTo } = require("../Service/AuthService");
const {
  getTeachers,
  deleteTeacher,
  updateTeacher,
  getAllDataTeacher,
  createTeachers,
  approvedUser,
} = require("../Service/TeachersService");
const {
  createTeachersValidator,
} = require("../Resuble/TeachersvalidatorError");
const {
  UpdateUserPassword,
  updateOneUserValidator,
} = require("../Resuble/UsersvalidatorError");
const { uploadImage, resizeImageAuth } = require("../Utils/imagesHandler");
const { UtilsValidator } = require("../Resuble/UtilsValidationError");
const Routes = Router();
Routes.put(
  "/changeUserPassword",
  protect,
  UpdateUserPassword,
  updateLoggedUserPassword
);
Routes.route("/")
  .post(
    protect,
    allowedTo("manager"),
    uploadImage,
    createTeachersValidator,
    resizeImageAuth("teacher"),
    createTeachers
  )
  .get(getTeachers);
Routes.route("/:id")
  .get(UtilsValidator, getAllDataTeacher)
  .delete(protect, allowedTo("manager"), UtilsValidator, deleteTeacher)
  .put(protect, allowedTo("manager"), updateOneUserValidator, updateTeacher);
Routes.route("/approved/:id").put(
  protect,
  allowedTo("teacher", "admin"),
  approvedUser
);

module.exports = Routes;
