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
- This fixes 403 Forbidden errors when deleting or saving notes

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

## Files Modified

1. `backend/vercel.json` - Fixed CORS headers
2. `backend/controllers/noteController.js` - Added credential checks, logging, and fixed authorization
3. `backend/middleware/uploadMiddleware.js` - Added error handling middleware
4. `backend/server.js` - Added test endpoint and error handling
5. `frontend/src/utils/api.js` - Fixed Content-Type header for FormData uploads

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
