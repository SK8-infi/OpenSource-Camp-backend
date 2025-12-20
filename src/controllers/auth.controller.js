import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { isAdminEmail } from '../utils/isAdmin.js';

// Helper to check if a string is a bcrypt hash
const isBcryptHash = (str) => {
  return typeof str === 'string' && str.startsWith('$2a$') || str.startsWith('$2b$') || str.startsWith('$2y$');
};

// Safe password comparison - handles both hashed and plaintext passwords
const comparePassword = async (plainPassword, storedPassword) => {
  if (!plainPassword || !storedPassword) {
    return false;
  }

  // If stored password is a bcrypt hash, use bcrypt.compare
  if (isBcryptHash(storedPassword)) {
    try {
      return await bcrypt.compare(plainPassword, storedPassword);
    } catch (error) {
      console.error('Bcrypt compare error:', error);
      return false;
    }
  }

  // Otherwise, do plaintext comparison (for legacy/migration scenarios)
  return plainPassword === storedPassword;
};

export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.error('Registration failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.error('Registration failed: Invalid email format');
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { userId: normalizedEmail }
      ]
    });

    if (existingUser) {
      console.error('Registration failed: User already exists for email:', normalizedEmail);
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // Create new user
    const newUser = new User({
      userId: normalizedEmail, // Use email as userId
      email: normalizedEmail,
      password: hashedPassword,
      completedPages: [],
      lastViewedPage: 1,
      completedResources: []
    });

    // Save user to database
    await newUser.save();

    console.log('User registered successfully:', normalizedEmail);

    // Return success response
    return res.status(201).json({
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('REGISTRATION ERROR:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      console.error('Registration failed: Duplicate', field);
      return res.status(409).json({ message: 'User already exists' });
    }

    // Return safe error message
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error';
    
    return res.status(500).json({ 
      message: 'Internal server error'
    });
  }
};

export const login = async (req, res) => {
  try {
    // Log request body for debugging (without sensitive data)
    console.log('Login attempt for email:', req.body?.email ? 'provided' : 'missing');

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.error('Login failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate JWT_SECRET exists before proceeding
    if (!process.env.JWT_SECRET) {
      console.error('Login failed: JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Find user
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.error('Login failed: User not found for email:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Validate user has a password
    if (!user.password) {
      console.error('Login failed: User has no password set');
      return res.status(500).json({ message: 'User account error' });
    }

    // Compare password safely
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      console.error('Login failed: Invalid password for email:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    let token;
    try {
      token = jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: jwtExpiresIn }
      );
    } catch (jwtError) {
      console.error('JWT sign error:', jwtError);
      return res.status(500).json({ message: 'Token generation failed' });
    }

    // Return success response
    res.json({
      token,
      user: {
        email: user.email,
        isAdmin: isAdminEmail(user.email)
      }
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    console.error('Error stack:', error.stack);
    
    // Return safe error message
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Login failed. Please try again.';
    
    return res.status(500).json({ 
      message: 'Login error',
      error: errorMessage
    });
  }
};

