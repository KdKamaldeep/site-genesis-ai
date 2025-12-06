import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import config from '../src/config.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    const email = process.argv[2] || 'admin@sitegenesis.com';
    const password = process.argv[3] || 'admin123';
    const role = process.argv[4] || 'admin';

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('User already exists:', email);
      process.exit(0);
    }

    // Create admin user
    const passwordHash = await User.hashPassword(password);
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      role,
    });

    await user.save();
    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', role);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

