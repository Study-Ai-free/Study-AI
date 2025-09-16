const express = require('express');
const router = express.Router();
const GoogleDriveCloudStorage = require('../services/GoogleDriveCloudStorage');

let googleDriveInstance = null;

// Initialize Google Drive instance
const getGoogleDriveInstance = () => {
  if (!googleDriveInstance) {
    googleDriveInstance = new GoogleDriveCloudStorage();
  }
  return googleDriveInstance;
};

// Get authentication URL
router.get('/auth', async (req, res) => {
  try {
    const googleDrive = getGoogleDriveInstance();
    const authUrl = googleDrive.getAuthUrl();
    
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('Google Drive auth error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get Google Drive auth URL'
    });
  }
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      return res.status(400).send(`
        <html>
          <head><title>Google Drive Authentication Failed</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Google Drive Authentication Failed</h1>
            <p>Error: ${error}</p>
            <p>Please close this window and try again.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send(`
        <html>
          <head><title>Google Drive Authentication Failed</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Authentication Failed</h1>
            <p>No authorization code received.</p>
            <p>Please close this window and try again.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }

    const googleDrive = getGoogleDriveInstance();
    const result = await googleDrive.authenticate(code);
    
    if (result.success) {
      res.send(`
        <html>
          <head><title>Google Drive Connected</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>✅ Google Drive Connected Successfully!</h1>
            <p>You can now close this window and return to StudyAI Platform.</p>
            <script>
              // Notify parent window of successful authentication
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_DRIVE_AUTH_SUCCESS',
                  provider: 'googledrive'
                }, '*');
              }
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `);
    } else {
      res.status(400).send(`
        <html>
          <head><title>Google Drive Authentication Failed</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Google Drive Authentication Failed</h1>
            <p>Error: ${result.error}</p>
            <p>Please close this window and try again.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Google Drive callback error:', error);
    res.status(500).send(`
      <html>
        <head><title>Google Drive Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>🚨 Authentication Error</h1>
          <p>An unexpected error occurred: ${error.message}</p>
          <p>Please close this window and contact support if the problem persists.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  }
});

// Get connection status
router.get('/status', async (req, res) => {
  try {
    const googleDrive = getGoogleDriveInstance();
    const isAuthenticated = await googleDrive.isAuthenticated();
    
    if (!isAuthenticated) {
      return res.json({
        success: true,
        connected: false,
        provider: 'googledrive'
      });
    }

    const userInfo = await googleDrive.getUserInfo();
    
    res.json({
      success: true,
      connected: true,
      provider: 'googledrive',
      storage: userInfo?.storage || null,
      user: userInfo?.user || null
    });
  } catch (error) {
    console.error('Google Drive status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Disconnect Google Drive
router.post('/disconnect', async (req, res) => {
  try {
    if (googleDriveInstance) {
      googleDriveInstance.disconnect();
      googleDriveInstance = null;
    }
    
    res.json({
      success: true,
      message: 'Disconnected from Google Drive'
    });
  } catch (error) {
    console.error('Google Drive disconnect error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List files
router.get('/files', async (req, res) => {
  try {
    const googleDrive = getGoogleDriveInstance();
    const isAuthenticated = await googleDrive.isAuthenticated();
    
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated with Google Drive'
      });
    }

    const { folderId } = req.query;
    const files = await googleDrive.listFiles(folderId);
    
    res.json({
      success: true,
      files: files,
      provider: 'googledrive'
    });
  } catch (error) {
    console.error('Google Drive list files error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create folder
router.post('/folders', async (req, res) => {
  try {
    const googleDrive = getGoogleDriveInstance();
    const isAuthenticated = await googleDrive.isAuthenticated();
    
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated with Google Drive'
      });
    }

    const { folderName, parentId } = req.body;
    const folderId = await googleDrive.ensureFolderExists(folderName, parentId);
    
    res.json({
      success: true,
      folderId: folderId,
      folderName: folderName,
      provider: 'googledrive'
    });
  } catch (error) {
    console.error('Google Drive create folder error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload file
router.post('/upload', async (req, res) => {
  try {
    const googleDrive = getGoogleDriveInstance();
    const isAuthenticated = await googleDrive.isAuthenticated();
    
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated with Google Drive'
      });
    }

    const { fileName, content, folderId } = req.body;
    const file = await googleDrive.uploadFile(fileName, content, folderId);
    
    res.json({
      success: true,
      file: file,
      provider: 'googledrive'
    });
  } catch (error) {
    console.error('Google Drive upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;