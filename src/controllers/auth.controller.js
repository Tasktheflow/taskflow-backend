const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const notify = require("../utils/notify");
const sendEmail =require("../utils/sendEmail");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },  
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Signup USER
const signup = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ 
      $or: [{email }, { username }],
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email or username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        token,
        user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      },
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Signin USER
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    const token = generateToken(user);

    // SEND RESPONSE
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });

    
    try {
      await notify({
        user: user._id,
        type: "LOGIN_ALERT",
        message: "New login detected on your account",
      });

      await sendEmail({
        to: user.email,
        subject: "New login detected",
        html: `
          <p>Hello ${user.username},</p>
          <p>A new login was detected on your account.</p>
          <p>If this wasn't you, please reset your password immediately.</p>
        `,
      });
    } catch (err) {
      console.error("Login notification failed:", err.message);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



module.exports = {
  signup,
  signin,
};
