const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
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
} = require("../controllers/project.controller");
const { acceptInvitation } = require("../controllers/invitation.controller");

const optionalAuth = require("../middlewares/optionalAuth");




const { getProjectActivity } = require("../controllers/activity.controller");


router.post("/", authMiddleware, createProject);
router.get("/", authMiddleware, getMyProjects);
router.get("/deleted", authMiddleware, getDeletedProjects);
router.patch("/restore/:id", authMiddleware, restoreProject);
router.get("/:id/activity", authMiddleware, getProjectActivity);
router.post("/:projectId/invite", authMiddleware, inviteMember);
router.post("/invitations/accept", authMiddleware, acceptInvitation);



router.post("/:projectId/members", authMiddleware, addMember);
router.patch("/:projectId/remove-member", authMiddleware, removeMember);
router.get("/:projectId/members", authMiddleware, getProjectMembers);

router.delete("/:id", authMiddleware, deleteProject);
router.post("/:id/comments", authMiddleware, addProjectComment);




module.exports = router;
