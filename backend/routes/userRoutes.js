const express = require("express");
const router = express.Router();
const {
  registerUser,
  authUser,
  adminLogin,
  getUsers,
  updateUserProfile,
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");

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

module.exports = router;
