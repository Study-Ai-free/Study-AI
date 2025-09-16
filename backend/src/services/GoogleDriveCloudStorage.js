const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GoogleDriveCloudStorage {
  constructor() {
    this.clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    this.redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3001/api/googledrive/callback';
    this.oauth2Client = null;
    this.drive = null;
    this.accessToken = null;
    this.refreshToken = null;
    
    this.initializeOAuth();
  }

  initializeOAuth() {
    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    // Set up event listener for token refresh
    this.oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        this.refreshToken = tokens.refresh_token;
      }
      this.accessToken = tokens.access_token;
    });
  }

  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async authenticate(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      
      // Initialize Drive API
      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      
      return { success: true, tokens };
    } catch (error) {
      console.error('Google Drive authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  async isAuthenticated() {
    return this.accessToken && this.drive;
  }

  async getUserInfo() {
    if (!this.drive) return null;
    
    try {
      const response = await this.drive.about.get({
        fields: 'user,storageQuota'
      });
      
      return {
        user: response.data.user,
        storage: {
          used: parseInt(response.data.storageQuota.usage || 0),
          total: parseInt(response.data.storageQuota.limit || 0),
          remaining: parseInt(response.data.storageQuota.limit || 0) - parseInt(response.data.storageQuota.usage || 0)
        }
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  async ensureFolderExists(folderName, parentId = null) {
    if (!this.drive) throw new Error('Not authenticated');

    try {
      // Search for existing folder
      const query = parentId 
        ? `name='${folderName}' and parents in '${parentId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
        : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)'
      });

      if (response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Create folder if it doesn't exist
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error) {
      console.error('Error ensuring folder exists:', error);
      throw error;
    }
  }

  async uploadFile(fileName, content, folderId = null) {
    if (!this.drive) throw new Error('Not authenticated');

    try {
      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined
      };

      const media = {
        mimeType: 'application/octet-stream',
        body: content
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, size, createdTime'
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async downloadFile(fileId) {
    if (!this.drive) throw new Error('Not authenticated');

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async listFiles(folderId = null, mimeType = null) {
    if (!this.drive) throw new Error('Not authenticated');

    try {
      let query = 'trashed=false';
      if (folderId) {
        query += ` and parents in '${folderId}'`;
      }
      if (mimeType) {
        query += ` and mimeType='${mimeType}'`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime)',
        orderBy: 'modifiedTime desc'
      });

      return response.data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    if (!this.drive) throw new Error('Not authenticated');

    try {
      await this.drive.files.delete({
        fileId: fileId
      });
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async saveJSON(fileName, data, folderId = null) {
    const jsonContent = JSON.stringify(data, null, 2);
    return await this.uploadFile(fileName, jsonContent, folderId);
  }

  async loadJSON(fileName, folderId = null) {
    try {
      // Find the file
      let query = `name='${fileName}' and trashed=false`;
      if (folderId) {
        query += ` and parents in '${folderId}'`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id)'
      });

      if (response.data.files.length === 0) {
        return null;
      }

      const fileContent = await this.downloadFile(response.data.files[0].id);
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error loading JSON:', error);
      return null;
    }
  }

  disconnect() {
    this.oauth2Client = null;
    this.drive = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.initializeOAuth();
  }
}

module.exports = GoogleDriveCloudStorage;