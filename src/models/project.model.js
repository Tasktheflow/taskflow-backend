const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectTitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    deleted:{
      type: Boolean,
      default: false,
    },
    deletedAt:{
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
