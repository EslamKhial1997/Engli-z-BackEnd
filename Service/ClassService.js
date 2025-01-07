const factory = require("./FactoryHandler");
const createClassModel = require("../Modules/createClasses");
const expressAsyncHandler = require("express-async-handler");
exports.createClasses = expressAsyncHandler(async (req, res) => {
  const newClass = new createClassModel({
    ...req.body, // استخدام req.body بشكل صحيح لتمرير البيانات
  });

  // حفظ الكلاس الجديد في قاعدة البيانات
  await newClass.save();

  // إرسال استجابة عند نجاح العملية
  res.status(201).json({ status: "Success", data: newClass });
});

exports.getClassess = factory.getAll(createClassModel);
exports.getClass = factory.getOne(createClassModel);
exports.updateClass = factory.updateOne(createClassModel, "class");
exports.deleteClass = factory.deleteOne(createClassModel, "class");
