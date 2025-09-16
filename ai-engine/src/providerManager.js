/**
 * Provider Manager - Handles multiple AI providers with fallback support
 * Supports OpenAI GPT, Google Gemini, and Anthropic Claude
 */

const OpenAIProvider = require('./providers/openai');
const GoogleProvider = require('./providers/google');
const AnthropicProvider = require('./providers/anthropic');
const logger = require('./utils/logger');

class ProviderManager {
  constructor() {
    this.providers = new Map();
    this.fallbackOrder = ['openai', 'google', 'anthropic'];
    this.currentProvider = process.env.DEFAULT_AI_PROVIDER || 'openai';
    
    this.initializeProviders();
  }

  /**
   * Initialize all available AI providers
   */
  initializeProviders() {
    try {
      // Initialize OpenAI
      if (process.env.OPENAI_API_KEY) {
        this.providers.set('openai', new OpenAIProvider());
        logger.info('OpenAI provider initialized');
      }

      // Initialize Google Gemini
      if (process.env.GOOGLE_AI_API_KEY) {
        this.providers.set('google', new GoogleProvider());
        logger.info('Google Gemini provider initialized');
      }

      // Initialize Anthropic Claude
      if (process.env.ANTHROPIC_API_KEY) {
        this.providers.set('anthropic', new AnthropicProvider());
        logger.info('Anthropic Claude provider initialized');
      }

      if (this.providers.size === 0) {
        throw new Error('No AI providers configured. Please add API keys to environment variables.');
      }

      logger.info(`Initialized ${this.providers.size} AI providers`);
    } catch (error) {
      logger.error('Failed to initialize AI providers:', error);
      throw error;
    }
  }

  /**
   * Execute a request with automatic fallback to other providers
   * @param {string} method - Method name to call on provider
   * @param {Array} args - Arguments to pass to the method
   * @param {Object} options - Options including retry settings
   * @returns {*} Result from the AI provider
   */
  async executeWithFallback(method, args, options = {}) {
    const { maxRetries = 3, timeout = 30000 } = options;
    let lastError;

    // Try each provider in fallback order
    for (const providerName of this.fallbackOrder) {
      if (!this.providers.has(providerName)) {
        continue;
      }

      const provider = this.providers.get(providerName);
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          logger.debug(`Attempting ${method} with ${providerName} (attempt ${attempt})`);
          
          const result = await Promise.race([
            provider[method](...args),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
          ]);

          logger.info(`Successfully executed ${method} with ${providerName}`);
          return {
            result,
            provider: providerName,
            attempt
          };

        } catch (error) {
          lastError = error;
          logger.warn(`${providerName} attempt ${attempt} failed:`, error.message);
          
          // If it's a rate limit error, wait before retrying
          if (error.message.includes('rate limit') && attempt < maxRetries) {
            await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          }
        }
      }

      logger.error(`${providerName} provider failed after ${maxRetries} attempts`);
    }

    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Analyze content using the best available provider
   * @param {string} content - Content to analyze
   * @param {string} subject - Subject context
   * @returns {Object} Analysis result
   */
  async analyzeContent(content, subject) {
    return await this.executeWithFallback('analyzeContent', [content, subject]);
  }

  /**
   * Generate quiz questions using the best available provider
   * @param {Object} content - Analyzed content
   * @param {Object} options - Quiz generation options
   * @returns {Object} Generated quiz
   */
  async generateQuiz(content, options) {
    return await this.executeWithFallback('generateQuiz', [content, options]);
  }

  /**
   * Extract key concepts from content
   * @param {string} content - Raw content
   * @param {string} context - Additional context
   * @returns {Array} Key concepts
   */
  async extractConcepts(content, context) {
    return await this.executeWithFallback('extractConcepts', [content, context]);
  }

  /**
   * Get status of all providers
   * @returns {Object} Provider status information
   */
  async getProviderStatus() {
    const status = {};

    for (const [name, provider] of this.providers) {
      try {
        const isHealthy = await provider.healthCheck();
        status[name] = {
          available: true,
          healthy: isHealthy,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        status[name] = {
          available: false,
          healthy: false,
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }
    }

    return {
      providers: status,
      currentProvider: this.currentProvider,
      fallbackOrder: this.fallbackOrder
    };
  }

  /**
   * Switch to a specific provider
   * @param {string} providerName - Name of provider to switch to
   */
  switchProvider(providerName) {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider '${providerName}' is not available`);
    }
    
    this.currentProvider = providerName;
    logger.info(`Switched to provider: ${providerName}`);
  }

  /**
   * Delay helper for rate limiting
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ProviderManager;