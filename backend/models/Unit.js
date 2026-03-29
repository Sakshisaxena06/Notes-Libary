import mongoose from "mongoose";

const unitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "📚",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure unique unit names within a subject
unitSchema.index({ name: 1, subject: 1 }, { unique: true });

const Unit = mongoose.model("Unit", unitSchema);

export default Unit;
