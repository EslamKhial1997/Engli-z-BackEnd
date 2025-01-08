const expressAsyncHandler = require("express-async-handler");
const {
  UploadSingleImage,
  UploadSinglePDF,
} = require("../Middleware/UploadImageMiddleware");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const ensureUploadDirExists = (type) => {
  const dir = `../uploads/${type}`; // تأكد من استخدام المسار الصحيح
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};
exports.resizeImage = (type) =>
  expressAsyncHandler(async (req, res, next) => {
    ensureUploadDirExists(type);
    const imageType = req.file?.mimetype.split("image/")[1];
    if (req.file) {
      const filename = `${type}-${uuidv4()}-${Date.now()}.${
        imageType ? imageType : "jpeg"
      }`;
      await sharp(req.file.buffer)
        .resize(1920, 1080)
        .toFormat(imageType)
        .toFile(`../uploads/${type}/${filename}`);
      req.body.image = filename;
    }
    next();
  });
exports.resizeImageAuth = (type) =>
  expressAsyncHandler(async (req, res, next) => {
    ensureUploadDirExists(type);
    const imageType = req.file?.mimetype.split("image/")[1];
    if (req.file) {
      const filename = `${type}-${uuidv4()}-${Date.now()}.${
        imageType ? imageType : "jpeg"
      }`;
      await sharp(req.file.buffer)
        .resize(750, 750)
        .toFormat("jpeg")
        .jpeg({ quality: 70 })
        .toFile(`../uploads/${type}/${filename}`);
      req.body.image = filename;
    }
    next();
  });

exports.uploadImage = UploadSingleImage("image");
exports.uploadPDF = UploadSinglePDF("pdf");
exports.fsRemove = async (filePath) => {
  if (!filePath) return;

  // التحقق من وجود الملف
  if (!fs.existsSync(filePath)) {
    console.log(`File not found To Delete the Old File`);
    return;
  }

  // إذا كان الملف موجودًا، حاول حذفه
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Failed to delete file:", err);
    } else {
      console.log("File successfully deleted from local filesystem");
    }
  });
};

// دالة للحصول على مسار الصورة وحذفها
exports.filePathImage = (fileName, relativePathImage) => {
  if (!fileName || !relativePathImage) {
    console.error("No file name same old image");
    return;
  }

  const filePath = path.join(
    __dirname,
    `../uploads/${fileName}/`,
    relativePathImage
  );

  exports.fsRemove(filePath);
};
