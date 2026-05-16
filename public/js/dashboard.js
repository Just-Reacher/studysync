/* ─────────────────────────────────────────────
   StudySync — dashboard.js
   Real API connectivity. No demo/mock data.
───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════
     AUTH GUARD
  ══════════════════════════════ */
  const token  = localStorage.getItem('ss_token')  || sessionStorage.getItem('ss_token');
  const userRaw= localStorage.getItem('ss_user')   || sessionStorage.getItem('ss_user');

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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `API error ${res.status}`);
    }

    return res.json();
  };

  /* ══════════════════════════════
     LOGOUT
  ══════════════════════════════ */
  const logout = () => {
    ['ss_token','ss_user'].forEach(k => {
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

  const openSidebar  = () => { sidebar.classList.add('open'); sidebarOverlay.classList.add('show'); menuToggle.setAttribute('aria-expanded','true'); };
  const closeSidebar = () => { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); menuToggle.setAttribute('aria-expanded','false'); };

  menuToggle.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  sidebarOverlay.addEventListener('click', closeSidebar);

  /* ══════════════════════════════
     GREETING + DATE
  ══════════════════════════════ */
  const setGreeting = () => {
    const h = new Date().getHours();
    const label = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    document.getElementById('greetingTime').textContent = label;
    document.getElementById('greetingName').textContent = (user.name || 'Student').split(' ')[0];
    document.getElementById('topbarDate').textContent   = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
  };

  setGreeting();

  /* ══════════════════════════════
     SIDEBAR USER
  ══════════════════════════════ */
  const setSidebarUser = () => {
    document.getElementById('sidebarUserName').textContent = user.name || 'Student';
    const avatarEl = document.getElementById('sidebarAvatar');
    if (user.avatar) {
      avatarEl.innerHTML = `<img src="${user.avatar}" alt="${user.name}" />`;
    } else {
      avatarEl.textContent = (user.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
    }
  };

  setSidebarUser();

  /* ══════════════════════════════
     HELPERS
  ══════════════════════════════ */
  const escapeHTML = str => { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; };

  const formatDeadline = iso => {
    const diff = Math.round((new Date(iso) - new Date()) / 86400000);
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    if (diff < 0)  return `Overdue by ${Math.abs(diff)}d`;
    return `Due in ${diff}d`;
  };

  const formatTime = t => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h, 10);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const emptyState = (icon, msg) =>
    `<div class="empty-state"><i class="fa-solid ${icon}"></i><p>${msg}</p></div>`;

  const skeletonRows = (count, el) => {
    if (!el) return;
    el.innerHTML = Array(count).fill(
      `<div class="skeleton" style="height:14px;border-radius:6px;margin-bottom:10px;"></div>`
    ).join('');
  };

  /* ══════════════════════════════
     QUOTE
  ══════════════════════════════ */
  const loadQuote = async () => {
    try {
      const data = await api('/dashboard/quote');
      if (!data) return;
      document.getElementById('quoteText').textContent   = `"${data.quote}"`;
      document.getElementById('quoteAuthor').textContent = `— ${data.author}`;
    } catch {
      document.getElementById('quoteText').textContent = '';
      document.getElementById('quoteAuthor').textContent = '';
    }
  };

  /* ══════════════════════════════
     STATS
  ══════════════════════════════ */
  const loadStats = async () => {
    try {
      const data = await api('/dashboard/stats');
      if (!data) return;

      // Streak
      const streak = data.streak ?? 0;
      document.getElementById('statStreak').textContent       = `${streak}d`;
      document.getElementById('streakNumber').textContent     = streak;
      document.getElementById('streakSub').textContent        = data.streakMessage || 'Keep it going!';
      document.getElementById('statStreakChange').textContent = `${streak} day${streak !== 1 ? 's' : ''}`;

      // Tasks
      const pending = data.tasksPending ?? 0;
      const total   = data.tasksTotal   ?? 0;
      document.getElementById('statTasks').textContent      = `${total - pending}/${total}`;
      document.getElementById('statTaskChange').textContent  = `${pending} left`;
      document.getElementById('welcomeSub').textContent     = `You have ${pending} task${pending !== 1 ? 's' : ''} pending today.`;
      if (pending > 0) {
        const b = document.getElementById('navTaskBadge');
        b.textContent = pending; b.classList.add('show');
      }

      // Score
      const avg = data.avgScore ?? null;
      document.getElementById('statAvgScore').textContent    = avg !== null ? `${avg}%` : 'N/A';
      const scoreChg = document.getElementById('statScoreChange');
      scoreChg.textContent = avg !== null ? (avg >= 70 ? '↑ Good' : '↓ Review') : '—';
      scoreChg.className   = `stat-change ${avg !== null ? (avg >= 70 ? 'up' : 'down') : 'neu'}`;

      // Focus
      const mins = data.focusMinutesToday ?? 0;
      document.getElementById('statFocusTime').textContent   = mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`;
      document.getElementById('statFocusChange').textContent = mins > 0 ? 'Active' : 'None yet';

    } catch (err) {
      console.error('Stats:', err);
      document.getElementById('welcomeSub').textContent = 'Could not load stats.';
    }
  };

  /* ══════════════════════════════
     TASKS
  ══════════════════════════════ */
  const priorityClass = p => ({ high:'priority-high', medium:'priority-medium' }[p] || 'priority-low');

  const toggleTask = async (id, completed, checkEl, taskEl) => {
    try {
      await api(`/tasks/${id}`, { method:'PATCH', body: JSON.stringify({ completed }) });
      checkEl.classList.toggle('done', completed);
      checkEl.setAttribute('aria-checked', String(completed));
      checkEl.innerHTML = completed ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : '';
      taskEl.classList.toggle('completed', completed);
      loadStats();
    } catch (err) { console.error('Toggle task:', err); }
  };

  const renderTasks = tasks => {
    const el = document.getElementById('taskList');
    if (!tasks || !tasks.length) { el.innerHTML = emptyState('fa-check-circle','No tasks for today. Great job!'); return; }

    el.innerHTML = tasks.map(t => `
      <div class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
        <div class="task-check ${t.completed ? 'done' : ''}" role="checkbox" aria-checked="${t.completed}" tabindex="0">
          ${t.completed ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : ''}
        </div>
        <div class="task-info">
          <div class="task-name">${escapeHTML(t.title)}</div>
          <div class="task-meta">${t.deadline ? formatDeadline(t.deadline) : 'No deadline'}</div>
        </div>
        <span class="priority-badge ${priorityClass(t.priority)}">${t.priority || 'low'}</span>
      </div>`).join('');

    el.querySelectorAll('.task-check').forEach(check => {
      const act = () => {
        const taskEl = check.closest('.task-item');
        toggleTask(taskEl.dataset.id, !check.classList.contains('done'), check, taskEl);
      };
      check.addEventListener('click', act);
      check.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });
  };

  const loadTasks = async () => {
    skeletonRows(3, document.getElementById('taskList'));
    try {
      const today = new Date().toISOString().split('T')[0];
      const data  = await api(`/tasks?date=${today}&limit=5`);
      if (!data) return;
      renderTasks(data.tasks || data);
    } catch { document.getElementById('taskList').innerHTML = emptyState('fa-triangle-exclamation','Could not load tasks.'); }
  };

  /* ══════════════════════════════
     PERFORMANCE
  ══════════════════════════════ */
  const subjectColors = { 'Mathematics':'var(--primary)', 'English':'var(--accent)', 'ICT':'#F59E0B', 'Integrated Science':'#C026D3', 'Social Studies':'#E05475' };

  const renderPerformance = subjects => {
    const el = document.getElementById('performanceList');
    if (!subjects || !subjects.length) { el.innerHTML = emptyState('fa-chart-line','No quiz data yet. Take a quiz!'); return; }

    el.innerHTML = subjects.map(s => {
      const color = subjectColors[s.subject] || 'var(--primary)';
      return `<div class="perf-item">
        <div class="perf-header"><span class="perf-subject">${escapeHTML(s.subject)}</span><span class="perf-score">${s.avgScore}%</span></div>
        <div class="perf-bar-wrap"><div class="perf-bar" data-target="${s.avgScore}" style="width:0%;background:linear-gradient(90deg,${color},var(--accent));"></div></div>
      </div>`;
    }).join('');

    requestAnimationFrame(() => {
      el.querySelectorAll('.perf-bar').forEach(bar => setTimeout(() => { bar.style.width = bar.dataset.target + '%'; }, 80));
    });
  };

  const loadPerformance = async () => {
    skeletonRows(3, document.getElementById('performanceList'));
    try {
      const data = await api('/progress/subjects?limit=5');
      if (!data) return;
      renderPerformance(data.subjects || data);
    } catch { document.getElementById('performanceList').innerHTML = emptyState('fa-triangle-exclamation','Could not load performance.'); }
  };

  /* ══════════════════════════════
     QUIZZES
  ══════════════════════════════ */
  const subjectMeta = s => ({
    'Mathematics':       { icon:'fa-square-root-variable', bg:'#EEF2FF', color:'#4F46E5' },
    'English':           { icon:'fa-book',                  bg:'#F0FDF4', color:'#16A34A' },
    'ICT':               { icon:'fa-laptop-code',           bg:'#FFF7ED', color:'#EA580C' },
    'Integrated Science':{ icon:'fa-flask',                 bg:'#FDF4FF', color:'#C026D3' },
    'Social Studies':    { icon:'fa-globe',                 bg:'#FFF1F2', color:'#E11D48' },
  }[s] || { icon:'fa-book-open', bg:'var(--primary-pale)', color:'var(--primary)' });

  const renderQuizzes = quizzes => {
    const el = document.getElementById('quizList');
    if (!quizzes || !quizzes.length) { el.innerHTML = emptyState('fa-brain','No quizzes available right now.'); return; }

    el.innerHTML = quizzes.map(q => {
      const sm = subjectMeta(q.subject);
      return `<a href="quizzes.html?id=${q.id}" class="quiz-item">
        <div class="quiz-subj-icon" style="background:${sm.bg};color:${sm.color};"><i class="fa-solid ${sm.icon}"></i></div>
        <div class="quiz-info">
          <div class="quiz-name">${escapeHTML(q.title)}</div>
          <div class="quiz-meta">${escapeHTML(q.subject)} · ${q.questionCount ?? '?'} questions</div>
        </div>
        <i class="fa-solid fa-chevron-right quiz-arrow"></i>
      </a>`;
    }).join('');
  };

  const loadQuizzes = async () => {
    skeletonRows(2, document.getElementById('quizList'));
    try {
      const data = await api('/quizzes?limit=3&status=available');
      if (!data) return;
      const quizzes = data.quizzes || data;
      renderQuizzes(quizzes);
      if (quizzes.length) {
        const b = document.getElementById('navQuizBadge');
        b.textContent = quizzes.length; b.classList.add('show');
      }
    } catch { document.getElementById('quizList').innerHTML = emptyState('fa-triangle-exclamation','Could not load quizzes.'); }
  };

  /* ══════════════════════════════
     REMINDERS
  ══════════════════════════════ */
  const reminderMeta = type => ({
    prayer: { icon:'fa-hands-praying', bg:'#F0FDF4', color:'#16A34A' },
    study:  { icon:'fa-book-open',     bg:'var(--primary-pale)', color:'var(--primary)' },
    school: { icon:'fa-school',        bg:'#FFF5E0', color:'#D97706' },
  }[type] || { icon:'fa-bell', bg:'var(--primary-pale)', color:'var(--primary)' });

  const renderReminders = reminders => {
    const el = document.getElementById('reminderList');
    if (!reminders || !reminders.length) { el.innerHTML = emptyState('fa-bell-slash','No reminders for today.'); return; }

    el.innerHTML = reminders.map(r => {
      const rm = reminderMeta(r.type);
      return `<div class="reminder-item">
        <div class="reminder-icon" style="background:${rm.bg};color:${rm.color};"><i class="fa-solid ${rm.icon}"></i></div>
        <div class="reminder-info">
          <div class="reminder-title">${escapeHTML(r.title)}</div>
          <div class="reminder-time">${formatTime(r.time)}</div>
        </div>
      </div>`;
    }).join('');
  };

  const loadReminders = async () => {
    skeletonRows(2, document.getElementById('reminderList'));
    try {
      const today = new Date().toISOString().split('T')[0];
      const data  = await api(`/reminders?date=${today}&limit=4`);
      if (!data) return;
      renderReminders(data.reminders || data);
    } catch { document.getElementById('reminderList').innerHTML = emptyState('fa-triangle-exclamation','Could not load reminders.'); }
  };

  /* ══════════════════════════════
     MINI CALENDAR
  ══════════════════════════════ */
  let calYear   = new Date().getFullYear();
  let calMonth  = new Date().getMonth();
  let calEvents = [];

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const renderCalendar = () => {
    document.getElementById('calMonthLabel').textContent = `${MONTHS[calMonth]} ${calYear}`;

    const today      = new Date();
    const firstDay   = new Date(calYear, calMonth, 1).getDay();
    const daysInMon  = new Date(calYear, calMonth + 1, 0).getDate();
    const prevMonEnd = new Date(calYear, calMonth, 0).getDate();

    let html = DAYS.map(d => `<div class="cal-day-label">${d}</div>`).join('');

    for (let i = firstDay - 1; i >= 0; i--)
      html += `<div class="cal-day other-month">${prevMonEnd - i}</div>`;

    for (let d = 1; d <= daysInMon; d++) {
      const isToday  = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
      const dateStr  = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const hasEvent = calEvents.includes(dateStr);
      html += `<div class="cal-day ${isToday?'today':''} ${hasEvent?'has-event':''}" data-date="${dateStr}" role="button" tabindex="0">${d}</div>`;
    }

    const grid = document.getElementById('calGrid');
    grid.innerHTML = html;

    grid.querySelectorAll('.cal-day[data-date]').forEach(day => {
      day.addEventListener('click', () => { window.location.href = `calendar.html?date=${day.dataset.date}`; });
    });
  };

  const loadCalendarEvents = async () => {
    try {
      const data = await api(`/calendar/events?year=${calYear}&month=${calMonth+1}`);
      if (!data) return;
      calEvents = (data.events || data).map(e => e.date);
    } catch { calEvents = []; }
    renderCalendar();
  };

  document.getElementById('calPrev').addEventListener('click', () => {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } loadCalendarEvents();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } loadCalendarEvents();
  });

  /* ══════════════════════════════
     NOTIFICATION POPUP
  ══════════════════════════════ */
  const notifPopup = document.getElementById('notifPopup');
  const notifDot   = document.getElementById('notifDot');

  const showPopup = ({ title, body, primaryLabel, primaryHref }) => {
    document.getElementById('notifPopupTitleText').textContent = title;
    document.getElementById('notifPopupBody').textContent      = body;
    const primBtn = document.getElementById('notifPrimaryBtn');
    primBtn.textContent = primaryLabel || 'View';
    primBtn.onclick = () => { if (primaryHref) window.location.href = primaryHref; closePopup(); };
    notifDot.classList.add('show');
    notifPopup.classList.add('show');
  };

  const closePopup = () => notifPopup.classList.remove('show');

  document.getElementById('notifClose').addEventListener('click', closePopup);
  document.getElementById('notifSecondaryBtn').addEventListener('click', closePopup);
  document.getElementById('notifBtn').addEventListener('click', () => {
    notifPopup.classList.contains('show') ? closePopup() : loadNotification();
  });

  const loadNotification = async () => {
    try {
      const data = await api('/dashboard/notification');
      if (data && data.title) showPopup(data);
    } catch { /* non-critical */ }
  };

  setTimeout(loadNotification, 4000);

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  renderCalendar();

  Promise.allSettled([
    loadQuote(),
    loadStats(),
    loadTasks(),
    loadPerformance(),
    loadQuizzes(),
    loadReminders(),
    loadCalendarEvents(),
  ]);

});