import express from 'express';
import {
  getContent,
  getContentById,
  generateContentForTenant,
  updateContent,
  regenerateContent,
  deleteContent,
} from '../controllers/contentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/content:
 *   get:
 *     summary: Get all content
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [essay, speech, tenLines]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of content with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *                 pagination:
 *                   type: object
 */
router.get('/', authenticate, getContent);

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Get content by ID
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content details
 *       404:
 *         description: Content not found
 *   put:
 *     summary: Update content
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               sections:
 *                 type: object
 *               faq:
 *                 type: array
 *               meta:
 *                 type: object
 *     responses:
 *       200:
 *         description: Content updated
 *   delete:
 *     summary: Delete content
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content deleted
 */
router.get('/:id', authenticate, getContentById);

/**
 * @swagger
 * /api/content/generate/{tenantId}:
 *   post:
 *     summary: Generate content for a tenant
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               count:
 *                 type: integer
 *                 default: 5
 *                 description: Number of content items to generate
 *     responses:
 *       200:
 *         description: Content generation started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 generated:
 *                   type: integer
 *                 results:
 *                   type: array
 */
router.post('/generate/:tenantId', authenticate, generateContentForTenant);
router.put('/:id', authenticate, updateContent);

/**
 * @swagger
 * /api/content/{id}/regenerate:
 *   post:
 *     summary: Regenerate content
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content regenerated successfully
 */
router.post('/:id/regenerate', authenticate, regenerateContent);
router.delete('/:id', authenticate, deleteContent);

export default router;

