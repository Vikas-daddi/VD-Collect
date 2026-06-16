const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure transporter (works with Ethereal for free testing, or Gmail)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendBookingConfirmation = async (userEmail, userName, centerName, pickupDate) => {
  const mailOptions = {
    from: `"VD Collect" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: '♻️ Pickup Confirmed – VD Collect',
    html: `
      <h2>Hello ${userName},</h2>
      <p>Your pickup request at <strong>${centerName}</strong> has been <strong>confirmed</strong>! ✅</p>
      <p>📅 Pickup Date: ${new Date(pickupDate).toLocaleDateString()}</p>
      <p>Thank you for recycling responsibly with <strong>VD Collect</strong> ♻️</p>
      <br/>
      <p>- Team VD Collect</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent to:', userEmail);
  } catch (error) {
    console.error('❌ Email failed to send:', error.message);
  }
};

module.exports = { sendBookingConfirmation };