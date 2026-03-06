const express = require("express");
const router = express.Router();

const {
     signup, 
     signin,
     forgotPassword,
     resetPassword,
    } = require("../controllers/auth.controller");
    

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);
    


router.post("/register", signup);
router.post("/login", signin);

module.exports = router;

