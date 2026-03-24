const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  icon: {
    type: String,
    default: "📄",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Subject", subjectSchema);
