/* ─────────────────────────────────────────────
   StudySync — progress.js
   Analytics, subject performance, quiz history,
   streak, activity graph, badges. Real API.
───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════
     AUTH GUARD
  ══════════════════════════════ */
  const token   = localStorage.getItem('ss_token')  || sessionStorage.getItem('ss_token');
  const userRaw = localStorage.getItem('ss_user')   || sessionStorage.getItem('ss_user');
  if (!token) { window.location.href = 'login.html'; return; }
  const user = userRaw ? JSON.parse(userRaw) : {};

  /* ══════════════════════════════
     API HELPER
  ══════════════════════════════ */
  const api = async (endpoint, options = {}) => {
    const res = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
      },
      ...options,
    });
    if (res.status === 401) { logout(); return null; }
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || `Error ${res.status}`);
    }
    return res.json();
  };

  /* ══════════════════════════════
     LOGOUT
  ══════════════════════════════ */
  const logout = () => {
    ['ss_token', 'ss_user'].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    window.location.href = 'login.html';
  };
  document.getElementById('logoutBtn').addEventListener('click', logout);

  /* ══════════════════════════════
     SIDEBAR TOGGLE
  ══════════════════════════════ */
  const sidebar        = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const menuToggle     = document.getElementById('menuToggle');
  menuToggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
  });

  /* ══════════════════════════════
     SIDEBAR USER
  ══════════════════════════════ */
  document.getElementById('sidebarUserName').textContent = user.name || 'Student';
  const avatarEl = document.getElementById('sidebarAvatar');
  if (user.avatar) {
    avatarEl.innerHTML = `<img src="${user.avatar}" alt="${user.name}" />`;
  } else {
    avatarEl.textContent = (user.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  /* ══════════════════════════════
     HELPERS
  ══════════════════════════════ */
  const escapeHTML = str => {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  };

  const formatDate = iso =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = secs => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const scoreColor = pct =>
    pct >= 75 ? 'score-good' : pct >= 50 ? 'score-mid' : 'score-low';

  const subjectMeta = s => ({
    'Mathematics':        { icon: 'fa-square-root-variable', bg: '#EEF2FF', color: '#4F46E5', barColor: '#4F46E5' },
    'English':            { icon: 'fa-book',                  bg: '#F0FDF4', color: '#16A34A', barColor: '#16A34A' },
    'ICT':                { icon: 'fa-laptop-code',           bg: '#FFF7ED', color: '#EA580C', barColor: '#EA580C' },
    'Integrated Science': { icon: 'fa-flask',                 bg: '#FDF4FF', color: '#C026D3', barColor: '#C026D3' },
    'Social Studies':     { icon: 'fa-globe',                 bg: '#FFF1F2', color: '#E11D48', barColor: '#E11D48' },
    'Elective':           { icon: 'fa-star',                  bg: '#E0FAF4', color: '#0E9A7D', barColor: '#0E9A7D' },
  }[s] || { icon: 'fa-book-open', bg: 'var(--primary-pale)', color: 'var(--primary)', barColor: 'var(--primary)' });

  const emptyState = (icon, msg) =>
    `<div class="empty-state"><i class="fa-solid ${icon}"></i><p>${msg}</p></div>`;

  /* ══════════════════════════════
     STATE
  ══════════════════════════════ */
  let currentPeriod = '30';

  /* ══════════════════════════════
     PERIOD SELECT
  ══════════════════════════════ */
  document.getElementById('periodSelect').addEventListener('change', e => {
    currentPeriod = e.target.value;
    loadAll();
  });

  /* ══════════════════════════════
     LOAD ALL
  ══════════════════════════════ */
  const loadAll = () => {
    Promise.allSettled([
      loadSummary(),
      loadSubjectPerformance(),
      loadActivityGraph(),
      loadQuizHistory(),
      loadStreak(),
      loadBadges(),
    ]);
  };

  /* ══════════════════════════════
     SUMMARY STATS
  ══════════════════════════════ */
  const loadSummary = async () => {
    try {
      const data = await api(`/progress/summary?period=${currentPeriod}`);
      if (!data) return;

      // Stat cards
      document.getElementById('scTotalQuizzes').textContent = data.totalQuizzes ?? '0';
      document.getElementById('scQuizChange').textContent   = data.totalQuizzes > 0
        ? `+${data.quizzesDelta ?? 0} this period` : 'None yet';

      const avg = data.avgScore ?? null;
      document.getElementById('scAvgScore').textContent  = avg !== null ? `${avg}%` : 'N/A';
      document.getElementById('scAvgChange').textContent = avg !== null
        ? (avg >= 70 ? '↑ Good' : '↓ Review') : '—';
      document.getElementById('scAvgChange').className =
        `stat-change ${avg !== null ? (avg >= 70 ? 'up' : 'down') : 'neu'}`;

      document.getElementById('scStreak').textContent       = `${data.streak ?? 0}d`;
      document.getElementById('scStreakChange').textContent = `${data.streak ?? 0} days`;

      const focusMins = data.focusMinutes ?? 0;
      document.getElementById('scFocusHours').textContent  = focusMins >= 60
        ? `${(focusMins / 60).toFixed(1)}h` : `${focusMins}m`;
      document.getElementById('scFocusChange').textContent = focusMins > 0 ? 'Active' : 'None';

      // Page subtitle
      document.getElementById('progressSub').textContent =
        `${data.totalQuizzes ?? 0} quizzes taken · avg score ${avg !== null ? avg + '%' : 'N/A'}`;

      // Insights
      if (data.strongestSubject) {
        document.getElementById('strongSubject').textContent = data.strongestSubject.name;
        document.getElementById('strongScore').textContent   = `${data.strongestSubject.avgScore}%`;
      } else {
        document.getElementById('strongSubject').textContent = 'No data yet';
        document.getElementById('strongScore').textContent   = '—';
      }

      if (data.weakestSubject) {
        document.getElementById('weakSubject').textContent = data.weakestSubject.name;
        document.getElementById('weakScore').textContent   = `${data.weakestSubject.avgScore}%`;
      } else {
        document.getElementById('weakSubject').textContent = 'No data yet';
        document.getElementById('weakScore').textContent   = '—';
      }

    } catch (err) {
      console.error('Summary error:', err);
      document.getElementById('progressSub').textContent = 'Could not load summary.';
    }
  };

  /* ══════════════════════════════
     SUBJECT PERFORMANCE
  ══════════════════════════════ */
  const loadSubjectPerformance = async () => {
    const el = document.getElementById('subjectList');
    try {
      const data = await api(`/progress/subjects?period=${currentPeriod}`);
      if (!data) return;
      const subjects = data.subjects || data;

      if (!subjects.length) {
        el.innerHTML = emptyState('fa-chart-line', 'No quiz data yet.');
        return;
      }

      el.innerHTML = subjects.map(s => {
        const sm = subjectMeta(s.subject);
        return `
          <div class="subject-row">
            <div class="subject-row-header">
              <div class="subject-row-left">
                <div class="subject-icon" style="background:${sm.bg};color:${sm.color};">
                  <i class="fa-solid ${sm.icon}" aria-hidden="true"></i>
                </div>
                <div>
                  <div class="subject-name">${escapeHTML(s.subject)}</div>
                  <div class="subject-quizzes">${s.quizCount ?? 0} quiz${(s.quizCount ?? 0) !== 1 ? 'zes' : ''}</div>
                </div>
              </div>
              <span class="subject-score">${s.avgScore}%</span>
            </div>
            <div class="subject-bar-wrap">
              <div class="subject-bar" data-target="${s.avgScore}"
                style="width:0%;background:linear-gradient(90deg,${sm.barColor},var(--accent));"></div>
            </div>
          </div>`;
      }).join('');

      // Animate bars
      requestAnimationFrame(() => {
        el.querySelectorAll('.subject-bar').forEach(bar => {
          setTimeout(() => { bar.style.width = bar.dataset.target + '%'; }, 100);
        });
      });

    } catch {
      el.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load subject data.');
    }
  };

  /* ══════════════════════════════
     ACTIVITY GRAPH
  ══════════════════════════════ */
  const loadActivityGraph = async () => {
    const el = document.getElementById('activityGraph');
    try {
      const data = await api(`/progress/activity?period=${currentPeriod}`);
      if (!data) return;
      const days = data.days || data; // array of { date, count, score }

      if (!days.length) {
        el.innerHTML = emptyState('fa-chart-column', 'No activity data yet.');
        return;
      }

      const maxCount = Math.max(...days.map(d => d.count || 0), 1);
      const today    = new Date().toISOString().split('T')[0];

      // Show last 14 days max for readability
      const display = days.slice(-14);

      const barsHTML = display.map(d => {
        const h       = Math.round(((d.count || 0) / maxCount) * 100);
        const isEmpty = (d.count || 0) === 0;
        const isToday = d.date === today;
        return `
          <div class="activity-bar-wrap" title="${d.date}: ${d.count ?? 0} quizzes${d.score ? ', avg ' + d.score + '%' : ''}">
            <div class="activity-bar ${isEmpty ? 'empty' : ''}"
              style="height:${isEmpty ? '4' : h}%;
                     ${isToday ? 'background:linear-gradient(180deg,var(--accent),#16A34A);' : ''}">
            </div>
          </div>`;
      }).join('');

      const datesHTML = display.map(d => {
        const day = new Date(d.date).getDate();
        return `<div class="activity-date">${day}</div>`;
      }).join('');

      el.innerHTML = `
        <div class="activity-row">
          <span class="activity-day-label" aria-hidden="true">${maxCount}</span>
          <div class="activity-bars" role="img" aria-label="Daily quiz activity">${barsHTML}</div>
        </div>
        <div class="activity-date-row">${datesHTML}</div>`;

    } catch {
      el.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load activity.');
    }
  };

  /* ══════════════════════════════
     QUIZ HISTORY
  ══════════════════════════════ */
  const loadQuizHistory = async () => {
    const el = document.getElementById('historyList');
    try {
      const data = await api(`/progress/history?period=${currentPeriod}&limit=10`);
      if (!data) return;
      const history = data.history || data;

      if (!history.length) {
        el.innerHTML = emptyState('fa-clock-rotate-left', 'No quiz history yet.');
        return;
      }

      el.innerHTML = history.map(h => {
        const sm  = subjectMeta(h.subject);
        const cls = scoreColor(h.score);
        return `
          <div class="history-item">
            <div class="history-icon" style="background:${sm.bg};color:${sm.color};">
              <i class="fa-solid ${sm.icon}" aria-hidden="true"></i>
            </div>
            <div class="history-info">
              <div class="history-title">${escapeHTML(h.quizTitle || h.title)}</div>
              <div class="history-meta">
                ${escapeHTML(h.subject)} ·
                ${h.correct ?? '?'}/${h.total ?? '?'} correct ·
                ${formatDate(h.completedAt || h.date)}
                ${h.timeTaken ? ` · ${formatTime(h.timeTaken)}` : ''}
              </div>
            </div>
            <span class="history-score ${cls}">${h.score}%</span>
          </div>`;
      }).join('');

    } catch {
      el.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load quiz history.');
    }
  };

  /* ══════════════════════════════
     STREAK
  ══════════════════════════════ */
  const loadStreak = async () => {
    try {
      const data = await api('/progress/streak');
      if (!data) return;

      document.getElementById('streakNum').textContent = data.streak ?? 0;
      document.getElementById('streakMsg').textContent = data.message || 'Keep it going!';

      // Last 7 days dots
      const days  = data.last7Days || [];
      const today = new Date().toISOString().split('T')[0];
      const dotsEl = document.getElementById('streakDots');

      if (days.length) {
        dotsEl.innerHTML = days.map(d => {
          const isToday  = d.date === today;
          const isActive = d.active;
          const label    = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
          return `<div class="streak-dot ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}"
            title="${d.date}" aria-label="${d.date}: ${isActive ? 'studied' : 'no study'}">${label}</div>`;
        }).join('');
      } else {
        dotsEl.innerHTML = Array(7).fill(0).map((_, i) => {
          const d   = new Date();
          d.setDate(d.getDate() - (6 - i));
          const lbl = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
          return `<div class="streak-dot" aria-hidden="true">${lbl}</div>`;
        }).join('');
      }

    } catch (err) {
      console.error('Streak error:', err);
    }
  };

  /* ══════════════════════════════
     ACHIEVEMENT BADGES
  ══════════════════════════════ */
  const BADGE_DEFINITIONS = [
    { id: 'first_quiz',    emoji: '🎯', name: 'First Quiz',     desc: 'Complete 1 quiz' },
    { id: 'streak_3',      emoji: '🔥', name: '3-Day Streak',   desc: 'Study 3 days in a row' },
    { id: 'streak_7',      emoji: '⚡', name: '7-Day Streak',   desc: 'Study 7 days in a row' },
    { id: 'perfect_score', emoji: '💯', name: 'Perfect Score',  desc: 'Get 100% on a quiz' },
    { id: 'quiz_10',       emoji: '🏆', name: 'Quiz Master',    desc: 'Complete 10 quizzes' },
    { id: 'all_subjects',  emoji: '🌟', name: 'All-Rounder',    desc: 'Quiz in every subject' },
    { id: 'speed_demon',   emoji: '⏱️', name: 'Speed Demon',    desc: 'Finish a quiz in under 3m' },
    { id: 'bookworm',      emoji: '📚', name: 'Bookworm',       desc: 'Save 10 notes' },
    { id: 'top_score',     emoji: '🥇', name: 'Top Student',    desc: 'Average score above 85%' },
  ];

  const loadBadges = async () => {
    const el = document.getElementById('badgesGrid');
    try {
      const data = await api('/progress/badges');
      if (!data) return;
      const earned = new Set((data.badges || data).map(b => b.id || b));

      el.innerHTML = BADGE_DEFINITIONS.map(b => {
        const unlocked = earned.has(b.id);
        return `
          <div class="badge-item ${unlocked ? '' : 'locked'}" title="${b.desc}" aria-label="${b.name}: ${unlocked ? 'earned' : 'locked'}">
            <div class="badge-emoji">${b.emoji}</div>
            <div class="badge-name">${b.name}</div>
            <div class="badge-desc">${b.desc}</div>
          </div>`;
      }).join('');

    } catch {
      // Render all locked on error
      el.innerHTML = BADGE_DEFINITIONS.map(b => `
        <div class="badge-item locked" title="${b.desc}">
          <div class="badge-emoji">${b.emoji}</div>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div>
        </div>`).join('');
    }
  };

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  loadAll();

});