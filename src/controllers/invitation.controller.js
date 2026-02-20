const Invitation = require("../models/invitation.model");
const Project = require("../models/project.model");
const logActivity = require("../utils/activityLogger");
const notify = require("../utils/notify");

const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invitation token is required",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find invitation
    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation",
      });
    }

    // Check if already used
    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Invitation already used or expired",
      });
    }

    // Check expiry
    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await invitation.save();

      return res.status(400).json({
        success: false,
        message: "Invitation expired",
      });
    }

    // Ensure invite belongs to logged-in user
    if (
      invitation.email.toLowerCase() !==
      req.user.email.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "This invitation is not for your account",
      });
    }

    // Get project
    const project = await Project.findById(invitation.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if already member
    const alreadyMember = project.members.some(
      member => member.toString() === req.user._id.toString()
    );

    if (!alreadyMember) {
      project.members.push(req.user._id);
      await project.save();

      // Activity Log
      await logActivity({
        project: project._id,
        user: req.user._id,
        action: "JOIN_PROJECT",
        entityType: "PROJECT",
        entityId: project._id,
        message: `${req.user.email} joined the project`,
      });

      // Notify Project Owner
      await notify({
        user: project.owner,
        type: "PROJECT_JOINED",
        project: project._id,
        message: `${req.user.username} joined your project "${project.projectTitle}"`,
      });
    }

    // Mark invitation as accepted
    invitation.status = "accepted";
    await invitation.save();

    return res.status(200).json({
      success: true,
      message: "Invitation accepted successfully",
      projectId: project._id,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = { acceptInvitation };
