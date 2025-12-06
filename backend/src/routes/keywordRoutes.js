import express from 'express';
import {
  createKeyword,
  bulkCreateKeywords,
  getKeywords,
  getKeyword,
  updateKeyword,
  deleteKeyword,
  retryKeyword,
} from '../controllers/keywordController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/keywords:
 *   get:
 *     summary: Get all keywords
 *     tags: [Keywords]
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter by tenant ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, generating, completed, failed]
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
 *         description: List of keywords with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keywords:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Keyword'
 *                 pagination:
 *                   type: object
 *   post:
 *     summary: Create a new keyword
 *     tags: [Keywords]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - keyword
 *               - type
 *             properties:
 *               tenantId:
 *                 type: string
 *               keyword:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [essay, speech, tenLines]
 *     responses:
 *       201:
 *         description: Keyword created successfully
 */
router.post('/', authenticate, createKeyword);

/**
 * @swagger
 * /api/keywords/bulk:
 *   post:
 *     summary: Bulk create keywords
 *     tags: [Keywords]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - keywords
 *               - type
 *             properties:
 *               tenantId:
 *                 type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               type:
 *                 type: string
 *                 enum: [essay, speech, tenLines]
 *     responses:
 *       201:
 *         description: Keywords created
 */
router.post('/bulk', authenticate, bulkCreateKeywords);
router.get('/', authenticate, getKeywords);

/**
 * @swagger
 * /api/keywords/{id}:
 *   get:
 *     summary: Get keyword by ID
 *     tags: [Keywords]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Keyword details
 *       404:
 *         description: Keyword not found
 *   put:
 *     summary: Update keyword
 *     tags: [Keywords]
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
 *               keyword:
 *                 type: string
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Keyword updated
 *   delete:
 *     summary: Delete keyword
 *     tags: [Keywords]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Keyword deleted
 */
router.get('/:id', authenticate, getKeyword);
router.put('/:id', authenticate, updateKeyword);
router.delete('/:id', authenticate, deleteKeyword);

/**
 * @swagger
 * /api/keywords/{id}/retry:
 *   post:
 *     summary: Retry generating content for a keyword
 *     tags: [Keywords]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content generation started
 *       404:
 *         description: Keyword not found
 *       500:
 *         description: Generation failed
 */
router.post('/:id/retry', authenticate, retryKeyword);

export default router;

