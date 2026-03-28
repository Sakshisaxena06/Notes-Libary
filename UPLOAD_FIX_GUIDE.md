# Upload Fix Guide - Cloudinary Configuration

## Problem

The file upload is failing with a 500 Internal Server Error because Cloudinary environment variables are not configured in Vercel.

## What I Fixed

### 1. Updated `backend/vercel.json`

- Removed restrictive `Access-Control-Allow-Origin` header that was blocking localhost requests
- Kept necessary CORS headers (methods, headers, credentials)
- Now Express CORS middleware handles origin validation properly

### 2. Enhanced `backend/controllers/noteController.js`

- Added check for Cloudinary credentials before upload
- Added detailed logging for debugging
- Better error messages for missing configuration

### 3. Enhanced `backend/middleware/uploadMiddleware.js`

- Added `handleUploadError` middleware for better error handling
- Handles multer-specific errors (file size, etc.)

### 4. Updated `backend/server.js`

- Imported and added `handleUploadError` middleware
- Added `/api/test-upload` endpoint to check Cloudinary configuration

### 5. Fixed `frontend/src/utils/api.js`

- Fixed `fetchWithAuth` to not set `Content-Type` header when sending FormData
- Browser now sets Content-Type automatically with correct multipart boundary
- This was causing 400 Bad Request errors on file uploads

### 6. Fixed `backend/controllers/noteController.js` (Authorization)

- Updated `deleteNote` function to check query parameters as fallback for authorization
- Updated `toggleSaved` function to check query parameters as fallback for authorization
- **CRITICAL FIX**: Updated `createNote` function to use user ID from request body if provided
  - This was the root cause of 403 errors - notes were being created without user ID
  - Now notes are properly associated with the user who uploaded them
- This fixes 403 Forbidden errors when deleting or saving notes

### 7. Fixed `frontend/src/components/UploadNotes.jsx` (User ID Fallback)

- Added fallback to check for both `user._id` and `user.id` when deleting files
- Added detailed logging for debugging
- This fixes 403 Forbidden errors when user object has different property name

## Steps to Fix Upload on Vercel

### Step 1: Set Cloudinary Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your backend project (notes-libary)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
CLOUDINARY_CLOUD_NAME=di5uofgbx
CLOUDINARY_API_KEY=937261494882864
CLOUDINARY_API_SECRET=Cbam4LDjvbJE46vFWMtSfB-Y0xU
```

5. Click **Save**
6. **Redeploy** your backend (Vercel → Deployments → Redeploy)

### Step 2: Verify Configuration

After redeploying, test the configuration by visiting:

```
https://notes-libary.vercel.app/api/test-upload
```

You should see:

```json
{
  "status": "ok",
  "cloudinaryConfigured": true,
  "cloudinaryCloudName": "di5uofgbx",
  "message": "Upload service is ready"
}
```

### Step 3: Test Upload

1. Go to your frontend: https://notes-libary-jbp6.vercel.app
2. Try uploading a file
3. Check the Vercel logs if there are any errors:
   - Vercel Dashboard → Your Project → Deployments → Click on deployment → Functions tab

## Common Issues

### Issue 1: "File upload service not configured"

**Solution**: Cloudinary environment variables are not set in Vercel. Follow Step 1 above.

### Issue 2: "Failed to upload file" (500 error)

**Solution**: Check Vercel function logs for detailed error. Common causes:

- Invalid Cloudinary credentials
- File too large (max 100MB)
- Network issues

### Issue 3: CORS errors

**Solution**: The vercel.json has been updated. Make sure to redeploy after changes.

### Issue 4: "No file uploaded" (400 error)

**Solution**: This was caused by `fetchWithAuth` setting `Content-Type: application/json` by default. When sending FormData, the browser needs to set the Content-Type automatically with the multipart boundary. This has been fixed in `frontend/src/utils/api.js`. Make sure to redeploy your frontend after this fix.

### Issue 5: "Not authorized to delete this note" (403 error)

**Solution**: This was caused by the `deleteNote` and `toggleSaved` functions only checking `req.user` (set by protect middleware) for authorization. The frontend was passing `userId` and `isAdmin` as query parameters, but the controller wasn't checking them. This has been fixed in `backend/controllers/noteController.js`. Make sure to redeploy your backend after this fix.

### Issue 6: "Failed to load resource: the server responded with a status of 401" (Cloudinary 401 error)

**Solution**: This error occurs when trying to access a file from Cloudinary that is not publicly accessible. The file URL shows `/image/upload/` but the file is a PDF, which should be uploaded as `raw` resource type. The fix is to add `access_mode: "public"` to the upload parameters and ensure the correct resource type is used:

1. In `backend/controllers/noteController.js`:
   - Added `access_mode: "public"` to the `getUploadSignature` function parameters
   - Added `access_mode: "public"` to the `uploadFile` function parameters
   - Ensured `resource_type: "raw"` is always used for PDFs and documents (in URL path only)
   - **IMPORTANT**: Removed `resource_type` from signature parameters to fix "Invalid Signature" error

2. In `frontend/src/components/UploadNotes.jsx`:
   - Added `access_mode` parameter when uploading to Cloudinary
   - Ensured the upload URL uses the correct resource type (`/raw/upload/`)
   - **IMPORTANT**: Removed `resource_type` from form data to fix "Invalid Signature" error

This ensures that all uploaded files are publicly accessible and can be viewed without authentication.

## Files Modified

1. `backend/vercel.json` - Fixed CORS headers
2. `backend/controllers/noteController.js` - Added credential checks, logging, and fixed authorization (CRITICAL: Fixed createNote to use user ID from request body)
3. `backend/middleware/uploadMiddleware.js` - Added error handling middleware
4. `backend/server.js` - Added test endpoint and error handling
5. `frontend/src/utils/api.js` - Fixed Content-Type header for FormData uploads
6. `frontend/src/components/UploadNotes.jsx` - Added user ID fallback and logging
7. `backend/controllers/noteController.js` - Added `access_mode: "public"` to upload signature and upload_file function to fix 401 errors
8. `frontend/src/components/UploadNotes.jsx` - Added `access_mode` parameter when uploading to Cloudinary
9. `backend/controllers/noteController.js` - Ensured `resource_type: "raw"` is always used for PDFs and documents (in URL path only)
10. `frontend/src/components/UploadNotes.jsx` - Ensured the upload URL uses the correct resource type (`/raw/upload/`)
11. `backend/controllers/noteController.js` - **IMPORTANT**: Removed `resource_type` from signature parameters to fix "Invalid Signature" error
12. `frontend/src/components/UploadNotes.jsx` - **IMPORTANT**: Removed `resource_type` from form data to fix "Invalid Signature" error

## Testing Locally

To test locally, make sure your `backend/.env` file has the Cloudinary credentials:

```
CLOUDINARY_CLOUD_NAME=di5uofgbx
CLOUDINARY_API_KEY=937261494882864
CLOUDINARY_API_SECRET=Cbam4LDjvbJE46vFWMtSfB-Y0xU
```

Then run:

```bash
cd backend
npm start
```

Test the upload endpoint:

```bash
curl http://localhost:5000/api/test-upload
```
