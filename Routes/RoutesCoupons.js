const { Router } = require("express");

const { protect, allowedTo } = require("../Service/AuthService");
const {
  createCoupon,
  getCoupons,
  getCoupon,
  checkCoupon,
  // updateCoupon,
} = require("../Service/CouponService");
const { createCouponValidator } = require("../Resuble/CouponValidationError");
const { UtilsValidator } = require("../Resuble/UtilsValidationError");

const Routes = Router();
Routes.use(protect);
Routes.use(allowedTo("admin", "teacher"));
Routes.get("/checkCoupon", checkCoupon);
Routes.route("/")
  .post( createCouponValidator, createCoupon)
  .get(getCoupons);
Routes.route("/:id").get(UtilsValidator, getCoupon);
// .delete(allowedTo("admin", "manager"), deleteCoupon)
// .put(allowedTo("admin", "manager"), updateCoupon);
module.exports = Routes;
