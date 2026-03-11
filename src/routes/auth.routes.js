const express = require("express");
const router = express.Router();

const {
     signup, 
     signin,
     forgotPassword,
     resetPassword,
     logout,
    } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
    

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);
router.post("/logout", authMiddleware, logout);
    


router.post("/register", signup);
router.post("/login", signin);

module.exports = router;

