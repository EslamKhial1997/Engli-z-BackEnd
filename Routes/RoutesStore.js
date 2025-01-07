const { Router } = require("express");

const { protect, allowedTo } = require("../Service/AuthService");
const { uploadImage, resizeImage } = require("../Utils/imagesHandler");
const {
  createStore,
  getStores,
  getStore,
  updateStore,
  deleteStore,
} = require("../Service/StoreService");

const { UtilsValidator } = require("../Resuble/UtilsValidationError");
const Routes = Router();

Routes.route("/")
  .post(
    protect,
    allowedTo("teacher"),
    uploadImage,
    resizeImage("Store"),
    createStore
  )
  .get(getStores);
Routes.route("/:id")
  .get(UtilsValidator, getStore)
  .put(
    protect,
    allowedTo("teacher"),
    uploadImage,
    UtilsValidator,
    resizeImage("Store"),
    updateStore
  )
  .delete(protect, allowedTo("teacher"), UtilsValidator, deleteStore);
module.exports = Routes;
