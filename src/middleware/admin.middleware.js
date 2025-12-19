import { isAdminEmail } from '../utils/isAdmin.js';

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!isAdminEmail(req.user.email)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

