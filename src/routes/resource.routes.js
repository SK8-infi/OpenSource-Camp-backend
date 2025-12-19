import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
  markAsCompleted,
  getAnalytics
} from '../controllers/resource.controller.js';

const router = express.Router();

// Public routes (require authentication)
router.get('/', authenticate, getAllResources);
router.post('/:id/complete', authenticate, markAsCompleted);

// Admin-only routes
router.post('/', authenticate, requireAdmin, createResource);
router.put('/:id', authenticate, requireAdmin, updateResource);
router.delete('/:id', authenticate, requireAdmin, deleteResource);
router.get('/analytics', authenticate, requireAdmin, getAnalytics);

export default router;

