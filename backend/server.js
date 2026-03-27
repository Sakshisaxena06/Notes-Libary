import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import noteRoutes from "./routes/noteRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import { initDefaultSubjects } from "./controllers/subjectController.js";
import { handleUploadError } from "./middleware/uploadMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

connectDB();

const app = express();

// ✅ FIXED CORS CONFIG
const corsOptions = {
  origin: [
    "https://notes-libary-jbp6.vercel.app", // your frontend (deployed)
    "https://notes-libary.vercel.app", // your backend (deployed)
    "http://localhost:5173", // local frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// ✅ handle preflight requests (VERY IMPORTANT)
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/notes", noteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);

// Upload error handling middleware
app.use(handleUploadError);

// Initialize default subjects
initDefaultSubjects();

// Test route
app.get("/", (req, res) => {
  res.send("Notes API running");
});

// Test upload endpoint
app.get("/api/test-upload", (req, res) => {
  const cloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  res.json({
    status: "ok",
    cloudinaryConfigured: !!cloudinaryConfigured,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "not set",
    message: cloudinaryConfigured
      ? "Upload service is ready"
      : "Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Vercel environment variables.",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ message: "Error" });
});

const PORT = process.env.PORT || 5000;

// Run server locally only
if (process.env.VERCEL !== "true") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
