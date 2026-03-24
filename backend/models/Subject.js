import mongoose from "mongoose";

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

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
