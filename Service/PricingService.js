const createPricingModel = require("../Modules/createPricing");
const factory = require("./FactoryHandler");
exports.createFirstPricing = async () => {
  try {
    // التحقق مما إذا كان هناك بيانات تسعير موجودة مسبقًا
    const existingPricing = await createPricingModel.find({});
    if (existingPricing.length > 0) {
      console.log("🚨 Pricing plans already exist in the database.");
      return;
    }

    // تعريف خطط التسعير
    const plans = [
      {
        title: "Basic",
        price: 2000,
        student: 150,
        upload: 100000,
        traffic: 150000,
        domain: false,
        allowed: "منع تحميل المحتوي بتقنية DRM",
        assistant: 1,
      },

      {
        title: "Standard",
        price: 3000,
        student: 250,
        upload: 150000,
        traffic: 250000,
        domain: true,
        recommnded: false,
        allowed: "منع تحميل المحتوي بتقنية DRM",
        assistant: 2,
      },
      {
        title: "Advanced",
        price: 5000,
        student: 500,
        upload: 300000,
        traffic: 500000,
        domain: true,
        recommnded: true,
        allowed: "منع تحميل المحتوي بتقنية DRM",
        assistant: 3,
      },
      {
        title: "Premium",
        price: 7500,
        student: 750,
        upload: 500000,
        traffic: 750000,
        domain: true,
        recommnded: true,
        allowed: "منع تحميل المحتوي بتقنية DRM",
        assistant: 5,
      },
      {
        title: "Elite",
        price: 10000,
        student: 1000, 
        upload: 750000,
        traffic: 1000000,
        domain: true,
        recommnded: true,
        allowed: "منع تحميل المحتوي بتقنية DRM",
        assistant: 5,
      },
    ];

    // إدخال خطط التسعير إلى قاعدة البيانات
    for (let i = 0; i < plans.length; i++) {
      const pricing = new createPricingModel(plans[i]);
      await pricing.save(); // حفظ كل خطة في قاعدة البيانات بالتتابع
    }
    console.log("✅ Pricing plans created successfully.");
  } catch (error) {
    console.error("❌ Error creating pricing plans:", error.message);
  }
};

exports.createPricing = factory.createOne(createPricingModel);
exports.getPricings = factory.getAll(createPricingModel);
exports.getPricing = factory.getOne(createPricingModel);
exports.updatePricing = factory.updateOne(createPricingModel);
exports.deletePricing = factory.deleteOne(createPricingModel);
