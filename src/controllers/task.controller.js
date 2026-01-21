const Task = require("../models/task.model");
const Project = require("../models/project.model");
const logActivity = require("../utils/activityLogger");
const notify = require("../utils/notify");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User.model");



const Activity = require("../models/activity.model");

//const { countDocuments } = require("../models/User.model");

// CREATE TASK
const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, projectId } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (projectId) {
      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (!project.members.includes(req.user._id)) {
        return res.status(403).json({ message: "Not a project member" });
      }
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      project: projectId || null,
      owner: req.user._id,
    });

    await logActivity({
  project: task.project,
  user: req.user._id,
  action: "CREATE_TASK",
  entityType: "TASK",
  entityId: task._id,
  message: `Task "${task.title}" was created`,
});


    
     res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: {
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        owner: task.owner,
        project: task.project,
        deleted: task.deleted,
        deletedAt: task.deletedAt,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    
    });
  }
};

// Get project tasks exclude deleted
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      members: req.user._id,
    });

    if (!project) {
      return res.status(403).json({ message: "Access denied" });
    }

    const tasks = await Task.find({ project: projectId, deleted: false })
      .populate("owner", "username email");

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};



// Get my tasks exclude deleted
const getMyTasks = async (req, res) => {
  try {
    const { status, overdue, sortBy, order } = req.query;

    // Base filter: only logged-in user's tasks
    const filter = {
      owner: req.user._id, deleted: false
    };

    // Optional filters
    if (status) filter.status = status;

    if (overdue === "true") {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: "Done" };
    }

     const sort = sortBy ? { [sortBy]: order === "desc" ? -1 : 1 } : { createdAt: -1 };

    const tasks = await Task.find(filter).sort(sort);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// UPDATE TASK

const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
      deleted: false,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Prevent status update here
    delete req.body.status;

    Object.assign(task, req.body);
    await task.save();

    await logActivity({
      project: task.project,
      user: req.user._id,
      action: "UPDATE_TASK",
      entityType: "TASK",
      entityId: task._id,
      message: `Task "${task.title}" was updated`,
    });

    res.json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update task" });
  }
};


const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const STATUS_FLOW = {
      Todo: ["Inprogress"],
      Inprogress: ["Review"],
      Review: ["Done", "Inprogress"],
      Done: [],
    };

    const task = await Task.findById(req.params.id).populate("project");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    //  Only assigned user
     if (!task.owner) {
  return res.status(400).json({
    message: "Task must be assigned before changing status",
  });
}

    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only assigned user can change task status",
      });
    }

   

    const allowed = STATUS_FLOW[task.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition: ${task.status} → ${status}`,
      });
    }

    task.status = status;
    await task.save();

    //  Activity log
    await logActivity({
      project: task.project,
      user: req.user._id,
      action: status === "Done" ? "COMPLETE_TASK" : "UPDATE_TASK",
      entityType: "TASK",
      entityId: task._id,
      message:
        status === "Done"
          ? `Task "${task.title}" was completed`
          : `Task "${task.title}" moved to ${status}`,
    });

    // Notify project owner ONLY when completed
    if (status === "Done") {
      await notify({
        user: task.project.owner,
        type: "TASK_COMPLETED",
        project: task.project._id,
        task: task._id,
        message: `Task "${task.title}" was completed`,
      });
    }

    if (status === "Done") {
  const owner = await User.findById(task.project.owner);

  await sendEmail({
    to: owner.email,
    subject: "Task completed",
    html: `
      <p>Hello ${owner.username},</p>
      <p>The task <b>${task.title}</b> has been completed.</p>
    `,
  });
}


    res.json({
      success: true,
      message: "Task status updated",
      data: {
        id: task._id,
        status: task.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update task status" });
  }
};




// DELETE TASK
//Soft delete
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { deleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await logActivity({
      project: task.project,
      user: req.user._id,
      action: "DELETE_TASK",
      entityType: "TASK",
      entityId: task._id,
      message: `Task "${task.title}" was deleted`,
    });

    res.json({
      success: true,
      message: "Task moved to recycle bin",
      data: {
        id: task._id,
        deleted: task.deleted,
        deletedAt: task.deletedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task" });
  }
};



//Get Recycled BinTasks
const getDeletedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      owner: req.user._id, deleted: true });
      
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch deleted tasks" });
  }
};

//Restore Task from Recycle Bin
const restoreTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, deleted: true },
      { deleted: false, deletedAt: null },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found in recycle bin" });
    }

    await logActivity({
      project: task.project,
      user: req.user._id,
      action: "RESTORE_TASK",
      entityType: "TASK",
      entityId: task._id,
      message: `Task "${task.title}" was restored`,
    });

    res.json({
      success: true,
      message: "Task restored successfully",
      data: {
        id: task._id,
        deleted: task.deleted,
        deletedAt: task.deletedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore task" });
  }
};


const getTaskActivity = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(403).json({ message: "Access denied" });
    }

    const activities = await Activity.find({
      entityType: "TASK",
      entityId: task._id,
    })
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task activity" });
  }
};

const addTaskComment = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Comment is required" });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(403).json({ message: "Access denied" });
    }

    const comment = await Activity.create({
      user: req.user._id,
      action: "COMMENT",
      entityType: "TASK",
      entityId: task._id,
      project: task.project,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Comment added",
      data: comment,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add comment" });
  }
};

const assignTask = async (req, res) => {
  try {
    const { userId } = req.body;
    const taskId = req.params.id;

    const task = await Task.findById(taskId).populate("project");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.deleted) {
  return res.status(400).json({
    message: "Cannot assign a deleted task",
  });
}


    // Task must belong to a project
    if (!task.project) {
      return res.status(400).json({ message: "Task is not part of a project" });
    }

    //  ONLY PROJECT OWNER CAN ASSIGN
    if (task.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only project owner can assign tasks",
      });
    }

    // Assigned user must be a project member
    if (!task.project.members.includes(userId)) {
      return res.status(400).json({
        message: "User is not a project member",
      });
    }

    //prevent re-assigning to same user
    if (task.owner?.toString() === userId) {
  return res.status(400).json({
    message: "Task is already assigned to this user",
  });
}

    // Assign task
    task.owner = userId;
    await task.save();

    await notify({
  user: userId,
  type: "TASK_ASSIGNED",
  project: task.project._id,
  task: task._id,
  message: `You were assigned to task "${task.title}"`,
});


    const assignedUser = await User.findById(userId);

await sendEmail({
  to: assignedUser.email,
  subject: "You have been assigned a task",
  html: `
    <p>Hello ${assignedUser.username},</p>
    <p>You were assigned to the task <b>${task.title}</b>.</p>
    <p>Please log in to view details.</p>
  `,
});

    // Activity log
    await logActivity({
      project: task.project._id,
      user: req.user._id,
      action: "UPDATE_TASK",
      entityType: "TASK",
      entityId: task._id,
      message: `Task "${task.title}" was assigned`,
    });

    res.json({
      success: true,
      message: "Task assigned successfully",
      data: task,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign task" });
  }
};





module.exports = {
  createTask,
  getProjectTasks,
  getMyTasks,
  updateTask,
  deleteTask,
  getDeletedTasks,
  restoreTask,
  getTaskActivity,
  addTaskComment,
  assignTask,
  updateTaskStatus,

};
