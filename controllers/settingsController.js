/* ─────────────────────────────────────────────
   StudySync — controllers/settingsController.js
───────────────────────────────────────────── */
const bcrypt           = require('bcryptjs');
const { query }        = require('../config/db');
const { asyncHandler } = require('../utils/helpers');

/* ── GET profile ── */
const getProfile = asyncHandler(async (req, res) => {
  const r = await query(
    'SELECT id, name, first_name, last_name, email, avatar, shs_level, track, role FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!r.rows.length) return res.status(404).json({ message: 'User not found.' });
  res.json(r.rows[0]);
});

/* ── PUT profile ── */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, name, email, shsLevel, track } = req.body;

  if (email) {
    const exists = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), req.user.id]);
    if (exists.rows.length) return res.status(400).json({ message: 'Email already in use.' });
  }

  const r = await query(
    `UPDATE users SET
       first_name = COALESCE($1, first_name),
       last_name  = COALESCE($2, last_name),
       name       = COALESCE($3, name),
       email      = COALESCE($4, email),
       shs_level  = COALESCE($5, shs_level),
       track      = COALESCE($6, track)
     WHERE id = $7
     RETURNING id, name, first_name, last_name, email, avatar, shs_level, track, role`,
    [firstName || null, lastName || null, name || null, email ? email.toLowerCase() : null, shsLevel || null, track || null, req.user.id]
  );
  res.json(r.rows[0]);
});

/* ── PUT password ── */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ message: 'New password must be at least 8 characters.' });

  const r = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!r.rows.length) return res.status(404).json({ message: 'User not found.' });

  const match = await bcrypt.compare(currentPassword, r.rows[0].password_hash);
  if (!match) return res.status(400).json({ message: 'Current password is incorrect.' });

  const hash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
  res.json({ message: 'Password updated successfully.' });
});

/* ── POST avatar ── */
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const avatarUrl = `/uploads/${req.file.filename}`;
  await query('UPDATE users SET avatar = $1 WHERE id = $2', [avatarUrl, req.user.id]);
  res.json({ avatarUrl });
});

/* ── GET notifications ── */
const getNotifications = asyncHandler(async (req, res) => {
  const r = await query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id]);
  if (!r.rows.length) return res.json({});
  const s = r.rows[0];
  res.json({
    prayer:     s.notif_prayer,
    study:      s.notif_study,
    quiz:       s.notif_quiz,
    tasks:      s.notif_tasks,
    motivation: s.notif_motivation,
    weekly:     s.notif_weekly,
  });
});

/* ── PUT notifications ── */
const updateNotifications = asyncHandler(async (req, res) => {
  const { prayer, study, quiz, tasks, motivation, weekly } = req.body;
  await query(
    `INSERT INTO user_settings (user_id, notif_prayer, notif_study, notif_quiz, notif_tasks, notif_motivation, notif_weekly)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (user_id) DO UPDATE SET
       notif_prayer     = COALESCE($2, user_settings.notif_prayer),
       notif_study      = COALESCE($3, user_settings.notif_study),
       notif_quiz       = COALESCE($4, user_settings.notif_quiz),
       notif_tasks      = COALESCE($5, user_settings.notif_tasks),
       notif_motivation = COALESCE($6, user_settings.notif_motivation),
       notif_weekly     = COALESCE($7, user_settings.notif_weekly)`,
    [req.user.id, prayer ?? null, study ?? null, quiz ?? null, tasks ?? null, motivation ?? null, weekly ?? null]
  );
  res.json({ message: 'Notification preferences saved.' });
});

/* ── GET appearance ── */
const getAppearance = asyncHandler(async (req, res) => {
  const r = await query('SELECT accent_colour, font_size, dark_mode FROM user_settings WHERE user_id = $1', [req.user.id]);
  if (!r.rows.length) return res.json({ accentColour: 'purple', fontSize: 'medium', darkMode: false });
  const s = r.rows[0];
  res.json({ accentColour: s.accent_colour, fontSize: s.font_size, darkMode: s.dark_mode });
});

/* ── PUT appearance ── */
const updateAppearance = asyncHandler(async (req, res) => {
  const { accentColour, fontSize, darkMode } = req.body;

  await query(
    `INSERT INTO user_settings (
      user_id,
      accent_colour,
      font_size,
      dark_mode
    )
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (user_id) DO UPDATE SET
      accent_colour = COALESCE($2, user_settings.accent_colour),
      font_size     = COALESCE($3, user_settings.font_size),
      dark_mode     = COALESCE($4, user_settings.dark_mode),
      updated_at    = NOW()`,
    [
      req.user.id,
      accentColour ?? 'purple',
      fontSize ?? 'medium',
      darkMode ?? false
    ]
  );

  res.json({ message: 'Appearance saved.' });
});

/* ── DELETE clear progress ── */
const clearProgress = asyncHandler(async (req, res) => {
  await Promise.all([
    query('DELETE FROM quiz_attempts WHERE user_id = $1', [req.user.id]),
    query('DELETE FROM daily_activity WHERE user_id = $1', [req.user.id]),
    query('UPDATE study_streak SET current_streak=0, longest_streak=0, last_study_date=NULL WHERE user_id=$1', [req.user.id]),
  ]);
  res.json({ message: 'Progress data cleared.' });
});

/* ── DELETE account ── */
const deleteAccount = asyncHandler(async (req, res) => {
  await query('DELETE FROM users WHERE id = $1', [req.user.id]);
  res.json({ message: 'Account deleted.' });
});

module.exports = {
  getProfile, updateProfile, updatePassword, updateAvatar,
  getNotifications, updateNotifications,
  getAppearance, updateAppearance,
  clearProgress, deleteAccount,
};