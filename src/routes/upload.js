const express = require('express');
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { uploadImage: uploadMiddleware } = require('../config/cloudinary');

const router = express.Router();

// Protect all routes
router.use(protect);

// Upload routes
router.route('/')
  .post(uploadMiddleware.single('image'), uploadImage)
  .delete(deleteImage);

module.exports = router;
