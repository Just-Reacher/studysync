/* ─────────────────────────────────────────────
   StudySync — controllers/authController.js
───────────────────────────────────────────── */
const bcrypt          = require('bcryptjs');
const crypto          = require('crypto');
const { query }       = require('../config/db');
const { generateToken } = require('../utils/generateToken');
const { asyncHandler }  = require('../utils/helpers');
const { sendEmail }     = require('../services/emailService');

/* ── Register ── */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (exists.rows.length) {
    return res.status(400).json({ message: 'Email already registered.' });
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'student') RETURNING id, name, email, role, created_at`,
    [name.trim(), email.toLowerCase(), hash]
  );

  const user = result.rows[0];

  // Create default settings row
  await query('INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);
  // Create streak row
  await query('INSERT INTO study_streak (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

/* ── Login ── */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await query(
    'SELECT id, name, email, password_hash, role, avatar, is_active FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  const user = result.rows[0];
  if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
  if (!user.is_active) return res.status(403).json({ message: 'Account is deactivated.' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
});

/* ── Forgot Password ── */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await query('SELECT id, name, email FROM users WHERE email = $1', [email.toLowerCase()]);
  const user   = result.rows[0];

  // Always respond 200 to prevent email enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const token   = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expires]
  );

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await sendEmail({
    to:      user.email,
    subject: 'StudySync — Reset Your Password',
    html: `
      <h2>Reset your StudySync password</h2>
      <p>Hi ${user.name},</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="padding:12px 24px;background:#5B5BD6;color:#fff;border-radius:8px;text-decoration:none;">Reset Password</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

/* ── Reset Password ── */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const result = await query(
    `SELECT prt.id, prt.user_id FROM password_reset_tokens prt
     WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()`,
    [token]
  );

  if (!result.rows.length) {
    return res.status(400).json({ message: 'Reset link is invalid or has expired.' });
  }

  const { id: tokenId, user_id } = result.rows[0];
  const hash = await bcrypt.hash(password, 12);

  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user_id]);
  await query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenId]);

  res.json({ message: 'Password reset successfully. Please log in.' });
});

/* ── Get current user ── */
const getMe = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT id, name, first_name, last_name, email, avatar, shs_level, track, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ message: 'User not found.' });
  res.json(result.rows[0]);
});

module.exports = { register, login, forgotPassword, resetPassword, getMe };