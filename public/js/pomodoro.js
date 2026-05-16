/* ─────────────────────────────────────────────
   StudySync — pomodoro.js
   Focus timer: countdown, modes, session log,
   settings, task picker, sound, real API sync.
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
     SETTINGS STATE (with localStorage persistence)
  ══════════════════════════════ */
  const DEFAULTS = { focus: 25, short: 5, long: 15, rounds: 4 };

  const loadSettings = () => {
    const saved = localStorage.getItem('ss_pomo_settings');
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  };

  const saveSettings = () => {
    localStorage.setItem('ss_pomo_settings', JSON.stringify(settings));
  };

  let settings = loadSettings();

  /* ══════════════════════════════
     TIMER STATE
  ══════════════════════════════ */
  let mode         = 'focus';   // 'focus' | 'short' | 'long'
  let isRunning    = false;
  let secondsLeft  = settings.focus * 60;
  let totalSeconds = settings.focus * 60;
  let interval     = null;
  let roundsDone   = 0;         // completed focus sessions in current cycle
  let currentRound = 1;         // 1-based, resets after long break
  let selectedTask = null;      // { id, title }

  // Today's stats (persisted per day)
  const todayKey  = new Date().toISOString().split('T')[0];
  const statsKey  = `ss_pomo_stats_${todayKey}`;
  let todayStats  = JSON.parse(localStorage.getItem(statsKey) || '{"sessions":0,"focusMin":0,"breaks":0}');

  // Session log (in-memory, cleared on page reload)
  let sessionLog  = [];

  /* ══════════════════════════════
     SVG PROGRESS RING
  ══════════════════════════════ */
  const CIRCUMFERENCE = 2 * Math.PI * 108; // r=108
  const progressRing  = document.getElementById('timerProgress');

  const updateRing = (fraction) => {
    const offset = CIRCUMFERENCE * (1 - fraction);
    progressRing.style.strokeDashoffset = offset;
  };

  const modeRingColor = () => ({
    focus: 'var(--primary)',
    short: 'var(--accent)',
    long:  'var(--warn)',
  }[mode]);

  /* ══════════════════════════════
     DISPLAY
  ══════════════════════════════ */
  const pad = n => String(n).padStart(2, '0');

  const updateDisplay = () => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    const display = `${pad(m)}:${pad(s)}`;
    document.getElementById('timerDisplay').textContent   = display;
    document.title = `${display} — StudySync`;
    updateRing(secondsLeft / totalSeconds);
  };

  const modeLabel = () => ({
    focus: 'Focus Time',
    short: 'Short Break',
    long:  'Long Break',
  }[mode]);

  const applyModeUI = () => {
    document.getElementById('timerModeLabel').textContent = modeLabel();
    progressRing.style.stroke = modeRingColor();

    // Breathing animation during break
    const wrap = document.getElementById('timerCircleWrap');
    if (mode !== 'focus') {
      wrap.classList.add('breathing');
    } else {
      wrap.classList.remove('breathing');
    }
  };

  /* ══════════════════════════════
     SESSION DOTS
  ══════════════════════════════ */
  const renderDots = () => {
    const dotsEl = document.getElementById('sessionDots');
    const total  = settings.rounds;
    dotsEl.innerHTML = Array.from({ length: total }, (_, i) => {
      let cls = '';
      if (i < roundsDone)    cls = 'done';
      if (i === roundsDone && mode === 'focus') cls = 'current';
      return `<div class="session-dot ${cls}" aria-hidden="true"></div>`;
    }).join('');
  };

  /* ══════════════════════════════
     MODE SWITCHING
  ══════════════════════════════ */
  const switchMode = (newMode, auto = false) => {
    if (isRunning && !auto) return; // can't manually switch while running

    stopTimer();
    mode = newMode;
    totalSeconds = settings[mode] * 60;
    secondsLeft  = totalSeconds;

    document.querySelectorAll('.mode-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === mode);
      t.setAttribute('aria-selected', t.dataset.mode === mode ? 'true' : 'false');
    });

    applyModeUI();
    updateDisplay();
    updateRing(1);

    if (auto) startTimer();
  };

  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (!isRunning) switchMode(tab.dataset.mode);
    });
  });

  /* ══════════════════════════════
     PLAY / PAUSE / RESET / SKIP
  ══════════════════════════════ */
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playIcon     = document.getElementById('playIcon');

  const startTimer = () => {
    if (isRunning) return;
    isRunning = true;
    btnPlayPause.classList.add('running');
    playIcon.className = 'fa-solid fa-pause';
    btnPlayPause.setAttribute('aria-label', 'Pause timer');

    interval = setInterval(() => {
      secondsLeft--;
      updateDisplay();
      if (secondsLeft <= 0) onTimerEnd();
    }, 1000);
  };

  const pauseTimer = () => {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(interval);
    btnPlayPause.classList.remove('running');
    playIcon.className = 'fa-solid fa-play';
    btnPlayPause.setAttribute('aria-label', 'Start timer');
  };

  const stopTimer = () => {
    isRunning = false;
    clearInterval(interval);
    btnPlayPause.classList.remove('running');
    playIcon.className = 'fa-solid fa-play';
    btnPlayPause.setAttribute('aria-label', 'Start timer');
  };

  btnPlayPause.addEventListener('click', () => {
    isRunning ? pauseTimer() : startTimer();
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    stopTimer();
    secondsLeft  = totalSeconds;
    updateDisplay();
    updateRing(1);
  });

  document.getElementById('btnSkip').addEventListener('click', () => {
    if (isRunning) pauseTimer();
    onTimerEnd(true);
  });

  /* ══════════════════════════════
     TIMER END
  ══════════════════════════════ */
  const onTimerEnd = (skipped = false) => {
    stopTimer();
    playSound();

    if (mode === 'focus') {
      // Log completed focus session
      const mins = settings.focus;
      logSession('focus', mins, skipped);
      todayStats.sessions++;
      todayStats.focusMin += skipped ? Math.round((totalSeconds - secondsLeft) / 60) : mins;
      saveTodayStats();
      updateStatsUI();
      postSessionToAPI('focus', mins);

      roundsDone++;
      renderDots();

      if (roundsDone >= settings.rounds) {
        roundsDone = 0;
        showBanner('🎉 Great work! Time for a long break.', 'break');
        switchMode('long', true);
      } else {
        showBanner('✅ Session done! Take a short break.', 'break');
        switchMode('short', true);
      }

    } else {
      // Break ended
      const mins = mode === 'short' ? settings.short : settings.long;
      logSession('break', mins, skipped);
      todayStats.breaks++;
      saveTodayStats();
      updateStatsUI();
      showBanner('🧠 Break over! Ready to focus?', 'focus');
      switchMode('focus', false);
    }
  };

  /* ══════════════════════════════
     STATS UI
  ══════════════════════════════ */
  const saveTodayStats = () => {
    localStorage.setItem(statsKey, JSON.stringify(todayStats));
  };

  const updateStatsUI = () => {
    document.getElementById('statSessions').textContent = todayStats.sessions;
    document.getElementById('statFocusMin').textContent =
      todayStats.focusMin >= 60
        ? `${Math.floor(todayStats.focusMin / 60)}h ${todayStats.focusMin % 60}m`
        : `${todayStats.focusMin}m`;
    document.getElementById('statBreaks').textContent  = todayStats.breaks;
  };

  /* ══════════════════════════════
     POST SESSION TO API
  ══════════════════════════════ */
  const postSessionToAPI = async (type, minutes) => {
    try {
      await api('/timer/sessions', {
        method: 'POST',
        body: JSON.stringify({
          type,
          minutes,
          taskId: selectedTask?.id || null,
          date: new Date().toISOString().split('T')[0],
        }),
      });
    } catch (err) {
      console.error('Session post error:', err);
    }
  };

  /* ══════════════════════════════
     LOAD TODAY STATS FROM API
  ══════════════════════════════ */
  const loadTodayStats = async () => {
    try {
      const data = await api(`/timer/stats?date=${new Date().toISOString().split('T')[0]}`);
      if (!data) return;

      // Merge API stats (authoritative) with local
      if (data.sessions  !== undefined) todayStats.sessions  = data.sessions;
      if (data.focusMin  !== undefined) todayStats.focusMin  = data.focusMin;
      if (data.breaks    !== undefined) todayStats.breaks    = data.breaks;
      if (data.dailyGoal !== undefined) {
        document.getElementById('statGoal').textContent =
          `${data.dailyGoal}m`;
      }
      saveTodayStats();
      updateStatsUI();
    } catch {
      // Use local stats as fallback
      updateStatsUI();
    }
  };

  /* ══════════════════════════════
     SESSION LOG
  ══════════════════════════════ */
  const logSession = (type, minutes, skipped) => {
    const now  = new Date();
    const time = `${String(now.getHours() % 12 || 12).padStart(2,'0')}:${pad(now.getMinutes())} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    sessionLog.unshift({
      type,
      minutes,
      skipped,
      time,
      task: selectedTask?.title || null,
    });
    renderSessionLog();
  };

  const renderSessionLog = () => {
    const el = document.getElementById('sessionLog');
    if (!sessionLog.length) {
      el.innerHTML = '<div class="task-empty">No sessions yet today.</div>';
      return;
    }

    el.innerHTML = sessionLog.map(s => `
      <div class="log-item">
        <div class="log-icon ${s.type === 'focus' ? 'focus' : 'break'}">
          <i class="fa-solid ${s.type === 'focus' ? 'fa-brain' : 'fa-mug-hot'}" aria-hidden="true"></i>
        </div>
        <div class="log-info">
          <div class="log-title">${s.type === 'focus' ? 'Focus' : 'Break'}${s.skipped ? ' (skipped)' : ''}</div>
          <div class="log-time">${s.time}${s.task ? ' · ' + s.task : ''}</div>
        </div>
        <div class="log-duration">${s.minutes}m</div>
      </div>`).join('');
  };

  document.getElementById('clearLogBtn').addEventListener('click', () => {
    sessionLog = [];
    renderSessionLog();
  });

  /* ══════════════════════════════
     SETTINGS BUTTONS
  ══════════════════════════════ */
  const settingKeys = { focus: 'settingFocus', short: 'settingShort', long: 'settingLong', rounds: 'settingRounds' };
  const settingLimits = { focus: [5, 90], short: [1, 30], long: [5, 60], rounds: [1, 10] };

  const updateSettingDisplay = (target) => {
    document.getElementById(settingKeys[target]).textContent = settings[target];
  };

  document.querySelectorAll('.setting-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (isRunning) return; // don't change while running

      const target = btn.dataset.target;
      const action = btn.dataset.action;
      const [min, max] = settingLimits[target];

      if (action === 'inc') settings[target] = Math.min(max, settings[target] + 1);
      if (action === 'dec') settings[target] = Math.max(min, settings[target] - 1);

      updateSettingDisplay(target);
      saveSettings();

      // If current mode matches, update timer
      if (target === mode || (target === 'focus' && mode === 'focus') ||
          (target === 'short' && mode === 'short') || (target === 'long' && mode === 'long')) {
        totalSeconds = settings[mode] * 60;
        secondsLeft  = totalSeconds;
        updateDisplay();
        updateRing(1);
      }

      // Update dots if rounds changed
      if (target === 'rounds') renderDots();
    });
  });

  // Init setting displays
  Object.keys(settingKeys).forEach(updateSettingDisplay);

  /* ══════════════════════════════
     SOUND
  ══════════════════════════════ */
  const soundToggle = document.getElementById('soundToggle');

  const playSound = () => {
    if (!soundToggle.checked) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // AudioContext not available
    }
  };

  /* ══════════════════════════════
     NOTIFICATION BANNER
  ══════════════════════════════ */
  let bannerTimeout;
  const showBanner = (msg, type) => {
    const banner = document.getElementById('notifBanner');
    banner.className = `notif-banner show ${type}`;
    banner.innerHTML = `<i class="fa-solid ${type === 'focus' ? 'fa-brain' : 'fa-mug-hot'}"></i> ${msg}`;
    clearTimeout(bannerTimeout);
    bannerTimeout = setTimeout(() => banner.classList.remove('show'), 4000);

    // Browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('StudySync', { body: msg, icon: '/favicon.ico' });
    }
  };

  // Request notification permission
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  /* ══════════════════════════════
     TASK PICKER
  ══════════════════════════════ */
  const taskModal     = document.getElementById('taskModal');
  const sessionTaskEl = document.getElementById('sessionTask');
  const clearTaskBtn  = document.getElementById('clearTaskBtn');

  const openTaskPicker = async () => {
    taskModal.classList.add('show');
    const list = document.getElementById('taskPickerList');
    list.innerHTML = '<div class="task-empty">Loading tasks…</div>';

    try {
      const data = await api('/tasks?completed=false&limit=20');
      if (!data) return;
      const tasks = data.tasks || data;

      if (!tasks.length) {
        list.innerHTML = '<div class="task-empty">No pending tasks found.</div>';
        return;
      }

      list.innerHTML = tasks.map(t => `
        <div class="task-picker-item" data-id="${t.id}" data-title="${t.title}" role="button" tabindex="0">
          <i class="fa-solid fa-circle-dot" aria-hidden="true"></i>
          ${t.title}
        </div>`).join('');

      list.querySelectorAll('.task-picker-item').forEach(item => {
        const pick = () => {
          selectedTask = { id: item.dataset.id, title: item.dataset.title };
          document.getElementById('sessionTaskLabel').textContent = selectedTask.title;
          clearTaskBtn.style.display = 'block';
          taskModal.classList.remove('show');
        };
        item.addEventListener('click', pick);
        item.addEventListener('keydown', e => { if (e.key === 'Enter') pick(); });
      });

    } catch {
      list.innerHTML = '<div class="task-empty">Could not load tasks.</div>';
    }
  };

  sessionTaskEl.addEventListener('click', e => {
    if (e.target === clearTaskBtn || clearTaskBtn.contains(e.target)) return;
    openTaskPicker();
  });
  sessionTaskEl.addEventListener('keydown', e => { if (e.key === 'Enter') openTaskPicker(); });

  clearTaskBtn.addEventListener('click', e => {
    e.stopPropagation();
    selectedTask = null;
    document.getElementById('sessionTaskLabel').textContent = 'Set a task for this session…';
    clearTaskBtn.style.display = 'none';
  });

  document.getElementById('taskModalClose').addEventListener('click', () => taskModal.classList.remove('show'));
  taskModal.addEventListener('click', e => { if (e.target === taskModal) taskModal.classList.remove('show'); });

  /* ══════════════════════════════
     KEYBOARD SHORTCUTS
  ══════════════════════════════ */
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === ' ')       { e.preventDefault(); isRunning ? pauseTimer() : startTimer(); }
    if (e.key === 'r' || e.key === 'R') { if (!isRunning) { secondsLeft = totalSeconds; updateDisplay(); updateRing(1); } }
    if (e.key === 'Escape')  { taskModal.classList.remove('show'); }
  });

  /* ══════════════════════════════
     PAGE VISIBILITY — pause on hide
  ══════════════════════════════ */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRunning) {
      // Keep running in background — interval continues
      // Browser will throttle but timer continues
    }
  });

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  applyModeUI();
  updateDisplay();
  updateRing(1);
  renderDots();
  renderSessionLog();
  updateStatsUI();
  loadTodayStats();

});