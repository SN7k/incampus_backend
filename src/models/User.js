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
  universityId: {
    type: String,
    required: [true, 'Please provide your university ID'],
    unique: true
  },
  // Profile fields
  name: {
    type: String,
    trim: true,
    required: [true, 'Please provide your name']
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
  coverPhoto: {
    url: String,
    publicId: String
  },
  education: {
    degree: String,
    institution: String,
    years: String
  },
  location: {
    type: String,
  },
  skills: [{
    name: String,
    proficiency: Number
  }],
  achievements: [{
    title: String,
    description: String,
    year: String
  }],
  interests: [{
    type: String
  }],
  profileLikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
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
  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  this.otp = {
    code: otp,
    expiresAt
  };
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(otp) {
  console.log('Verifying OTP:', {
    providedOTP: otp,
    storedOTP: this.otp?.code,
    expiresAt: this.otp?.expiresAt,
    currentTime: new Date(),
    isExpired: this.otp?.expiresAt ? Date.now() > this.otp.expiresAt : true
  });

  // Check if OTP exists
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    console.log('No OTP found or OTP is incomplete');
    return false;
  }

  // Check if OTP is expired
  if (Date.now() > this.otp.expiresAt) {
    console.log('OTP has expired');
    return false;
  }

  // Compare OTPs
  const isValid = this.otp.code === otp;
  console.log('OTP comparison result:', {
    isValid,
    providedOTP: otp,
    storedOTP: this.otp.code
  });

  return isValid;
};

// Transform MongoDB documents to include id field
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

export default User;