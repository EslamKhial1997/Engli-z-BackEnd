const expressAsyncHandler = require("express-async-handler");
const createLecturesModel = require("../Modules/createAlecture");
const createPackageModel = require("../Modules/createPackage");
const factory = require("./FactoryHandler");
const { default: axios } = require("axios");

exports.createBunny = expressAsyncHandler(async (req, res, next) => {
  try {
    const package = await createPackageModel.findOne();

    const bunny = await axios.get(
      `https://api.bunny.net/videolibrary/${package.libraryID}`,
      {
        headers: {
          accept: "application/json",
          AccessKey: package.token,
        },
      }
    );

    if (
      !bunny ||
      Math.floor(bunny.data.StorageUsage / (1000 * 1000)) >=
        package.pricing.upload
    ) {
      return res
        .status(401)
        .json({
          model: false,
          msg: " لا يمكن رفع أي محاضرة في الوقت الحالي المساحه مكتملة",
        });
    }

    await createPackageModel.findByIdAndUpdate(
      package._id,
      {
        $set: {
          usedStorage: Math.floor(bunny.data.StorageUsage / (1000 * 1000)),
          usedTraffic: Math.floor(bunny.data.TrafficUsage / (1000 * 1000)),
        },
      },
      { new: true }
    );

    const { id } = req.params;
    const lecture = await createLecturesModel.findById(id);
    if (lecture?.guid) {
      const response = await axios.get(
        `https://video.bunnycdn.com/library/${package.libraryID}/videos/${lecture.guid}`,
        {
          headers: {
            "Content-Type": "application/octet-stream",
            AccessKey: package.apiKey,
          },
        }
      );

      if (response.data.status === 0) {
        await axios.delete(
          `https://video.bunnycdn.com/library/${package.libraryID}/videos/${lecture.guid}`,
          {
            headers: {
              accept: "application/json",
              AccessKey: package.apiKey,
            },
          }
        );

        await createLecturesModel.findByIdAndUpdate(id, {
          $unset: { guid: "" },
        });
      } else {
        return res.status(401).json({
          model: false,
          msg: "يوجد فيديو في المحاضرة",
        });
      }
    }

    return res.status(200).json({
      model: true,
      msg: "لايوجد فيديو في المحاضرة",
      guid: lecture.guid,
      libraryID: package.libraryID,
      apiKey: package.apiKey,
    });
  } catch (error) {
    console.error("Server Error:", error);
    next(new ApiError("خطأ في سيرفر الفيديوهات", 500));
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
      videoId: videoId,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading video",
      error: error.message,
    });
  }
});
