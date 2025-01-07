const factory = require("./FactoryHandler");
const createStoreModel = require("../Modules/createStore");
exports.createStore = factory.createOne(createStoreModel);
exports.getStores = factory.getAll(createStoreModel);
exports.getStore = factory.getOne(createStoreModel);
exports.updateStore = factory.updateOne(createStoreModel, "Store");
exports.deleteStore = factory.deleteOne(createStoreModel, "Store");
