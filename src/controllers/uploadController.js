const { cloudinary } = require('../config/cloudinary');

// @desc    Upload image
// @route   POST /api/upload
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a file'
      });
    }

    // Return the Cloudinary URL
    res.status(200).json({
      success: true,
      data: {
        url: req.file.path,
        type: req.file.mimetype.startsWith('image') ? 'image' : 'video'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload
// @access  Private
exports.deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a public_id'
      });
    }

    // Extract public_id from URL if full URL is provided
    let id = public_id;
    if (public_id.includes('cloudinary.com')) {
      // Extract the ID from the URL
      const parts = public_id.split('/');
      const filename = parts[parts.length - 1];
      id = `unipix/${filename.split('.')[0]}`;
    }

    const result = await cloudinary.uploader.destroy(id);

    if (result.result !== 'ok') {
      return res.status(400).json({
        success: false,
        error: 'Failed to delete image'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
