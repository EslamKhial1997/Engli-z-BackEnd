// Core Modules
const path = require("path");
// Third-party Libraries
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const hpp = require("hpp");
const session = require("express-session");
const passport = require("passport");
const mongoSanitize = require("express-mongo-sanitize");
const { xss } = require("express-xss-sanitizer");
const cookieParser = require("cookie-parser");

// Local Modules
const dbCollection = require("./config/config");
const globalError = require("./Middleware/globalError");
const ApiError = require("./Resuble/ApiErrors");
const app = express();
app.use(cors({
  origin: 'http://localhost:3000', // السماح بالطلبات من React
  credentials: true // لتمكين الكوكيز
}));
app.use((req, res, next) => {
  console.log('Setting CORS headers');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});
// Route Imports
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

// Initial Configurations
dotenv.config({ path: "config.env" });

const uploadsPath = path.join(__dirname, "../uploads");
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json({ limit: "50kb" })); 

app.use(hpp());
// app.use(express.static(path.join(__dirname, "../build")));
app.use(express.static(uploadsPath));
app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(mongoSanitize());
app.use(xss());
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Database Connection
dbCollection();

// Initial Setup Tasks
const { createFirstManagerAccount } = require("./Service/AuthService");
const { createFirstTeacher } = require("./Service/TeachersService");
const { createFirstPricing } = require("./Service/PricingService");
createFirstManagerAccount();
createFirstTeacher();
createFirstPricing();

// Routes
app.use("/", RoutesGoogleAuth);
app.use("/api/v1/auth", RoutesAuth);
app.use("/api/v1/users", RoutesUsers);
app.use("/api/v1/transaction", RoutesTransactions);
app.use("/api/v1/teacher", RoutesTeachers);
app.use("/api/v1/class", RoutesClasses);
app.use("/api/v1/section", RoutesSections);
app.use("/api/v1/lecture", RoutesLectures);
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

// Fallback Route for Client-side
app.get("*", (req, res) => {
  if (!req.originalUrl.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../build", "index.html"));
  } else {
    res.status(404).json({ message: "API endpoint not found" });
  }
});

// Error Handling
app.all("*", (req, res, next) => {
  next(new ApiError(`Sorry, this URL ${req.originalUrl} does not exist`, 400));
});
app.use(globalError);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
