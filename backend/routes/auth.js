// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");
// const Otp = require("../models/Otp");
// const nodemailer = require("nodemailer");
// const bcrypt = require("bcryptjs");

// // ===== Setup Nodemailer transporter =====
// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL_USER, // your Gmail
//         pass: process.env.EMAIL_PASS, // app password
//     },
// });

// // ===== Helper: Send OTP Email =====
// async function sendOtpEmail(email, otp, purpose) {
//     const subject =
//         purpose === "registration"
//             ? "Your Registration OTP"
//             : "Your Login OTP (valid 5 minutes)";
//     const text =
//         purpose === "registration"
//             ? `Your OTP for registration is: ${otp}. It is valid for 5 minutes.`
//             : `Your OTP for login is: ${otp}. It is valid for 5 minutes.`;

//     await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject,
//         text,
//     });
// }

// // ================== REGISTRATION ==================

// // Step 1: Send OTP (registration)
// router.post("/send-otp", async (req, res) => {
//     const { email } = req.body;
//     const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

//     try {
//         await Otp.create({ email, otp, expiresAt });
//         await sendOtpEmail(email, otp, "registration");
//         res.json({ success: true });
//     } catch (err) {
//         console.error("Error sending OTP:", err);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// });

// // Step 2: Verify OTP & Save User
// router.post("/register", async (req, res) => {
//     const { username, email, password, otp } = req.body;

//     try {
//         // Check OTP
//         const otpRecord = await Otp.findOne({ email, otp });
//         if (!otpRecord) {
//             return res.json({ success: false, message: "Invalid OTP" });
//         }
//         if (otpRecord.expiresAt < new Date()) {
//             return res.json({ success: false, message: "OTP expired" });
//         }

//         // Check if email already registered
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.json({ success: false, message: "Email already registered" });
//         }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create user
//         await User.create({
//             username,
//             email,
//             password: hashedPassword,
//         });

//         // Delete used OTP
//         await Otp.deleteMany({ email });

//         res.json({ success: true, message: "Registration successful" });
//     } catch (err) {
//         console.error("Error during registration:", err);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// });

// // ================== LOGIN ==================

// // Step 1: Validate credentials & send OTP
// router.post("/login", async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         const user = await User.findOne({ username });
//         if (!user) {
//             return res.json({ success: false, message: "User not found" });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.json({ success: false, message: "Invalid password" });
//         }

//         // Generate OTP for login
//         const otp = Math.floor(100000 + Math.random() * 900000);
//         const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//         await Otp.create({ email: user.email, otp, expiresAt });
//         await sendOtpEmail(user.email, otp, "login");

//         res.json({ success: true, message: "OTP sent to registered email", email: user.email });
//     } catch (err) {
//         console.error("Login error:", err);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// });

// // ================== OTP VERIFICATION (Login + Registration) ==================
// router.post("/verify-otp", async (req, res) => {
//     const { email, otp } = req.body;

//     try {
//         const otpRecord = await Otp.findOne({ email, otp });
//         if (!otpRecord) {
//             return res.json({ success: false, message: "Invalid OTP" });
//         }
//         if (otpRecord.expiresAt < new Date()) {
//             return res.json({ success: false, message: "OTP expired" });
//         }

//         // OTP valid -> delete it
//         await Otp.deleteMany({ email });

//         res.json({ success: true, message: "OTP verified successfully" });
//     } catch (err) {
//         console.error("OTP verification error:", err);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// });

// module.exports = router;
// previous one 

// below one working but existing user validation after entering otp 

// ----------------------------------------------------------------------------------------------------------
// updated no balance feature
// backend/routes/auth.js
// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");
// const Otp = require("../models/Otp");
// const nodemailer = require("nodemailer");
// const bcrypt = require("bcryptjs");

// // Nodemailer transporter (make sure EMAIL_USER and EMAIL_PASS are in backend/.env)
// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
// });

// // Helper: send OTP (handles registration/login)
// async function sendOtpEmail(email, otp, type) {
//     let subject, text;
//     if (type === "register") {
//         subject = "YONO SBI - Registration OTP";
//         text = `Dear Customer,\n\nYour OTP for registration is: ${otp}\nThis OTP is valid for 5 minutes.\n\nThanks,\nYONO SBI`;
//     } else {
//         subject = "YONO SBI - Login OTP";
//         text = `Dear Customer,\n\nYour OTP for login is: ${otp}\nThis OTP is valid for 5 minutes.\n\nThanks,\nYONO SBI`;
//     }

//     await transporter.sendMail({
//         from: `"YONO SBI" <${process.env.EMAIL_USER}>`,
//         to: email,
//         subject,
//         text,
//     });
// }

// // Helper: send account number + IFSC after registration
// async function sendAccountEmail(email, accountNumber, ifsc) {
//     const subject = "YONO SBI — Your Account Details";
//     const text = `Congratulations! Your account has been created.\n\nAccount Number: ${accountNumber}\nIFSC: ${ifsc}\n\nThank you for registering with YONO SBI.`;
//     await transporter.sendMail({
//         from: `"YONO SBI" <${process.env.EMAIL_USER}>`,
//         to: email,
//         subject,
//         text,
//     });
// }

// /**
//  * NOTE about OTP storage:
//  * Your Otp schema uses `createdAt` with TTL (expires: 300).
//  * We will set `type` to 'register' or 'login' and rely on createdAt TTL.
//  */

// // ---------------------- Registration ----------------------

// // Send registration OTP
// // ---------------------- Registration ----------------------

// // Send registration OTP
// router.post("/send-otp", async (req, res) => {
//     try {
//         const { email } = req.body;
//         if (!email) return res.status(400).json({ success: false, message: "Email required" });

//         // ✅ Check if email already exists
//         const existingUser = await User.findOne({ email: email.toLowerCase() });
//         if (existingUser) {
//             return res.json({
//                 success: false,
//                 message: "Email already registered. Please login instead.",
//                 redirectToLogin: true   // 👈 flag for frontend
//             });
//         }

//         const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit as string
//         await Otp.create({ email: email.toLowerCase(), otp, type: "register" });
//         await sendOtpEmail(email, otp, "register");

//         return res.json({ success: true });
//     } catch (err) {
//         console.error("Error sending registration OTP:", err);
//         return res.status(500).json({ success: false, message: "Server error" });
//     }
// });

// // Register (verify OTP + create user + send account details)
// router.post("/register", async (req, res) => {
//     try {
//         const { username, email, password, otp } = req.body;
//         if (!username || !email || !password || !otp) {
//             return res.status(400).json({ success: false, message: "All fields required" });
//         }

//         const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp, type: "register" });
//         if (!otpRecord) return res.json({ success: false, message: "Invalid OTP" });

//         // check TTL manually too (safer)
//         const diff = Date.now() - new Date(otpRecord.createdAt).getTime();
//         if (diff > 5 * 60 * 1000) {
//             return res.json({ success: false, message: "OTP expired" });
//         }

//         // check duplicates
//         const existingUserByUsername = await User.findOne({ username });
//         if (existingUserByUsername) return res.json({ success: false, message: "Username already taken" });

//         const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
//         if (existingUserByEmail) return res.json({ success: false, message: "Email already registered" });

//         // hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // generate unique 12-digit account number
//         let accountNumber;
//         let isUnique = false;
//         while (!isUnique) {
//             accountNumber = String(Math.floor(100000000000 + Math.random() * 900000000000)); // 12-digit
//             const ex = await User.findOne({ accountNumber });
//             if (!ex) isUnique = true;
//         }

//         const ifsc = process.env.IFSC_CODE || "MSV004323";

//         const newUser = await User.create({
//             username,
//             email: email.toLowerCase(),
//             password: hashedPassword,
//             accountNumber,
//             ifsc,
//         });

//         // remove OTPs for that email (cleanup)
//         await Otp.deleteMany({ email: email.toLowerCase() });

//         // send account number + IFSC to user's email
//         try {
//             await sendAccountEmail(email, accountNumber, ifsc);
//         } catch (mailErr) {
//             console.error("Failed to send account email (user created):", mailErr);
//             // don't fail registration — user is created; but notify in response if desired
//         }

//         return res.json({ success: true, message: "Registration successful" });
//     } catch (err) {
//         console.error("Error during registration:", err);
//         // if duplicate key error happens (very unlikely now), return readable message
//         if (err.code === 11000) {
//             return res.status(500).json({ success: false, message: "Duplicate key error: " + JSON.stringify(err.keyValue) });
//         }
//         return res.status(500).json({ success: false, message: "Server error" });
//     }
// });

// // ---------------------- Login ----------------------

// // Login: verify username+password, then GENERATE & SEND OTP to user's email
// router.post("/login", async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         if (!username || !password) return res.status(400).json({ success: false, message: "Username and password required" });

//         const user = await User.findOne({ username });
//         if (!user) return res.json({ success: false, message: "User not found" });

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) return res.json({ success: false, message: "Invalid password" });

//         // generate login OTP and store (type: login)
//         const otp = String(Math.floor(100000 + Math.random() * 900000));
//         await Otp.create({ email: user.email.toLowerCase(), otp, type: "login" });

//         // send OTP mail
//         try {
//             await sendOtpEmail(user.email, otp, "login");
//         } catch (mailErr) {
//             console.error("Error sending login OTP email:", mailErr);
//             // You can choose to return error here, but we'll return success so frontend proceeds to OTP entry
//             // and user will not receive mail — inform frontend appropriately if needed.
//         }

//         // return email so frontend knows which address to verify OTP against
//         return res.json({ success: true, message: "OTP sent to registered email", email: user.email.toLowerCase() });
//     } catch (err) {
//         console.error("Login error:", err);
//         return res.status(500).json({ success: false, message: "Server error during login" });
//     }
// });

// // Send login OTP separately (optional; kept for compatibility)
// router.post("/login/send-otp", async (req, res) => {
//     try {
//         const { email } = req.body;
//         if (!email) return res.status(400).json({ success: false, message: "Email required" });

//         const otp = String(Math.floor(100000 + Math.random() * 900000));
//         await Otp.create({ email: email.toLowerCase(), otp, type: "login" });
//         await sendOtpEmail(email, otp, "login");

//         return res.json({ success: true });
//     } catch (err) {
//         console.error("Error sending login OTP:", err);
//         return res.status(500).json({ success: false, message: "Server error" });
//     }
// });

// // Verify login OTP (matching frontend expectation)
// router.post("/login/verify-otp", async (req, res) => {
//     try {
//         const { email, otp } = req.body;
//         if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required" });

//         const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp, type: "login" });
//         if (!otpRecord) return res.json({ success: false, message: "Invalid OTP" });

//         // check expiry (5 minutes)
//         const diff = Date.now() - new Date(otpRecord.createdAt).getTime();
//         if (diff > 5 * 60 * 1000) {
//             return res.json({ success: false, message: "OTP expired" });
//         }

//         await Otp.deleteMany({ email: email.toLowerCase(), type: "login" });
//         return res.json({ success: true, message: "Login successful" });
//     } catch (err) {
//         console.error("Error verifying login OTP:", err);
//         return res.status(500).json({ success: false, message: "Server error" });
//     }
// });

// module.exports = router;

// --------------------------------------------------------
// updated with balance feature 
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

// Nodemailer transporter (make sure EMAIL_USER and EMAIL_PASS are in backend/.env)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Helper: send OTP (handles registration/login)
async function sendOtpEmail(email, otp, type) {
    let subject, text;
    if (type === "register") {
        subject = "YONO SBI - Registration OTP";
        text = `Dear Customer,\n\nYour OTP for registration is: ${otp}\nThis OTP is valid for 5 minutes.\n\nThanks,\nYONO SBI`;
    } else {
        subject = "YONO SBI - Login OTP";
        text = `Dear Customer,\n\nYour OTP for login is: ${otp}\nThis OTP is valid for 5 minutes.\n\nThanks,\nYONO SBI`;
    }

    await transporter.sendMail({
        from: `"YONO SBI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        text,
    });
}

// Helper: send account number + IFSC after registration
async function sendAccountEmail(email, accountNumber, ifsc) {
    const subject = "YONO SBI — Your Account Details";
    const text = `Congratulations! Your account has been created.\n\nAccount Number: ${accountNumber}\nIFSC: ${ifsc}\n\nThank you for registering with YONO SBI.`;
    await transporter.sendMail({
        from: `"YONO SBI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        text,
    });
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
