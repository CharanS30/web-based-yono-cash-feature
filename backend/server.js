const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const path = require("path");
app.use(express.static(path.join(__dirname, "../public")));

app.use(express.json());
app.use(cors());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const yonoRoutes = require("./routes/yonoRoutes");
app.use("/api/yono", yonoRoutes);

const accountRoutes = require("./routes/accountRoutes");
app.use("/api/account", accountRoutes);


const atmRoutes = require("./routes/atmRoutes");
app.use("/api/atm", atmRoutes);


// DB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
