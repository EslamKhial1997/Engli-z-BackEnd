const factory = require("./FactoryHandler");

const createNoticesModel = require("../Modules/createNotice");

exports.createNotice = factory.createOne(createNoticesModel);
exports.getNotices = factory.getAll(createNoticesModel);
exports.getNotice = factory.getOne(createNoticesModel);
exports.updateNotice = factory.updateOne(createNoticesModel);
exports.deleteNotice = factory.deleteOne(createNoticesModel);
