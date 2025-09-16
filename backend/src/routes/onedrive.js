const express = require('express');
const router = express.Router();
const OneDriveCloudStorage = require('../services/OneDriveCloudStorage');

// Store for active OneDrive sessions (in production, use Redis or database)
const activeSessions = new Map();

// Get OneDrive authorization URL
router.get('/auth', async (req, res) => {
  try {
    const oneDriveStorage = new OneDriveCloudStorage();
    const authUrl = oneDriveStorage.getAuthUrl();
    
    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('OneDrive auth error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).send('Authorization code is required');
    }

    const oneDriveStorage = new OneDriveCloudStorage();
    const result = await oneDriveStorage.authenticate(code);
    
    if (result.success) {
      // Store the authenticated session (simplified - use proper session management in production)
      const sessionId = Date.now().toString();
      activeSessions.set(sessionId, {
        oneDriveStorage,
        authenticatedAt: new Date(),
        lastActivity: new Date()
      });
      
      res.send(`
        <html>
          <head><title>OneDrive Connected</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>✅ OneDrive Connected Successfully!</h1>
            <p>You can now close this window and return to Study AI.</p>
            <script>
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `);
    } else {
      res.status(400).send(`
        <html>
          <head><title>Authentication Failed</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ OneDrive Authentication Failed</h1>
            <p>Error: ${result.error}</p>
            <p>Please try again.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('OneDrive callback error:', error);
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>🚨 Authentication Error</h1>
          <p>${error.message}</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  }
});

// Check connection status
router.get('/status', async (req, res) => {
  try {
    // Find an active session (simplified)
    const activeSession = Array.from(activeSessions.values())[0];
    
    if (!activeSession) {
      return res.json({
        success: true,
        connected: false
      });
    }

    const { oneDriveStorage } = activeSession;
    const isAuthenticated = await oneDriveStorage.isAuthenticated();
    
    if (!isAuthenticated) {
      return res.json({
        success: true,
        connected: false
      });
    }

    const userInfo = await oneDriveStorage.getUserInfo();
    
    res.json({
      success: true,
      connected: true,
      storage: userInfo.storage,
      user: userInfo.user
    });
  } catch (error) {
    console.error('OneDrive status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Disconnect OneDrive
router.post('/disconnect', async (req, res) => {
  try {
    // Clear all sessions
    activeSessions.clear();
    
    res.json({
      success: true,
      message: 'Disconnected from OneDrive'
    });
  } catch (error) {
    console.error('OneDrive disconnect error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get OneDrive storage info
router.get('/storage', async (req, res) => {
  try {
    const activeSession = Array.from(activeSessions.values())[0];
    
    if (!activeSession) {
      return res.status(401).json({
        success: false,
        error: 'Not connected to OneDrive'
      });
    }

    const { oneDriveStorage } = activeSession;
    const userInfo = await oneDriveStorage.getUserInfo();
    
    res.json({
      success: true,
      storage: userInfo.storage
    });
  } catch (error) {
    console.error('OneDrive storage info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List files in OneDrive
router.get('/files', async (req, res) => {
  try {
    const activeSession = Array.from(activeSessions.values())[0];
    
    if (!activeSession) {
      return res.status(401).json({
        success: false,
        error: 'Not connected to OneDrive'
      });
    }

    const { oneDriveStorage } = activeSession;
    const { folderId } = req.query;
    
    const files = await oneDriveStorage.listFiles(folderId);
    
    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('OneDrive list files error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;