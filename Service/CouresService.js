const expressAsyncHandler = require("express-async-handler");
const factory = require("./FactoryHandler");
const ApiError = require("../Resuble/ApiErrors");
const createLecturesModel = require("../Modules/createAlecture");
const createCouresModel = require("../Modules/createCouress");
const createCouponsModel = require("../Modules/createCoupon");
const createTransactionModel = require("../Modules/createtransaction");
const { default: mongoose } = require("mongoose");
const createTeachersModel = require("../Modules/createTeacher");
const createPackageModel = require("../Modules/createPackage");
const { default: axios } = require("axios");
exports.createCoures = expressAsyncHandler(async (req, res, next) => {
  let session;
  try {
    if (req.user.active !== "active") {
      return res.status(401).json({
        msg: "الحساب غير نشط ولايمكن شراء المحاضرة",
      });
    }
    const teacher = await createTeachersModel.findOne({}, "active");
    if (!teacher || teacher.active === false) {
      return res.status(401).json({
        msg: "لا يمكن شراء أي محاضرة في الوقت الحالي ",
      });
    }

    const clientIp = req.headers["x-forwarded-for"]
    session = await mongoose.startSession();
    session.startTransaction(); // بدء المعاملة

    const package = await createPackageModel.findOne();
    const bunnyResponse = await axios.get(
      `https://api.bunny.net/videolibrary/${package.libraryID}`,
      {
        headers: {
          accept: "application/json",
          AccessKey: package.token,
        },
      }
    );

    if (
      !bunnyResponse ||
      Math.floor(bunnyResponse.data.StorageUsage / (1000 * 1000)) >=
        package.pricing.upload
    ) {
      return res.status(403).json({
        msg: "لا يمكن شراء أي محاضرة في الوقت الحالي",
      });
    }

    await createPackageModel.findByIdAndUpdate(
      package._id,
      {
        $set: {
          usedStorage: Math.floor(
            bunnyResponse.data.StorageUsage / (1000 * 1000)
          ),
          usedTraffic: Math.floor(
            bunnyResponse.data.TrafficUsage / (1000 * 1000)
          ),
        },
      },
      { new: true }
    );

    const [couponModel, lactureModel] = await Promise.all([
      createCouponsModel.findOneAndUpdate(
        { code: req.body.coupon },
        { $set: { locked: false } }
      ),
      createLecturesModel.findById(req.body.lacture),
    ]);

    if (!lactureModel) {
      return res.status(404).json({
        status: "Failure",
        msg: "المحاضرة غير موجودة",
      });
    }

    const couresExist = await createCouresModel.find({
      user: req.user._id,
      couresItems: { $elemMatch: { lacture: req.body.lacture } },
    });

    if (couresExist.length > 0) {
      return res.status(400).json({
        status: "Failure",
        msg: "المحاضرة موجودة من قبل",
      });
    }

    const userExists = await createCouresModel.findOne({ user: req.user._id });
    let coures;

    const newCourseItem = {
      lacture: req.body.lacture,
      coupon: couponModel?.code,
      expires: couponModel?.expires,
      seen: couponModel?.seen,
      ip: clientIp,
    };

    if (userExists) {
      userExists.couresItems.push(newCourseItem);
      await userExists.save();
    } else {
      coures = await createCouresModel.create({
        user: req.user._id,
        couresItems: [newCourseItem],
      });
    }

    await createTransactionModel.create({
      user: req.user._id,
      lecture: lactureModel,
      coupon: {
        code: couponModel?.code,
        createBy: couponModel?.createdBy,
      },
    });

    await createCouponsModel.findOneAndDelete({ code: req.body.coupon });
    await session.commitTransaction();

    res.status(200).json({
      status: "success",
      msg: "تم شراء المحاضرة بنجاح",
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
});

exports.getCoures = factory.getOneCourse(createCouresModel);
exports.deleteCourses = factory.deleteOne(createCouresModel);
exports.deleteSpecificCourseItem = expressAsyncHandler(
  async (req, res, next) => {
    const coures = await createCouresModel.findOneAndUpdate(
      { user: req.user._id },
      {
        $pull: { couresItems: { _id: req.params.id } },
      },
      { new: true }
    );
    res.status(200).json({
      status: "success",
      data: coures,
    });
  }
);
exports.updateSpecificCourseItemSeen = expressAsyncHandler(
  async (req, res, next) => {
    const course = await createCouresModel.findOne({ user: req.user._id });
    if (!course) {
      res.status(404).json({
        status: "error",
        msg: "لايوجد كورسات ",
      });
    }
    const itemsIndex = course.couresItems.findIndex(
      (item) => item._id.toString() === req.params.id
    );
    if (itemsIndex > -1) {
      const courseItem = course.couresItems[itemsIndex];
      courseItem.seen -= 1;

      if (
        courseItem.seen === 0 ||
        (courseItem.expires < Date.now() && courseItem.expires)
      ) {
        course.couresItems.splice(itemsIndex, 1);
      } else {
        course.couresItems[itemsIndex] = courseItem;
      }

      await course.save(); // حفظ التحديثات

      res.status(200).json({
        status: "success",
        msg: courseItem.seen === 0 ? "Item deleted" : "Item updated",
        data: course,
      });
    } else {
      return next(new ApiError("There is no course item with the provided ID"));
    }
  }
);
