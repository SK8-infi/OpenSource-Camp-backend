import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const authenticate = async (req, res, next) => {
  try {
    // Check JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('Authentication failed: JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'JsonWebTokenError') {
        console.error('Authentication failed: Invalid token');
        return res.status(401).json({ message: 'Invalid token' });
      }
      if (jwtError.name === 'TokenExpiredError') {
        console.error('Authentication failed: Token expired');
        return res.status(401).json({ message: 'Token expired' });
      }
      throw jwtError;
    }

    if (!decoded.userId) {
      console.error('Authentication failed: Token missing userId');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.error('Authentication failed: User not found for userId:', decoded.userId);
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

