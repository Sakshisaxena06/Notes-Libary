import express from "express";
const router = express.Router();
import {
  registerUser,
  authUser,
  adminLogin,
  getUsers,
  updateUserProfile,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

// @route   POST /api/users/register
// @desc    Register a new user
router.post("/register", registerUser);

// @route   POST /api/users/login
// @desc    Auth user & get token
router.post("/login", authUser);

// @route   POST /api/users/admin
// @desc    Admin login
router.post("/admin", adminLogin);

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get("/", protect, admin, getUsers);

// @route   PUT /api/users/profile/:id
// @desc    Update user profile
// @access  Private
router.put("/profile/:id", protect, updateUserProfile);

export default router;
