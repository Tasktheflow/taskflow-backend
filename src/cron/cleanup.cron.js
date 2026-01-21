const cron = require("node-cron");
const Task = require("../models/task.model");
const Project = require("../models/project.model");

console.log("🕒 Cleanup cron initialized");

cron.schedule("0 0 * * *", async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const taskResult = await Task.deleteMany({
      deleted: true,
      deletedAt: { $lte: cutoffDate },
    });

    const projectResult = await Project.deleteMany({
      deleted: true,
      deletedAt: { $lte: cutoffDate },
    });

    console.log(
      `[CRON] Cleanup complete → Tasks: ${taskResult.deletedCount}, Projects: ${projectResult.deletedCount}`
    );
  } catch (error) {
    console.error("[CRON] Cleanup failed:", error.message);
  }
});
