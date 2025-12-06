import express from 'express';
import {
  createTenant,
  getTenants,
  getTenant,
  updateTenant,
  deleteTenant,
  importTenant,
  uploadMiddleware,
  handleMulterError,
} from '../controllers/tenantController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Get all tenants
 *     tags: [Tenants]
 *     responses:
 *       200:
 *         description: List of tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tenant'
 *   post:
 *     summary: Create a new tenant (Admin only)
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _id
 *               - name
 *               - domain
 *             properties:
 *               _id:
 *                 type: string
 *                 example: site1
 *               name:
 *                 type: string
 *                 example: My Site
 *               domain:
 *                 type: string
 *                 example: example.com
 *               logoUrl:
 *                 type: string
 *               adsenseCode:
 *                 type: string
 *               theme:
 *                 type: object
 *               cronFrequency:
 *                 type: number
 *                 default: 5
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, requireAdmin, createTenant);
router.get('/', authenticate, getTenants);

/**
 * @swagger
 * /api/tenants/import:
 *   post:
 *     summary: Import tenant from JSON file (Admin only)
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - tenantFile
 *             properties:
 *               tenantFile:
 *                 type: string
 *                 format: binary
 *                 description: JSON file containing tenant data
 *     responses:
 *       201:
 *         description: Tenant imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tenant:
 *                   $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Invalid file or missing required fields
 */
router.post('/import', authenticate, requireAdmin, uploadMiddleware, handleMulterError, importTenant);

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       404:
 *         description: Tenant not found
 *   put:
 *     summary: Update tenant (Admin only)
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               adsenseCode:
 *                 type: string
 *               theme:
 *                 type: object
 *               cronFrequency:
 *                 type: number
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       404:
 *         description: Tenant not found
 *   delete:
 *     summary: Delete tenant (Admin only)
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
 *       404:
 *         description: Tenant not found
 */
router.get('/:id', authenticate, getTenant);
router.put('/:id', authenticate, requireAdmin, updateTenant);
router.delete('/:id', authenticate, requireAdmin, deleteTenant);

export default router;

