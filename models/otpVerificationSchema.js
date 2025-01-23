const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
    user_email: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 } // OTP expires in 10 minutes (600 seconds)
});

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);

module.exports = OtpVerification;