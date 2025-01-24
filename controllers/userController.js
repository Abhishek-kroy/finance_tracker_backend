const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/userModel');
const OtpVerification = require('../models/otpVerificationSchema');
const axios = require('axios')
require('dotenv').config();


// Handle user registration
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists!" });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with hashed password
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        res.status(201).json({ success: true, message: "User registered successfully!", user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error registering user", error: err.message });
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: `${process.env.EMAIL}`, // Replace with your email
        pass: `${process.env.PASS}`, // Replace with your email's app password
    },
});

const sendOtp = async (req, res) => {
    try {
        console.log("sending otp");
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({success:false, message: 'Email is required' });
        }

        // Generate a new OTP (6-digit)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Upsert the OTP entry (update if exists, insert otherwise)
        const result = await OtpVerification.findOneAndUpdate(
            { user_email: email }, // Filter by email
            { otp: otp, createdAt: Date.now() }, // Update fields
            { upsert: true, new: true, setDefaultsOnInsert: true } // Options
        );

        console.log('OTP Saved:', result);

        // Define email options
        const mailOptions = {
            from: `${process.env.EMAIL}`, // Replace with your email
            to: email,
            subject: 'Sign-Up OTP for Finance Tracker',
            html: `
                <html>
                  <head>
                    <title>Sign-Up OTP</title>
                  </head>
                  <body>
                    <div style="font-family:sans-serif; color:#444444; font-size:14px; line-height:20px; padding:20px;">
                      <h2 style="color:#333333;">Welcome to Finance Tracker!</h2>
                      <p>Hello, <strong>${email}</strong>!</p>
                      <p>Thank you for signing up on our Finance Tracker platform. To complete your registration, please enter the OTP below:</p>
                      <p style="font-size:16px; font-weight:bold;">Your OTP is: <span style="color:#ff6600;">${otp}</span></p>
                      <p>This OTP is valid for 10 minutes. Please use it to verify your account.</p>
                      <p>If you did not request this sign-up, please ignore this email.</p>
                    </div>
                  </body>
                </html>
            `,
        };

        // Send the OTP via email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.response);

        // Respond with success
        res.status(200).json({success:true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error in sendOtp:', error);
        if (!res.headersSent) {
            res.status(500).json({success:false, message: 'Error sending OTP', error });
        }
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        console.log("email",email);
        console.log("otp",otp);

        if (!email || !otp) {
            return res.status(400).json({success:false, message: 'Email and OTP are required' });
        }

        // Find the OTP entry for the given email
        const record = await OtpVerification.findOne({ user_email: email });

        if (!record) {
            return res.status(404).json({success:false, message: 'OTP not found. Please request a new OTP.' });
        }

        // Check if the OTP matches
        if (record.otp !== otp) {
            return res.status(400).json({success:false, message: 'Invalid OTP' });
        }

        // Check if the OTP has expired (assuming a 5-minute validity)
        const now = Date.now();
        const otpExpiryTime = new Date(record.createdAt).getTime() + 5 * 60 * 1000; // Add 5 minutes

        if (now > otpExpiryTime) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
        }

        // OTP is valid
        res.status(200).json({success:true, message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Error in verifyOtp:', error);
        res.status(500).json({success:false, message: 'Error verifying OTP', error });
    }
};

// Handle user login
const loginUser = async (req, res) => {
    const { email, password, recaptchaToken } = req.body;

    if (!email || !password || !recaptchaToken) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    try {
        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
        const recaptchaResponse = await axios.post("https://www.google.com/recaptcha/api/siteverify", null, {
            params: {
                secret: recaptchaSecret,
                response: recaptchaToken,
            },
        });

        if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) {
            return res.status(403).json({ success: false, message: "reCAPTCHA verification failed!" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password!" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, message: "Invalid email or password!" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log('Login successful');
        res.status(200).json({
            success: true,
            message: "Login successful!",
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error logging in", error: err.message });
    }
};

module.exports = { registerUser, sendOtp, verifyOtp, loginUser };