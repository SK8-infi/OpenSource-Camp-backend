import User from '../models/user.model.js';

/**
 * Save GitHub username and mark Page 1 as completed
 */
export const saveGitHubUsername = async (req, res) => {
  try {
    const { githubUsername, clearPrevious } = req.body;
    const userId = req.user._id;

    if (!githubUsername || githubUsername.trim() === '') {
      return res.status(400).json({ message: 'GitHub username is required' });
    }

    // Validate: no spaces
    if (githubUsername.includes(' ')) {
      return res.status(400).json({ message: 'GitHub username cannot contain spaces' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update GitHub username
    user.githubUsername = githubUsername.trim();

    // If clearing previous, remove Page 1 from completed pages
    if (clearPrevious) {
      user.completedPages = user.completedPages.filter(page => page !== 1);
    }

    // Mark Page 1 as completed if not already
    if (!user.completedPages.includes(1)) {
      user.completedPages.push(1);
    }

    await user.save();

    res.json({
      message: 'GitHub username saved successfully',
      completedPages: user.completedPages
    });
  } catch (error) {
    console.error('Error saving GitHub username:', error);
    res.status(500).json({ message: 'Error saving GitHub username', error: error.message });
  }
};

/**
 * Save Microsoft Learn email and mark Page 2 as completed
 */
export const saveMicrosoftLearnEmail = async (req, res) => {
  try {
    const { email, clearPrevious } = req.body;
    const userId = req.user._id;

    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Basic email validation

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update Microsoft Learn email
    user.microsoftLearnEmail = email.trim().toLowerCase();

    // If clearing previous, remove Page 2 from completed pages
    if (clearPrevious) {
      user.completedPages = user.completedPages.filter(page => page !== 2);
    }

    // Mark Page 2 as completed if not already
    if (!user.completedPages.includes(2)) {
      user.completedPages.push(2);
    }

    await user.save();

    res.json({
      message: 'Microsoft Learn email saved successfully',
      completedPages: user.completedPages
    });
  } catch (error) {
    console.error('Error saving Microsoft Learn email:', error);
    res.status(500).json({ message: 'Error saving Microsoft Learn email', error: error.message });
  }
};

/**
 * Mark a page as completed
 */
export const markPageComplete = async (req, res) => {
  try {
    const { pageNumber } = req.body;
    const userId = req.user._id;

    if (!pageNumber || typeof pageNumber !== 'number' || pageNumber < 1) {
      return res.status(400).json({ message: 'Valid page number is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mark page as completed if not already
    if (!user.completedPages.includes(pageNumber)) {
      user.completedPages.push(pageNumber);
      // Sort to keep pages in order
      user.completedPages.sort((a, b) => a - b);
      await user.save();
    }

    res.json({
      message: `Page ${pageNumber} marked as completed`,
      completedPages: user.completedPages
    });
  } catch (error) {
    console.error('Error marking page as complete:', error);
    res.status(500).json({ message: 'Error marking page as complete', error: error.message });
  }
};

/**
 * Mark a page as incomplete (remove from completed pages)
 */
export const markPageIncomplete = async (req, res) => {
  try {
    const { pageNumber } = req.body;
    const userId = req.user._id;

    if (!pageNumber || typeof pageNumber !== 'number' || pageNumber < 1) {
      return res.status(400).json({ message: 'Valid page number is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove page from completed pages
    user.completedPages = user.completedPages.filter(page => page !== pageNumber);
    await user.save();

    res.json({
      message: `Page ${pageNumber} marked as incomplete`,
      completedPages: user.completedPages
    });
  } catch (error) {
    console.error('Error marking page as incomplete:', error);
    res.status(500).json({ message: 'Error marking page as incomplete', error: error.message });
  }
};

/**
 * Get current user's progress
 */
export const getUserProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      name: user.name || null,
      githubUsername: user.githubUsername || null,
      microsoftLearnEmail: user.microsoftLearnEmail || null,
      completedPages: user.completedPages || [],
      lastViewedPage: user.lastViewedPage || 1
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ message: 'Error fetching user progress', error: error.message });
  }
};

/**
 * Update last viewed page
 */
export const updateLastViewedPage = async (req, res) => {
  try {
    const { pageNumber } = req.body;
    const userId = req.user._id;

    if (!pageNumber || typeof pageNumber !== 'number' || pageNumber < 1) {
      return res.status(400).json({ message: 'Valid page number is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.lastViewedPage = pageNumber;
    await user.save();

    res.json({
      message: 'Last viewed page updated',
      lastViewedPage: user.lastViewedPage
    });
  } catch (error) {
    console.error('Error updating last viewed page:', error);
    res.status(500).json({ message: 'Error updating last viewed page', error: error.message });
  }
};

