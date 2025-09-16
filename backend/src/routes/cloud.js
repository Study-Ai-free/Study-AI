const express = require('express');
const router = express.Router();
const OneDriveCloudStorage = require('../services/OneDriveCloudStorage');
const GoogleDriveCloudStorage = require('../services/GoogleDriveCloudStorage');
const iCloudCloudStorage = require('../services/iCloudCloudStorage');
const SupabaseCloudStorage = require('../services/SupabaseCloudStorage');

// Cloud storage instances
const cloudProviders = {
  onedrive: new OneDriveCloudStorage(),
  googledrive: new GoogleDriveCloudStorage(),
  icloud: new iCloudCloudStorage(),
  supabase: new SupabaseCloudStorage()
};

// Current active provider (stored per session - in production, this would be per user)
let currentProvider = null;
let currentProviderType = null;

// Helper function to get current provider
const getCurrentProvider = () => {
  if (!currentProvider || !currentProviderType) {
    throw new Error('No cloud provider connected');
  }
  return { provider: currentProvider, type: currentProviderType };
};

// Get available providers
router.get('/providers', (req, res) => {
  res.json({
    success: true,
    providers: [
      {
        id: 'onedrive',
        name: 'Microsoft OneDrive',
        description: '5GB free • Perfect for Windows users • Office integration',
        icon: 'Microsoft',
        color: '#0078d4',
        available: true
      },
      {
        id: 'googledrive',
        name: 'Google Drive',
        description: '15GB free • Gmail integration • Google Workspace',
        icon: 'Google',
        color: '#4285f4',
        available: true
      },
      {
        id: 'icloud',
        name: 'iCloud Drive',
        description: '5GB free • Apple ecosystem • Seamless sync',
        icon: 'Apple',
        color: '#007aff',
        available: true,
        note: 'Requires CloudKit setup'
      },
      {
        id: 'supabase',
        name: 'Supabase Storage',
        description: '1GB free • Open source • PostgreSQL database',
        icon: 'Supabase',
        color: '#3ecf8e',
        available: true,
        note: 'Requires account creation'
      }
    ]
  });
});

// Get authentication URL for any provider
router.get('/auth/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    if (!cloudProviders[provider]) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported cloud provider'
      });
    }

    const authUrl = cloudProviders[provider].getAuthUrl();
    
    res.json({
      success: true,
      provider,
      authUrl
    });
  } catch (error) {
    console.error(`${req.params.provider} auth error:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Handle OAuth callback for any provider
router.get('/callback/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, webAuthToken, userToken } = req.query;
    
    if (!cloudProviders[provider]) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported cloud provider'
      });
    }

    let result;
    if (provider === 'icloud') {
      // iCloud uses different auth parameters
      result = await cloudProviders[provider].authenticate(webAuthToken, userToken);
    } else {
      // OneDrive and Google Drive use OAuth code
      result = await cloudProviders[provider].authenticate(code);
    }

    if (result.success) {
      currentProvider = cloudProviders[provider];
      currentProviderType = provider;
      
      res.send(`
        <html>
          <head><title>Authentication Successful</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>✅ Connected to ${provider}</h1>
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
            <h1>❌ Authentication Failed</h1>
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
    console.error(`${req.params.provider} callback error:`, error);
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>🚨 Error</h1>
          <p>${error.message}</p>
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
    if (!currentProvider || !currentProviderType) {
      return res.json({
        success: true,
        connected: false,
        provider: null
      });
    }

    const isAuthenticated = await currentProvider.isAuthenticated();
    if (!isAuthenticated) {
      currentProvider = null;
      currentProviderType = null;
      return res.json({
        success: true,
        connected: false,
        provider: null
      });
    }

    const userInfo = await currentProvider.getUserInfo();
    
    res.json({
      success: true,
      connected: true,
      provider: currentProviderType,
      storage: userInfo?.storage || null,
      user: userInfo?.user || null
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Switch provider (disconnect current and allow new connection)
router.post('/switch/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    if (!cloudProviders[provider]) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported cloud provider'
      });
    }

    // Disconnect current provider
    if (currentProvider) {
      currentProvider.disconnect();
    }

    // Reset current provider
    currentProvider = null;
    currentProviderType = null;

    res.json({
      success: true,
      message: `Switched to ${provider}. Please authenticate.`,
      authUrl: cloudProviders[provider].getAuthUrl()
    });
  } catch (error) {
    console.error('Provider switch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Disconnect from current provider
router.post('/disconnect', async (req, res) => {
  try {
    if (currentProvider) {
      currentProvider.disconnect();
    }
    
    currentProvider = null;
    currentProviderType = null;
    
    res.json({
      success: true,
      message: 'Disconnected from cloud storage'
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// File operations (work with any connected provider)
router.get('/files', async (req, res) => {
  try {
    const { provider } = getCurrentProvider();
    const { folderId } = req.query;
    
    const files = await provider.listFiles(folderId);
    
    res.json({
      success: true,
      files,
      provider: currentProviderType
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/upload', async (req, res) => {
  try {
    const { provider } = getCurrentProvider();
    const { fileName, content, folderId } = req.body;
    
    const file = await provider.uploadFile(fileName, content, folderId);
    
    res.json({
      success: true,
      file,
      provider: currentProviderType
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/download/:fileId', async (req, res) => {
  try {
    const { provider } = getCurrentProvider();
    const { fileId } = req.params;
    
    const content = await provider.downloadFile(fileId);
    
    res.json({
      success: true,
      content,
      provider: currentProviderType
    });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/files/:fileId', async (req, res) => {
  try {
    const { provider } = getCurrentProvider();
    const { fileId } = req.params;
    
    await provider.deleteFile(fileId);
    
    res.json({
      success: true,
      message: 'File deleted successfully',
      provider: currentProviderType
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rename folder endpoint (used by Study-AI-Drive window)
router.put('/rename-folder', async (req, res) => {
  try {
    const { provider } = getCurrentProvider();
    const { folderId, newName, provider: providerType } = req.body;
    
    // For Supabase, rename folder in storage
    if (currentProviderType === 'supabase') {
      const result = await provider.renameFolder(folderId, newName);
      res.json({
        success: true,
        folderId,
        newName,
        provider: 'Study-AI-Drive'
      });
    } else {
      // For other providers, use existing folder rename functionality
      const result = await provider.renameFolder(folderId, newName);
      res.json({
        success: true,
        folderId,
        newName,
        provider: currentProviderType
      });
    }
  } catch (error) {
    console.error('Rename folder error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create folder endpoint (used by Study-AI-Drive window)
router.post('/create-folder', async (req, res) => {
  try {
    const { provider } = getCurrentProvider();
    const { name, provider: providerType, parentPath, depth } = req.body;
    
    // Validate folder depth (maximum 6 levels)
    if (depth && depth > 6) {
      return res.status(400).json({
        success: false,
        error: 'Maximum folder depth of 6 levels exceeded'
      });
    }
    
    // For Supabase, create folder in storage
    if (currentProviderType === 'supabase') {
      const folderId = await provider.createFolder(name, parentPath);
      res.json({
        success: true,
        folderId,
        folderName: name,
        parentPath: parentPath || '',
        depth: depth || 1,
        provider: 'Study-AI-Drive'
      });
    } else {
      // For other providers, use existing folder creation
      const folderId = await provider.ensureFolderExists(name, parentPath);
      res.json({
        success: true,
        folderId,
        folderName: name,
        parentPath: parentPath || '',
        depth: depth || 1,
        provider: currentProviderType
      });
    }
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Folder operations
router.post('/folders', async (req, res) => {
  try {
    const { provider } = getCurrentProvider();
    const { folderName, parentId } = req.body;
    
    const folderId = await provider.ensureFolderExists(folderName, parentId);
    
    res.json({
      success: true,
      folderId,
      folderName,
      provider: currentProviderType
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;