const Project = require("../models/project.model");
const User = require("../models/User.model");
const logActivity = require("../utils/activityLogger");
const Activity = require("../models/activity.model");
const notify = require("../utils/notify");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const Invitation = require("../models/invitation.model");




// CREATE PROJECT
const createProject = async (req, res) => {
  try {
    const { projectTitle, description, color } = req.body;

    if (!projectTitle) {
      return res.status(400).json({
        success: false,
        message: "Project title is required",
      });
    }

    const allowedColors = [
      "green",
      "blue",
      "gray",
      "red",
      "yellow",
      "teal",
      "orange",
    ];

    if (color && !allowedColors.includes(color)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project color",
      });
    }

    const project = await Project.create({
      projectTitle,
      description,
      color,
      owner: req.user._id,
      members: [req.user._id],
    });

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: "CREATE_PROJECT",
      entityType: "PROJECT",
      entityId: project._id,
      message: `Project "${project.projectTitle}" was created`,
    });

    const populatedProject = await Project.findById(project._id)
      .populate("members", "username email")
      .populate("owner", "username email");

    res.status(201).json({
      success: true,
      message: "Project created",
      data: populatedProject,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};

const inviteMember = async (req, res) => {
  try {
    const { projectId, email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can invite
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only project owner can invite members",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    
    // USER EXISTS
    
    if (user) {
      const alreadyMember = project.members.some(
        member => member.toString() === user._id.toString()
      );

      if (alreadyMember) {
        return res.status(400).json({
          message: "User already a member",
        });
      }

      project.members.push(user._id);
      await project.save();

      // Activity log
      await logActivity({
        project: project._id,
        user: req.user._id,
        action: "INVITE_MEMBER",
        entityType: "PROJECT",
        entityId: project._id,
        message: `${req.user.email} added ${normalizedEmail} to the project`,
      });

      await sendEmail({
        to: normalizedEmail,
        subject: "You were added to a project",
        html: `
          <p>Hello ${user.username},</p>
          <p>You have been added to the project <b>${project.projectTitle}</b>.</p>
        `,
      });

      const updatedProject = await Project.findById(projectId)
        .populate("members", "username email");

      return res.status(200).json({
        success: true,
        message: "User added successfully",
        members: updatedProject.members,
      });
    }

    
    // USER DOES NOT EXIST

    const existingInvite = await Invitation.findOne({
      email: normalizedEmail,
      project: project._id,
      status: "pending",
      expiresAt: { $gt: new Date() }
    });

    if (existingInvite) {
      return res.status(400).json({
        message: "User already has a pending invitation",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await Invitation.create({
      email: normalizedEmail,
      project: project._id,
      token,
      status: "pending",
      expiresAt,
    });

    // Activity log
    await logActivity({
      project: project._id,
      user: req.user._id,
      action: "INVITE_MEMBER",
      entityType: "PROJECT",
      entityId: project._id,
      message: `${req.user.email} invited ${normalizedEmail}`,
    });

    const inviteLink = `https://task-flow-g8s6.vercel.app/invite?token=${token}`;

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Project Invitation",
        html: `
          <p>You have been invited to join <b>${project.projectTitle}</b>.</p>
          <p>Click below to accept invitation:</p>
          <a href="${inviteLink}">${inviteLink}</a>
          <p>This link expires in 24 hours.</p>
        `,
      });
    } catch (err) {
      console.error("Email failed:", err.message);
    }

    return res.status(200).json({
      success: true,
      message: "Invitation email sent",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to invite member",
    });
  }
};


// GET PROJECT MEMBERS
const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate("owner", "username email")
      .populate("members", "username email");

    if (!project || project.deleted) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Ensure only members can see members list
    if (!project.members.some(
      member => member._id.toString() === req.user._id.toString()
    )) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Format roles
    const formattedMembers = project.members.map(member => ({
      _id: member._id,
      username: member.username,
      email: member.email,
      role:
        member._id.toString() === project.owner._id.toString()
          ? "Owner"
          : "Member",
    }));

    res.status(200).json({
      success: true,
      count: formattedMembers.length,
      members: formattedMembers,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch members",
    });
  }
};


// Get my projects excluding deleted ones
const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      members: req.user._id,
      deleted: false,
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

// Soft delete project user only if they are the owner
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { deleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!project) {
      return res.status(403).json({ message: "Only owner can delete this project" });
    }
await logActivity({
  user: req.user._id,
  action: "DELETE_PROJECT",
  entityType: "PROJECT",
  entityId: project._id,
  project: project._id,
  message: `Project "${project.projectTitle}" was deleted`,
});


    res.json({
      success: true,
      message: "Project moved to recycle bin",
      data: project,

    });
    
  } catch (error) {
    res.status(500).json({ message: "Failed to delete project" });
  }
};


// Get project recycle bin user can only see their own deleted projects
const getDeletedProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      owner: req.user._id,
      deleted: true,
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch deleted projects" });
  }
};


// Restore soft deleted project
const restoreProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, deleted: true },
      { deleted: false, deletedAt: null },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found in recycle bin" });
    }

   await logActivity({
  project: project._id,
  user: req.user._id,
  action: "RESTORE_PROJECT",
  entityType: "PROJECT",
  entityId: project._id,
  message: `Project "${project.projectTitle}" was restored`,
});




    res.json({
      success: true,
      message: "Project restored",
      data: project,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore project" });
  }
};

// ADD MEMBER TO PROJECT
const addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id, // only owner can add members
    });

    if (!project) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Proper ObjectId comparison
    const alreadyMember = project.members.some(
      member => member.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: "User already a member" });
    }

    project.members.push(user._id);
    await project.save();

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: "ADD_MEMBER",
      entityType: "PROJECT",
      entityId: user._id,
      message: `${user.email} was added to the project`,
    });

    await notify({
      user: user._id,
      type: "ADDED_TO_PROJECT",
      project: project._id,
      message: `You were added to project "${project.projectTitle}"`,
    });

    await sendEmail({
      to: user.email,
      subject: "Added to a project",
      html: `
        <p>Hello ${user.username},</p>
        <p>You were added to the project <b>${project.projectTitle}</b>.</p>
      `,
    });

    res.json({
      success: true,
      message: "Member added successfully",
      project,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to add member" });
  }
};

// REMOVE MEMBER FROM PROJECT
const removeMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body;

    const project = await Project.findOne({
      _id: projectId,
      owner: req.user._id, // only owner
    });

    if (!project) {
      return res.status(403).json({ message: "Not authorized" });
    }

    //  Owner cannot be removed
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        message: "Project owner cannot be removed",
      });
    }

    // User must be a member
    const isMember = project.members.some(
  member => member.toString() === userId
);

if (!isMember) {
  return res.status(404).json({
    message: "User is not a project member",
  });
}


    // Remove member
    project.members = project.members.filter(
      (member) => member.toString() !== userId
    );
    await project.save();

    const removedUser = await User.findById(userId);

    // Activity log
    await logActivity({
      project: project._id,
      user: req.user._id,
      action: "REMOVE_MEMBER",
      entityType: "PROJECT",
      entityId: userId,
      message: `${removedUser.email} was removed from the project`,
    });

    //  app notification
    await notify({
      user: userId,
      type: "REMOVED_FROM_PROJECT",
      project: project._id,
      message: `You were removed from project "${project.projectTitle}"`,
    });

    //  Email
    await sendEmail({
      to: removedUser.email,
      subject: "Removed from project",
      html: `
        <p>Hello ${removedUser.username},</p>
        <p>You were removed from the project <b>${project.projectTitle}</b>.</p>
      `,
    });

    res.json({
      success: true,
      message: "Member removed successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove member" });
  }
};


const addProjectComment = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      members: req.user._id, // only for project members
    });

    if (!project) {
      return res.status(403).json({ message: "Access denied" });
    }

    const comment = await Activity.create({
      user: req.user._id,
      action: "COMMENT",
      entityType: "PROJECT",
      entityId: project._id,
      project: project._id,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Comment added to project",
      data: comment,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add comment" });
  }
};


module.exports = {
  createProject,
  inviteMember,
  getProjectMembers,
  getMyProjects,
  addMember,
  removeMember,
  deleteProject,
  getDeletedProjects,
  restoreProject,
  addProjectComment,
};
