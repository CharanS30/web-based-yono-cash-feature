const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true },
    otp: { type: String, required: true },
    type: { type: String, enum: ['register', 'login'], default: 'login' },
    createdAt: { type: Date, default: Date.now, expires: 300 } // expires after 300 seconds (5 minutes)
});

// TTL index created via 'expires' option on createdAt
module.exports = mongoose.model('Otp', OtpSchema);
