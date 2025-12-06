import express from 'express';
import {
  runCronForTenant,
  updateCronFrequency,
} from '../controllers/cronController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/cron/run/{tenantId}:
 *   post:
 *     summary: Manually run cron for a tenant (Admin only)
 *     tags: [Cron]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cron job executed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 generated:
 *                   type: integer
 */
router.post('/run/:tenantId', authenticate, requireAdmin, runCronForTenant);

/**
 * @swagger
 * /api/cron/update/{tenantId}:
 *   put:
 *     summary: Update cron frequency for a tenant (Admin only)
 *     tags: [Cron]
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
 *               - cronFrequency
 *             properties:
 *               cronFrequency:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 description: Posts per day
 *     responses:
 *       200:
 *         description: Cron frequency updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 */
router.put('/update/:tenantId', authenticate, requireAdmin, updateCronFrequency);

export default router;

