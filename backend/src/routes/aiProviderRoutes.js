import express from 'express';
import {
  getAIProviders,
  updateAIProviders,
} from '../controllers/aiProviderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/ai-providers:
 *   get:
 *     summary: Get AI provider configuration
 *     tags: [AI Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI provider configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 openai:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     hasApiKey:
 *                       type: boolean
 *                 gemini:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     hasApiKey:
 *                       type: boolean
 *   put:
 *     summary: Update AI provider configuration (Admin only)
 *     tags: [AI Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - openai
 *               - gemini
 *             properties:
 *               openai:
 *                 type: object
 *                 required:
 *                   - enabled
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *               gemini:
 *                 type: object
 *                 required:
 *                   - enabled
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: AI provider configuration updated
 *       400:
 *         description: Invalid request
 */
router.get('/', authenticate, getAIProviders);
router.put('/', authenticate, requireAdmin, updateAIProviders);

export default router;

