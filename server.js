/* ─────────────────────────────────────────────
   StudySync — server.js
   Main Express application entry point
───────────────────────────────────────────── */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const fs = require('fs');

const { connectDB }        = require('./config/db');
const { errorMiddleware }  = require('./middleware/errorMiddleware');
const { rateLimitMiddleware, authRateLimit } =require('./middleware/rateLimitMiddleware');

/* ── Routes ── */
const authRoutes        = require('./routes/authRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const quizRoutes        = require('./routes/quizRoutes');
const taskRoutes        = require('./routes/taskRoutes');
const reminderRoutes    = require('./routes/reminderRoutes');
const noteRoutes        = require('./routes/noteRoutes');
const progressRoutes    = require('./routes/progressRoutes');
const calendarRoutes    = require('./routes/calendarRoutes');
const timerRoutes       = require('./routes/timerRoutes');
const settingsRoutes    = require('./routes/settingsRoutes');
const emailRoutes       = require('./routes/emailRoutes');

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

/* ══════════════════════════════
   MIDDLEWARE
══════════════════════════════ */

/* Security headers */
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts in HTML files
  crossOriginEmbedderPolicy: false,
}));

/* CORS */
app.use(cors({
  origin: true,
  credentials: true,
}));

/* Body parsing */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* Logging */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

/* Rate limiting */
app.use('/api', rateLimitMiddleware);
app.use('/api/auth/login', authRateLimit);

/* ══════════════════════════════
   STATIC FILES
══════════════════════════════ */
app.use(express.static(path.join(__dirname, 'public')));
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ══════════════════════════════
   API ROUTES
══════════════════════════════ */
app.use('/api/auth',      authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quizzes',   quizRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notes',     noteRoutes);
app.use('/api/progress',  progressRoutes);
app.use('/api/calendar',  calendarRoutes);
app.use('/api/timer',     timerRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/email',     emailRoutes);

/* ══════════════════════════════
   HTML ROUTES (SPA fallback)
══════════════════════════════ */
const htmlDir = path.join(__dirname, 'public');

app.get('/',            (req, res) => res.sendFile(path.join(htmlDir, 'index.html')));
app.get('/login',       (req, res) => res.sendFile(path.join(htmlDir, 'login.html')));
app.get('/dashboard',   (req, res) => res.sendFile(path.join(htmlDir, 'dashboard.html')));
app.get('/quizzes',     (req, res) => res.sendFile(path.join(htmlDir, 'quizzes.html')));
app.get('/quiz-review', (req, res) => res.sendFile(path.join(htmlDir, 'quiz-review.html')));
app.get('/tasks',       (req, res) => res.sendFile(path.join(htmlDir, 'tasks.html')));
app.get('/reminders',   (req, res) => res.sendFile(path.join(htmlDir, 'reminders.html')));
app.get('/notes',       (req, res) => res.sendFile(path.join(htmlDir, 'notes.html')));
app.get('/progress',    (req, res) => res.sendFile(path.join(htmlDir, 'progress.html')));
app.get('/calendar',    (req, res) => res.sendFile(path.join(htmlDir, 'calendar.html')));
app.get('/pomodoro',    (req, res) => res.sendFile(path.join(htmlDir, 'pomodoro.html')));
app.get('/settings',    (req, res) => res.sendFile(path.join(htmlDir, 'settings.html')));
app.get('/policy',      (req, res) => res.sendFile(path.join(htmlDir, 'policy.html')));
app.get('/terms',       (req, res) => res.sendFile(path.join(htmlDir, 'terms.html')));

/* ══════════════════════════════
   HEALTH CHECK
══════════════════════════════ */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'StudySync API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

/* ══════════════════════════════
   404 HANDLER
══════════════════════════════ */
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
  }
  res.sendFile(path.join(htmlDir, 'index.html'));
});

/* ══════════════════════════════
   ERROR HANDLER
══════════════════════════════ */
app.use(errorMiddleware);

/* ══════════════════════════════
   START SERVER
══════════════════════════════ */
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🎓 StudySync server running`);
      console.log(`   ➜ http://localhost:${PORT}`);
      console.log(`   ➜ ENV: ${process.env.NODE_ENV}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;