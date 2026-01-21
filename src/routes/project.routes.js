const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createProject,
  getMyProjects,
  addMember,
  deleteProject,
  getDeletedProjects,
  restoreProject,
  addProjectComment,
} = require("../controllers/project.controller");

const { getProjectActivity } = require("../controllers/activity.controller");


router.post("/", authMiddleware, createProject);
router.get("/", authMiddleware, getMyProjects);
router.get("/deleted", authMiddleware, getDeletedProjects);
router.patch("/restore/:id", authMiddleware, restoreProject);
router.get("/:id/activity", authMiddleware, getProjectActivity);

router.post("/:projectId/members", authMiddleware, addMember);
router.delete("/:id", authMiddleware, deleteProject);
router.post("/:id/comments", authMiddleware, addProjectComment);




module.exports = router;
