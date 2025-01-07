const factory = require("./FactoryHandler");
const createPackageModel = require("../Modules/createPackage");
const createTeachersModel = require("../Modules/createTeacher");
const expressAsyncHandler = require("express-async-handler");

exports.createPackage = expressAsyncHandler(async (req, res) => {
  const packageExists = await createPackageModel.find();
  if (packageExists.length >0) {
    return res.status(409).json({
      status: "faild",
      msg: "الخطة موجوده من قبل",
    });
  }
  const package = await createPackageModel.create(req.body);
  await createTeachersModel.findOneAndUpdate(
    {},
    { $set: { package: package._id } },
    { new: true }
  );
  res.status(201).json({ status: "Success", data: package });
});
exports.getPackages = factory.getAll(createPackageModel);
exports.updatePackage = factory.updateOne(createPackageModel, "Package");
