// Core dependencies
const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();

// Custom middleware and config
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
require("./config/db");          // Database connection
require("./config/passport");    // Passport configuration

// Route imports
const apiRoutes = require("./routes/index");   // All /api routes
const pageRoutes = require("./routes/pages");  // Frontend page routes

const app = express();

// ---------------------
// 🔧 Middleware setup
// ---------------------
app.use(cors({
  origin: "http://localhost:5500", // You can remove this if front + back on same domain
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// ---------------------
// 🚀 Routes
// ---------------------

// Frontend Pages (static HTML)
app.use("/", pageRoutes);

// Backend APIs (JSON)
app.use("/api", apiRoutes);

// ---------------------
// ⚠️ Error Handlers
// ---------------------
app.use(notFound);
app.use(errorHandler);

// ---------------------
// 🌍 Start the server
// ---------------------
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`API routes at: http://localhost:${PORT}/api`);
});

