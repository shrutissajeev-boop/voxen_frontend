// server.js
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
const pool = require('./config/db');  // Import the database pool

const app = express();

// ---------------------
// 🔧 Middleware setup
// ---------------------
app.use(cors({
  origin: ["http://localhost:5000", "http://localhost:5500"],
  credentials: true,
  allowedHeaders: ["*", "API_KEY_STORAGE_KEY"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session MUST be before passport
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});



// ---------------------
// 🚀 Routes
// ---------------------

// Frontend Pages (static HTML)
app.use("/", pageRoutes);

// Test database connection endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    // Test basic connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    // Check specific tables
    const tableChecks = {
      users: false,
      conversations: false,
      messages: false,
      reviews: false,
      embeddings: false
    };
    
    tables.rows.forEach(row => {
      if (tableChecks.hasOwnProperty(row.table_name)) {
        tableChecks[row.table_name] = true;
      }
    });
    
    client.release();
    
    res.json({
      status: 'success',
      databaseTime: result.rows[0].now,
      tables: tableChecks,
      message: 'Database connection successful!',
      details: 'Check the tables object to see which required tables exist.'
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

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
  console.log(`\n📝 Environment Check:`);
  console.log(`   - GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅' : '❌ MISSING'}`);
  console.log(`   - GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✅' : '❌ MISSING'}`);
  console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? '✅' : '❌ MISSING'}`);
  console.log(`   - SESSION_SECRET: ${process.env.SESSION_SECRET ? '✅' : '❌ MISSING'}`);
  console.log(`   - DB_NAME: ${process.env.DB_NAME || 'astro_auth'}`);
  console.log(`\n🔗 OAuth Callback URL: http://localhost:${PORT}/api/auth/google/callback`);
  console.log(`   Make sure this matches in Google Console!\n`);
});