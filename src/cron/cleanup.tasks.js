const cron = require("node-cron");
const Task = require("../models/task.model");

cron.schedule("0 0 * * *", async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await Task.deleteMany({
      deleted: true,
      deletedAt: { $lte: cutoffDate },
    });

    console.log(`Old tasks permanently deleted: ${result.deletedCount}`);
  } catch (error) {
    console.error("Error cleaning up old tasks:", error.message);
  }
});
