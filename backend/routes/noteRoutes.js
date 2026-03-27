import express from "express";
const router = express.Router();
import upload from "../middleware/uploadMiddleware.js";
import {
  getNotes,
  getNotesByUser,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getFavoriteNotes,
  getSavedNotes,
  toggleFavorite,
  toggleSaved,
  uploadFile,
} from "../controllers/noteController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

// @route   GET /api/notes
// @desc    Get all notes
// @access  Public (for viewing)
router.get("/", getNotes);

// @route   GET /api/notes/user/:userId
// @desc    Get notes by user
// @access  Private
router.get("/user/:userId", protect, getNotesByUser);

// @route   POST /api/notes/upload
// @desc    Upload file
// @access  Public (anyone can upload)
router.post("/upload", upload.single("file"), uploadFile);

// @route   GET /api/notes/favorites
// @desc    Get favorite notes
// @access  Private
router.get("/favorites", protect, getFavoriteNotes);

// @route   GET /api/notes/saved
// @desc    Get saved notes
// @access  Private
router.get("/saved", protect, getSavedNotes);

// @route   GET /api/notes/:id
// @desc    Get single note
// @access  Public
router.get("/:id", getNoteById);

// @route   POST /api/notes
// @desc    Create new note (also used when uploading files)
// @access  Public (anyone can upload)
router.post("/", createNote);

// @route   PUT /api/notes/:id
// @desc    Update note
// @access  Private
router.put("/:id", protect, updateNote);

// @route   PUT /api/notes/:id/favorite
// @desc    Toggle favorite
// @access  Private
router.put("/:id/favorite", protect, toggleFavorite);

// @route   PUT /api/notes/:id/save
// @desc    Toggle saved
router.put("/:id/save", toggleSaved);

// @route   DELETE /api/notes/:id
// @desc    Delete note
// @access  Private
router.delete("/:id", protect, deleteNote);

export default router;
