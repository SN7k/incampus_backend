const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  universityId: {
    type: String,
    required: [true, 'Please add a university ID'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/v1580125958/samples/people/smiling-man.jpg'
  },
  coverPhoto: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [250, 'Bio cannot be more than 250 characters'],
    default: ''
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student'
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  program: {
    type: String,
    default: ''
  },
  batch: {
    type: String,
    default: ''
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }
  
  console.log('Hashing password for user:', this._id || 'new user');
  console.log('Password before hashing exists:', !!this.password);
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  try {
    // Ensure JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured in environment variables');
      // Use a fallback secret for development only
      process.env.JWT_SECRET = 'incampus_fallback_secret_key_for_development_only';
      console.log('Using fallback JWT_SECRET for development');
    }
    
    // Ensure JWT_EXPIRE is configured
    if (!process.env.JWT_EXPIRE) {
      console.log('JWT_EXPIRE is not configured, using default 30d');
      process.env.JWT_EXPIRE = '30d';
    }
    
    // Generate the token
    const token = jwt.sign(
      { id: this._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    console.log(`Token generated for user ${this._id}: ${token.substring(0, 10)}...`);
    return token;
  } catch (error) {
    console.error('Error generating JWT token:', error);
    // Return a fallback token in case of error (for development only)
    return jwt.sign(
      { id: this._id.toString() },
      'incampus_emergency_fallback_key',
      { expiresIn: '30d' }
    );
  }
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    console.log(`Comparing password for user: ${this._id}`);
    console.log(`Stored password hash exists: ${!!this.password}`);
    console.log(`Entered password exists: ${!!enteredPassword}`);
    
    if (!this.password) {
      console.error('No password hash found for user');
      return false;
    }
    
    if (!enteredPassword) {
      console.error('No password provided for comparison');
      return false;
    }
    
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log(`Password comparison result: ${isMatch}`);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw new Error('Password verification failed');
  }
};

module.exports = mongoose.model('User', UserSchema);
