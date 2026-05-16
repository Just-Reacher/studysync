/* ─────────────────────────────────────────────
   StudySync — controllers/emailController.js
───────────────────────────────────────────── */
const { query }        = require('../config/db');
const { asyncHandler } = require('../utils/helpers');
const { sendEmail }    = require('../services/emailService');

/* ── Send weekly performance summary ── */
const sendWeeklySummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [userRes, attemptsRes, streakRes] = await Promise.all([
    query('SELECT name, email FROM users WHERE id = $1', [userId]),
    query(`SELECT COUNT(*)::INT AS total, ROUND(AVG(score))::INT AS avg
           FROM quiz_attempts WHERE user_id = $1 AND completed_at >= NOW() - INTERVAL '7 days'`, [userId]),
    query('SELECT current_streak FROM study_streak WHERE user_id = $1', [userId]),
  ]);

  const user    = userRes.rows[0];
  const stats   = attemptsRes.rows[0];
  const streak  = streakRes.rows[0]?.current_streak || 0;

  await sendEmail({
    to:      user.email,
    subject: 'StudySync — Your Weekly Progress Report',
    html: `
      <div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;background:#F7F7FF;padding:32px 24px;border-radius:16px;">
        <div style="background:linear-gradient(135deg,#5B5BD6,#7C7CF0);padding:28px 24px;border-radius:12px;color:#fff;margin-bottom:24px;">
          <h1 style="font-size:24px;margin:0 0 6px;">Weekly Report 📊</h1>
          <p style="margin:0;opacity:0.8;">Hi ${user.name} — here's your week in review.</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
          <div style="background:#fff;border-radius:10px;padding:16px;text-align:center;border:1px solid rgba(91,91,214,0.12);">
            <div style="font-size:28px;font-weight:600;color:#5B5BD6;">${stats.total || 0}</div>
            <div style="font-size:12px;color:#8888AA;">Quizzes Taken</div>
          </div>
          <div style="background:#fff;border-radius:10px;padding:16px;text-align:center;border:1px solid rgba(91,91,214,0.12);">
            <div style="font-size:28px;font-weight:600;color:#22C9A5;">${stats.avg || 0}%</div>
            <div style="font-size:12px;color:#8888AA;">Avg. Score</div>
          </div>
          <div style="background:#fff;border-radius:10px;padding:16px;text-align:center;border:1px solid rgba(91,91,214,0.12);">
            <div style="font-size:28px;font-weight:600;color:#F59E0B;">${streak}🔥</div>
            <div style="font-size:12px;color:#8888AA;">Day Streak</div>
          </div>
        </div>
        <a href="${process.env.CLIENT_URL}/progress" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#5B5BD6,#7C7CF0);color:#fff;border-radius:10px;text-decoration:none;font-weight:500;">View Full Progress →</a>
        <p style="font-size:12px;color:#8888AA;text-align:center;margin-top:20px;">You can disable these emails in Settings → Notifications.</p>
      </div>
    `,
  });

  res.json({ message: 'Weekly summary sent.' });
});

/* ── Send motivation email ── */
const sendMotivation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRes = await query('SELECT name, email FROM users WHERE id = $1', [userId]);
  const user    = userRes.rows[0];

  await sendEmail({
    to:      user.email,
    subject: 'StudySync — Keep Going! 💪',
    html: `
      <div style="font-family:'DM Sans',sans-serif;max-width:600px;margin:0 auto;background:#F7F7FF;padding:32px 24px;border-radius:16px;">
        <div style="background:linear-gradient(135deg,#5B5BD6,#7C7CF0);padding:28px 24px;border-radius:12px;color:#fff;margin-bottom:24px;">
          <h1 style="font-size:22px;margin:0 0 8px;">You've got this, ${user.name}! 🎓</h1>
          <p style="margin:0;font-style:italic;opacity:0.85;">"Discipline is the bridge between goals and accomplishment." — Jim Rohn</p>
        </div>
        <p style="color:#4A4A72;line-height:1.7;">Your academic journey matters. Every quiz you take, every note you save, every task you complete — it all adds up.</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#5B5BD6,#7C7CF0);color:#fff;border-radius:10px;text-decoration:none;font-weight:500;margin-top:20px;">Open StudySync →</a>
      </div>
    `,
  });

  res.json({ message: 'Motivation email sent.' });
});

module.exports = { sendWeeklySummary, sendMotivation };