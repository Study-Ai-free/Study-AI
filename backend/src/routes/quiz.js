const express = require('express');
const authMiddleware = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const logger = require('../utils/logger');

const router = express.Router();

// Generate a new quiz
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { subjectId, difficulty = 3, questionCount = 10 } = req.body;
    const userId = req.user.id;

    // For now, return a mock quiz until AI integration is complete
    const mockQuiz = {
      id: 'mock-quiz-id',
      title: 'Sample Quiz',
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          explanation: 'Basic addition: 2 + 2 = 4'
        }
      ]
    };

    res.json({ quiz: mockQuiz });
  } catch (error) {
    logger.error('Quiz generation error:', error);
    res.status(500).json({ message: 'Server error generating quiz' });
  }
});

// Get user's quizzes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Mock response for now
    res.json({ quizzes: [] });
  } catch (error) {
    logger.error('Quiz retrieval error:', error);
    res.status(500).json({ message: 'Server error retrieving quizzes' });
  }
});

module.exports = router;