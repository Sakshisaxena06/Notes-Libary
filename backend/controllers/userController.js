import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.warn("⚠️ WARNING: JWT_SECRET not set in environment variables!");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret123", {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(), // ✅ always lowercase
      password,
      isAdmin: false,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // ✅ FIXED: lowercase email on login lookup too
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin login
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ Use env variables for admin credentials instead of hardcoding
    const adminUsername = process.env.ADMIN_USERNAME || "sakshi_admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "@#Chem0987";

    if (username === adminUsername && password === adminPassword) {
      let admin = await User.findOne({ isAdmin: true });

      if (!admin) {
        admin = await User.create({
          name: "Sakshi Admin",
          email: "sakshi_admin@sug.com",
          password: adminPassword,
          isAdmin: true,
        });
      }

      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        isAdmin: true,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: "Invalid admin credentials" });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      user.password = newPassword;
    }

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
};