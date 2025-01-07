const express = require("express");
const createLecturesModel = require("../Modules/createAlecture");
const createPackageModel = require("../Modules/createPackage");
const { default: axios } = require("axios");
const expressAsyncHandler = require("express-async-handler");
const cookieParser = require("cookie-parser");
const Routes = express.Router();
Routes.use(cookieParser());
Routes.get(
  "/:id",
  expressAsyncHandler(async (req, res, next) => {
    const token = req.cookies.access_token;
    const package = await createPackageModel.findOne();
    if (!token) {
      return res.redirect("/");
    }
    const bunny = await axios
      .get(`https://api.bunny.net/videolibrary/${package.libraryID}`, {
        headers: {
          accept: "application/json",
          AccessKey: package.token,
        },
      })
      .then((response) => response.data)
      .catch(() => null);
    if (
      bunny.TrafficUsage <= package.usedStorage ||
      bunny.StorageUsage <= package.usedTraffic
    ) {
      // return res.render("Error", {
      //   msg: "لا يمكن رفع اي محاضرة في الوقت الحالي",
      // });
      res.redirect("/dashboard");
      return res
        .status(400)
        .json({ msg: "لا يمكن رفع اي محاضرة في الوقت الحالي" });
    } else {
      await createPackageModel.findByIdAndUpdate(
        package._id,
        {
          $set: {
            usedStorage: Math.floor(bunny.StorageUsage / (1000 * 1000)),
            usedTraffic: Math.floor(bunny.TrafficUsage / (1000 * 1000)),
          },
        },
        { new: true }
      );
    }
    try {
      const { id } = req.params;
      let status;
      // البحث عن المحاضرة باستخدام الـ ID
      const lecture = await createLecturesModel
        .findById(id)
        .populate("section");
      const package = await createPackageModel.findOne();

      if (!lecture || !package) {
        // إذا لم يتم العثور على المحاضرة أو الباقة، عرض رسالة خطأ
        return res.status(404).send("Not found");
      }

      try {
        // محاولة الحصول على حالة الفيديو
        const response = await axios.get(
          `https://video.bunnycdn.com/library/${package.libraryID}/videos/${lecture.guid}`,
          {
            headers: {
              "Content-Type": "application/octet-stream",
              AccessKey: package.apiKey,
            },
          }
        );
        status = response.data.status === 0 ? false : true;
        // console.log(status.status);
      } catch (error) {
        console.error("Error fetching video status:", error);
        status = false; // تعيين القيمة الافتراضية إذا فشل الطلب
        return res.redirect("/error");
      }

      // إذا كانت الحالة غير صحيحة، إعادة التوجيه أولاً
      if (status) {
        return res.redirect("/dashboard/create-files");
      }

      // تمرير الـ ID وبيانات المحاضرة إلى القالب إذا كانت الحالة صحيحة
      res.render("uploadForm", {
        lecture: lecture,
        guid: lecture.guid,
        libraryID: package.libraryID,
        apiKey: package.apiKey,
        status,
        token,
      });
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).send("Server Error");
    }
  })
);

module.exports = Routes;
