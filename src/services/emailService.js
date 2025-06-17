import nodemailer from 'nodemailer';

// Email service configuration
const emailConfig = {
  // Option 1: Gmail (requires App Password)
  gmail: {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },
  
  // Option 2: SendGrid (more reliable for production)
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  },
  
  // Option 3: Mailgun
  mailgun: {
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAILGUN_USER,
      pass: process.env.MAILGUN_PASS
    }
  }
};

// Choose email provider based on environment variables
let transporter;
let emailProvider = 'none';

if (process.env.SENDGRID_API_KEY) {
  transporter = nodemailer.createTransporter(emailConfig.sendgrid);
  emailProvider = 'sendgrid';
} else if (process.env.MAILGUN_USER && process.env.MAILGUN_PASS) {
  transporter = nodemailer.createTransporter(emailConfig.mailgun);
  emailProvider = 'mailgun';
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransporter(emailConfig.gmail);
  emailProvider = 'gmail';
} else {
  console.error('No email service configured. Please set up one of the following:');
  console.error('- Gmail: EMAIL_USER and EMAIL_PASS');
  console.error('- SendGrid: SENDGRID_API_KEY');
  console.error('- Mailgun: MAILGUN_USER and MAILGUN_PASS');
}

// Verify transporter configuration
const verifyTransporter = async () => {
  try {
    if (!transporter) {
      throw new Error('No email service configured');
    }
    await transporter.verify();
    console.log(`Email transporter (${emailProvider}) is configured correctly`);
    return true;
  } catch (error) {
    console.error(`Email transporter (${emailProvider}) configuration error:`, error);
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
    from: process.env.EMAIL_USER || process.env.MAILGUN_USER || 'noreply@incampus.com',
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
      to: email,
      provider: emailProvider
    });
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      provider: emailProvider
    });
    throw new Error('Failed to send OTP email');
  }
};