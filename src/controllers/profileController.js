import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { validationResult } from 'express-validator';
import Notification from '../models/Notification.js';

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
      // Delete old avatar from Cloudinary if publicId is different
      if (user.avatar && user.avatar.publicId && user.avatar.publicId !== avatar.publicId) {
        await cloudinary.uploader.destroy(user.avatar.publicId);
      }
      updateData.avatar = {
        url: avatar.url,
        publicId: avatar.publicId || undefined
      };
    }

    // Handle cover photo if provided
    if (coverPhoto && coverPhoto.url) {
      // Delete old cover photo from Cloudinary if publicId is different
      if (user.coverPhoto && user.coverPhoto.publicId && user.coverPhoto.publicId !== coverPhoto.publicId) {
        await cloudinary.uploader.destroy(user.coverPhoto.publicId);
      }
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

    // Fetch current user for comparison
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Handle avatar if provided (object with url and publicId)
    if (avatar && typeof avatar === 'object' && avatar.url) {
      // Delete old avatar from Cloudinary if publicId is different
      if (user.avatar && user.avatar.publicId && user.avatar.publicId !== avatar.publicId) {
        await cloudinary.uploader.destroy(user.avatar.publicId);
      }
      updateData.avatar = avatar;
    }

    // Handle cover photo if provided (object with url and publicId)
    if (coverPhoto && typeof coverPhoto === 'object' && coverPhoto.url) {
      // Delete old cover photo from Cloudinary if publicId is different
      if (user.coverPhoto && user.coverPhoto.publicId && user.coverPhoto.publicId !== coverPhoto.publicId) {
        await cloudinary.uploader.destroy(user.coverPhoto.publicId);
      }
      updateData.coverPhoto = coverPhoto;
    }

    console.log('Updating profile with data:', updateData);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -otp');

    console.log('Profile updated successfully:', updatedUser);

    res.status(200).json({
      status: 'success',
      data: updatedUser
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
    const user = await User.findById(req.user.id).select('-password -otp');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Convert MongoDB document to plain object and ensure id field exists
    const userData = user.toObject();
    userData.id = userData._id.toString();
    delete userData._id;
    
    res.status(200).json({ status: 'success', data: userData });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get user profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('getUserProfile - requested userId:', userId);
    console.log('getUserProfile - userId type:', typeof userId);
    
    const user = await User.findById(userId).select('-password -otp');
    console.log('getUserProfile - found user:', user);
    
    if (!user) {
      console.log('getUserProfile - user not found for ID:', userId);
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    
    // Convert MongoDB document to plain object and ensure id field exists
    const userData = user.toObject();
    userData.id = userData._id.toString();
    delete userData._id;
    
    console.log('getUserProfile - returning user data:', userData);
    res.status(200).json({ status: 'success', data: userData });
  } catch (error) {
    console.error('getUserProfile - error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Like a user profile
export const likeProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const likerId = req.user._id;
    if (likerId.toString() === userId) {
      return res.status(400).json({ status: 'error', message: 'You cannot like your own profile.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    if (user.profileLikes.includes(likerId)) {
      return res.status(400).json({ status: 'error', message: 'You already liked this profile.' });
    }
    user.profileLikes.push(likerId);
    await user.save();
    // Create notification
    await Notification.create({
      recipient: user._id,
      sender: likerId,
      type: 'like',
    });
    res.status(200).json({ status: 'success', message: 'Profile liked.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Unlike a user profile
export const unlikeProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const likerId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    user.profileLikes = user.profileLikes.filter(id => id.toString() !== likerId.toString());
    await user.save();
    res.status(200).json({ status: 'success', message: 'Profile unliked.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};