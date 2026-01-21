const cron = require("node-cron");
const Project = require("../models/project.model");

cron.schedule("0 0 * * *", async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await Project.deleteMany({
      deleted: true,
      deletedAt: { $lte: cutoffDate },
    });

    console.log(`Old projects permanently deleted: ${result.deletedCount}`);
  } catch (error) {
    console.error("Project cleanup error:", error.message);
  }
});
// This cron job runs daily at midnight and permanently deletes projects
// that have been in the recycle bin for more than 30 days.