# Fix for PDF Viewing Errors (401 and 404)

## Problem Description

When viewing PDF files in the application, users encounter errors:

- **401 (Unauthorized)**: File exists but is not publicly accessible
- **404 (Not Found)**: File doesn't exist at the Cloudinary URL

## Root Cause

The issue was in the Cloudinary upload configuration:

1. **Backend signature generation** ([`backend/controllers/noteController.js`](backend/controllers/noteController.js:53-82)):
   - The `access_mode` parameter was missing from the upload signature
   - This caused files to be uploaded with private access by default

2. **Frontend upload** ([`frontend/src/components/UploadNotes.jsx`](frontend/src/components/UploadNotes.jsx:275-283)):
   - The `access_mode` parameter was not included in the upload form data
   - Files were uploaded without explicit public access settings

3. **Missing files (404)**:
   - Some files may have been deleted from Cloudinary
   - Some files may have never uploaded successfully
   - Some files may have been uploaded before the fix was applied

## Solution Implemented

### 1. Backend Fix

Updated [`backend/controllers/noteController.js`](backend/controllers/noteController.js:53-82) to include `access_mode: "public"` in the upload signature:

```javascript
const params = {
  folder: "notes-app",
  timestamp: timestamp,
  type: "upload",
  access_mode: "public", // ✅ FIX: Ensure file is publicly accessible
};

// ...

res.json({
  signature,
  timestamp,
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  folder: "notes-app",
  resourceType: "raw",
  accessMode: "public", // ✅ FIX: Ensure file is publicly accessible
});
```

### 2. Frontend Fix

Updated [`frontend/src/components/UploadNotes.jsx`](frontend/src/components/UploadNotes.jsx:275-283) to include `access_mode` in the upload form data:

```javascript
cloudinaryFormData.append("file", file);
cloudinaryFormData.append("signature", signatureData.signature);
cloudinaryFormData.append("timestamp", signatureData.timestamp);
cloudinaryFormData.append("api_key", signatureData.apiKey);
cloudinaryFormData.append("folder", signatureData.folder);
cloudinaryFormData.append("type", "upload");
cloudinaryFormData.append("access_mode", "public"); // ✅ FIX: Ensure file is publicly accessible
```

### 3. Migration Scripts

Created two scripts to fix existing files:

#### [`backend/scripts/migrateToPublic.js`](backend/scripts/migrateToPublic.js)

Updates all existing Cloudinary files to public access.

#### [`backend/scripts/checkAndFixFiles.js`](backend/scripts/checkAndFixFiles.js)

Checks all files and identifies missing ones (404 errors).

### 4. Package Scripts

Added scripts to [`backend/package.json`](backend/package.json:7-11):

```json
"scripts": {
  "start": "node server.js",
  "dev": "node server.js",
  "migrate:public": "node scripts/migrateToPublic.js",
  "check:files": "node scripts/checkAndFixFiles.js"
}
```

## How to Apply the Fix

### For New Uploads

The fix is already applied. All new file uploads will be publicly accessible.

### For Existing Files

#### Step 1: Check for Missing Files

First, check which files are missing (404 errors):

```bash
cd backend
npm run check:files
```

This script will:

- Check all notes with Cloudinary files
- Identify files that don't exist (404 errors)
- Update files that exist but aren't public
- Provide a list of missing files that need to be re-uploaded

#### Step 2: Update Existing Files to Public

After checking, update all existing files to public access:

```bash
cd backend
npm run migrate:public
```

This script will:

- Find all notes with Cloudinary files
- Update each file to have public access
- Display a summary of successful and failed updates

#### Step 3: Handle Missing Files

If the check script found missing files (404 errors), you have two options:

**Option A: Delete the notes with missing files**

```bash
# Connect to your MongoDB and delete notes with missing files
# Or delete them through the application UI
```

**Option B: Re-upload the files**

1. Log in to the application
2. Go to the Upload Notes section
3. Re-upload the missing files
4. The new uploads will automatically have public access

## Prerequisites

Before running the scripts, ensure:

1. **Environment Variables** are set in [`backend/.env`](backend/.env):

   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   MONGODB_URI=your_mongodb_connection_string
   ```

2. **Cloudinary Account** has Admin API access (available on all plans)

3. **Backend Dependencies** are installed:
   ```bash
   cd backend
   npm install
   ```

## Verification

After applying the fix:

1. **Upload a new PDF** and verify it can be viewed without errors
2. **Run the check script** to verify all files are accessible:
   ```bash
   cd backend
   npm run check:files
   ```
3. **Test existing PDFs** to confirm they now load correctly

## Troubleshooting

### Script Fails to Run

If the scripts fail:

1. **Check Cloudinary credentials** in your `.env` file
2. **Verify MongoDB connection** is working
3. **Check Cloudinary account limits** (API rate limits may apply)
4. **Review error messages** in the console output

### Files Still Return 404

If files still return 404 after running scripts:

1. **Verify the file exists** in Cloudinary dashboard
2. **Check the `cloudinaryId`** in your database matches the actual file ID
3. **Manually update** the file in Cloudinary dashboard:
   - Go to Cloudinary Dashboard → Media Library
   - Find the file
   - Click "Edit" → "Access" → Set to "Public"
4. **Re-upload the file** if it doesn't exist in Cloudinary

### New Uploads Still Fail

If new uploads still fail:

1. **Clear browser cache** and reload the application
2. **Check browser console** for any errors
3. **Verify backend is running** with the updated code
4. **Check Cloudinary upload logs** in your dashboard

## Technical Details

### Cloudinary Access Modes

- **`public`**: File is accessible to anyone with the URL
- **`authenticated`**: File requires authentication (signed URLs)
- **`private`**: File is only accessible via Admin API

### Why This Fix Works

1. **Signature includes `access_mode`**: The upload signature now includes the `access_mode` parameter, ensuring Cloudinary applies the correct access level during upload

2. **Form data includes `access_mode`**: The frontend explicitly sends the `access_mode` parameter, overriding any default settings

3. **Migration updates existing files**: The migration script uses Cloudinary's Admin API to update existing files to public access

4. **Check script identifies issues**: The check script helps identify files that don't exist or have access issues

### URL Structure

Cloudinary URLs for raw files (PDFs, documents) follow this pattern:

```
https://res.cloudinary.com/{cloud_name}/raw/upload/{version}/{folder}/{public_id}.{extension}
```

Example:

```
https://res.cloudinary.com/di5uofgbx/raw/upload/v1774708040/notes-app/jbupebxtee8kfkmzetjx.pdf
```

## Additional Resources

- [Cloudinary Upload Documentation](https://cloudinary.com/documentation/image_upload_api_reference)
- [Cloudinary Access Control](https://cloudinary.com/documentation/access_control)
- [Cloudinary Admin API](https://cloudinary.com/documentation/admin_api)

## Support

If you continue to experience issues:

1. Check the [UPLOAD_FIX_GUIDE.md](UPLOAD_FIX_GUIDE.md) for additional troubleshooting
2. Review Cloudinary dashboard for file status
3. Check backend logs for detailed error messages
4. Run the check script to identify specific files with issues
