# OneDrive Cloud Storage Setup Guide

## Overview

This guide will help you set up OneDrive as the primary storage backend for your Study AI platform. Instead of using a traditional database, all data (user files, quiz results, analytics) will be stored in the user's OneDrive account.

## Why OneDrive?

✅ **Native Windows Integration** - Perfect for your environment  
✅ **5GB Free Storage** - Generous free tier  
✅ **Microsoft Graph API** - Robust and well-documented  
✅ **Office 365 Integration** - Natural fit for document processing  
✅ **File Sharing & Collaboration** - Built-in sharing capabilities  
✅ **No Database Maintenance** - Users manage their own storage  

## Prerequisites

1. **Microsoft Account** - You need a Microsoft account (personal or work)
2. **Azure Account** - Free Azure account for app registration
3. **OneDrive Access** - User must have OneDrive enabled

## Step 1: Azure App Registration

### 1.1 Create Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Fill in the details:
   - **Name**: `Study AI OneDrive Integration`
   - **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`
   - **Redirect URI**: 
     - Type: `Web`
     - URL: `http://localhost:3001/api/onedrive/callback`
5. Click "Register"

### 1.2 Configure API Permissions

1. In your app registration, go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Choose "Delegated permissions"
5. Add these permissions:
   - `Files.ReadWrite.All` - Read and write access to user files
   - `User.Read` - Read user profile
6. Click "Add permissions"
7. Click "Grant admin consent" (if you're an admin)

### 1.3 Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Description: `Study AI Backend Secret`
4. Expires: `24 months` (or as per your preference)
5. Click "Add"
6. **Copy the secret value immediately** (you won't see it again)

### 1.4 Note Down Configuration

Copy these values for your environment configuration:
- **Application (client) ID**: Found in "Overview" tab
- **Client Secret**: The value you just copied
- **Directory (tenant) ID**: Found in "Overview" tab

## Step 2: Backend Configuration

### 2.1 Environment Variables

Create a `.env` file in your backend directory:

```bash
# OneDrive Configuration
ONEDRIVE_CLIENT_ID=your-application-client-id-here
ONEDRIVE_CLIENT_SECRET=your-client-secret-here
ONEDRIVE_TENANT_ID=common
ONEDRIVE_REDIRECT_URI=http://localhost:3001/api/onedrive/callback

# Other configuration
JWT_SECRET=your-jwt-secret
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 2.2 Install Dependencies

The required packages are already installed:
- `@azure/msal-node` - Microsoft authentication
- `@microsoft/microsoft-graph-client` - OneDrive API client

## Step 3: Testing the Integration

### 3.1 Start the Backend

```bash
cd backend
npm run dev
```

### 3.2 Test Authentication Flow

1. **Get Auth URL**:
   ```bash
   curl http://localhost:3001/api/onedrive/auth
   ```

2. **Visit the returned URL** in your browser
3. **Sign in** with your Microsoft account
4. **Grant permissions** to the app
5. **You'll be redirected** to the callback URL with a session ID

### 3.3 Test API Endpoints

After authentication, you can test these endpoints:

```bash
# Check connection status
curl -H "x-session-id: YOUR_SESSION_ID" http://localhost:3001/api/onedrive/status

# Get storage information
curl -H "x-session-id: YOUR_SESSION_ID" http://localhost:3001/api/onedrive/storage-info

# List files in app folder
curl -H "x-session-id: YOUR_SESSION_ID" http://localhost:3001/api/onedrive/files
```

## Step 4: Data Storage Structure

Once authenticated, the system creates this folder structure in OneDrive:

```
/StudyAI-Data/
├── uploads/                    # User uploaded files
│   ├── {subject-id}/          # One folder per subject
│   │   ├── content-list.json  # Metadata for uploaded files
│   │   ├── file1.pdf
│   │   └── file2.mp4
├── data/                      # Application data
│   ├── user-profile.json     # User preferences and profile
│   ├── subjects.json         # List of subjects
│   ├── quiz-history.json     # All quiz attempts and scores
│   └── analytics.json        # Learning analytics and progress
└── generated/                 # AI-generated content
    ├── quizzes/              # Generated quiz files
    │   ├── quiz-001.json
    │   └── quiz-002.json
    └── summaries/            # AI-generated summaries
        └── summary-001.json
```

## Step 5: How It Works

### 5.1 File Upload Flow

1. User uploads a PDF/video through the frontend
2. File is temporarily stored on the backend server
3. Backend uploads file to OneDrive in the appropriate subject folder
4. Metadata is stored in `content-list.json`
5. Temporary file is deleted from backend
6. Subject's file count is updated

### 5.2 Quiz Generation Flow

1. User requests a quiz for a subject
2. Backend reads all files from the subject's OneDrive folder
3. AI processes the content and generates quiz questions
4. Quiz is saved as JSON in `/generated/quizzes/`
5. Subject's quiz count is updated

### 5.3 Analytics Flow

1. User completes a quiz
2. Results are saved to `quiz-history.json`
3. Analytics are updated in `analytics.json`
4. Progress tracking is calculated in real-time

## Step 6: Benefits of This Approach

### For Users:
- **Own Their Data** - Everything stored in their OneDrive
- **No Data Loss** - Data persists even if they stop using the app
- **Backup & Sync** - OneDrive handles backup automatically
- **Access Anywhere** - Can access files directly in OneDrive
- **Storage Control** - Can manage storage usage themselves

### For Developers:
- **No Database Costs** - No PostgreSQL hosting needed
- **Scalability** - Each user has their own storage
- **Maintenance-Free** - Microsoft handles infrastructure
- **Security** - Microsoft handles data security and compliance

## Step 7: Production Deployment

### 7.1 Update Redirect URI

When deploying to production:
1. Update Azure app registration redirect URI
2. Update environment variables with production URLs
3. Consider using Azure Key Vault for secrets

### 7.2 Multi-Tenant Considerations

For enterprise use:
- Consider app-only permissions for bulk operations
- Implement proper tenant isolation
- Handle admin consent flows

## Troubleshooting

### Common Issues:

1. **"Application not found"** - Check client ID
2. **"Invalid client secret"** - Check secret value and expiration
3. **"Insufficient privileges"** - Ensure proper permissions are granted
4. **"Redirect URI mismatch"** - Verify redirect URI in Azure matches your config

### Debug Mode:

Enable debug logging in your `.env`:
```bash
LOG_LEVEL=debug
```

This will show detailed authentication and API call logs.

## Next Steps

After setting up OneDrive integration:

1. **Test with real files** - Upload PDFs and videos
2. **Implement AI processing** - Connect to OpenAI/Google AI for content analysis
3. **Build the frontend** - Create UI for OneDrive authentication
4. **Add advanced features** - File sharing, collaborative quizzes, etc.

## Security Notes

- Never commit your `.env` file to version control
- Rotate client secrets regularly
- Use HTTPS in production
- Consider implementing token refresh for long-running sessions
- Validate all file uploads before processing

---

🎉 **Your Study AI platform now uses OneDrive as a serverless, user-owned database!**