const { createClient } = require('@supabase/supabase-js');

class SupabaseCloudStorage {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    this.bucketName = 'study-materials'; // Add bucket name property
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase URL and Anon Key are required');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  async authenticate(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      this.isAuthenticated = true;
      this.currentUser = data.user;

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async signUp(email, password, fullName) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: fullName
        },
        message: 'Please check your email to confirm your account'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async isUserAuthenticated() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error || !user) {
        this.isAuthenticated = false;
        this.currentUser = null;
        return false;
      }

      this.isAuthenticated = true;
      this.currentUser = user;
      return true;
    } catch (error) {
      return false;
    }
  }

  async getUserInfo() {
    if (!this.isAuthenticated || !this.currentUser) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    try {
      // Get storage usage
      const { data: files, error: listError } = await this.supabase.storage
        .from('study-materials')
        .list('', { limit: 1000 });

      let totalSize = 0;
      if (!listError && files) {
        // Note: Supabase doesn't return file sizes in list, so we'll estimate
        totalSize = files.length * 1024 * 1024; // Estimate 1MB per file
      }

      return {
        success: true,
        user: {
          id: this.currentUser.id,
          email: this.currentUser.email,
          name: this.currentUser.user_metadata?.full_name || this.currentUser.email
        },
        storage: {
          used: totalSize,
          total: 1024 * 1024 * 1024, // 1GB limit for demo
          remaining: (1024 * 1024 * 1024) - totalSize
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async uploadFile(fileName, fileBuffer, mimeType) {
    if (!this.isAuthenticated) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    try {
      const filePath = `${this.currentUser.id}/${Date.now()}_${fileName}`;
      
      const { data, error } = await this.supabase.storage
        .from('study-materials')
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: false
        });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        file: {
          id: data.path,
          name: fileName,
          path: data.path,
          size: fileBuffer.length,
          mimeType,
          uploadedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listFiles(folder = '') {
    if (!this.isAuthenticated) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    try {
      const userFolder = folder ? `${this.currentUser.id}/${folder}` : this.currentUser.id;
      
      const { data, error } = await this.supabase.storage
        .from('study-materials')
        .list(userFolder);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      const files = data.map(file => ({
        id: file.id,
        name: file.name,
        size: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype || 'application/octet-stream',
        lastModified: file.updated_at || file.created_at,
        isFolder: false
      }));

      return {
        success: true,
        files
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async downloadFile(filePath) {
    if (!this.isAuthenticated) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    try {
      const { data, error } = await this.supabase.storage
        .from('study-materials')
        .download(filePath);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data,
        buffer: await data.arrayBuffer()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFile(filePath) {
    if (!this.isAuthenticated) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    try {
      const { error } = await this.supabase.storage
        .from('study-materials')
        .remove([filePath]);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        message: 'File deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createFolder(folderName, parentPath = '') {
    try {
      if (!this.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName;
      const placeholderPath = `${folderPath}/.placeholder`;

      // Create a placeholder file to establish the folder
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(placeholderPath, new Blob([''], { type: 'text/plain' }));

      if (error) {
        throw error;
      }

      return {
        success: true,
        folderId: folderPath,
        folderName: folderName,
        path: folderPath
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async renameFolder(folderId, newName) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      // For Supabase, we need to list all files in the folder and move them
      const { data: files, error: listError } = await this.supabase.storage
        .from(this.bucketName)
        .list(folderId);

      if (listError) {
        throw listError;
      }

      const parentPath = folderId.includes('/') ? folderId.substring(0, folderId.lastIndexOf('/')) : '';
      const newFolderPath = parentPath ? `${parentPath}/${newName}` : newName;

      // Move all files to the new folder path
      for (const file of files) {
        if (file.name !== '.placeholder') {
          const oldPath = `${folderId}/${file.name}`;
          const newPath = `${newFolderPath}/${file.name}`;
          
          await this.supabase.storage
            .from(this.bucketName)
            .move(oldPath, newPath);
        }
      }

      // Create placeholder in new folder and remove old folder
      await this.createFolder(newName, parentPath);
      await this.supabase.storage
        .from(this.bucketName)
        .remove([`${folderId}/.placeholder`]);

      return {
        success: true,
        oldFolderId: folderId,
        newFolderId: newFolderPath,
        newName: newName
      };
    } catch (error) {
      console.error('Error renaming folder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async disconnect() {
    try {
      await this.supabase.auth.signOut();
      this.isAuthenticated = false;
      this.currentUser = null;
      
      return {
        success: true,
        message: 'Signed out successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SupabaseCloudStorage;