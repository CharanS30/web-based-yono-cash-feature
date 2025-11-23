// const mongoose = require("mongoose");

// const yonoCashSchema = new mongoose.Schema({
//   email: { type: String, required: true },
//   amount: { type: Number, required: true },
//   pin: { type: String, required: true },
//   referenceNumber: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("YonoCash", yonoCashSchema);


// =for deposit & withdrawal ==

// backend/models/YonoCash.js
const mongoose = require("mongoose");

const yonoCashSchema = new mongoose.Schema({
  email: { type: String, required: true },
  amount: { type: Number },           // optional: deposit may not send amount
  pin: { type: String },              // optional: deposit flow doesn't provide pin
  referenceNumber: { type: String, required: true },
  type: { type: String, enum: ["withdraw", "deposit"], default: "withdraw" },
  channel: { type: String },          // e.g. "Virtual ATM" or "CDM" (optional)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("YonoCash", yonoCashSchema);
