const OneDriveCloudStorage = require('./OneDriveCloudStorage');

class CloudDatabase {
  constructor(storageProvider) {
    this.storage = storageProvider;
  }

  // User Management
  async getUserProfile() {
    try {
      const result = await this.storage.loadJSON('data/user-profile.json');
      if (result.success) {
        return result.data;
      } else {
        // Return default profile if file doesn't exist
        return { initialized: true, createdAt: new Date().toISOString() };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async updateUserProfile(profileData) {
    try {
      const currentProfile = await this.getUserProfile();
      const updatedProfile = { ...currentProfile, ...profileData, updatedAt: new Date().toISOString() };
      const result = await this.storage.saveJSON('data/user-profile.json', updatedProfile);
      return result.success;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Subject Management
  async getSubjects() {
    try {
      const result = await this.storage.loadJSON('data/subjects.json');
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error getting subjects:', error);
      return [];
    }
  }

  async addSubject(subject) {
    try {
      const subjects = await this.getSubjects();
      const newSubject = {
        id: Date.now().toString(),
        name: subject.name,
        description: subject.description || '',
        createdAt: new Date().toISOString(),
        fileCount: 0,
        quizCount: 0
      };
      
      subjects.push(newSubject);
      
      // Create subject folder in uploads
      await this.storage.createFolder(newSubject.id, '/StudyAI-Data/uploads');
      
      const result = await this.storage.saveJSON('data/subjects.json', subjects);
      return result.success ? newSubject : null;
    } catch (error) {
      console.error('Error adding subject:', error);
      return null;
    }
  }

  async updateSubject(subjectId, updates) {
    try {
      const subjects = await this.getSubjects();
      const index = subjects.findIndex(s => s.id === subjectId);
      
      if (index !== -1) {
        subjects[index] = { ...subjects[index], ...updates, updatedAt: new Date().toISOString() };
        const result = await this.storage.saveJSON('data/subjects.json', subjects);
        return result.success ? subjects[index] : null;
      }
      return null;
    } catch (error) {
      console.error('Error updating subject:', error);
      return null;
    }
  }

  async deleteSubject(subjectId) {
    try {
      const subjects = await this.getSubjects();
      const filteredSubjects = subjects.filter(s => s.id !== subjectId);
      
      // Note: In a real implementation, you'd also delete the subject folder and all its contents
      
      const result = await this.storage.saveJSON('data/subjects.json', filteredSubjects);
      return result.success;
    } catch (error) {
      console.error('Error deleting subject:', error);
      return false;
    }
  }

  // Content Management
  async uploadContent(file, subjectId, metadata = {}) {
    try {
      const subjects = await this.getSubjects();
      const subject = subjects.find(s => s.id === subjectId);
      
      if (!subject) {
        throw new Error('Subject not found');
      }

      const fileId = Date.now().toString();
      const fileExtension = file.originalname.split('.').pop();
      const remoteFilePath = `uploads/${subjectId}/${fileId}.${fileExtension}`;
      
      // Upload file to OneDrive
      const uploadResult = await this.storage.uploadFile(file.path, remoteFilePath);
      
      if (!uploadResult.success) {
        throw new Error('File upload failed');
      }

      // Create content metadata
      const contentMetadata = {
        id: fileId,
        originalName: file.originalname,
        fileName: `${fileId}.${fileExtension}`,
        filePath: remoteFilePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        subjectId: subjectId,
        uploadedAt: new Date().toISOString(),
        processed: false,
        downloadUrl: uploadResult.downloadUrl,
        ...metadata
      };

      // Save content metadata
      const contentListResult = await this.storage.loadJSON(`uploads/${subjectId}/content-list.json`);
      const contentList = contentListResult.success ? contentListResult.data : [];
      contentList.push(contentMetadata);
      
      await this.storage.saveJSON(`uploads/${subjectId}/content-list.json`, contentList);
      
      // Update subject file count
      await this.updateSubject(subjectId, { fileCount: subject.fileCount + 1 });
      
      return contentMetadata;
    } catch (error) {
      console.error('Error uploading content:', error);
      return null;
    }
  }

  async getContentList(subjectId) {
    try {
      const result = await this.storage.loadJSON(`uploads/${subjectId}/content-list.json`);
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error getting content list:', error);
      return [];
    }
  }

  async getContentById(subjectId, contentId) {
    try {
      const contentList = await this.getContentList(subjectId);
      return contentList.find(c => c.id === contentId) || null;
    } catch (error) {
      console.error('Error getting content by ID:', error);
      return null;
    }
  }

  async deleteContent(subjectId, contentId) {
    try {
      const contentList = await this.getContentList(subjectId);
      const content = contentList.find(c => c.id === contentId);
      
      if (!content) {
        return false;
      }

      // Delete file from OneDrive
      await this.storage.deleteFile(content.filePath);
      
      // Update content list
      const updatedList = contentList.filter(c => c.id !== contentId);
      await this.storage.saveJSON(`uploads/${subjectId}/content-list.json`, updatedList);
      
      // Update subject file count
      const subjects = await this.getSubjects();
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) {
        await this.updateSubject(subjectId, { fileCount: Math.max(0, subject.fileCount - 1) });
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      return false;
    }
  }

  // Quiz Management
  async saveQuiz(quiz) {
    try {
      const quizId = quiz.id || Date.now().toString();
      const quizData = {
        ...quiz,
        id: quizId,
        createdAt: quiz.createdAt || new Date().toISOString()
      };
      
      const result = await this.storage.saveJSON(`generated/quizzes/${quizId}.json`, quizData);
      
      if (result.success && quiz.subjectId) {
        // Update subject quiz count
        const subjects = await this.getSubjects();
        const subject = subjects.find(s => s.id === quiz.subjectId);
        if (subject) {
          await this.updateSubject(quiz.subjectId, { quizCount: subject.quizCount + 1 });
        }
      }
      
      return result.success ? quizData : null;
    } catch (error) {
      console.error('Error saving quiz:', error);
      return null;
    }
  }

  async getQuiz(quizId) {
    try {
      const result = await this.storage.loadJSON(`generated/quizzes/${quizId}.json`);
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error getting quiz:', error);
      return null;
    }
  }

  async getQuizzesBySubject(subjectId) {
    try {
      // List all quiz files
      const filesResult = await this.storage.listFiles('generated/quizzes');
      if (!filesResult.success) {
        return [];
      }

      const quizzes = [];
      for (const file of filesResult.files) {
        if (file.name.endsWith('.json')) {
          const quizResult = await this.storage.loadJSON(`generated/quizzes/${file.name}`);
          if (quizResult.success && quizResult.data.subjectId === subjectId) {
            quizzes.push(quizResult.data);
          }
        }
      }
      
      return quizzes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting quizzes by subject:', error);
      return [];
    }
  }

  // Quiz History and Analytics
  async saveQuizResponse(response) {
    try {
      const quizHistory = await this.getQuizHistory();
      const responseData = {
        id: Date.now().toString(),
        quizId: response.quizId,
        subjectId: response.subjectId,
        answers: response.answers,
        score: response.score,
        totalQuestions: response.totalQuestions,
        completedAt: new Date().toISOString(),
        timeSpent: response.timeSpent || 0
      };
      
      quizHistory.push(responseData);
      
      const result = await this.storage.saveJSON('data/quiz-history.json', quizHistory);
      
      if (result.success) {
        // Update analytics
        await this.updateAnalytics(responseData);
      }
      
      return result.success ? responseData : null;
    } catch (error) {
      console.error('Error saving quiz response:', error);
      return null;
    }
  }

  async getQuizHistory() {
    try {
      const result = await this.storage.loadJSON('data/quiz-history.json');
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error getting quiz history:', error);
      return [];
    }
  }

  async getAnalytics() {
    try {
      const result = await this.storage.loadJSON('data/analytics.json');
      return result.success ? result.data : { totalQuizzes: 0, averageScore: 0, subjects: {} };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return { totalQuizzes: 0, averageScore: 0, subjects: {} };
    }
  }

  async updateAnalytics(quizResponse) {
    try {
      const analytics = await this.getAnalytics();
      
      // Update overall stats
      analytics.totalQuizzes = (analytics.totalQuizzes || 0) + 1;
      
      const allResponses = await this.getQuizHistory();
      const totalScore = allResponses.reduce((sum, r) => sum + (r.score || 0), 0);
      analytics.averageScore = totalScore / allResponses.length;
      
      // Update subject-specific stats
      if (!analytics.subjects) {
        analytics.subjects = {};
      }
      
      if (!analytics.subjects[quizResponse.subjectId]) {
        analytics.subjects[quizResponse.subjectId] = {
          totalQuizzes: 0,
          averageScore: 0,
          lastQuizDate: null
        };
      }
      
      const subjectStats = analytics.subjects[quizResponse.subjectId];
      subjectStats.totalQuizzes += 1;
      subjectStats.lastQuizDate = quizResponse.completedAt;
      
      // Calculate subject average score
      const subjectResponses = allResponses.filter(r => r.subjectId === quizResponse.subjectId);
      const subjectTotalScore = subjectResponses.reduce((sum, r) => sum + (r.score || 0), 0);
      subjectStats.averageScore = subjectTotalScore / subjectResponses.length;
      
      const result = await this.storage.saveJSON('data/analytics.json', analytics);
      return result.success ? analytics : null;
    } catch (error) {
      console.error('Error updating analytics:', error);
      return null;
    }
  }

  // Storage Info
  async getStorageInfo() {
    return await this.storage.getStorageInfo();
  }

  // File listing for debugging/admin
  async listAllFiles(folderPath = '') {
    return await this.storage.listFiles(folderPath);
  }
}

module.exports = CloudDatabase;