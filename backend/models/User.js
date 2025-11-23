// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    dob: Date,
    gender: String,
    email: { type: String, required: true, unique: true, lowercase: true },
    address: String,
    username: { type: String, required: true, unique: true },
    // NOTE: password may be hashed or plain depending on how you registered users.
    // We support both by comparing using bcrypt then falling back to plain compare.
    password: { type: String, required: true },
    accountNumber: { type: String, unique: true },
    ifsc: { type: String, default: process.env.IFSC_CODE || 'MSV004323' },
    balance: { type: Number, default: 5000 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
