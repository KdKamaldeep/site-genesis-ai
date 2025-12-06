import AIProvider from '../models/AIProvider.js';
import config from '../config.js';
import logger from '../utils/logger.js';

/**
 * Get AI provider configuration
 */
export const getAIProviders = async (req, res) => {
  try {
    const providerConfig = await AIProvider.getConfig();
    
    // Update hasApiKey based on current environment
    providerConfig.openai.hasApiKey = !!config.openaiApiKey;
    providerConfig.gemini.hasApiKey = !!config.geminiApiKey;
    
    // Save if hasApiKey changed
    if (providerConfig.isModified('openai.hasApiKey') || providerConfig.isModified('gemini.hasApiKey')) {
      await providerConfig.save();
    }
    
    res.json({
      openai: {
        enabled: providerConfig.openai.enabled,
        hasApiKey: providerConfig.openai.hasApiKey,
      },
      gemini: {
        enabled: providerConfig.gemini.enabled,
        hasApiKey: providerConfig.gemini.hasApiKey,
      },
    });
  } catch (error) {
    logger.error('Error reading AI provider config:', error);
    // Return default config on error
    res.json({
      openai: {
        enabled: true,
        hasApiKey: !!config.openaiApiKey,
      },
      gemini: {
        enabled: true,
        hasApiKey: !!config.geminiApiKey,
      },
    });
  }
};

/**
 * Update AI provider configuration
 */
export const updateAIProviders = async (req, res) => {
  try {
    const { openai, gemini } = req.body;
    
    if (typeof openai?.enabled !== 'boolean' || typeof gemini?.enabled !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request. Both openai.enabled and gemini.enabled must be boolean values.' });
    }
    
    // Get or create config
    const providerConfig = await AIProvider.getConfig();
    
    // Update enabled status
    providerConfig.openai.enabled = openai.enabled;
    providerConfig.gemini.enabled = gemini.enabled;
    
    // Update hasApiKey based on current environment (read-only, determined by env vars)
    providerConfig.openai.hasApiKey = !!config.openaiApiKey;
    providerConfig.gemini.hasApiKey = !!config.geminiApiKey;
    
    await providerConfig.save();
    
    logger.info(`AI provider settings updated: OpenAI=${openai.enabled}, Gemini=${gemini.enabled}`);
    res.json({
      openai: {
        enabled: providerConfig.openai.enabled,
        hasApiKey: providerConfig.openai.hasApiKey,
      },
      gemini: {
        enabled: providerConfig.gemini.enabled,
        hasApiKey: providerConfig.gemini.hasApiKey,
      },
    });
  } catch (error) {
    logger.error('Error updating AI provider config:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get AI provider enabled status (for internal use)
 */
export const getAIProviderStatus = async () => {
  try {
    const providerConfig = await AIProvider.getConfig();
    return {
      openai: providerConfig.openai.enabled && !!config.openaiApiKey,
      gemini: providerConfig.gemini.enabled && !!config.geminiApiKey,
    };
  } catch (error) {
    logger.error('Error getting AI provider status:', error);
    // Return default: both enabled if API keys exist
    return {
      openai: !!config.openaiApiKey,
      gemini: !!config.geminiApiKey,
    };
  }
};

