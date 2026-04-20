const nodemailer = require('nodemailer');
const env = require('./env');
const logger = require('./logger');

const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  // Verify connection in development
  if (env.isDev() && env.SMTP_USER !== 'test@gmail.com') {
    transporter.verify()
      .then(() => logger.info('SMTP connection verified'))
      .catch((err) => logger.warn('SMTP connection failed:', err.message));
  }

  return transporter;
};

const transporter = createTransporter();

/**
 * Send email
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"WalMart Clone" <${env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    logger.error('Email send failed:', error);
    throw error;
  }
};

module.exports = { sendEmail, transporter };
