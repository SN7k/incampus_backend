import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { validationResult } from 'express-validator';

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: user
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
    if (avatar && avatar.url) {
      // Avatar is already uploaded, just save the URL
      updateData.avatar = {
        url: avatar.url,
        publicId: avatar.publicId || undefined
      };
    }

    // Handle cover photo if provided
    if (coverPhoto && coverPhoto.url) {
      // Cover photo is already uploaded, just save the URL
      updateData.coverPhoto = {
        url: coverPhoto.url,
        publicId: coverPhoto.publicId || undefined
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
      data: updatedUser
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
    const { 
      name, 
      bio, 
      course, 
      batch, 
      role, 
      universityId, 
      avatar, 
      coverPhoto,
      education,
      location,
      skills,
      achievements,
      interests
    } = req.body;

    // Create update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (course !== undefined) updateData.course = course;
    if (batch !== undefined) updateData.batch = batch;
    if (role !== undefined) updateData.role = role;
    if (universityId !== undefined) updateData.universityId = universityId;
    if (education !== undefined) updateData.education = education;
    if (location !== undefined) updateData.location = location;
    if (skills !== undefined) updateData.skills = skills;
    if (achievements !== undefined) updateData.achievements = achievements;
    if (interests !== undefined) updateData.interests = interests;

    // Handle avatar if provided (object with url and publicId)
    if (avatar && typeof avatar === 'object' && avatar.url) {
      updateData.avatar = avatar;
    }

    // Handle cover photo if provided (object with url and publicId)
    if (coverPhoto && typeof coverPhoto === 'object' && coverPhoto.url) {
      updateData.coverPhoto = coverPhoto;
    }

    console.log('Updating profile with data:', updateData);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -otp');

    console.log('Profile updated successfully:', user);

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Profile update error:', error);
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

// Upload cover photo
export const uploadCoverPhoto = async (req, res) => {
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
      folder: 'incampus/covers',
      width: 1200,
      crop: 'scale'
    });

    // Delete old cover photo from Cloudinary if exists
    const user = await User.findById(req.user._id);
    if (user.coverPhoto && user.coverPhoto.publicId) {
      await cloudinary.uploader.destroy(user.coverPhoto.publicId);
    }

    // Update user cover photo in database
    user.coverPhoto = {
      url: result.secure_url,
      publicId: result.public_id
    };
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        coverPhoto: user.coverPhoto
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
    const user = await User.findById(req.user._id).select('-password -otp');
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get user profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password -otp');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};