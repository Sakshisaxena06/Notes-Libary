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

export default upload;