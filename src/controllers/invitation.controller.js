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

    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation",
      });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invitation expired",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    //  Ensure invite belongs to logged-in user
    if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "This invitation is not for your account",
      });
    }

    const project = await Project.findById(invitation.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const alreadyMember = project.members.some(
      member => member.toString() === req.user._id.toString()
    );

    if (!alreadyMember) {
      project.members.push(req.user._id);
      await project.save();

      //  Activity Log
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
        user: project.owner, // owner gets notification
        type: "PROJECT_JOINED",
        project: project._id,
        message: `${req.user.username} joined your project "${project.projectTitle}"`,
      });
    }

    await Invitation.deleteOne({ _id: invitation._id });

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
