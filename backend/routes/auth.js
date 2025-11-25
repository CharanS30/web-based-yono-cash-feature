const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

// Nodemailer transporter (make sure EMAIL_USER and EMAIL_PASS are set in Render env)
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// OAuth2 client setup
const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

// Create transporter
async function createTransporter() {
    const accessToken = await oauth2Client.getAccessToken();

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.EMAIL_USER,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            accessToken: accessToken?.token || accessToken
        }
    });
}


// Verify transporter at startup (helps catch auth/DNS errors early in logs)
// transporter.verify()
//   .then(() => {
//     console.log('✅ Nodemailer transporter verified (ready to send mail)');
//   })
//   .catch(err => {
//     console.error('❌ Nodemailer verify failed — check EMAIL_USER / EMAIL_PASS and network:');
//     console.error(err);
//   });

// Helper: send OTP (handles registration/login) — improved error logging
async function sendOtpEmail(email, otp, type) {
    let subject, text;

    if (type === "register") {
        subject = "YONO SBI - Registration OTP";
        text = `Dear Customer,\n\nYour OTP for registration is: ${otp}\nValid for 5 minutes.\n\nThanks,\nYONO SBI`;
    } else {
        subject = "YONO SBI - Login OTP";
        text = `Dear Customer,\n\nYour OTP for login is: ${otp}\nValid for 5 minutes.\n\nThanks,\nYONO SBI`;
    }

    const transporter = await createTransporter();
    await transporter.sendMail({
        from: `"YONO SBI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        text,
    });
}


// ---------------------- Helper: send account details email (OAuth2) ----------------------

async function sendAccountEmail(email, accountNumber, ifsc) {
    const subject = "YONO SBI — Your Account Details";
    const text = `Congratulations! Your account has been created successfully.\n\n` +
                 `Account Number: ${accountNumber}\n` +
                 `IFSC: ${ifsc}\n\n` +
                 `Thank you for registering with YONO SBI.`;    

    try {
        const transporter = await createTransporter();   // OAuth2 transporter
        await transporter.sendMail({
            from: `"YONO SBI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            text,
        });
        console.log("📩 Account details email sent to:", email);
    } catch (err) {
        console.error("❌ Failed to send account email:", err);
    }
}


// ---------------------- Registration ----------------------

// Send registration OTP
router.post("/send-otp", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.json({
                success: false,
                message: "Email already registered. Please login instead.",
                redirectToLogin: true,
            });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        await Otp.create({ email: email.toLowerCase(), otp, type: "register" });
        await sendOtpEmail(email, otp, "register");

        return res.json({ success: true });
    } catch (err) {
        console.error("Error sending registration OTP:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// Register (verify OTP + create user + send account details)
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, otp } = req.body;
        if (!username || !email || !password || !otp) {
            return res.status(400).json({ success: false, message: "All fields required" });
        }

        const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp, type: "register" });
        if (!otpRecord) return res.json({ success: false, message: "Invalid OTP" });

        const diff = Date.now() - new Date(otpRecord.createdAt).getTime();
        if (diff > 5 * 60 * 1000) {
            return res.json({ success: false, message: "OTP expired" });
        }

        // --- Ensure username & email are unique ---
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername)
            return res.json({ success: false, message: "Username already taken" });

        const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingUserByEmail)
            return res.json({ success: false, message: "Email already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);

        // --- Generate unique 12-digit account number ---
        let accountNumber;
        let isUnique = false;
        while (!isUnique) {
            accountNumber = String(Math.floor(100000000000 + Math.random() * 900000000000));
            const ex = await User.findOne({ accountNumber });
            if (!ex) isUnique = true;
        }

        const ifsc = process.env.IFSC_CODE || "MSV004323";

        // ✅ Create user with default ₹5000 balance
        const newUser = await User.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            accountNumber,
            ifsc,
            balance: 5000, // default starting balance
        });

        // Clean up OTP record
        await Otp.deleteMany({ email: email.toLowerCase() });

        // Send account details email
        try {
            await sendAccountEmail(email, accountNumber, ifsc);
        } catch (mailErr) {
            console.error("Failed to send account email:", mailErr);
        }

        return res.json({
            success: true,
            message: "Registration successful. Default balance ₹5000 added.",
        });
    } catch (err) {
        console.error("Error during registration:", err);
        if (err.code === 11000) {
            return res
                .status(500)
                .json({ success: false, message: "Duplicate key: " + JSON.stringify(err.keyValue) });
        }
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// ---------------------- Login ----------------------

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ success: false, message: "Username and password required" });

        const user = await User.findOne({ username });
        if (!user) return res.json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.json({ success: false, message: "Invalid password" });

        // generate login OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        await Otp.create({ email: user.email.toLowerCase(), otp, type: "login" });

        try {
            await sendOtpEmail(user.email, otp, "login");
        } catch (mailErr) {
            console.error("Error sending login OTP email:", mailErr);
        }

        // ✅ Return account details to frontend
        return res.json({
            success: true,
            message: "OTP sent to registered email",
            username: user.username,
            email: user.email.toLowerCase(),
            accountNumber: user.accountNumber || null,
            balance: user.balance != null ? user.balance : 0,
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "Server error during login" });
    }
});

// Verify login OTP
router.post("/login/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp)
            return res.status(400).json({ success: false, message: "Email and OTP required" });

        const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp, type: "login" });
        if (!otpRecord) return res.json({ success: false, message: "Invalid OTP" });

        const diff = Date.now() - new Date(otpRecord.createdAt).getTime();
        if (diff > 5 * 60 * 1000) {
            return res.json({ success: false, message: "OTP expired" });
        }

        await Otp.deleteMany({ email: email.toLowerCase(), type: "login" });
        return res.json({ success: true, message: "Login successful" });
    } catch (err) {
        console.error("Error verifying login OTP:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});



module.exports = router;
