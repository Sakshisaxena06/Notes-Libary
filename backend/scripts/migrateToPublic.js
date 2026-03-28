import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Note from "../models/Note.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/notes-app",
    );
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Migration function to update all notes with Cloudinary files to public access
const migrateToPublic = async () => {
  try {
    console.log("Starting migration to public access...");

    // Find all notes with Cloudinary IDs
    const notes = await Note.find({
      cloudinaryId: { $exists: true, $ne: null },
    });

    console.log(`Found ${notes.length} notes with Cloudinary files`);

    let successCount = 0;
    let errorCount = 0;

    for (const note of notes) {
      try {
        console.log(`Processing note: ${note._id} - ${note.title}`);
        console.log(`Cloudinary ID: ${note.cloudinaryId}`);

        // Update the resource to public access using Cloudinary Admin API
        const result = await cloudinary.api.update(note.cloudinaryId, {
          resource_type: "raw",
          access_mode: "public",
        });

        console.log(
          `✓ Successfully updated ${note.cloudinaryId} to public access`,
        );
        successCount++;
      } catch (error) {
        console.error(
          `✗ Failed to update ${note.cloudinaryId}:`,
          error.message,
        );
        errorCount++;
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total notes processed: ${notes.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log("========================\n");

    if (errorCount > 0) {
      console.log("Some files failed to update. You may need to:");
      console.log("1. Check your Cloudinary credentials");
      console.log("2. Verify the cloudinaryId values are correct");
      console.log("3. Manually update files in Cloudinary dashboard");
    }
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
};

// Run migration
(async () => {
  await connectDB();
  await migrateToPublic();
})();
