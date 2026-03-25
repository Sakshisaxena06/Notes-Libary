import mongoose from "mongoose";
import Note from "../models/Note.js";
import path from "path";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";

// @desc    Get all notes
// @route   GET /api/notes
// @access  Public
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({}).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notes by user
// @route   GET /api/notes/user/:userId
// @access  Public
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
// @route   GET /api/notes/:id
// @access  Public
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
// @route   POST /api/notes
// @access  Private
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
    } = req.body;

    // Get user from authenticated request
    const userId = req.user ? req.user._id : null;

    const note = new Note({
      user: userId,
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

// @desc    Upload file to Cloudinary
// @route   POST /api/notes/upload
// @access  Private
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary with folder organization
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "notes-app",
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    });

    // Clean up local file after upload
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      cloudinaryId: result.public_id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Public
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
// @route   DELETE /api/notes/:id?userId=xxx&isAdmin=true
// @access  Public
export const deleteNote = async (req, res) => {
  try {
    const { userId, isAdmin } = req.query;
    const note = await Note.findById(req.params.id);

    if (note) {
      // Check if user is admin (can be string "true" or boolean true)
      const isAdminBool = isAdmin === true || isAdmin === "true";

      if (isAdminBool) {
        // Delete from Cloudinary if exists
        if (note.cloudinaryId) {
          try {
            await cloudinary.uploader.destroy(note.cloudinaryId);
          } catch (cloudErr) {
            console.error("Error deleting from Cloudinary:", cloudErr);
          }
        }
        await note.deleteOne();
        return res.json({ message: "Note removed by admin" });
      }

      // Check if user is the owner - can delete their own note
      if (userId && note.user.toString() === userId) {
        // Delete from Cloudinary if exists
        if (note.cloudinaryId) {
          try {
            await cloudinary.uploader.destroy(note.cloudinaryId);
          } catch (cloudErr) {
            console.error("Error deleting from Cloudinary:", cloudErr);
          }
        }
        await note.deleteOne();
        return res.json({ message: "Note removed" });
      }

      // User is not authorized to delete this note
      return res
        .status(403)
        .json({ message: "Not authorized to delete this note" });
    } else {
      res.status(404).json({ message: "Note not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get favorite notes
// @route   GET /api/notes/favorites?userId=xxx
// @access  Public
export const getFavoriteNotes = async (req, res) => {
  try {
    const { userId } = req.query;

    // If userId is provided, filter by favoritedBy array
    if (userId) {
      const notes = await Note.find({
        favoritedBy: new mongoose.Types.ObjectId(userId),
      }).sort({ createdAt: -1 });
      return res.json(notes);
    }

    // Otherwise return all favorite notes
    const notes = await Note.find({ isFavorite: true }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get saved notes
// @route   GET /api/notes/saved
// @access  Public
export const getSavedNotes = async (req, res) => {
  try {
    const notes = await Note.find({ isSaved: true }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle favorite
// @route   PUT /api/notes/:id/favorite?userId=xxx
// @access  Public
export const toggleFavorite = async (req, res) => {
  try {
    const { userId } = req.query;
    const note = await Note.findById(req.params.id);

    if (note) {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const userIdObj = new mongoose.Types.ObjectId(userId);
      const favoriteIndex = note.favoritedBy.findIndex(
        (id) => id.toString() === userId,
      );

      if (favoriteIndex > -1) {
        // User already favorited - remove from favorites
        note.favoritedBy.splice(favoriteIndex, 1);
        note.isFavorite = note.favoritedBy.length > 0;
      } else {
        // Add user to favorites
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
// @route   PUT /api/notes/:id/save
// @access  Public
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
