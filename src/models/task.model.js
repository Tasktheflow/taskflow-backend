const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    priority: {
  type: String,
  enum: ["Low", "Medium", "High"],
  default: "Medium",
},

    status: {
      type: String,
      enum: ["Todo", "Inprogress", "Review", "Done"],
      default: "Todo",
    
    },

    startDate:{
      type:Date,
      required: true,

    },

    dueDate: {
      type: Date,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

     assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,

    },


      // Soft delete fields
    deleted: {
  type: Boolean,
  default: false,
},
    
    deletedAt: {
      type: Date,
      default: null,
    },

  },
  { timestamps: true }
);

// Virtual property to check if task is overdue
taskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate) return false;
  if (this.status === "Done") return false;
  return new Date() > this.dueDate;
});

// Ensure virtuals show up when converting to JSON
taskSchema.set("toJSON", { virtuals: true });
taskSchema.set("toObject", { virtuals: true });


module.exports = mongoose.model("Task", taskSchema);
