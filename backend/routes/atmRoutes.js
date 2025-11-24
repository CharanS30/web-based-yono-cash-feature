// backend/routes/atmRoutes.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const YonoCash = require("../models/YonoCash");
const User = require("../models/User");

// helper transporter
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

router.post("/validate", async (req, res) => {
  try {
    const { referenceNumber, amount } = req.body;
    if (!referenceNumber || amount == null) {
      return res.status(400).json({ success: false, message: "Missing reference number or amount" });
    }

    const record = await YonoCash.findOne({ referenceNumber, amount, type: "withdraw" });
    if (!record) {
      return res.status(400).json({ success: false, message: "Invalid reference number or amount" });
    }

    return res.json({ success: true, message: "Reference and amount verified", email: record.email });
  } catch (error) {
    console.error("❌ Error in /validate:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/validate-pin", async (req, res) => {
  try {
    const { referenceNumber, pin } = req.body;
    if (!referenceNumber || !pin) {
      return res.status(400).json({ success: false, message: "Missing reference number or PIN" });
    }

    const record = await YonoCash.findOne({ referenceNumber, pin, type: "withdraw" });
    if (!record) {
      return res.status(400).json({ success: false, message: "Invalid PIN" });
    }

    const amount = parseFloat(record.amount);
    const email = record.email.toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.balance < amount) return res.status(400).json({ success: false, message: "Insufficient balance" });

    user.balance -= amount;
    await user.save();

    // send debit email
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: `"SBI YONO" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Transaction Successful - Amount Debited",
        text:
`Dear ${user.name || user.username || "Customer"},

Your YONO Cash withdrawal of ₹${amount} was successful.

Account No: ${user.accountNumber}
Available Balance: ₹${user.balance}

Thank you for using SBI YONO.`,
      };
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error("⚠️ Email sending failed:", mailErr);
    }

    // mark as used (delete)
    await YonoCash.deleteOne({ referenceNumber });

    return res.json({ success: true, message: `Transaction successful. ₹${amount} debited.`, amount, newBalance: user.balance });
  } catch (error) {
    console.error("❌ Error in /validate-pin:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


/**
 * NEW: Validate deposit reference only (used immediately after user enters reference)
 * POST /api/atm/validate-ref
 * body: { referenceNumber }
 * response success: { success:true, email, accountNumber }
 */
router.post("/validate-ref", async (req, res) => {
  try {
    const { referenceNumber } = req.body;
    if (!referenceNumber) return res.status(400).json({ success: false, message: "Reference number required" });

    // find deposit type record
    const record = await YonoCash.findOne({ referenceNumber, type: "deposit" });
    if (!record) return res.status(400).json({ success: false, message: "Invalid deposit reference number" });

    // return account/email info so ATM can display account number
    // record.email exists because yonoRoutes saved it earlier
    return res.json({
      success: true,
      email: record.email,
      accountNumber: record.accountNumber || null
    });
  } catch (err) {
    console.error("❌ Error in /validate-ref:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/deposit-confirm", async (req, res) => {
  try {
    const { referenceNumber, amount } = req.body;
    if (!referenceNumber || amount == null) {
      return res.status(400).json({ success: false, message: "referenceNumber and amount required" });
    }

    const record = await YonoCash.findOne({ referenceNumber, type: "deposit" });
    if (!record) return res.status(400).json({ success: false, message: "Invalid deposit reference number" });

    const depositAmount = Number(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // Find user by email on record
    const email = record.email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Credit the amount
    user.balance = (user.balance || 0) + depositAmount;
    await user.save();

    // Send deposit confirmation email to user
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: `"SBI YONO" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "YONO Cash Deposit Successful",
        text:
`Dear ${user.name || user.username || "Customer"},

Your account has been credited with ₹${depositAmount}.
Available Balance: ₹${user.balance}

Thank you for using YONO Cash.`,
      };
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error("⚠️ Deposit email send failed:", mailErr);
      // don't fail the transaction if email fails
    }

    // Remove the deposit reference record so it cannot be reused
    await YonoCash.deleteOne({ referenceNumber });

    return res.json({ success: true, message: "Deposit processed", amount: depositAmount, newBalance: user.balance });
  } catch (err) {
    console.error("❌ Error in /deposit-confirm:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
