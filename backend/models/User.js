// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    dob: Date,
    gender: String,
    email: { type: String, required: true, unique: true, lowercase: true },
    address: String,
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    accountNumber: { type: String, unique: true },
    ifsc: { type: String, default: process.env.IFSC_CODE || 'MSV004323' },
    balance: { type: Number, default: 5000 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
