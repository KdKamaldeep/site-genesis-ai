import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import connectDB from './db.js';
import config from './config.js';
import logger from './utils/logger.js';

// Routes
import tenantRoutes from './routes/tenantRoutes.js';
import keywordRoutes from './routes/keywordRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cronRoutes from './routes/cronRoutes.js';
import aiProviderRoutes from './routes/aiProviderRoutes.js';

// Cron jobs
import './cron/tenantCron.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SiteGenesis AI API Documentation',
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/keywords', keywordRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/template', templateRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/ai-providers', aiProviderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

