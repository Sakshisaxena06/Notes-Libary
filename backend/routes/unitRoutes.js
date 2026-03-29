import express from "express";
const router = express.Router();
import {
  getUnits,
  getUnitsBySubject,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../controllers/unitController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

// @route   GET /api/units
// @desc    Get all units (optionally filtered by subject)
// @access  Public
router.get("/", getUnits);

// @route   GET /api/units/subject/:subject
// @desc    Get units by subject
// @access  Public
router.get("/subject/:subject", getUnitsBySubject);

// @route   POST /api/units
// @desc    Create new unit
// @access  Private (Admin only)
router.post("/", protect, admin, createUnit);

// @route   PUT /api/units/:id
// @desc    Update unit
// @access  Private (Admin only)
router.put("/:id", protect, admin, updateUnit);

// @route   DELETE /api/units/:id
// @desc    Delete unit
// @access  Private (Admin only)
router.delete("/:id", protect, admin, deleteUnit);

export default router;
