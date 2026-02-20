const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");

const {
  inviteMember,
} = require("../controllers/project.controller");

const {
  acceptInvitation,
} = require("../controllers/invitation.controller");

// Send invitation
router.post("/", authMiddleware, inviteMember);

// Accept invitation
router.post("/accept", authMiddleware, acceptInvitation);

module.exports = router;