const multer = require("multer");
const ApiError = require("../Resuble/ApiErrors");
const path = require("path");

const MulterOptions = () => {
  const storage = multer.memoryStorage();
  const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new ApiError("Only Image Allowed", 400), false);
    }
  };
  const upload = multer({ storage: storage, fileFilter: multerFilter });
  return upload;
};
const MulterOptionsPDF = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "../uploads/lecture"); // تحديد مكان حفظ الملفات
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
      );
      // ensureUploadDirExists("lecture")
    },
  });

  const fileFilter = function (req, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Please upload a PDF file."), false);
    }
  };

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 }, // الحد الأقصى لحجم الملف هو 5 ميجابايت
  });
};

exports.UploadSingleImage = (ImageName) => MulterOptions().single(ImageName);

exports.UploadSinglePDF = (pdf) => MulterOptionsPDF().single(pdf);
exports.UploadMultiImage = (ArrOfImage) =>
  MulterOptions("data").fields(ArrOfImage);
