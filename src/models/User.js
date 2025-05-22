import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  collegeId: {
    type: String,
    required: [true, 'Please provide your college ID'],
    unique: true
  },
  // Profile fields
  name: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  course: {
    type: String,
    trim: true
  },
  batch: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student'
  },
  avatar: {
    url: String,
    publicId: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check if password is correct
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Method to generate OTP
userSchema.methods.generateOTP = function() {
  const otp = '123456'; // For testing purposes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otp = {
    code: otp,
    expiresAt
  };
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(otp) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  if (Date.now() > this.otp.expiresAt) {
    return false;
  }
  return this.otp.code === otp;
};

const User = mongoose.model('User', userSchema);

export default User; 