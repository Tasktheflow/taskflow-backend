const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user) {
      req.user = user;
    }

    next();
  } catch (err) {
    next();
  }
};

module.exports = optionalAuth;
