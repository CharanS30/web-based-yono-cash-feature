const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();

// 🔥 IMPORTANT: Serve static frontend from /public folder (public is outside backend)
app.use(express.static(path.join(__dirname, "../public")));

app.use(express.json());
app.use(cors());

// --- Your existing routes here ---
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const yonoRoutes = require("./routes/yonoRoutes");
app.use("/api/yono", yonoRoutes);

const accountRoutes = require("./routes/accountRoutes");
app.use("/api/account", accountRoutes);

const atmRoutes = require("./routes/atmRoutes");
app.use("/api/atm", atmRoutes);

// -----------------------------------------------
// 🔥 DEFAULT ROUTE: When hitting "/" show login_page.html
// -----------------------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login_page.html"));
});

// -----------------------------------------------
// OPTIONAL: For any unknown GET route (except /api/*) → show login page
// prevents "Cannot GET /something"
// -----------------------------------------------
app.get("*", (req, res) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    return res.sendFile(path.join(__dirname, "../public/login_page.html"));
  }
  res.status(404).send("Not Found");
});

// -----------------------------------------------
// DB + Server Start
// -----------------------------------------------
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    // still start server so Render does not fail healthcheck
    app.listen(PORT, () => console.log(`Server running (DB error) on ${PORT}`));
  });
