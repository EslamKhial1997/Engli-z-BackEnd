const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const useragent = require("express-useragent");
const requestIp = require("request-ip");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const dbCollection = require("./config/config");
const globalError = require("./Middleware/globalError");
const ApiError = require("./Resuble/ApiErrors");
const RoutesUsers = require("./Routes/RoutesUsers");
const RoutesTransactions = require("./Routes/RoutesTransaction");
const RoutesClasses = require("./Routes/RoutesClasses");
const RoutesAuth = require("./Routes/RoutesAuth");
const RoutesGoogleAuth = require("./Routes/RoutesGoogleAuth");
const RoutesTeachers = require("./Routes/RoutesTeachers");
const RoutesSections = require("./Routes/RoutesSections");
const RoutesLectures = require("./Routes/RoutesLectures");
const RoutesVideo = require("./Routes/RoutesBunny");
const RoutesCoupons = require("./Routes/RoutesCoupons");
const RoutesCouress = require("./Routes/RoutesCoures");
const RoutesSliders = require("./Routes/RoutesSlider");
const RoutesStores = require("./Routes/RoutesStore");
const RoutesQuizs = require("./Routes/RoutesQuiz");
const RoutesNotice = require("./Routes/RoutesNotice");
const RoutesPackage = require("./Routes/RoutesPackage");
const RoutesNotifacations = require("./Routes/RoutesNotification");
const RoutesPricing = require("./Routes/RoutesPricing");
const RoutesCash = require("./Routes/RoutesCash");
const { createFirstManagerAccount } = require("./Service/AuthService");
const { createFirstTeacher } = require("./Service/TeachersService");
const { createFirstPricing } = require("./Service/PricingService");
const app = express();
dotenv.config({ path: "config.env" });
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});
const uploadsPath = path.join(__dirname, "../uploads");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(uploadsPath));

app.use(express.json({ limit: "50kb" }));

dbCollection();
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

createFirstManagerAccount();
createFirstTeacher();
createFirstPricing();
app.use(cors());
app.use(useragent.express());
app.use(requestIp.mw());
app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use("/", RoutesGoogleAuth);
app.use("/api/v1/auth", RoutesAuth);
app.use("/api/v1/users", RoutesUsers);
app.use("/api/v1/transaction", RoutesTransactions);
app.use("/api/v1/teacher", RoutesTeachers);
app.use("/api/v1/class", RoutesClasses); 
app.use("/api/v1/section", RoutesSections);
app.use("/api/v1/lecture", RoutesLectures);
app.use("/video", RoutesVideo);
app.use("/api/v1/coupon", RoutesCoupons);
app.use("/api/v1/coures", RoutesCouress);
app.use("/api/v1/slider", RoutesSliders);
app.use("/api/v1/store", RoutesStores);
app.use("/api/v1/quiz", RoutesQuizs);
app.use("/api/v1/notice", RoutesNotice);
app.use("/api/v1/package", RoutesPackage);
app.use("/api/v1/notifacation", RoutesNotifacations);
app.use("/api/v1/pricing", RoutesPricing);
app.use("/api/v1/cash", RoutesCash);
app.use(express.static(path.join(__dirname, "../build")));
// app.get("/youtube", (req, res) => {
//   res.sendFile(path.join(__dirname, "layout", "youtube.html"));
// });

app.get("*", (req, res) => {
  if (!req.originalUrl.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../build", "index.html"));
  } else {
    res.status(404).json({ message: "API endpoint not found" });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// معالجة أي طلبات لم يتم التعرف عليها
app.all("*", (req, res, next) => {
  next(new ApiError(`Sorry, this URL ${req.originalUrl} does not exist`, 400));
});

// Middleware لمعالجة الأخطاء العامة
app.use(globalError);
