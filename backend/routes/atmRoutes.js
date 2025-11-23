// const express = require("express");
// const router = express.Router();
// const YonoCash = require("../models/YonoCash");
// const User = require("../models/User");
// const nodemailer = require("nodemailer");

// // ✅ STEP 1: Validate Reference Number and Amount
// router.post("/validate", async (req, res) => {
//   try {
//     const { referenceNumber, amount } = req.body;

//     if (!referenceNumber || !amount) {
//       return res.status(400).json({ success: false, message: "Missing reference number or amount" });
//     }

//     const record = await YonoCash.findOne({ referenceNumber, amount });
//     if (!record) {
//       return res.status(400).json({ success: false, message: "Invalid reference number or amount" });
//     }

//     res.json({
//       success: true,
//       message: "Reference and amount verified",
//       email: record.email,
//     });
//   } catch (error) {
//     console.error("❌ Error in /validate:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // ✅ STEP 2: Validate PIN, Deduct Balance, and Send Email
// router.post("/validate-pin", async (req, res) => {
//   try {
//     const { referenceNumber, pin } = req.body;

//     if (!referenceNumber || !pin) {
//       return res.status(400).json({ success: false, message: "Missing reference number or PIN" });
//     }

//     // 1️⃣ Find YonoCash record
//     const record = await YonoCash.findOne({ referenceNumber, pin });
//     if (!record) {
//       return res.status(400).json({ success: false, message: "Invalid PIN" });
//     }

//     const amount = parseFloat(record.amount);
//     const email = record.email.toLowerCase();

//     // 2️⃣ Find User
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     // 3️⃣ Deduct amount from balance
//     if (user.balance < amount) {
//       return res.status(400).json({ success: false, message: "Insufficient balance" });
//     }

//     user.balance -= amount;
//     await user.save(); // 💾 DB update confirmed

//     console.log(`✅ Balance updated for ${email}: ₹${user.balance}`);

//     // 4️⃣ Send debit email
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
//       subject: "Transaction Successful - Amount Debited",
//       text: `Dear ${user.username || user.name || "Customer"},

// Your YONO Cash withdrawal of ₹${amount} was successful.

// Account No: ${user.accountNumber}
// Available Balance: ₹${user.balance}

// If this was not authorized by you, please contact SBI immediately.

// Thank you for using SBI YONO.`,
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//       console.log(`📧 Email sent successfully to ${email}`);
//     } catch (emailErr) {
//       console.error("⚠️ Email sending failed:", emailErr);
//     }

//     // 5️⃣ Mark YonoCash record as used (optional)
//     await YonoCash.deleteOne({ referenceNumber });
//     console.log(`🧹 Deleted used YonoCash record: ${referenceNumber}`);

//     // 6️⃣ Respond success
//     res.json({
//       success: true,
//       message: `Transaction successful. ₹${amount} debited.`,
//       amount,
//       newBalance: user.balance,
//     });
//   } catch (error) {
//     console.error("❌ Error in /validate-pin:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// module.exports = router;

//include deposit also, above only withdrawal

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

/**
 * EXISTING: Validate reference+amount for withdrawal (unchanged)
 * POST /api/atm/validate
 * body: { referenceNumber, amount }
 */
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

/**
 * EXISTING: Validate PIN, Deduct Balance, and Send Email (withdraw)
 * POST /api/atm/validate-pin
 * body: { referenceNumber, pin }
 */
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

/**
 * NEW: Confirm deposit and credit user
 * POST /api/atm/deposit-confirm
 * body: { referenceNumber, amount }
 * response: { success:true, amount, newBalance }
 */
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
