const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using Ethereal Email (for development/testing)
// In production, you would use a real SMTP service (e.g., SendGrid, Mailgun, Gmail)
let transporter;

async function initTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    // Use provided SMTP credentials
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to Ethereal Email for local testing
    console.log('No SMTP credentials found in .env, falling back to Ethereal Email for testing...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, 
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📧 Ethereal Email test account created!');
    } catch (err) {
      console.error('Failed to create Ethereal account:', err);
    }
  }
}

// Initialize transporter asynchronously
initTransporter();

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 */
exports.sendEmail = async (to, subject, html) => {
  try {
    if (!transporter) {
      console.warn('⚠️ Transporter not initialized. Skipping email to:', to);
      return;
    }

    const mailOptions = {
      from: `"VD Collect" <${process.env.FROM_EMAIL || 'noreply@vdcollect.com'}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent to ${to}: ${info.messageId}`);
    
    // If using ethereal, you can preview the email here:
    if (info.messageId && !process.env.SMTP_HOST) {
      console.log('👀 Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('❌ Error sending email to', to, ':', error);
    // Don't throw, just log so it doesn't break the main flow
  }
};
