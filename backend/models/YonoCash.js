// backend/models/YonoCash.js
const mongoose = require("mongoose");

const yonoCashSchema = new mongoose.Schema({
  email: { type: String, required: true },
  amount: { type: Number },           
  pin: { type: String },              
  referenceNumber: { type: String, required: true },
  type: { type: String, enum: ["withdraw", "deposit"], default: "withdraw" },
  channel: { type: String },          // e.g. "Virtual ATM" or "CDM" 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("YonoCash", yonoCashSchema);
