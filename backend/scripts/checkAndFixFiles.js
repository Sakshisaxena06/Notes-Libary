import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Note from "../models/Note.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// Check and fix files
const checkAndFixFiles = async (deleteMissing = false) => {
  try {
    console.log("Starting file check and fix...\n");

    // Find all notes with Cloudinary IDs
    const notes = await Note.find({
      cloudinaryId: { $exists: true, $ne: null },
    });

    console.log(`Found ${notes.length} notes with Cloudinary files\n`);

    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    const missingFiles = [];

    for (const note of notes) {
      try {
        console.log(`Checking note: ${note._id} - ${note.title}`);
        console.log(`Cloudinary ID: ${note.cloudinaryId}`);
        console.log(`Current URL: ${note.fileUrl}`);

        // Try to get resource details from Cloudinary
        try {
          const resource = await cloudinary.api.resource(note.cloudinaryId, {
            resource_type: "raw",
          });

          console.log(`✓ File exists in Cloudinary`);
          console.log(`  - Public ID: ${resource.public_id}`);
          console.log(`  - URL: ${resource.secure_url}`);
          console.log(`  - Access Mode: ${resource.access_mode}`);

          // Check if access mode is public
          if (resource.access_mode !== "public") {
            console.log(
              `  ⚠️  File is not public. Updating to public access...`,
            );

            // Update to public access
            await cloudinary.api.update(note.cloudinaryId, {
              resource_type: "raw",
              access_mode: "public",
            });

            console.log(`  ✓ Updated to public access`);
          }

          // Update note URL if it's different
          if (note.fileUrl !== resource.secure_url) {
            console.log(`  ⚠️  URL mismatch. Updating note URL...`);
            note.fileUrl = resource.secure_url;
            await note.save();
            console.log(`  ✓ Updated note URL`);
          }

          successCount++;
        } catch (apiError) {
          console.log(`API Error:`, apiError);
          if (apiError.error && apiError.error.http_code === 404) {
            console.log(`✗ File NOT found in Cloudinary (404)`);
            console.log(
              `  This file may have been deleted or never uploaded successfully`,
            );
            notFoundCount++;
            missingFiles.push({
              noteId: note._id,
              title: note.title,
              cloudinaryId: note.cloudinaryId,
              fileUrl: note.fileUrl,
            });

            if (deleteMissing) {
              console.log(`  Deleting note from database...`);
              await Note.findByIdAndDelete(note._id);
              console.log(`  ✓ Note deleted`);
            }
          } else {
            console.log(
              `✗ Error checking file: ${apiError.message || apiError}`,
            );
            errorCount++;
          }
        }

        console.log(""); // Empty line for readability
      } catch (error) {
        console.error(`✗ Error processing note ${note._id}:`, error.message);
        errorCount++;
        console.log("");
      }
    }

    console.log("\n=== Summary ===");
    console.log(`Total notes checked: ${notes.length}`);
    console.log(`Successfully verified: ${successCount}`);
    console.log(`Not found (404): ${notFoundCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log("================\n");

    if (missingFiles.length > 0) {
      console.log("=== Missing Files ===");
      console.log("The following files were not found in Cloudinary:");
      console.log("You may need to re-upload these files:\n");

      missingFiles.forEach((file, index) => {
        console.log(`${index + 1}. Note ID: ${file.noteId}`);
        console.log(`   Title: ${file.title}`);
        console.log(`   Cloudinary ID: ${file.cloudinaryId}`);
        console.log(`   URL: ${file.fileUrl}`);
        console.log("");
      });

      console.log("To fix these files:");
      console.log("1. Delete the notes with missing files from your database");
      console.log("2. Re-upload the files through the application");
      console.log("3. Or restore the files in Cloudinary if you have backups");
    }

    if (successCount > 0) {
      console.log(
        "\n✓ All accessible files have been verified and updated to public access",
      );
    }
  } catch (error) {
    console.error("Check and fix error:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed");
    process.exit(0);
  }
};

// Run check and fix
(async () => {
  await connectDB();
  const deleteMissing = process.argv.includes("--delete-missing");
  if (deleteMissing) {
    console.log(
      "⚠️  DELETE MISSING MODE: Notes with missing files will be deleted from database\n",
    );
  }
  await checkAndFixFiles(deleteMissing);
})();
