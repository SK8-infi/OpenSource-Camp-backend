import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';

dotenv.config();

const createUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const userId = 'img_2024042@iiitm.ac.in';
    const email = 'img_2024042@iiitm.ac.in';
    const password = '12345678';

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ userId }, { email: email.toLowerCase() }] 
    });

    if (existingUser) {
      console.log('User already exists!');
      console.log('Updating password...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashedPassword;
      await existingUser.save();
      
      console.log('Password updated successfully!');
      console.log('User details:');
      console.log(`  User ID: ${existingUser.userId}`);
      console.log(`  Email: ${existingUser.email}`);
      console.log(`  Is Admin: ${process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase()) ? 'Yes' : 'No'}`);
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = new User({
        userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        completedResources: []
      });

      await user.save();
      console.log('User created successfully!');
      console.log('User details:');
      console.log(`  User ID: ${user.userId}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Is Admin: ${process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase()) ? 'Yes' : 'No'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
};

createUser();

