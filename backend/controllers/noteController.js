import mongoose from "mongoose";
import Note from "../models/Note.js";
import path from "path";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";

// @desc    Get dashboard statistics (optimized single endpoint)
export const getDashboardStats = async (req, res) => {
  try {
    const { userId, isAdmin } = req.query;

    // Get total notes count
    const totalNotes = await Note.countDocuments();

    // Get user's uploaded notes count
    let userUploadedCount = 0;
    if (userId) {
      userUploadedCount = await Note.countDocuments({
        user: userId,
        fileUrl: { $exists: true, $ne: null },
      });
    }

    // Get user's favorites count
    let userFavoriteCount = 0;
    if (userId) {
      const userFavorites = await Note.countDocuments({
        favoritedBy: userId,
      });
      userFavoriteCount = userFavorites;
    }

    // Get total users count for admin
    let totalUsersCount = 0;
    if (isAdmin === "true") {
      const User = mongoose.model("User");
      totalUsersCount = await User.countDocuments();
    }

    res.json({
      totalNotes,
      favoriteNotes: userFavoriteCount,
      uploadedNotes: userUploadedCount,
      totalUsers: totalUsersCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Cloudinary upload signature for direct upload
export const getUploadSignature = async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      folder: "notes-app",
      resource_type: "raw",
      timestamp: timestamp,
      type: "upload",
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET,
    );

    res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: "notes-app",
      resourceType: "raw",
    });
  } catch (error) {
    console.error("Error generating upload signature:", error);
    res.status(500).json({ message: "Failed to generate upload signature" });
  }
};

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
      user: bodyUserId,
    } = req.body;

    // Use user ID from request body if provided, otherwise from req.user (set by protect middleware)
    const userId = bodyUserId || (req.user ? req.user._id : undefined);

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
    console.log("Upload request received:", {
      hasFile: !!req.file,
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
      body: req.body,
      headers: {
        "content-type": req.headers["content-type"],
        "content-length": req.headers["content-length"],
      },
    });

    if (!req.file) {
      console.error("No file in request");
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Check if Cloudinary credentials are configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("Cloudinary credentials not configured:", {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "set" : "missing",
        api_key: process.env.CLOUDINARY_API_KEY ? "set" : "missing",
        api_secret: process.env.CLOUDINARY_API_SECRET ? "set" : "missing",
      });
      return res.status(500).json({
        message:
          "File upload service not configured. Please contact administrator.",
      });
    }

    console.log("Uploading file to Cloudinary:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "notes-app",
          resource_type: "auto", // supports PDF, images, docs
          type: "upload", // ✅ FIX → makes file PUBLIC
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("Cloudinary upload success:", result.public_id);
            resolve(result);
          }
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
    console.error("Upload file error:", error);
    res.status(500).json({ message: error.message || "Failed to upload file" });
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
      queryUserId: req.query.userId,
      queryIsAdmin: req.query.isAdmin,
      fullQuery: req.query,
      fullUser: req.user,
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

      // Check authorization from req.user (set by protect middleware) only
      const userId = req.user?._id?.toString();
      const isAdmin = req.user?.isAdmin;
      const isOwner = userId && note.user && note.user.toString() === userId;

      console.log("Authorization check:", {
        isOwner,
        isAdmin,
        userId,
        noteUser: note.user?.toString(),
        reqUser: req.user?._id?.toString(),
      });

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
      // Check authorization from req.user (set by protect middleware) only
      const userId = req.user?._id?.toString();
      const isAdmin = req.user?.isAdmin;
      const isOwner = userId && note.user && note.user.toString() === userId;

      console.log("Toggle saved authorization check:", {
        isOwner,
        isAdmin,
        userId,
      });

      if (!isAdmin && !isOwner) {
        return res
          .status(403)
          .json({ message: "Not authorized to save this note" });
      }

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
