/**
 * AI Engine Index - Main entry point for AI processing
 * Handles content analysis, quiz generation, and provider management
 */

const ContentAnalyzer = require('./contentAnalyzer');
const QuizGenerator = require('./quizGenerator');
const ProviderManager = require('./providerManager');
const logger = require('./utils/logger');

class AIEngine {
  constructor() {
    this.providerManager = new ProviderManager();
    this.contentAnalyzer = new ContentAnalyzer(this.providerManager);
    this.quizGenerator = new QuizGenerator(this.providerManager);
  }

  /**
   * Process uploaded content (PDF or video) and extract key concepts
   * @param {Object} file - File information
   * @param {string} subject - Subject category
   * @param {string} userId - User ID for personalization
   * @returns {Object} Processed content with topics and concepts
   */
  async processContent(file, subject, userId) {
    try {
      logger.info(`Processing ${file.mimetype} content for user ${userId}`);
      
      const extractedContent = await this.contentAnalyzer.extractContent(file);
      const analyzedContent = await this.contentAnalyzer.analyzeContent(
        extractedContent, 
        subject
      );

      return {
        success: true,
        content: analyzedContent,
        metadata: {
          fileType: file.mimetype,
          fileName: file.originalname,
          processedAt: new Date().toISOString(),
          subject: subject,
          userId: userId
        }
      };
    } catch (error) {
      logger.error('Content processing failed:', error);
      throw new Error(`Content processing failed: ${error.message}`);
    }
  }

  /**
   * Generate quiz questions based on processed content
   * @param {Object} content - Analyzed content with topics
   * @param {Object} options - Quiz generation options
   * @returns {Object} Generated quiz questions
   */
  async generateQuiz(content, options = {}) {
    try {
      const {
        numQuestions = 10,
        difficulty = 3,
        questionTypes = ['multiple-choice', 'true-false', 'short-answer'],
        focusTopics = null
      } = options;

      logger.info(`Generating quiz with ${numQuestions} questions, difficulty ${difficulty}`);

      const quiz = await this.quizGenerator.generateQuestions(content, {
        numQuestions,
        difficulty,
        questionTypes,
        focusTopics
      });

      return {
        success: true,
        quiz: quiz,
        metadata: {
          generatedAt: new Date().toISOString(),
          difficulty: difficulty,
          questionCount: quiz.questions.length,
          estimatedTime: quiz.questions.length * 2 // 2 minutes per question
        }
      };
    } catch (error) {
      logger.error('Quiz generation failed:', error);
      throw new Error(`Quiz generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze student performance and identify weak/strong topics
   * @param {Array} quizResults - Historical quiz results
   * @param {string} userId - User ID
   * @returns {Object} Performance analysis
   */
  async analyzePerformance(quizResults, userId) {
    try {
      logger.info(`Analyzing performance for user ${userId}`);

      const topicPerformance = {};
      const overallStats = {
        totalQuestions: 0,
        correctAnswers: 0,
        averageScore: 0,
        strongTopics: [],
        weakTopics: [],
        improvementTrend: 'stable'
      };

      // Process quiz results to identify patterns
      quizResults.forEach(result => {
        result.questions.forEach(question => {
          const topic = question.topic;
          if (!topicPerformance[topic]) {
            topicPerformance[topic] = {
              total: 0,
              correct: 0,
              accuracy: 0,
              attempts: []
            };
          }

          topicPerformance[topic].total++;
          topicPerformance[topic].attempts.push({
            correct: question.isCorrect,
            timestamp: result.completedAt,
            difficulty: question.difficulty
          });

          if (question.isCorrect) {
            topicPerformance[topic].correct++;
            overallStats.correctAnswers++;
          }

          overallStats.totalQuestions++;
        });
      });

      // Calculate topic accuracies and identify strong/weak areas
      Object.keys(topicPerformance).forEach(topic => {
        const performance = topicPerformance[topic];
        performance.accuracy = performance.correct / performance.total;

        if (performance.accuracy >= 0.8 && performance.total >= 5) {
          overallStats.strongTopics.push({
            topic: topic,
            accuracy: performance.accuracy,
            attempts: performance.total
          });
        } else if (performance.accuracy < 0.6 && performance.total >= 3) {
          overallStats.weakTopics.push({
            topic: topic,
            accuracy: performance.accuracy,
            attempts: performance.total
          });
        }
      });

      overallStats.averageScore = overallStats.totalQuestions > 0 
        ? overallStats.correctAnswers / overallStats.totalQuestions 
        : 0;

      return {
        success: true,
        analysis: {
          overallStats,
          topicPerformance,
          recommendations: this._generateRecommendations(overallStats, topicPerformance)
        }
      };
    } catch (error) {
      logger.error('Performance analysis failed:', error);
      throw new Error(`Performance analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate study recommendations based on performance analysis
   * @private
   */
  _generateRecommendations(overallStats, topicPerformance) {
    const recommendations = [];

    // Focus on weak topics
    if (overallStats.weakTopics.length > 0) {
      recommendations.push({
        type: 'focus_weak_topics',
        priority: 'high',
        message: `Focus on improving: ${overallStats.weakTopics.map(t => t.topic).join(', ')}`,
        topics: overallStats.weakTopics.map(t => t.topic)
      });
    }

    // Practice more if overall accuracy is low
    if (overallStats.averageScore < 0.7) {
      recommendations.push({
        type: 'increase_practice',
        priority: 'medium',
        message: 'Consider increasing your daily practice time',
        suggestedAction: 'Take more quizzes to improve overall performance'
      });
    }

    // Maintain strong topics
    if (overallStats.strongTopics.length > 0) {
      recommendations.push({
        type: 'maintain_strengths',
        priority: 'low',
        message: `Keep up the good work on: ${overallStats.strongTopics.map(t => t.topic).join(', ')}`,
        topics: overallStats.strongTopics.map(t => t.topic)
      });
    }

    return recommendations;
  }

  /**
   * Get available AI providers and their status
   * @returns {Object} Provider status information
   */
  async getProviderStatus() {
    return await this.providerManager.getProviderStatus();
  }
}

module.exports = AIEngine;