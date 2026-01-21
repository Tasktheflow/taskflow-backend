const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createTask,
  getMyTasks,
  updateTask,
  deleteTask,
  getProjectTasks,
  getDeletedTasks,
  restoreTask,
  getTaskActivity,
  addTaskComment,
  assignTask,
  updateTaskStatus,
} = require("../controllers/task.controller");

router.post("/", authMiddleware, createTask);
router.get("/", authMiddleware, getMyTasks);

router.get("/deleted", authMiddleware, getDeletedTasks);
router.patch("/restore/:id", authMiddleware, restoreTask);
router.get("/project/:projectId", authMiddleware, getProjectTasks);

router.put("/:id", authMiddleware, updateTask);
router.delete("/:id", authMiddleware, deleteTask);
router.get("/:id/activity", authMiddleware, getTaskActivity);
router.post("/:id/comments", authMiddleware, addTaskComment);
router.patch("/:id/assign", authMiddleware, assignTask);
router.patch("/:id/status", authMiddleware, updateTaskStatus);








module.exports = router;
