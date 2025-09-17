const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const Content = require('../models/Content');
const Subject = require('../models/Subject');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'mp4', 'avi', 'mov'];
  const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload content file
router.post('/file', authMiddleware, upload.single('file'), [
  body('subjectId').isUUID().withMessage('Valid subject ID required'),
  body('title').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { subjectId, title } = req.body;
    const userId = req.user.id;

    // Verify subject belongs to user
    const subject = await Subject.findByIdAndUser(subjectId, userId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Create content record
    const content = await Content.create({
      userId,
      subjectId,
      originalFilename: req.file.originalname,
      filePath: req.file.filename, // Store relative path
      fileType: path.extname(req.file.originalname).toLowerCase().slice(1),
      fileSize: req.file.size,
      uploadStatus: 'uploaded'
    });

    logger.info(`File uploaded: ${req.file.originalname} by user ${userId}`);

    // For now, skip background processing since FileProcessor service doesn't exist
    // FileProcessor.processFile(content.id);

    res.status(201).json({
      message: 'File uploaded successfully',
      content: {
        id: content.id,
        originalFilename: content.originalFilename,
        fileType: content.fileType,
        fileSize: content.fileSize,
        uploadStatus: content.uploadStatus,
        createdAt: content.createdAt
      }
    });

  } catch (error) {
    logger.error('File upload error:', error);
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Failed to clean up file:', unlinkError);
      }
    }

    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// Get user's uploaded content
router.get('/content', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectId, status } = req.query;

    const filters = { userId };
    if (subjectId) filters.subjectId = subjectId;
    if (status) filters.uploadStatus = status;

    const content = await Content.findByFilters(filters);

    res.json({
      content: content.map(item => ({
        id: item.id,
        originalFilename: item.originalFilename,
        fileType: item.fileType,
        fileSize: item.fileSize,
        uploadStatus: item.uploadStatus,
        subjectId: item.subjectId,
        createdAt: item.createdAt,
        processedAt: item.processedAt,
        hasTopics: item.processedContent?.topics?.length > 0
      }))
    });

  } catch (error) {
    logger.error('Content retrieval error:', error);
    res.status(500).json({ message: 'Server error retrieving content' });
  }
});

// Get content processing status
router.get('/content/:contentId/status', authMiddleware, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    const content = await Content.findByIdAndUser(contentId, userId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.json({
      id: content.id,
      uploadStatus: content.uploadStatus,
      processedAt: content.processedAt,
      topics: content.processedContent?.topics || [],
      summary: content.processedContent?.summary,
      keyConceptsCount: content.processedContent?.keyConcepts?.length || 0
    });

  } catch (error) {
    logger.error('Content status error:', error);
    res.status(500).json({ message: 'Server error retrieving content status' });
  }
});

// Delete content
router.delete('/content/:contentId', authMiddleware, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    const content = await Content.findByIdAndUser(contentId, userId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads', content.filePath);
    try {
      await fs.unlink(filePath);
    } catch (fileError) {
      logger.warn(`Failed to delete file: ${filePath}`, fileError);
    }

    // Delete from database
    await Content.delete(contentId);

    logger.info(`Content deleted: ${contentId} by user ${userId}`);

    res.json({ message: 'Content deleted successfully' });

  } catch (error) {
    logger.error('Content deletion error:', error);
    res.status(500).json({ message: 'Server error deleting content' });
  }
});

module.exports = router;