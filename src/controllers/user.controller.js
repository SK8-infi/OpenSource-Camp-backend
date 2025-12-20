import User from '../models/user.model.js';

/**
 * Save GitHub username and mark Page 1 as completed
 */
export const saveGitHubUsername = async (req, res) => {
  try {
    const { githubUsername } = req.body;
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
    const { email } = req.body;
    const userId = req.user._id;

    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update Microsoft Learn email
    user.microsoftLearnEmail = email.trim().toLowerCase();

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
      completedPages: user.completedPages || []
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ message: 'Error fetching user progress', error: error.message });
  }
};

