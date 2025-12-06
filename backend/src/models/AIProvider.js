import mongoose from 'mongoose';
import config from '../config.js';

const aiProviderSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    default: 'global', // Single global configuration
  },
  openai: {
    enabled: {
      type: Boolean,
      default: true,
    },
    hasApiKey: {
      type: Boolean,
      default: false,
    },
  },
  gemini: {
    enabled: {
      type: Boolean,
      default: true,
    },
    hasApiKey: {
      type: Boolean,
      default: false,
    },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Ensure only one document exists and sync API key status
aiProviderSchema.statics.getConfig = async function() {
  let providerConfig = await this.findById('global');
  if (!providerConfig) {
    providerConfig = new this({ 
      _id: 'global',
      openai: {
        enabled: true,
        hasApiKey: !!config.openaiApiKey,
      },
      gemini: {
        enabled: true,
        hasApiKey: !!config.geminiApiKey,
      },
    });
    await providerConfig.save();
  } else {
    // Sync API key status from environment
    const openaiHasKey = !!config.openaiApiKey;
    const geminiHasKey = !!config.geminiApiKey;
    
    if (providerConfig.openai.hasApiKey !== openaiHasKey || 
        providerConfig.gemini.hasApiKey !== geminiHasKey) {
      providerConfig.openai.hasApiKey = openaiHasKey;
      providerConfig.gemini.hasApiKey = geminiHasKey;
      await providerConfig.save();
    }
  }
  return providerConfig;
};

const AIProvider = mongoose.model('AIProvider', aiProviderSchema);

export default AIProvider;

