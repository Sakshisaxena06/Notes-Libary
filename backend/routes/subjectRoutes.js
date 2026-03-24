const express = require("express");
const router = express.Router();
const {
  getSubjects,
  addSubject,
  deleteSubject,
} = require("../controllers/subjectController");
const { protect, admin } = require("../middleware/authMiddleware");

// Get all subjects - accessible to all users
router.get("/", getSubjects);

// Add a new subject - admin only
router.post("/", protect, admin, addSubject);

// Delete a subject - admin only
router.delete("/:id", protect, admin, deleteSubject);

module.exports = router;
