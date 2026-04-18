import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
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

// ✅ FIXED CORS — credentials:true requires explicit origins (no wildcard *)
const allowedOrigins = [
  "https://notes-libary-jbp6.vercel.app",
  "https://notes-libary.vercel.app",
  "http://localhost:5173",
  "http://localhost",
  "capacitor://localhost",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  credentials: true,
  optionsSuccessStatus: 200, // ✅ Important for older browsers & Android WebView
};

// ✅ Handle preflight FIRST, before any routes
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Routes
app.use("/api/notes", noteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);

// Upload error handling
app.use(handleUploadError);

// Initialize default subjects
initDefaultSubjects();

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Notes API running ✅" });
});

// Proxy endpoint for PDF files
app.get("/api/proxy-pdf", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ message: "URL parameter is required" });
    }

    if (!url.includes("cloudinary.com")) {
      return res.status(400).json({ message: "Invalid URL" });
    }

    let response;
    try {
      response = await fetch(url);
    } catch (fetchError) {
      console.error("Fetch error:", fetchError.message);
      return res.status(500).json({ message: "Failed to fetch file from Cloudinary" });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        message: `Failed to fetch file: ${response.status} ${response.statusText}`,
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");
    response.body.pipe(res);
  } catch (error) {
    console.error("Proxy PDF error:", error);
    res.status(500).json({ message: "Failed to proxy PDF file" });
  }
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
      : "Cloudinary credentials not configured.",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== "true") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;