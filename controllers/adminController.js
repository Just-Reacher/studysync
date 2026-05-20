/* ─────────────────────────────────────────────
   StudySync — controllers/adminController.js
   All admin endpoints: dashboard, users, quizzes,
   questions, notes, analytics, logs, emails,
   settings. Admin-only. Real DB queries.
───────────────────────────────────────────── */
const bcrypt           = require('bcryptjs');
const { query, withTransaction } = require('../config/db');
const { asyncHandler } = require('../utils/helpers');
const { sendEmail }    = require('../services/emailService');

/* ══════════════════════════════
   HELPERS
══════════════════════════════ */
const logActivity = async (req, { type = 'system', level = 'info', action, details }) => {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, user_email, user_name, type, level, action, details, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        req.user?.id || null,
        req.user?.email || null,
        req.user?.name || null,
        type, level, action,
        details || null,
        req.ip || req.headers['x-forwarded-for'] || null,
        req.headers['user-agent'] || null,
      ]
    );
  } catch (err) {
    console.error('[Log] Failed to write activity log:', err.message);
  }
};

const logEmail = async ({ type, subject, recipientCount, recipients, sentBy, status = 'sent', errorMessage }) => {
  try {
    await query(
      `INSERT INTO email_logs (type, subject, recipient_count, recipients, sent_by, status, error_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [type, subject, recipientCount || 1, recipients || null, sentBy || null, status, errorMessage || null]
    );
  } catch (err) {
    console.error('[Log] Failed to write email log:', err.message);
  }
};

/* ══════════════════════════════
   DASHBOARD
══════════════════════════════ */
const getDashboard = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [usersRes, quizzesTodayRes, activeRes, avgRes, newRes, subjectRes, recentUsersRes, activityRes] = await Promise.all([
    query('SELECT COUNT(*)::INT AS total FROM users WHERE role = $1', ['student']),
    query(`SELECT COUNT(*)::INT AS cnt FROM quiz_attempts WHERE DATE(completed_at) = $1`, [today]),
    query(`SELECT COUNT(DISTINCT user_id)::INT AS cnt FROM activity_logs WHERE DATE(created_at) = $1`, [today]),
    query('SELECT ROUND(AVG(score))::INT AS avg FROM quiz_attempts'),
    query(`SELECT COUNT(*)::INT AS cnt FROM users WHERE role='student' AND created_at >= $1`, [weekAgo]),
    query(`SELECT q.subject, COUNT(qa.id)::INT AS attempts, ROUND(AVG(qa.score))::INT AS "avgScore"
           FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id
           GROUP BY q.subject ORDER BY attempts DESC LIMIT 6`),
    query(`SELECT id, name, email, shs_level, is_active, created_at FROM users
           WHERE role='student' ORDER BY created_at DESC LIMIT 6`),
    query(`SELECT type, action, user_name, user_email, created_at FROM activity_logs
           ORDER BY created_at DESC LIMIT 8`),
  ]);

  res.json({
    totalUsers:     usersRes.rows[0]?.total   || 0,
    quizzesToday:   quizzesTodayRes.rows[0]?.cnt || 0,
    activeToday:    activeRes.rows[0]?.cnt    || 0,
    platformAvg:    avgRes.rows[0]?.avg       ?? null,
    newThisWeek:    newRes.rows[0]?.cnt       || 0,
    subjectStats:   subjectRes.rows,
    recentUsers:    recentUsersRes.rows,
    recentActivity: activityRes.rows,
  });
});

/* ══════════════════════════════
   USERS
══════════════════════════════ */
const getUsers = asyncHandler(async (req, res) => {
  const { search = '', level = '', status = '', page = 1, limit = 15 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = `
    SELECT u.id, u.name, u.email, u.shs_level, u.track, u.avatar, u.is_active, u.created_at,
      COUNT(qa.id)::INT AS quiz_count,
      ROUND(AVG(qa.score))::INT AS avg_score
    FROM users u
    LEFT JOIN quiz_attempts qa ON qa.user_id = u.id
    WHERE u.role = 'student'
  `;
  const params = []; let idx = 1;

  if (search) {
    sql += ` AND (u.name ILIKE $${idx} OR u.email ILIKE $${idx})`;
    params.push(`%${search}%`); idx++;
  }
  if (level)  { sql += ` AND u.shs_level = $${idx++}`; params.push(level); }
  if (status) { sql += ` AND u.is_active = $${idx++}`; params.push(status === 'active'); }

  sql += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(parseInt(limit), offset);

  const countSql = sql.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(DISTINCT u.id)::INT AS total FROM').split('GROUP BY')[0];
  const [result, countResult] = await Promise.all([
    query(sql, params),
    query(`SELECT COUNT(*)::INT AS total FROM users WHERE role='student'`),
  ]);

  res.json({ users: result.rows, total: countResult.rows[0]?.total || 0, page: parseInt(page) });
});

const getUser = asyncHandler(async (req, res) => {
  const r = await query(
    'SELECT id, name, first_name, last_name, email, avatar, shs_level, track, is_active, created_at FROM users WHERE id = $1',
    [req.params.id]
  );
  if (!r.rows.length) return res.status(404).json({ message: 'User not found.' });
  res.json(r.rows[0]);
});

const getUserStats = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const [attemptsRes, streakRes, subjectsRes] = await Promise.all([
    query('SELECT COUNT(*)::INT AS count, ROUND(AVG(score))::INT AS avg FROM quiz_attempts WHERE user_id = $1', [id]),
    query('SELECT current_streak FROM study_streak WHERE user_id = $1', [id]),
    query(`SELECT q.subject, ROUND(AVG(qa.score))::INT AS "avgScore"
           FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id
           WHERE qa.user_id = $1 GROUP BY q.subject ORDER BY "avgScore" DESC`, [id]),
  ]);
  res.json({
    quizCount: attemptsRes.rows[0]?.count || 0,
    avgScore:  attemptsRes.rows[0]?.avg   ?? null,
    streak:    streakRes.rows[0]?.current_streak || 0,
    subjects:  subjectsRes.rows,
  });
});

const getUserHistory = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  const r = await query(
    `SELECT qa.id, q.title AS "quizTitle", q.subject, qa.score, qa.correct, qa.total, qa.completed_at AS "completedAt"
     FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id
     WHERE qa.user_id = $1 ORDER BY qa.completed_at DESC LIMIT $2`,
    [req.params.id, parseInt(limit)]
  );
  res.json({ history: r.rows });
});

const toggleUserActive = asyncHandler(async (req, res) => {
  const r = await query(
    'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active',
    [req.params.id]
  );
  if (!r.rows.length) return res.status(404).json({ message: 'User not found.' });
  await logActivity(req, { type: 'system', action: `User ${r.rows[0].is_active ? 'activated' : 'deactivated'}: ${r.rows[0].name}` });
  res.json(r.rows[0]);
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const userRes = await query('SELECT id, name, email FROM users WHERE id = $1', [req.params.id]);
  if (!userRes.rows.length) return res.status(404).json({ message: 'User not found.' });
  const user = userRes.rows[0];

  const crypto  = require('crypto');
  const token   = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000);

  await query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)',
    [user.id, token, expires]
  );

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'StudySync — Password Reset (Admin)',
    html: `<p>Hi ${user.name},</p><p>An admin has requested a password reset for your account.</p><a href="${resetUrl}">Reset Password</a>`,
  });

  await logActivity(req, { type: 'auth', action: `Password reset sent to ${user.email}` });
  res.json({ message: 'Password reset email sent.' });
});

const deleteUser = asyncHandler(async (req, res) => {
  const userRes = await query('SELECT name, email FROM users WHERE id = $1', [req.params.id]);
  if (!userRes.rows.length) return res.status(404).json({ message: 'User not found.' });
  await query('DELETE FROM users WHERE id = $1', [req.params.id]);
  await logActivity(req, { type: 'system', level: 'warning', action: `User deleted: ${userRes.rows[0].email}` });
  res.json({ message: 'User deleted.' });
});

/* ══════════════════════════════
   QUIZZES (Admin)
══════════════════════════════ */
const adminGetQuizzes = asyncHandler(async (req, res) => {
  const { search = '', subject = '', level = '', page = 1, limit = 15 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = `
    SELECT q.*,
      (SELECT COUNT(*)::INT FROM questions WHERE quiz_id = q.id) AS question_count,
      (SELECT COUNT(*)::INT FROM quiz_attempts WHERE quiz_id = q.id) AS attempt_count,
      (SELECT ROUND(AVG(score))::INT FROM quiz_attempts WHERE quiz_id = q.id) AS avg_score
    FROM quizzes q WHERE 1=1
  `;
  const params = []; let idx = 1;
  if (search)  { sql += ` AND q.title ILIKE $${idx++}`;   params.push(`%${search}%`); }
  if (subject) { sql += ` AND q.subject = $${idx++}`;     params.push(subject); }
  if (level)   { sql += ` AND q.level = $${idx++}`;       params.push(level); }
  sql += ` ORDER BY q.subject, q.title LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(parseInt(limit), offset);

  const [result, total] = await Promise.all([
    query(sql, params),
    query('SELECT COUNT(*)::INT AS total FROM quizzes'),
  ]);
  res.json({ quizzes: result.rows, total: total.rows[0]?.total || 0 });
});

const adminCreateQuiz = asyncHandler(async (req, res) => {
  const { title, subject, level = 'SHS1', timed = true, timeLimitMinutes = 10, isActive = true } = req.body;
  const r = await query(
    `INSERT INTO quizzes (title, subject, level, timed, time_limit_minutes, is_active)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [title.trim(), subject, level, timed, timeLimitMinutes, isActive]
  );
  await logActivity(req, { type: 'system', action: `Quiz created: ${title}` });
  res.status(201).json({ quiz: r.rows[0] });
});

const adminUpdateQuiz = asyncHandler(async (req, res) => {
  const { title, subject, level, timed, timeLimitMinutes, isActive } = req.body;
  const r = await query(
    `UPDATE quizzes SET
       title              = COALESCE($1, title),
       subject            = COALESCE($2, subject),
       level              = COALESCE($3, level),
       timed              = COALESCE($4, timed),
       time_limit_minutes = COALESCE($5, time_limit_minutes),
       is_active          = COALESCE($6, is_active)
     WHERE id = $7 RETURNING *`,
    [title, subject, level, timed, timeLimitMinutes, isActive, req.params.id]
  );
  if (!r.rows.length) return res.status(404).json({ message: 'Quiz not found.' });
  await logActivity(req, { type: 'system', action: `Quiz updated: ${r.rows[0].title}` });
  res.json(r.rows[0]);
});

const adminDeleteQuiz = asyncHandler(async (req, res) => {
  const r = await query('DELETE FROM quizzes WHERE id = $1 RETURNING title', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ message: 'Quiz not found.' });
  await logActivity(req, { type: 'system', level: 'warning', action: `Quiz deleted: ${r.rows[0].title}` });
  res.json({ message: 'Quiz deleted.' });
});

/* ══════════════════════════════
   QUESTIONS (Admin)
══════════════════════════════ */
const adminGetQuestions = asyncHandler(async (req, res) => {
  const { search = '', quizId = '', subject = '', page = 1, limit = 15 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = `
    SELECT qu.*, q.title AS quiz_title, q.subject
    FROM questions qu JOIN quizzes q ON q.id = qu.quiz_id WHERE 1=1
  `;
  const params = []; let idx = 1;
  if (search)  { sql += ` AND qu.text ILIKE $${idx++}`;  params.push(`%${search}%`); }
  if (quizId)  { sql += ` AND qu.quiz_id = $${idx++}`;   params.push(quizId); }
  if (subject) { sql += ` AND q.subject = $${idx++}`;    params.push(subject); }
  sql += ` ORDER BY q.subject, qu.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(parseInt(limit), offset);

  const [result, total] = await Promise.all([
    query(sql, params),
    query('SELECT COUNT(*)::INT AS total FROM questions'),
  ]);
  res.json({ questions: result.rows, total: total.rows[0]?.total || 0 });
});

const adminCreateQuestion = asyncHandler(async (req, res) => {
  const { quizId, text, options, correctIndex, explanation } = req.body;
  const r = await query(
    'INSERT INTO questions (quiz_id, text, options, correct_index, explanation) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [quizId, text.trim(), JSON.stringify(options), correctIndex, explanation || null]
  );
  await logActivity(req, { type: 'system', action: `Question added to quiz ${quizId}` });
  res.status(201).json({ question: r.rows[0] });
});

const adminUpdateQuestion = asyncHandler(async (req, res) => {
  const { quizId, text, options, correctIndex, explanation } = req.body;
  const r = await query(
    `UPDATE questions SET
       quiz_id       = COALESCE($1, quiz_id),
       text          = COALESCE($2, text),
       options       = COALESCE($3, options),
       correct_index = COALESCE($4, correct_index),
       explanation   = COALESCE($5, explanation)
     WHERE id = $6 RETURNING *`,
    [quizId || null, text || null, options ? JSON.stringify(options) : null, correctIndex ?? null, explanation ?? null, req.params.id]
  );
  if (!r.rows.length) return res.status(404).json({ message: 'Question not found.' });
  res.json(r.rows[0]);
});

const adminDeleteQuestion = asyncHandler(async (req, res) => {
  const r = await query('DELETE FROM questions WHERE id = $1 RETURNING id', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ message: 'Question not found.' });
  await logActivity(req, { type: 'system', level: 'warning', action: `Question deleted: ${req.params.id}` });
  res.json({ message: 'Question deleted.' });
});

/* ══════════════════════════════
   NOTES (Admin)
══════════════════════════════ */
const adminGetNotes = asyncHandler(async (req, res) => {
  const { search = '', subject = '', type = '', page = 1, limit = 15 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let sql = `SELECT n.*, u.name AS author_name FROM notes n LEFT JOIN users u ON u.id = n.user_id WHERE 1=1`;
  const params = []; let idx = 1;
  if (search)  { sql += ` AND (n.title ILIKE $${idx} OR n.content ILIKE $${idx++})`; params.push(`%${search}%`); }
  if (subject) { sql += ` AND n.subject = $${idx++}`; params.push(subject); }
  if (type)    { sql += ` AND n.type = $${idx++}`;    params.push(type); }
  sql += ` ORDER BY n.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(parseInt(limit), offset);

  const [result, total] = await Promise.all([
    query(sql, params),
    query('SELECT COUNT(*)::INT AS total FROM notes'),
  ]);
  res.json({ notes: result.rows, total: total.rows[0]?.total || 0 });
});

const adminCreateNote = asyncHandler(async (req, res) => {
  const { title, subject, type = 'summary', content, tags = [] } = req.body;
  const r = await query(
    `INSERT INTO notes (user_id, title, subject, type, content, tags)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, title.trim(), subject, type, content.trim(), tags]
  );
  await logActivity(req, { type: 'note', action: `Admin created note: ${title}` });
  res.status(201).json({ note: r.rows[0] });
});

const adminUpdateNote = asyncHandler(async (req, res) => {
  const { title, subject, type, content, tags } = req.body;
  const r = await query(
    `UPDATE notes SET
       title   = COALESCE($1, title),
       subject = COALESCE($2, subject),
       type    = COALESCE($3, type),
       content = COALESCE($4, content),
       tags    = COALESCE($5, tags)
     WHERE id = $6 RETURNING *`,
    [title, subject, type, content, tags, req.params.id]
  );
  if (!r.rows.length) return res.status(404).json({ message: 'Note not found.' });
  res.json(r.rows[0]);
});

const adminDeleteNote = asyncHandler(async (req, res) => {
  const r = await query('DELETE FROM notes WHERE id = $1 RETURNING id', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ message: 'Note not found.' });
  res.json({ message: 'Note deleted.' });
});

/* ══════════════════════════════
   ANALYTICS
══════════════════════════════ */
const getAnalytics = asyncHandler(async (req, res) => {
  const period = req.query.period || '30';
  const pf     = period === 'all' ? '' : `AND completed_at >= NOW() - INTERVAL '${period} days'`;
  const pfDate = period === 'all' ? '' : `AND date >= CURRENT_DATE - INTERVAL '${period} days'`;

  const [usersRes, attemptsRes, focusRes, subjectsRes, topStudentsRes, dailyRes, topQuizzesRes] = await Promise.all([
    query('SELECT COUNT(*)::INT AS total FROM users WHERE role=$1', ['student']),
    query(`SELECT COUNT(*)::INT AS total, ROUND(AVG(score))::INT AS avg FROM quiz_attempts WHERE 1=1 ${pf}`),
    query(`SELECT COALESCE(SUM(minutes),0)::INT AS mins FROM timer_sessions WHERE type='focus' ${pfDate.replace('date','date')}`),
    query(`SELECT q.subject, COUNT(qa.id)::INT AS attempts, ROUND(AVG(qa.score))::INT AS "avgScore"
           FROM quiz_attempts qa JOIN quizzes q ON q.id=qa.quiz_id WHERE 1=1 ${pf}
           GROUP BY q.subject ORDER BY attempts DESC`),
    query(`SELECT u.name, u.id, COUNT(qa.id)::INT AS "quizCount", ROUND(AVG(qa.score))::INT AS "avgScore"
           FROM quiz_attempts qa JOIN users u ON u.id=qa.user_id WHERE 1=1 ${pf}
           GROUP BY u.id, u.name ORDER BY "avgScore" DESC LIMIT 10`),
    query(`SELECT date::TEXT, quiz_count AS count FROM daily_activity WHERE 1=1 ${pfDate} ORDER BY date ASC`),
    query(`SELECT q.id, q.title, q.subject, q.level,
             COUNT(qa.id)::INT AS attempts,
             ROUND(AVG(qa.score))::INT AS "avgScore",
             ROUND(100.0 * COUNT(CASE WHEN qa.score >= 50 THEN 1 END) / NULLIF(COUNT(qa.id),0))::INT AS "passRate"
           FROM quiz_attempts qa JOIN quizzes q ON q.id=qa.quiz_id WHERE 1=1 ${pf}
           GROUP BY q.id ORDER BY attempts DESC LIMIT 8`),
  ]);

  res.json({
    totalUsers:      usersRes.rows[0]?.total || 0,
    totalAttempts:   attemptsRes.rows[0]?.total || 0,
    platformAvg:     attemptsRes.rows[0]?.avg ?? null,
    totalFocusHours: parseFloat(((focusRes.rows[0]?.mins || 0) / 60).toFixed(1)),
    subjectStats:    subjectsRes.rows,
    topStudents:     topStudentsRes.rows,
    dailyActivity:   dailyRes.rows,
    topQuizzes:      topQuizzesRes.rows,
  });
});

/* ══════════════════════════════
   LOGS
══════════════════════════════ */
const getLogs = asyncHandler(async (req, res) => {
  const { search='', type='', level='', from='', to='', tab='all', page=1, limit=20 } = req.query;
  const offset = (parseInt(page)-1) * parseInt(limit);

  let sql = `
    SELECT al.*, u.name AS user_name_full
    FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id WHERE 1=1
  `;
  const params=[]; let idx=1;
  if (search) { sql+=` AND (al.action ILIKE $${idx} OR al.user_email ILIKE $${idx++})`; params.push(`%${search}%`); }
  if (type||tab!=='all') { sql+=` AND al.type = $${idx++}`; params.push(type||tab); }
  if (level)  { sql+=` AND al.level = $${idx++}`; params.push(level); }
  if (from)   { sql+=` AND DATE(al.created_at) >= $${idx++}`; params.push(from); }
  if (to)     { sql+=` AND DATE(al.created_at) <= $${idx++}`; params.push(to); }
  sql += ` ORDER BY al.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(parseInt(limit), offset);

  const countSql = `SELECT COUNT(*)::INT AS total FROM activity_logs WHERE 1=1${type?` AND type='${type}'`:''}${level?` AND level='${level}'`:''}`;
  const [result, total] = await Promise.all([query(sql,params), query(countSql)]);
  res.json({ logs: result.rows, total: total.rows[0]?.total||0 });
});

const exportLogs = asyncHandler(async (req, res) => {
  const { type='', level='', from='', to='' } = req.query;
  let sql = 'SELECT * FROM activity_logs WHERE 1=1';
  const params=[]; let idx=1;
  if (type)  { sql+=` AND type=$${idx++}`;  params.push(type); }
  if (level) { sql+=` AND level=$${idx++}`; params.push(level); }
  if (from)  { sql+=` AND DATE(created_at)>=$${idx++}`; params.push(from); }
  if (to)    { sql+=` AND DATE(created_at)<=$${idx++}`; params.push(to); }
  sql += ' ORDER BY created_at DESC LIMIT 5000';
  const result = await query(sql, params);
  res.json({ logs: result.rows });
});

const clearLogs = asyncHandler(async (req, res) => {
  await query('TRUNCATE activity_logs, error_logs');
  res.json({ message: 'Logs cleared.' });
});

const getEmailLogs = asyncHandler(async (req, res) => {
  const { type='', page=1, limit=15 } = req.query;
  const offset = (parseInt(page)-1)*parseInt(limit);
  let sql = 'SELECT * FROM email_logs WHERE 1=1';
  const params=[]; let idx=1;
  if (type) { sql+=` AND type=$${idx++}`; params.push(type); }
  sql += ` ORDER BY sent_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(parseInt(limit), offset);
  const [result, total] = await Promise.all([query(sql,params), query('SELECT COUNT(*)::INT AS total FROM email_logs')]);
  res.json({ logs: result.rows, total: total.rows[0]?.total||0 });
});

/* ══════════════════════════════
   EMAIL BLASTS
══════════════════════════════ */
const sendMotivationBlast = asyncHandler(async (req, res) => {
  const users = await query(`SELECT name, email FROM users WHERE role='student' AND is_active=TRUE`);
  let sent=0, failed=0;

  for (const u of users.rows) {
    try {
      await sendEmail({
        to: u.email,
        subject: 'StudySync — Keep Going! 💪',
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <div style="background:linear-gradient(135deg,#5B5BD6,#7C7CF0);padding:28px;border-radius:12px;color:#fff;margin-bottom:20px;">
            <h2 style="margin:0 0 8px;">You've got this, ${u.name}! 🎓</h2>
            <p style="margin:0;font-style:italic;opacity:0.85;">"Discipline is the bridge between goals and accomplishment."</p>
          </div>
          <p style="color:#4A4A72;">Keep studying. Every quiz, every note, every session brings you closer to your goal.</p>
          <a href="${process.env.CLIENT_URL}/dashboard" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#5B5BD6;color:#fff;border-radius:8px;text-decoration:none;">Open StudySync →</a>
        </div>`,
      });
      sent++;
    } catch { failed++; }
  }

  await logEmail({ type:'motivation', subject:'StudySync — Keep Going! 💪', recipientCount:sent, recipients:'all active students', sentBy:req.user.id, status: failed===0?'sent':'partial' });
  await logActivity(req, { type:'email', action:`Motivation blast sent to ${sent} students` });
  res.json({ message: `Sent to ${sent} students.`, sent, failed });
});

const sendWeeklyBlast = asyncHandler(async (req, res) => {
  const users = await query(`SELECT id, name, email FROM users WHERE role='student' AND is_active=TRUE`);
  let sent=0, failed=0;

  for (const u of users.rows) {
    try {
      const [attemptsRes, streakRes] = await Promise.all([
        query(`SELECT COUNT(*)::INT AS total, ROUND(AVG(score))::INT AS avg FROM quiz_attempts WHERE user_id=$1 AND completed_at>=NOW()-INTERVAL '7 days'`, [u.id]),
        query('SELECT current_streak FROM study_streak WHERE user_id=$1', [u.id]),
      ]);
      const stats  = attemptsRes.rows[0];
      const streak = streakRes.rows[0]?.current_streak||0;

      await sendEmail({
        to: u.email,
        subject: 'StudySync — Your Weekly Report 📊',
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <div style="background:linear-gradient(135deg,#5B5BD6,#7C7CF0);padding:28px;border-radius:12px;color:#fff;margin-bottom:20px;">
            <h2 style="margin:0 0 6px;">Weekly Report</h2><p style="margin:0;opacity:0.8;">Hi ${u.name} — here's your week.</p>
          </div>
          <div style="display:flex;gap:12px;margin-bottom:20px;">
            <div style="flex:1;background:#F7F7FF;border-radius:10px;padding:16px;text-align:center;"><div style="font-size:26px;font-weight:600;color:#5B5BD6;">${stats.total||0}</div><div style="font-size:12px;color:#8888AA;">Quizzes</div></div>
            <div style="flex:1;background:#F7F7FF;border-radius:10px;padding:16px;text-align:center;"><div style="font-size:26px;font-weight:600;color:#22C9A5;">${stats.avg||0}%</div><div style="font-size:12px;color:#8888AA;">Avg Score</div></div>
            <div style="flex:1;background:#F7F7FF;border-radius:10px;padding:16px;text-align:center;"><div style="font-size:26px;font-weight:600;color:#F59E0B;">${streak}🔥</div><div style="font-size:12px;color:#8888AA;">Streak</div></div>
          </div>
          <a href="${process.env.CLIENT_URL}/progress" style="display:block;text-align:center;padding:13px;background:#5B5BD6;color:#fff;border-radius:8px;text-decoration:none;">View Full Progress →</a>
        </div>`,
      });
      sent++;
    } catch { failed++; }
  }

  await logEmail({ type:'weekly', subject:'StudySync — Your Weekly Report 📊', recipientCount:sent, recipients:'all active students', sentBy:req.user.id, status:failed===0?'sent':'partial' });
  await logActivity(req, { type:'email', action:`Weekly blast sent to ${sent} students` });
  res.json({ message:`Weekly reports sent to ${sent} students.`, sent, failed });
});

const sendCustomBlast = asyncHandler(async (req, res) => {
  const { recipients, subject, body } = req.body;
  if (!subject || !body) return res.status(400).json({ message: 'Subject and body required.' });

  let sql = `SELECT name, email FROM users WHERE role='student' AND is_active=TRUE`;
  if (recipients === 'shs1') sql += ` AND shs_level='SHS1'`;
  if (recipients === 'shs2') sql += ` AND shs_level='SHS2'`;
  if (recipients === 'shs3') sql += ` AND shs_level='SHS3'`;
  if (recipients === 'active') sql += '';

  const users = await query(sql);
  let sent=0, failed=0;

  for (const u of users.rows) {
    try {
      await sendEmail({
        to: u.email, subject,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <div style="background:linear-gradient(135deg,#5B5BD6,#7C7CF0);padding:20px 24px;border-radius:12px;color:#fff;margin-bottom:20px;">
            <h2 style="margin:0;">StudySync</h2>
          </div>
          <div style="color:#4A4A72;line-height:1.7;">${body.replace(/\n/g,'<br>')}</div>
          <p style="font-size:12px;color:#8888AA;margin-top:24px;">You received this email from StudySync admin.</p>
        </div>`,
      });
      sent++;
    } catch { failed++; }
  }

  await logEmail({ type:'custom', subject, recipientCount:sent, recipients, sentBy:req.user.id, status:failed===0?'sent':'partial' });
  await logActivity(req, { type:'email', action:`Custom blast "${subject}" sent to ${sent} students` });
  res.json({ message:`Email sent to ${sent} recipients.`, sent, failed });
});

/* ══════════════════════════════
   ADMIN SETTINGS
══════════════════════════════ */
const getAdminProfile = asyncHandler(async (req, res) => {
  const r = await query('SELECT id, name, email, role FROM users WHERE id=$1', [req.user.id]);
  res.json(r.rows[0] || {});
});

const updateAdminProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const r = await query(
    'UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email) WHERE id=$3 RETURNING id,name,email',
    [name||null, email||null, req.user.id]
  );
  res.json(r.rows[0]);
});

const updateAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  const r = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
  const match = await bcrypt.compare(currentPassword, r.rows[0]?.password_hash);
  if (!match) return res.status(400).json({ message: 'Current password is incorrect.' });
  const hash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
  await logActivity(req, { type:'auth', action:'Admin password changed' });
  res.json({ message: 'Password updated.' });
});

const getSmtpSettings = asyncHandler(async (req, res) => {
  const r = await query(`SELECT key, value FROM admin_settings WHERE key IN ('smtp_host','smtp_port','smtp_user','smtp_from')`);
  const settings = {};
  r.rows.forEach(row => { settings[row.key.replace('smtp_','')] = row.value; });
  res.json(settings);
});

const updateSmtpSettings = asyncHandler(async (req, res) => {
  const { host, port, user, pass, from } = req.body;
  const updates = [
    ['smtp_host', host], ['smtp_port', String(port)],
    ['smtp_user', user], ['smtp_from', from],
  ];
  if (pass) updates.push(['smtp_pass', pass]);
  for (const [k, v] of updates) {
    await query(`INSERT INTO admin_settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`, [k, v]);
  }
  await logActivity(req, { type:'settings', action:'SMTP settings updated' });
  res.json({ message: 'SMTP settings saved.' });
});

const testSmtp = asyncHandler(async (req, res) => {
  const adminRes = await query('SELECT email, name FROM users WHERE id=$1', [req.user.id]);
  const admin    = adminRes.rows[0];
  await sendEmail({
    to: admin.email,
    subject: 'StudySync — SMTP Test',
    html: '<p>SMTP configuration is working correctly. ✅</p>',
  });
  res.json({ message: 'Test email sent successfully.' });
});

const updateMaintenance = asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  await query(`INSERT INTO admin_settings (key,value) VALUES ('maintenance_mode',$1) ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`, [String(enabled)]);
  await logActivity(req, { type:'system', level:'warning', action:`Maintenance mode ${enabled?'enabled':'disabled'}` });
  res.json({ message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}.` });
});

const getSystemInfo = asyncHandler(async (req, res) => {
  const [usersRes, quizzesRes] = await Promise.all([
    query('SELECT COUNT(*)::INT AS total FROM users WHERE role=$1', ['student']),
    query('SELECT COUNT(*)::INT AS total FROM quizzes'),
  ]);
  res.json({
    nodeVersion:  process.version,
    database:     'PostgreSQL',
    environment:  process.env.NODE_ENV || 'development',
    totalUsers:   usersRes.rows[0]?.total  || 0,
    totalQuizzes: quizzesRes.rows[0]?.total || 0,
    uptime:       `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
  });
});

module.exports = {
  getDashboard,
  getUsers, getUser, getUserStats, getUserHistory, toggleUserActive, resetUserPassword, deleteUser,
  adminGetQuizzes, adminCreateQuiz, adminUpdateQuiz, adminDeleteQuiz,
  adminGetQuestions, adminCreateQuestion, adminUpdateQuestion, adminDeleteQuestion,
  adminGetNotes, adminCreateNote, adminUpdateNote, adminDeleteNote,
  getAnalytics,
  getLogs, exportLogs, clearLogs, getEmailLogs,
  sendMotivationBlast, sendWeeklyBlast, sendCustomBlast,
  getAdminProfile, updateAdminProfile, updateAdminPassword,
  getSmtpSettings, updateSmtpSettings, testSmtp, updateMaintenance, getSystemInfo,
  logActivity,
};