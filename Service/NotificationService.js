const expressAsyncHandler = require("express-async-handler");
const createNotificationsModel = require("../Modules/createNotifiction");
const factory = require("./FactoryHandler");

exports.getMyNotifications = expressAsyncHandler(async (req, res, next) => {
  let mynotification;

  if (req.user.role === "user") {
    mynotification = await createNotificationsModel.find({
      user: req.user._id,
      type: { $ne: "student-signup" },
    });
  } else if (req.user.role === "admin") {
    mynotification = await createNotificationsModel.find({
      type: "student-signup",
    });
  } else {
    mynotification = await createNotificationsModel.find({
      type: "student-signup",
    });
  }

  res.status(200).json({
    message: "Notifications retrieved successfully",
    data: mynotification,
  });
});
exports.deleteNotification = factory.deleteOne(createNotificationsModel);
