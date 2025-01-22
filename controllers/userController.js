const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
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

module.exports = { registerUser, loginUser };