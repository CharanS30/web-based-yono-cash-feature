// backend/routes/accountRoutes.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require("../models/User"); // your User model

// Helper: transport using env variables
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// GET /api/account/details?email=...
// ✅ GET /api/account/details?email=...
router.get("/details", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // send only accountNumber and balance
    return res.json({
      success: true,
      accountNumber: user.accountNumber || "N/A",
      balance: user.balance ?? 0
    });
  } catch (err) {
    console.error("Error /account/details:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/account/balance?email=...
router.get("/balance", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, balance: user.balance });
  } catch (err) {
    console.error("Error /account/balance:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/account/updateBalance
// body: { email, amount }
// deducts amount, saves, sends debit email, and returns new balance
router.post("/updateBalance", async (req, res) => {
  try {
    const { email, amount } = req.body;
    if (!email || amount == null) return res.status(400).json({ success: false, message: "Email and amount required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

    if (user.balance < amt) return res.status(400).json({ success: false, message: "Insufficient balance" });

    user.balance = user.balance - amt;
    await user.save();

    // send debit email
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: `"SBI YONO" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Transaction Alert - Amount Debited",
        text: `Dear ${user.username || user.name || "Customer"},\n\n₹${amt} has been debited from your account (A/C: ${user.accountNumber}).\nAvailable balance: ₹${user.balance}.\n\nIf you did not authorize this transaction, contact us immediately.\n\nThanks,\nSBI YONO`,
      };
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error("Failed to send debit email:", mailErr);
      // do not fail the whole flow because of email failure
    }

    return res.json({ success: true, newBalance: user.balance });
  } catch (err) {
    console.error("Error /account/updateBalance:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
