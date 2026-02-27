const Activity = require("../models/activity.model");
const Project = require("../models/project.model");

// GET ACTIVITY LOGS FOR A PROJECT
const getProjectActivity = async (req, res) => {
  try {
    const { id } = req.params;

    // Check project exists and user is a member
    const project = await Project.findOne({
      _id: id,
      members: req.user._id,
    });

    if (!project) {
      return res.status(403).json({ message: "Access denied" });
    }

    const logs = await Activity.find({ project: id })
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
};

module.exports = { getProjectActivity };
