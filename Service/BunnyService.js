const expressAsyncHandler = require("express-async-handler");
const createLecturesModel = require("../Modules/createAlecture");
const createPackageModel = require("../Modules/createPackage");
const factory = require("./FactoryHandler");
const { default: axios } = require("axios"); 

exports.createBunny = expressAsyncHandler(async (req, res, next) => {
  const token = req.cookies.access_token;
  const package = await createPackageModel.findOne();
  if (!token) {
    return res.redirect("/login");
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
    const lecture = await createLecturesModel.findById(id).populate("section");
    const package = await createPackageModel.findOne();

    // if (!lecture || !package) {
    //   // إذا لم يتم العثور على المحاضرة أو الباقة، عرض رسالة خطأ
    //   return res.status(404).send("Not found");
    // }

    try {
      if (lecture.guid) {
        const response = await axios.get(
          `https://video.bunnycdn.com/library/${package.libraryID}/videos/${lecture.guid}`,
          {
            headers: {
              "Content-Type": "application/octet-stream",
              AccessKey: package.apiKey,
            },
          }
        );

        if (response.data.status !== 0 || lecture.video) {
          return res.redirect("/dashboard/create-files");
        }
      } 
    } catch (error) {
      console.error("Error fetching video status:", error);
      status = false; // تعيين القيمة الافتراضية إذا فشل الطلب
      return res.redirect("/error");
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
});

exports.uploadVideo = expressAsyncHandler(async (req, res, next) => {
  try {
    const { lectureId } = req.params;
    const videoFile = req.file;
    
    if (!videoFile) {
      return res.status(400).json({ message: "No video file provided" });
    }

    const lecture = await createLecturesModel.findById(lectureId);
    const package = await createPackageModel.findOne();

    if (!lecture || !package) {
      return res.status(404).json({ message: "Lecture or package not found" });
    }

    // Create video in Bunny CDN
    const createVideoResponse = await axios.post(
      `https://video.bunnycdn.com/library/${package.libraryID}/videos`,
      {
        title: lecture.title,
      },
      {
        headers: {
          "Content-Type": "application/json",
          AccessKey: package.apiKey,
        },
      }
    );

    const videoId = createVideoResponse.data.guid;

    // Upload the video file
    await axios.put(
      `https://video.bunnycdn.com/library/${package.libraryID}/videos/${videoId}`,
      videoFile.buffer,
      {
        headers: {
          "Content-Type": "application/octet-stream",
          AccessKey: package.apiKey,
        },
      }
    );

    // Update lecture with video ID
    lecture.guid = videoId;
    await lecture.save();

    res.status(200).json({
      success: true,
      message: "Video uploaded successfully",
      videoId: videoId
    });

  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading video",
      error: error.message
    });
  }
});
