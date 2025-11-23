// const express = require("express");
// const router = express.Router();
// const nodemailer = require("nodemailer");
// const YonoCash = require("../models/YonoCash");

// // email + password stored in .env
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // send YONO cash reference mail
// router.post("/send-reference", async (req, res) => {
//   try {
//     const { email, amount, pin } = req.body;

//     if (!email || !amount || !pin) {
//       return res.status(400).json({ success: false, message: "Missing fields" });
//     }

//     // generate random 6-digit reference number
//     const referenceNumber = String(Math.floor(100000 + Math.random() * 900000));

//     // store in DB
//     const record = new YonoCash({
//       email: email.toLowerCase(),
//       amount,
//       pin,
//       referenceNumber,
//     });

//     await record.save();

//     // send email
//     const mailOptions = {
//       from: `"YONO SBI" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "Your YONO Cash Reference Number",
//       text: `Dear Customer,

// Your YONO Cash transaction reference number is: ${referenceNumber}

// Use this number and the PIN you set to withdraw the entered amount at your virtual ATM.

// Transaction Amount: ₹${amount}

// Thank you for using YONO SBI.`,
//     };

//     await transporter.sendMail(mailOptions);

//     res.json({ success: true, message: "Reference number sent", referenceNumber });
//   } catch (err) {
//     console.error("Error in send-reference:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// module.exports = router;

// below working for withdrawal no deposit 
// const express = require("express");
// const router = express.Router();
// const nodemailer = require("nodemailer");
// const YonoCash = require("../models/YonoCash");

// router.post("/sendReference", async (req, res) => {
//   try {
//     const { email, amount, pin, referenceNumber } = req.body;
//     if (!email || !amount || !pin || !referenceNumber) {
//       return res.status(400).json({ success: false, message: "Missing fields" });
//     }

//     // Save in DB
//     await YonoCash.create({ email, amount, pin, referenceNumber });

//     // Send reference number email
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const mailOptions = {
//       from: `"SBI YONO" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "Your YONO Cash Reference Number",
//       text: `Dear user,\n\nYour YONO Cash Reference Number is ${referenceNumber}.\nUse this reference number with your PIN at the virtual ATM.\n\nAmount: ₹${amount}\nValid for 4 hours.\n\nThank you for using YONO Cash.`,
//     };

//     await transporter.sendMail(mailOptions);
//     res.json({ success: true, message: "Reference sent successfully" });
//   } catch (err) {
//     console.error("YONO Reference Error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// module.exports = router;

//=for deposit & withdrawal ==

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

