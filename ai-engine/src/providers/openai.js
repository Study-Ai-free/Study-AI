const { OpenAI } = require('openai');
const logger = require('../utils/logger');

class OpenAIProvider {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = 'gpt-3.5-turbo';
  }

  /**
   * Analyze content and extract key concepts
   */
  async analyzeContent(content, subject) {
    try {
      const prompt = `Analyze the following ${subject} content and extract key learning topics and concepts. 
      
Content: "${content}"

Please respond with a JSON object containing:
- topics: Array of main topics covered
- keyConcepts: Array of important concepts to learn
- summary: Brief summary of the content
- difficulty: Estimated difficulty level (1-5)

Format your response as valid JSON only.`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        topics: result.topics || [],
        keyConcepts: result.keyConcepts || [],
        summary: result.summary || '',
        difficulty: result.difficulty || 3,
        provider: 'openai'
      };

    } catch (error) {
      logger.error('OpenAI content analysis error:', error);
      throw new Error(`OpenAI analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate quiz questions from content
   */
  async generateQuiz(content, options = {}) {
    try {
      const {
        questionCount = 10,
        difficulty = 3,
        questionTypes = ['multiple_choice', 'true_false', 'short_answer'],
        topics = []
      } = options;

      const topicsFilter = topics.length > 0 ? ` Focus on these topics: ${topics.join(', ')}` : '';

      const prompt = `Create a quiz with ${questionCount} questions based on this content.${topicsFilter}

Content: "${content.summary}"
Key Concepts: ${content.keyConcepts?.join(', ')}

Requirements:
- Difficulty level: ${difficulty}/5
- Question types: ${questionTypes.join(', ')}
- Each question should test understanding of key concepts
- Provide clear explanations for correct answers

Format as JSON with this structure:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why this answer is correct",
      "topic": "Related topic",
      "difficulty": 3,
      "points": 1
    }
  ]
}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        questions: result.questions || [],
        totalQuestions: result.questions?.length || 0,
        estimatedTime: Math.ceil((result.questions?.length || 0) * 1.5), // 1.5 min per question
        provider: 'openai'
      };

    } catch (error) {
      logger.error('OpenAI quiz generation error:', error);
      throw new Error(`OpenAI quiz generation failed: ${error.message}`);
    }
  }

  /**
   * Extract key concepts from raw text
   */
  async extractConcepts(text, context = '') {
    try {
      const prompt = `Extract the most important learning concepts from this text. ${context ? `Context: ${context}` : ''}

Text: "${text}"

Return a JSON array of concepts with their importance scores:
[
  {
    "concept": "Concept name",
    "description": "Brief description",
    "importance": 0.9,
    "keywords": ["related", "keywords"]
  }
]`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 800
      });

      const concepts = JSON.parse(response.choices[0].message.content);
      
      return concepts.map(concept => ({
        ...concept,
        provider: 'openai'
      }));

    } catch (error) {
      logger.error('OpenAI concept extraction error:', error);
      throw new Error(`OpenAI concept extraction failed: ${error.message}`);
    }
  }

  /**
   * Health check for the provider
   */
  async healthCheck() {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });

      return response.choices && response.choices.length > 0;
    } catch (error) {
      logger.warn('OpenAI health check failed:', error.message);
      return false;
    }
  }
}

module.exports = OpenAIProvider;