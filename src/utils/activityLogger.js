const Activity = require("../models/activity.model");

const logActivity = async ({
  user,
  action,
  entityType,
  entityId,
  project = null,
  message = "",
}) => {
  try {
    await Activity.create({
      user,
      action,
      entityType,
      entityId,
      project,
      message,
    });
  } catch (error) {
    console.error("Activity log failed:", error.message);
  }
};

module.exports = logActivity;
