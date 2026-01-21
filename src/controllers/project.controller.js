const Project = require("../models/project.model");
const User = require("../models/User.model");
const logActivity = require("../utils/activityLogger");
const Activity = require("../models/activity.model");


// CREATE PROJECT
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) return res.status(400).json({ message: "Project name is required" });

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [req.user._id],
    });

   await logActivity({
  project: project._id,
  user: req.user._id,
  action: "CREATE_PROJECT",
  entityType: "PROJECT",
  entityId: project._id,
  message: `Project "${project.name}" was created`,
});

    res.status(201).json({
      success: true,
      message: "Project created",
      data: project,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create project" });
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
  message: `Project "${project.name}" was deleted`,
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
  message: `Project "${project.name}" was restored`,
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

    if (project.members.includes(user._id)) {
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


    res.json({ message: "Member added successfully", project });
  } catch (error) {
    res.status(500).json({ message: "Failed to add member" });
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
  getMyProjects,
  addMember,
  deleteProject,
  getDeletedProjects,
  restoreProject,
  addProjectComment,
};
