/* ─────────────────────────────────────────────
   StudySync — services/emailService.js
───────────────────────────────────────────── */
const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP not configured — skipping email to', to);
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from:    process.env.EMAIL_FROM || 'StudySync <ayisiemmanuel151@gmail.com>',
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>/g, ''),
    });
    console.log('[Email] Sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('[Email] Failed:', err.message);
    throw err;
  }
};

module.exports = { sendEmail };