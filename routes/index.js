const express = require("express");
const router = express.Router();

// Import other route files
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const chatRoutes = require("./chatRoutes"); // 👈 add this

// Use them with prefixes
router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/chat", chatRoutes); // 👈 add this

module.exports = router;
