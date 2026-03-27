import mongoose from "mongoose";
import Note from "../models/Note.js";
import path from "path";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";

// @desc    Get all notes
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({}).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notes by user
export const getNotesByUser = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single note
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (note) {
      res.json(note);
    } else {
      res.status(404).json({ message: "Note not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new note
export const createNote = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      subject,
      isFavorite,
      isSaved,
      fileUrl,
      fileName,
      fileType,
      cloudinaryId,
    } = req.body;

    const userId = req.user ? req.user._id : undefined;

    const note = new Note({
      user: userId || undefined, // Will be undefined instead of null if not provided
      title,
      content,
      category: category || "general",
      subject: subject || "General",
      isFavorite: isFavorite || false,
      isSaved: isSaved || false,
      fileUrl,
      fileName,
      fileType,
      cloudinaryId,
    });

    const createdNote = await note.save();
    res.status(201).json(createdNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ ✅ FIXED UPLOAD FUNCTION (MAIN CHANGE)
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "notes-app",
          resource_type: "auto", // supports PDF, images, docs
          type: "upload", // ✅ FIX → makes file PUBLIC
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      stream.end(req.file.buffer);
    });

    res.json({
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      cloudinaryId: result.public_id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update note
export const updateNote = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      subject,
      isFavorite,
      isSaved,
      fileUrl,
      fileName,
      fileType,
      cloudinaryId,
    } = req.body;

    const note = await Note.findById(req.params.id);

    if (note) {
      note.title = title || note.title;
      note.content = content || note.content;
      note.category = category || note.category;
      note.subject = subject || note.subject;
      note.isFavorite = isFavorite !== undefined ? isFavorite : note.isFavorite;
      note.isSaved = isSaved !== undefined ? isSaved : note.isSaved;
      note.fileUrl = fileUrl || note.fileUrl;
      note.fileName = fileName || note.fileName;
      note.fileType = fileType || note.fileType;
      note.cloudinaryId = cloudinaryId || note.cloudinaryId;

      const updatedNote = await note.save();
      res.json(updatedNote);
    } else {
      res.status(404).json({ message: "Note not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete note
export const deleteNote = async (req, res) => {
  try {
    console.log("Delete note request:", {
      noteId: req.params.id,
      userId: req.user?._id,
      isAdmin: req.user?.isAdmin,
    });

    // Validate note ID
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid note ID format:", req.params.id);
      return res.status(400).json({ message: "Invalid note ID format" });
    }

    const note = await Note.findById(req.params.id);

    if (note) {
      console.log("Note found:", {
        noteId: note._id,
        noteUser: note.user,
        cloudinaryId: note.cloudinaryId,
      });

      const isOwner =
        req.user &&
        note.user &&
        note.user.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.isAdmin;

      console.log("Authorization check:", { isOwner, isAdmin });

      if (isAdmin || isOwner) {
        if (note.cloudinaryId) {
          try {
            console.log("Deleting from Cloudinary:", note.cloudinaryId);
            await cloudinary.uploader.destroy(note.cloudinaryId);
            console.log("Cloudinary delete successful");
          } catch (err) {
            console.error("Cloudinary delete error:", err);
            // Continue with note deletion even if Cloudinary delete fails
          }
        }

        console.log("Deleting note from database");
        try {
          await note.deleteOne();
          console.log("Note deleted successfully");
          return res.json({ message: "Note removed" });
        } catch (dbError) {
          console.error("Database delete error:", dbError);
          return res
            .status(500)
            .json({ message: "Failed to delete note from database" });
        }
      }

      console.log("Authorization failed");
      return res
        .status(403)
        .json({ message: "Not authorized to delete this note" });
    } else {
      console.log("Note not found");
      res.status(404).json({ message: "Note not found" });
    }
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get favorite notes
export const getFavoriteNotes = async (req, res) => {
  try {
    const { userId } = req.query;

    if (userId) {
      const notes = await Note.find({
        favoritedBy: new mongoose.Types.ObjectId(userId),
      }).sort({ createdAt: -1 });
      return res.json(notes);
    }

    const notes = await Note.find({ isFavorite: true }).sort({
      createdAt: -1,
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get saved notes
export const getSavedNotes = async (req, res) => {
  try {
    const notes = await Note.find({ isSaved: true }).sort({
      createdAt: -1,
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle favorite
export const toggleFavorite = async (req, res) => {
  try {
    const { userId } = req.query;
    const note = await Note.findById(req.params.id);

    if (note) {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const userIdObj = new mongoose.Types.ObjectId(userId);
      const index = note.favoritedBy.findIndex(
        (id) => id.toString() === userId,
      );

      if (index > -1) {
        note.favoritedBy.splice(index, 1);
        note.isFavorite = note.favoritedBy.length > 0;
      } else {
        note.favoritedBy.push(userIdObj);
        note.isFavorite = true;
      }

      const updatedNote = await note.save();
      res.json(updatedNote);
    } else {
      res.status(404).json({ message: "Note not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Toggle saved
export const toggleSaved = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (note) {
      note.isSaved = !note.isSaved;
      const updatedNote = await note.save();
      res.json(updatedNote);
    } else {
      res.status(404).json({ message: "Note not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
