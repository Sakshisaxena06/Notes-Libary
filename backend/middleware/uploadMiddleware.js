import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (allowedTypes.some((type) => file.mimetype.startsWith(type))) {
    cb(null, true);
  } else {
    cb(new Error("Only images / documents allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter,
});

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error("Multer error:", error);
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 100MB." });
    }
    return res.status(400).json({ message: error.message });
  }
  if (error) {
    console.error("Upload error:", error);
    return res.status(400).json({ message: error.message });
  }
  next();
};

export default upload;
