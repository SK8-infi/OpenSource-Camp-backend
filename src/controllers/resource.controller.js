import Resource from '../models/resource.model.js';
import User from '../models/user.model.js';

export const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });

    const user = await User.findById(req.user._id);

    const completedResourceIds = new Set(
      user.completedResources.map(r => r.toString())
    );

    const resourcesWithCompletion = resources.map(resource => ({
      _id: resource._id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      url: resource.url,
      createdBy: resource.createdBy?.email,
      createdAt: resource.createdAt,
      completed: completedResourceIds.has(resource._id.toString())
    }));

    res.json(resourcesWithCompletion);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resources', error: error.message });
  }
};

export const createResource = async (req, res) => {
  try {
    const { title, description, type, url } = req.body;

    if (!title || !description || !type || !url) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const validTypes = ['video', 'article', 'pdf', 'course', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid resource type' });
    }

    const resource = new Resource({
      title,
      description,
      type,
      url,
      createdBy: req.user._id
    });

    await resource.save();

    res.status(201).json({
      _id: resource._id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      url: resource.url,
      createdBy: req.user.email,
      createdAt: resource.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating resource', error: error.message });
  }
};

export const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, url } = req.body;

    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (title) resource.title = title;
    if (description) resource.description = description;
    if (type) {
      const validTypes = ['video', 'article', 'pdf', 'course', 'other'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid resource type' });
      }
      resource.type = type;
    }
    if (url) resource.url = url;

    await resource.save();

    await resource.populate('createdBy', 'email');

    res.json({
      _id: resource._id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      url: resource.url,
      createdBy: resource.createdBy?.email,
      createdAt: resource.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating resource', error: error.message });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    await Resource.findByIdAndDelete(id);

    await User.updateMany(
      { completedResources: id },
      { $pull: { completedResources: id } }
    );

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resource', error: error.message });
  }
};

export const markAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const user = await User.findById(userId);

    const resourceIndex = user.completedResources.indexOf(id);
    
    // Toggle: if exists, remove; if not, add
    if (resourceIndex > -1) {
      user.completedResources.splice(resourceIndex, 1);
      await user.save();
      return res.json({ message: 'Resource marked as incomplete', completed: false });
    } else {
      user.completedResources.push(id);
      await user.save();
      return res.json({ message: 'Resource marked as completed', completed: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error toggling resource completion', error: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const totalResources = await Resource.countDocuments();
    const totalUsers = await User.countDocuments();
    
    const resourcesByType = await Resource.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const completionStats = await User.aggregate([
      {
        $project: {
          completedCount: { $size: '$completedResources' }
        }
      },
      {
        $group: {
          _id: null,
          totalCompletions: { $sum: '$completedCount' },
          avgCompletions: { $avg: '$completedCount' },
          usersWithCompletions: {
            $sum: {
              $cond: [{ $gt: ['$completedCount', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    const recentResources = await Resource.find()
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt createdBy');

    res.json({
      totalResources,
      totalUsers,
      resourcesByType,
      completionStats: completionStats[0] || {
        totalCompletions: 0,
        avgCompletions: 0,
        usersWithCompletions: 0
      },
      recentResources
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

