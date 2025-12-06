import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config.js';
import logger from '../utils/logger.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Set HTTPOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`User logged in: ${user.email}`);
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    logger.error('Error during login:', error);
    res.status(500).json({ error: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, role = 'admin' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      role,
    });

    await user.save();

    logger.info(`User registered: ${user.email}`);
    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Error during registration:', error);
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Error fetching current user:', error);
    res.status(500).json({ error: error.message });
  }
};

