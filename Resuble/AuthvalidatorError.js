const { check } = require("express-validator");

const {
  MiddlewareValidator,
} = require("../Middleware/MiddlewareValidatorError");

exports.LoginValidator = [
  check("password").notEmpty().withMessage("الرقم السري مطلوب"),

  check("email")
    .notEmpty()
    .withMessage("الايميل مطلوب")
    .isEmail()
    .withMessage("يجب ان يكون ايميل صحيح"),
  MiddlewareValidator,
];
