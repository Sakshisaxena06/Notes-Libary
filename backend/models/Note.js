import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Made optional for public uploads
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["general", "work", "personal", "study", "other"],
      default: "general",
    },
    subject: {
      type: String,
      default: "General",
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    favoritedBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      default: null,
    },
    cloudinaryId: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Update the updatedAt timestamp before saving
NoteSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Note = mongoose.model("Note", NoteSchema);

export default Note;
