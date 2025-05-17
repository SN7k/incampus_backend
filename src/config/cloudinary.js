const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Verify Cloudinary credentials are present
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('ERROR: Missing Cloudinary credentials in environment variables!');
  console.error('Make sure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in .env file');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify Cloudinary connection
const verifyCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection successful:', result.status);
    return true;
  } catch (error) {
    console.error('Cloudinary connection failed:', error.message);
    return false;
  }
};

// Attempt to verify connection on startup
verifyCloudinaryConnection();

// Configure storage with better error handling
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'incampus',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4'],
    transformation: [{ width: 1000, crop: "limit" }]
  }
});

// Configure upload middleware with error handling
const uploadImage = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!file.mimetype.match(/image\/.*|video\/.*/) && !file.originalname.match(/\.(jpg|jpeg|png|gif|mp4)$/)) {
      return cb(new Error('Only image and video files are allowed!'), false);
    }
    cb(null, true);
  }
});

module.exports = {
  cloudinary,
  uploadImage,
  verifyCloudinaryConnection
};
