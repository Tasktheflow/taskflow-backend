const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const notify = require("../utils/notify");
const crypto =require("crypto");
//const sendEmail =require("../utils/sendEmail");
const sendEmail = require("../utils/emailService");

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

    await sendEmail({
  to: user.email,
  subject: "Welcome to TaskFlow ",
  htmlContent: `
    <h2>Welcome to TaskFlow</h2>
    <p>Hello ${user.username},</p>
    <p>Your account has been created successfully.</p>
    <p>Start managing your projects efficiently </p>
  `,
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
  subject: "New Login Detected ",
  htmlContent: `
    <h3>Login Alert</h3>
    <p>Hello ${user.username},</p>
    <p>A new login was detected on your account.</p>
    <p>If this wasn’t you, please change your password immediately.</p>
  `,
});    } catch (err) {
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


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // generate raw token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // hash token before saving to DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;

    //  expire in 15 minutes
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    //  send RAW token in email
    const resetLink = `https://task-flow-g8s6.vercel.app/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      htmlContent: `
        <h3>Password Reset</h3>
        <p>Click the link below to reset your password.</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.json({
      success: true,
      message: "Password reset email sent",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // hash the token from user
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token is invalid or expired",
      });
    }

    // update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  signup,
  signin,
  forgotPassword,
  resetPassword,
};
