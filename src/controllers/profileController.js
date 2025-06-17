import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { validationResult } from 'express-validator';

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Setup user profile
export const setupProfile = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { name, avatar, coverPhoto, bio, role } = req.body;
    const userId = req.user._id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update user profile
    const updateData = {
      name,
      role,
      bio: bio || undefined
    };

    // Handle avatar if provided
    if (avatar) {
      // Upload avatar to Cloudinary
      const result = await cloudinary.uploader.upload(avatar, {
        folder: 'incampus/avatars',
        width: 300,
        crop: 'scale'
      });

      // Delete old avatar if exists
      if (user.avatar && user.avatar.publicId) {
        await cloudinary.uploader.destroy(user.avatar.publicId);
      }

      updateData.avatar = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    // Handle cover photo if provided
    if (coverPhoto) {
      // Upload cover photo to Cloudinary
      const result = await cloudinary.uploader.upload(coverPhoto, {
        folder: 'incampus/covers',
        width: 1200,
        crop: 'scale'
      });

      // Delete old cover photo if exists
      if (user.coverPhoto && user.coverPhoto.publicId) {
        await cloudinary.uploader.destroy(user.coverPhoto.publicId);
      }

      updateData.coverPhoto = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -otp');

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Profile setup error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, course, batch, role } = req.body;

    // Create update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (course) updateData.course = course;
    if (batch) updateData.batch = batch;
    if (role) updateData.role = role;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload an image file'
      });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'incampus/avatars',
      width: 300,
      crop: 'scale'
    });

    // Delete old avatar from Cloudinary if exists
    const user = await User.findById(req.user._id);
    if (user.avatar && user.avatar.publicId) {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    }

    // Update user avatar in database
    user.avatar = {
      url: result.secure_url,
      publicId: result.public_id
    };
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get my profile
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ status: 'success', data: { profile: user } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get user profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    res.status(200).json({ status: 'success', data: { profile: user } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};