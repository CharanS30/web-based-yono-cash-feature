// backend/routes/yonoRoutes.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const YonoCash = require("../models/YonoCash");

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

router.post("/sendReference", async (req, res) => {
  try {
    const {
      email,
      amount,
      pin,
      pinHash,
      referenceNumber,
      type = "withdraw",
      accountNumber,
      channel,
      deliveryOption
    } = req.body;

    if (!email || !referenceNumber) {
      return res.status(400).json({ success: false, message: "Missing required fields: email or referenceNumber" });
    }

    if (type === "withdraw") {
      if (amount == null || (!pin && !pinHash)) {
        return res.status(400).json({ success: false, message: "Missing fields for withdraw: amount or pin" });
      }
    } else if (type !== "deposit") {
      return res.status(400).json({ success: false, message: "Invalid type. Use 'withdraw' or 'deposit'." });
    }

    const storedPin = pin || pinHash || null;
    const storedAmount = amount != null ? Number(amount) : undefined;

    await YonoCash.create({
      email,
      amount: storedAmount,
      pin: storedPin,
      referenceNumber,
      type,
      channel: channel || deliveryOption || (type === "withdraw" ? "Virtual ATM" : "CDM"),
    });

    // Prepare email
    let mailText = "";
    let subject = "";

    if (type === "withdraw") {
      subject = "YONO Cash Withdrawal – Reference Number";

      mailText =
        `Dear user,\n\n` +
        `Your YONO cash Reference number is ${referenceNumber}.\n` +
        `Use this reference number with your PIN at the virtual ATM\n\n` +
        `Amount : ₹${amount}\n` +
        `Valid for 4 hours\n\n` +
        `Thank you for using Yono Cash`;
    } 
    
    else if (type === "deposit") {
      subject = "YONO Cash Deposit – Reference Number";

      mailText =
        `Dear user,\n\n` +
        `Your YONO cash Reference number is ${referenceNumber}.\n` +
        `Use this deposit reference number at the virtual ATM.\n\n` +
        `Valid for 4 hours\n\n` +
        `Thank you for using Yono Cash`;
    }

    const transporter = createTransporter();
    const mailOptions = {
      from: `"SBI YONO" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: mailText,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: type === "withdraw" 
        ? "Withdraw reference sent successfully" 
        : "Deposit reference sent successfully"
    });

  } catch (err) {
    console.error("YONO Reference Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

