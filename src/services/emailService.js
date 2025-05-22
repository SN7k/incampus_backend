import nodemailer from 'nodemailer';

// Check if required environment variables are set
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('Email configuration error: Missing required environment variables');
  console.error('Please ensure EMAIL_USER and EMAIL_PASS are set in your .env file');
}

// Create a transporter with Gmail configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : undefined // Remove spaces from app password
  },
  debug: true // Enable debug logging
});

// Verify transporter configuration
const verifyTransporter = async () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration is incomplete. Check your .env file.');
    }
    await transporter.verify();
    console.log('Email transporter is configured correctly');
    return true;
  } catch (error) {
    console.error('Email transporter configuration error:', error);
    return false;
  }
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  // Verify transporter before sending
  const isConfigured = await verifyTransporter();
  if (!isConfigured) {
    throw new Error('Email service is not configured correctly');
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your InCampus Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to InCampus!</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
          <strong>${otp}</strong>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', {
      messageId: info.messageId,
      to: email
    });
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', {
      error: error.message,
      code: error.code,
      command: error.command
    });
    throw new Error('Failed to send OTP email');
  }
};