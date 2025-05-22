import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

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