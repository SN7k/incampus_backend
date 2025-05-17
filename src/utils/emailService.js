const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

// Default email configuration (for development/testing)
const DEFAULT_EMAIL_USER = 'connect.incampus@gmail.com';
const DEFAULT_EMAIL_NAME = 'InCampus';

// Create a transporter object using SMTP transport
const createTransporter = () => {
  console.log('Creating email transporter with:', {
    user: process.env.EMAIL_USER || DEFAULT_EMAIL_USER,
    // Don't log the actual password
    passwordProvided: !!process.env.EMAIL_PASSWORD
  });
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      // Use environment variables if available, otherwise use defaults
      user: process.env.EMAIL_USER || DEFAULT_EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.replace(/\s+/g, '') : 'your-app-password-here' // Remove spaces from app password
    },
    // Add debug option to see detailed logs
    debug: process.env.NODE_ENV === 'development'
  });
};

// Create transporter when needed instead of at module load time
let transporter = null;

// Store OTPs temporarily (in production, use Redis or a database)
const otpStore = new Map();

// Fixed OTP only used in development mode
const DEV_OTP = '123456';

// Generate OTP and store it
const generateOTP = (email) => {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`Generating OTP in ${isProduction ? 'production' : 'development'} mode`);
  
  let otp;
  
  // In development mode, use a fixed OTP for easier testing
  if (!isProduction) {
    otp = DEV_OTP;
    console.log(`Development: Using fixed OTP for ${email}: ${otp}`);
  } else {
    // In production, generate a random 6-digit OTP
    otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Production: Generated OTP for ${email} (not shown for security)`);
  }
  
  // Store OTP with expiry time (15 minutes)
  otpStore.set(email, {
    otp,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  });
  
  return otp;
};

// Verify OTP
const verifyOTP = (email, otp) => {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`Verifying OTP for ${email} in ${isProduction ? 'production' : 'development'} mode`);
  
  // In development mode, allow the fixed OTP to work
  if (!isProduction && otp === DEV_OTP) {
    console.log('Development mode: Using fixed OTP for verification');
    return { valid: true, message: 'OTP verified successfully (development mode).' };
  }
  
  // For production mode or when not using the fixed OTP in development
  const otpData = otpStore.get(email);
  
  // Only log OTP data in development mode for security
  if (!isProduction) {
    console.log('OTP data from store:', otpData);
  } else {
    console.log('Checking OTP from store (details hidden for security)');
  }
  
  if (!otpData) {
    return { valid: false, message: 'OTP not found or expired. Please request a new one.' };
  }
  
  if (new Date() > otpData.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }
  
  if (otpData.otp !== otp) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }
  
  // OTP is valid, delete it to prevent reuse
  otpStore.delete(email);
  return { valid: true, message: 'OTP verified successfully.' };
};

// Send OTP email
const sendOTPEmail = async (email, name) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const otp = generateOTP(email);
  
  // In development mode, we can skip actually sending the email
  if (!isProduction) {
    console.log(`Development mode: Skipping actual email sending to ${email}. Using OTP: ${otp}`);
    return { success: true, message: 'OTP generated successfully (development mode).', otp };
  }
  
  // Create transporter if it doesn't exist
  if (!transporter) {
    transporter = createTransporter();
  }
  
  const senderEmail = process.env.EMAIL_USER || DEFAULT_EMAIL_USER;
  const senderName = process.env.EMAIL_NAME || DEFAULT_EMAIL_NAME;
  
  console.log(`Production mode: Sending real OTP email to ${email}`);
  
  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: email,
    subject: 'Verify Your InCampus Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4285f4; margin: 0;">InCampus</h1>
          <p style="color: #666; margin: 5px 0 0;">Your University Social Network</p>
        </div>
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #202124; margin-top: 0;">Verification Code</h2>
          <p>Hello ${name},</p>
          <p>Thank you for signing up with InCampus. To complete your registration, please use the following verification code:</p>
          <div style="background-color: #ffffff; border: 1px solid #dadce0; border-radius: 8px; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #4285f4;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #5f6368;">This code will expire in 15 minutes.</p>
        </div>
        <p>If you didn't request this code, you can safely ignore this email.</p>
        <div style="border-top: 1px solid #dadce0; padding-top: 15px; margin-top: 20px; font-size: 12px; color: #5f6368;">
          <p>Best regards,<br>The InCampus Team</p>
          <p style="margin-top: 15px;">© ${new Date().getFullYear()} InCampus. All rights reserved.</p>
        </div>
      </div>
    `
  };
  
  try {
    console.log('Sending email with options:', {
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    // Always operate in production mode - no development mode shortcuts
    
    // Make sure email credentials are set in production
    if (process.env.NODE_ENV === 'production' && (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD)) {
      console.error('Production environment requires EMAIL_USER and EMAIL_PASSWORD to be set');
      return { success: false, message: 'Email configuration error' };
    }
    
    // Actually send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Always operate in production mode - no development mode shortcuts
    
    return { success: false, message: 'Failed to send OTP email' };
  }
};

module.exports = {
  sendOTPEmail,
  verifyOTP
};
