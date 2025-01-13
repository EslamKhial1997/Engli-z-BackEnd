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
exports.createCoures = expressAsyncHandler(async (req, res, next) => {
  const clientIp =
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",").shift() ||
    req.connection.remoteAddress;
  const session = await mongoose.startSession();
  session.startTransaction(); // بدء المعاملة
  const package = await createPackageModel.findOne();
 
  
 
  if (
    package.pricing.upload <= package.usedStorage ||
    package.pricing.traffic <= package.usedTraffic
  ) {
    return res.status(404).json({
      status: "Failure",
      msg: "لا يمكن شراء اي محاضرة في الوقت الحالي",
    });
  }

  try {
    const teacher = await createTeachersModel.findOne();
    if (teacher.active === false) {
      await createCouponsModel.findOneAndUpdate(
        {
          code: req.body.coupon,
        },
        { $set: { locked: false } }
      );
      throw new Error("اذا استمرت المشكله يرجي التواصل مع المدرس");
    }
    const lactureModel = await createLecturesModel.findById(req.body.lacture);
    // التحقق من وجود كوبون
    const couponModel = await createCouponsModel.findOne({
      code: req.body.coupon,
    });
    let couresExist = await createCouresModel.find({
      user: req.user._id,
      couresItems: {
        $elemMatch: { lacture: req.body.lacture },
      },
    });

    if (lactureModel) {
      if (couresExist.length > 0) {
        await createCouponsModel.findOneAndUpdate(
          {
            code: req.body.coupon,
          },
          { $set: { locked: false } }
        );
        return res.status(404).json({
          status: "Failure",
          msg: "المحاضره موجوده من قبل",
        });
      }
      const userExists = await createCouresModel.findOne({
        user: req.user._id,
      });

      await createCouponsModel.findOneAndUpdate(
        {
          code: req.body.coupon,
        },
        { $set: { locked: false } }
      );

      if (userExists) {
        coures = userExists.couresItems.push({
          lacture: req.body.lacture,
          coupon: couponModel?.code,
          expires: couponModel?.expires,
          seen: lactureModel?.seen,
          ip: clientIp,
        });
        await userExists.save();
      } else {
        coures = await createCouresModel.create({
          user: req.user._id,
          couresItems: [
            {
              lacture: req.body.lacture,
              coupon: couponModel?.code,
              expires: couponModel?.expires,
              seen: lactureModel?.seen,
              ip: clientIp,
            },
          ],
        });
      }

      const transaction = await createTransactionModel.create({
        user: req.user._id,
        lecture: lactureModel,
        coupon: {
          code: couponModel?.code,
          createBy: couponModel?.createdBy,
        },
      });
      transaction.save();
      res.status(200).json({
        status: "success",
        msg: "تم شراء المحاضرة بنجاح",
      });
    }
    await createCouponsModel.findOneAndDelete({
      code: req.body.coupon,
    });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction(); // إلغاء المعاملة عند حدوث خطأ
    next(error);
  } finally {
    session.endSession(); // إنهاء الجلسة
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
