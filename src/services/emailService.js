import nodemailer from 'nodemailer';

// Create a transporter - check if environment variables are available
let transporter;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    console.warn('Email credentials not found in environment variables. Using test account.');
    // For testing purposes, create a test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
} catch (error) {
  console.error('Failed to create email transporter:', error);
}

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'connect.incampus@gmail.com',
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
    if (!transporter) {
      console.log('Email service not configured. Please set up email credentials.');
      throw new Error('Email service not configured');
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully');
    
    // If using ethereal email (test account), log the URL to view the email
    if (info.messageId && info.testMessageUrl) {
      console.log('Preview URL: %s', info.testMessageUrl);
    }
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};