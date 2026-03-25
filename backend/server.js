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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

connectDB();

const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/notes", noteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);

initDefaultSubjects();

app.get("/", (req, res) => {
  res.send("Notes API running");
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ message: "Error" });
});

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== "true") {
  app.listen(PORT, () => {
    console.log("Server running");
  });
}

export default app;