import nodemailer from 'nodemailer';

// Create a transporter - check if environment variables are available
let transporter;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // More detailed Gmail SMTP configuration
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      debug: true // Enable verbose logging
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
    
    console.log(`Attempting to send email to ${email} with transporter config:`, {
      host: transporter.options.host,
      port: transporter.options.port,
      secure: transporter.options.secure,
      auth: {
        user: transporter.options.auth.user,
        // Not logging password for security reasons
        passLength: transporter.options.auth.pass ? transporter.options.auth.pass.length : 0
      }
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully with info:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
    
    // If using ethereal email (test account), log the URL to view the email
    if (info.messageId && info.testMessageUrl) {
      console.log('Preview URL: %s', info.testMessageUrl);
    }
    
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};