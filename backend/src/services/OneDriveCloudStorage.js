const { Client } = require('@microsoft/microsoft-graph-client');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const fs = require('fs').promises;
const path = require('path');

class OneDriveCloudStorage {
  constructor() {
    this.clientId = process.env.ONEDRIVE_CLIENT_ID;
    this.clientSecret = process.env.ONEDRIVE_CLIENT_SECRET;
    this.tenantId = 'common';
    this.redirectUri = process.env.ONEDRIVE_REDIRECT_URI;
    this.scopes = ['https://graph.microsoft.com/Files.ReadWrite.All', 'https://graph.microsoft.com/User.Read'];
    
    this.msalInstance = new ConfidentialClientApplication({
      auth: {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        authority: `https://login.microsoftonline.com/${this.tenantId}`
      }
    });
    
    this.graphClient = null;
    this.appFolderPath = '/StudyAI-Data';
  }

  /**
   * Get the authorization URL for user login
   */
  getAuthUrl() {
    const authCodeUrlRequest = {
      scopes: this.scopes,
      redirectUri: this.redirectUri,
    };
    
    return this.msalInstance.getAuthCodeUrl(authCodeUrlRequest);
  }

  /**
   * Exchange authorization code for access token and initialize Graph client
   */
  async authenticateWithCode(authCode) {
    try {
      const tokenRequest = {
        code: authCode,
        scopes: this.scopes,
        redirectUri: this.redirectUri,
      };

      const response = await this.msalInstance.acquireTokenByCode(tokenRequest);
      
      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, response.accessToken);
        }
      });

      // Create app folder structure
      await this.initializeAppFolder();
      
      return {
        success: true,
        user: response.account,
        accessToken: response.accessToken
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize the StudyAI folder structure in OneDrive
   */
  async initializeAppFolder() {
    try {
      // Create main app folder
      await this.createFolder('StudyAI-Data', '/');
      
      // Create subfolders
      await this.createFolder('uploads', this.appFolderPath);
      await this.createFolder('data', this.appFolderPath);
      await this.createFolder('generated', this.appFolderPath);
      await this.createFolder('quizzes', `${this.appFolderPath}/generated`);
      await this.createFolder('summaries', `${this.appFolderPath}/generated`);
      
      // Initialize empty data files
      await this.saveJSON('data/user-profile.json', { initialized: true, createdAt: new Date().toISOString() });
      await this.saveJSON('data/subjects.json', []);
      await this.saveJSON('data/quiz-history.json', []);
      await this.saveJSON('data/analytics.json', { totalQuizzes: 0, averageScore: 0, subjects: {} });
      
      console.log('OneDrive app folder structure initialized successfully');
    } catch (error) {
      console.error('Error initializing app folder:', error);
    }
  }

  /**
   * Create a folder in OneDrive
   */
  async createFolder(folderName, parentPath = '/') {
    try {
      const driveItem = {
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      };

      const endpoint = parentPath === '/' 
        ? '/me/drive/root/children'
        : `/me/drive/root:${parentPath}:/children`;

      await this.graphClient.api(endpoint).post(driveItem);
      return true;
    } catch (error) {
      // Folder might already exist, which is okay
      if (error.code !== 'nameAlreadyExists') {
        console.error(`Error creating folder ${folderName}:`, error);
      }
      return false;
    }
  }

  /**
   * Upload a file to OneDrive
   */
  async uploadFile(localFilePath, remoteFilePath) {
    try {
      const fileContent = await fs.readFile(localFilePath);
      const fileName = path.basename(remoteFilePath);
      const remoteDirPath = path.dirname(remoteFilePath);
      
      const endpoint = `/me/drive/root:${this.appFolderPath}/${remoteFilePath}:/content`;
      
      const uploadedFile = await this.graphClient
        .api(endpoint)
        .putContent(fileContent);
        
      return {
        success: true,
        file: uploadedFile,
        downloadUrl: uploadedFile.webUrl
      };
    } catch (error) {
      console.error('File upload error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a file from OneDrive
   */
  async downloadFile(remoteFilePath, localFilePath = null) {
    try {
      const endpoint = `/me/drive/root:${this.appFolderPath}/${remoteFilePath}:/content`;
      const fileStream = await this.graphClient.api(endpoint).getStream();
      
      if (localFilePath) {
        const writeStream = require('fs').createWriteStream(localFilePath);
        fileStream.pipe(writeStream);
        return { success: true, localPath: localFilePath };
      } else {
        // Return file content as buffer
        const chunks = [];
        for await (const chunk of fileStream) {
          chunks.push(chunk);
        }
        return { success: true, content: Buffer.concat(chunks) };
      }
    } catch (error) {
      console.error('File download error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save JSON data to OneDrive
   */
  async saveJSON(filePath, data) {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const endpoint = `/me/drive/root:${this.appFolderPath}/${filePath}:/content`;
      
      await this.graphClient
        .api(endpoint)
        .header('Content-Type', 'application/json')
        .put(jsonContent);
        
      return { success: true };
    } catch (error) {
      console.error('JSON save error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load JSON data from OneDrive
   */
  async loadJSON(filePath) {
    try {
      const result = await this.downloadFile(filePath);
      if (result.success) {
        const jsonData = JSON.parse(result.content.toString());
        return { success: true, data: jsonData };
      } else {
        return result;
      }
    } catch (error) {
      console.error('JSON load error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List files in a OneDrive folder
   */
  async listFiles(folderPath = '') {
    try {
      const endpoint = folderPath 
        ? `/me/drive/root:${this.appFolderPath}/${folderPath}:/children`
        : `/me/drive/root:${this.appFolderPath}:/children`;
        
      const response = await this.graphClient.api(endpoint).get();
      return { success: true, files: response.value };
    } catch (error) {
      console.error('List files error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a file from OneDrive
   */
  async deleteFile(filePath) {
    try {
      const endpoint = `/me/drive/root:${this.appFolderPath}/${filePath}`;
      await this.graphClient.api(endpoint).delete();
      return { success: true };
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile() {
    try {
      const user = await this.graphClient.api('/me').get();
      return { success: true, user };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get OneDrive usage statistics
   */
  async getStorageInfo() {
    try {
      const drive = await this.graphClient.api('/me/drive').get();
      return { 
        success: true, 
        quota: drive.quota,
        driveType: drive.driveType,
        owner: drive.owner
      };
    } catch (error) {
      console.error('Get storage info error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = OneDriveCloudStorage;