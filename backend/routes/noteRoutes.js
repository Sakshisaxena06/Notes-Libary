const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
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
} = require("../controllers/noteController");
const { protect, admin } = require("../middleware/authMiddleware");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: function (req, file, cb) {
    try {
      const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|md/;
      const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase(),
      );
      const mimetype = filetypes.test(file.mimetype);
      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error("Only images and documents are allowed"));
      }
    } catch (err) {
      cb(err);
    }
  },
});

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
// @access  Private
router.post("/upload", protect, upload.single("file"), uploadFile);

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
// @desc    Create new note
// @access  Private
router.post("/", protect, createNote);

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
router.delete("/:id", deleteNote);

module.exports = router;
