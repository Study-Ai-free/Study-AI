const logger = require('../utils/logger');

class FileProcessor {
  static async processFile(contentId) {
    // Mock file processing
    logger.info(`Mock processing file for content ID: ${contentId}`);
    
    // Simulate async processing
    setTimeout(() => {
      logger.info(`Mock processing completed for content ID: ${contentId}`);
    }, 1000);
  }
}

module.exports = FileProcessor;