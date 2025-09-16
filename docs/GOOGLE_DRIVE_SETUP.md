# Google Drive Integration Setup Guide

This guide will help you set up Google Drive integration for the StudyAI Platform.

## Prerequisites

- Google account
- Access to Google Cloud Console
- Node.js backend running

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" and then "New Project"
3. Give your project a name (e.g., "StudyAI Platform")
4. Click "Create"

## Step 2: Enable Google Drive API

1. In your Google Cloud project, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on "Google Drive API" and then "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in the required fields:
     - App name: "StudyAI Platform"
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes (optional for now)
   - Add test users (add your own email for testing)

4. Back in Credentials, create OAuth client ID:
   - Application type: "Web application"
   - Name: "StudyAI Backend"
   - Authorized redirect URIs: `http://localhost:3001/api/googledrive/callback`

5. Copy the **Client ID** and **Client Secret**

## Step 4: Configure Environment Variables

Add these to your `.env` file in the backend directory:

```bash
# Google Drive Configuration
GOOGLE_DRIVE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret-here
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3001/api/googledrive/callback
```

## Step 5: Install Required Dependencies

The backend should already have the required dependencies, but if not:

```bash
cd backend
npm install googleapis
```

## Step 6: Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your frontend:
   ```bash
   cd frontend
   npm start
   ```

3. In the StudyAI Platform:
   - Click "Configure Storage Integration"
   - Select "Google Drive"
   - You should be redirected to Google for authorization
   - Grant the necessary permissions
   - You should be redirected back with a success message

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**
   - Check that the redirect URI in Google Cloud Console exactly matches: `http://localhost:3001/api/googledrive/callback`
   - Make sure there are no trailing slashes or extra spaces

2. **"access_denied" error**
   - Make sure you've added your email as a test user in the OAuth consent screen
   - Check that the Google Drive API is enabled

3. **"invalid_client" error**
   - Verify your Client ID and Client Secret are correct in the .env file
   - Make sure there are no extra spaces or quotes around the values

4. **Backend errors**
   - Check the backend console for detailed error messages
   - Ensure all environment variables are set correctly
   - Restart the backend server after adding environment variables

### Scopes Required:

The integration requests these Google Drive scopes:
- `https://www.googleapis.com/auth/drive.file` - Access to files created by the app
- `https://www.googleapis.com/auth/drive.metadata.readonly` - Read-only access to file metadata

## Production Setup

For production deployment:

1. Update the OAuth consent screen to "In production"
2. Add your production domain to authorized redirect URIs
3. Update the `GOOGLE_DRIVE_REDIRECT_URI` environment variable to your production URL
4. Ensure your domain is verified in Google Cloud Console

## Security Notes

- Never commit your `.env` file to version control
- Use different Google Cloud projects for development and production
- Regularly rotate your client secrets
- Monitor API usage in Google Cloud Console

## Support

If you continue to have issues:
1. Check the backend logs for detailed error messages
2. Verify all URLs and credentials are correct
3. Test the authentication flow step by step
4. Ensure Google Drive API quotas are not exceeded