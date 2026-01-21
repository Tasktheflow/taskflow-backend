const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "CREATE_TASK",
        "UPDATE_TASK",
        "DELETE_TASK",
        "RESTORE_TASK",
        "COMPLETE_TASK",

        "CREATE_PROJECT",
        "DELETE_PROJECT",
        "RESTORE_PROJECT",
        "ADD_MEMBER",
        "REMOVE_MEMBER",
        "COMMENT",

      ],
    },

    entityType: {
      type: String,
      enum: ["TASK", "PROJECT"],
      required: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    message: {
      type: String,
    },

    parentComment: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Activity",
  default: null,
},
    
    edited: {
  type: Boolean,
  default: false,
}

  },
  { timestamps: true }
);

activitySchema.index({ project: 1, createdAt: -1 });
module.exports = mongoose.model("Activity", activitySchema);
