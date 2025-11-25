// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// serve static files from public (must be before routes)
app.use(express.static(path.join(__dirname, "..", "public")));


// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const yonoRoutes = require("./routes/yonoRoutes");
app.use("/api/yono", yonoRoutes);

const accountRoutes = require("./routes/accountRoutes");
app.use("/api/account", accountRoutes);

const atmRoutes = require("./routes/atmRoutes");
app.use("/api/atm", atmRoutes);

// DB connection (fallback safe message if env var missing)
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.warn("⚠️ MONGO_URI not set. Using local mongo if available.");
}

mongoose
  .connect(MONGO_URI || "mongodb://localhost:27017/yono_sbi", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Serve login_page.html on root "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login_page.html"));
});

// Safe catch-all middleware for non-API routes (avoids path-to-regexp issues)
app.use((req, res, next) => {
  // If request is an API call, pass to next (so 404s or API handlers apply)
  if (req.path.startsWith('/api/')) return next();

  // Otherwise serve the SPA entry (login_page)
  return res.sendFile(path.join(__dirname, "..", "public", "login_page.html"));
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
