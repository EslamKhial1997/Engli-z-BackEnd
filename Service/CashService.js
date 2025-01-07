const createCashModel = require("../Modules/createCash");
const factory = require("./FactoryHandler");


exports.createCash = factory.createOne(createCashModel);
exports.getCashs = factory.getAll(createCashModel);
exports.getCash = factory.getOne(createCashModel);
exports.updateCash = factory.updateOne(createCashModel);
exports.deleteCash = factory.deleteOne(createCashModel);
