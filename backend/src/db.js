import mongoose from 'mongoose';
import config from './config.js';
import logger from './utils/logger.js';
import AIProvider from './models/AIProvider.js';

const connectDB = async () => {
  try {
    if (!config.mongodbUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(config.mongodbUri);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize AI Provider settings if they don't exist
    try {
      await AIProvider.getConfig();
      logger.info('AI Provider settings initialized');
    } catch (error) {
      logger.warn('Error initializing AI Provider settings:', error);
    }
    
    return conn;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;

