import express from 'express';
import {
  getTemplate,
  updateTemplate,
  previewTemplate,
} from '../controllers/templateController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/template/{tenantId}:
 *   get:
 *     summary: Get template for a tenant
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenantId:
 *                   type: string
 *                 template:
 *                   type: string
 *                 isDefault:
 *                   type: boolean
 *   put:
 *     summary: Update template for a tenant
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template
 *             properties:
 *               template:
 *                 type: string
 *                 description: EJS template content
 *     responses:
 *       200:
 *         description: Template updated successfully
 */
router.get('/:tenantId', authenticate, getTemplate);
router.put('/:tenantId', authenticate, updateTemplate);

/**
 * @swagger
 * /api/template/{tenantId}/preview:
 *   post:
 *     summary: Preview template with sample data
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template
 *             properties:
 *               template:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rendered HTML preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 html:
 *                   type: string
 */
router.post('/:tenantId/preview', authenticate, previewTemplate);

export default router;

