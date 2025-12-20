import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  saveGitHubUsername,
  saveMicrosoftLearnEmail,
  markPageComplete,
  getUserProgress
} from '../controllers/user.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Save GitHub username (marks Page 1 as completed)
router.post('/github', saveGitHubUsername);

// Save Microsoft Learn email (marks Page 2 as completed)
router.post('/microsoft-learn', saveMicrosoftLearnEmail);

// Mark any page as completed
router.post('/complete-page', markPageComplete);

// Get user progress
router.get('/me', getUserProgress);

export default router;

