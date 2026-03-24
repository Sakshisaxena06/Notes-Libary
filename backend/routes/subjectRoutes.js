import express from "express";
const router = express.Router();
import {
  getSubjects,
  addSubject,
  deleteSubject,
} from "../controllers/subjectController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

// Get all subjects - accessible to all users
router.get("/", getSubjects);

// Add a new subject - admin only
router.post("/", protect, admin, addSubject);

// Delete a subject - admin only
router.delete("/:id", protect, admin, deleteSubject);

export default router;
