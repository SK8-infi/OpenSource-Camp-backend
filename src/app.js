import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/user', userRoutes);

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err);
  console.error('Error Stack:', err.stack);
  
  // Don't send error stack in production
  const errorResponse = {
    message: err.message || 'Internal server error'
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;

