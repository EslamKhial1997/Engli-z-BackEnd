const { check } = require("express-validator");
const { default: slugify } = require("slugify");
const {
  MiddlewareValidator,
} = require("../Middleware/MiddlewareValidatorError");
const createClassModel = require("../Modules/createClasses");

exports.createSectionsValidator = [
  check("name")
    .notEmpty()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    })
    .withMessage("Name Section is required"),
  check("class")
    .notEmpty()
    .isMongoId()
    .withMessage("Class To Mongo is not Invalid ID")
    .custom((val) =>
      createClassModel.findOne({ _id: val }).then((e) => {
        if (!e) {
          return Promise.reject(new Error("لايوجد صف"));
        }
      })
    ),
  MiddlewareValidator,
];
