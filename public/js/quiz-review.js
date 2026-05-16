/* ─────────────────────────────────────────────
   StudySync — quiz-review.js
   Loads quiz result from sessionStorage +
   fetches full review data from API.
   Real API. No mock data.
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options.headers || {}) },
      ...options,
    });
    if (res.status === 401) { logout(); return null; }
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Error ${res.status}`); }
    return res.json();
  };

  /* ══════════════════════════════
     LOGOUT
  ══════════════════════════════ */
  const logout = () => {
    ['ss_token','ss_user'].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
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
  avatarEl.textContent = (user.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  /* ══════════════════════════════
     HELPERS
  ══════════════════════════════ */
  const escapeHTML = str => {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  };

  const LETTERS = ['A', 'B', 'C', 'D', 'E'];

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const emptyState = (icon, msg) =>
    `<div class="empty-state"><i class="fa-solid ${icon}"></i><p>${msg}</p></div>`;

  /* ══════════════════════════════
     LOAD RESULT FROM SESSION
  ══════════════════════════════ */
  const resultRaw = sessionStorage.getItem('ss_quiz_result');

  if (!resultRaw) {
    // No result in session — redirect back
    window.location.href = 'quizzes.html';
    return;
  }

  const result = JSON.parse(resultRaw);
  const {
    quizId, quizTitle, subject,
    questions, answers,
    correct, wrong, skipped,
    pct, timeTaken,
  } = result;

  /* ══════════════════════════════
     RENDER SCORE SUMMARY
  ══════════════════════════════ */
  const renderSummary = () => {
    document.getElementById('reviewQuizTitle').textContent = quizTitle || 'Quiz Review';
    document.getElementById('reviewQuizSub').textContent   = subject   || '';
    document.getElementById('reviewPct').textContent       = `${pct}%`;

    const chips = [
      { icon: 'fa-check',        label: `${correct} correct` },
      { icon: 'fa-xmark',        label: `${wrong} wrong` },
      { icon: 'fa-forward',      label: `${skipped} skipped` },
      { icon: 'fa-clock',        label: formatTime(timeTaken) },
    ];

    document.getElementById('scoreChips').innerHTML = chips.map(c =>
      `<div class="score-chip"><i class="fa-solid ${c.icon}"></i> ${c.label}</div>`
    ).join('');
  };

  /* ══════════════════════════════
     BUILD REVIEW ITEMS
  ══════════════════════════════ */
  const buildReviewItems = (questions, answers) => {
    return questions.map((q, idx) => {
      const selected   = answers[q.id];
      const options    = q.options || [];
      const correctIdx = typeof q.correctIndex === 'number'
        ? q.correctIndex
        : options.findIndex(o => o.correct === true);

      let status = 'skipped';
      if (selected !== undefined) {
        status = selected === correctIdx ? 'correct' : 'wrong';
      }

      const statusLabel = { correct: 'Correct', wrong: 'Wrong', skipped: 'Skipped' }[status];
      const badgeClass  = { correct: 'badge-correct', wrong: 'badge-wrong', skipped: 'badge-skipped' }[status];

      const optionsHTML = options.map((opt, i) => {
        const text    = typeof opt === 'object' ? opt.text : opt;
        let cls = '';
        if (i === correctIdx)                          cls = 'is-correct';
        else if (i === selected && selected !== correctIdx) cls = 'is-wrong';
        return `
          <div class="review-option ${cls}">
            <span class="review-option-letter">${LETTERS[i]}</span>
            <span>${escapeHTML(text)}</span>
            ${i === correctIdx ? ' <i class="fa-solid fa-check" style="margin-left:auto;font-size:12px;" aria-label="Correct answer"></i>' : ''}
            ${i === selected && selected !== correctIdx ? ' <i class="fa-solid fa-xmark" style="margin-left:auto;font-size:12px;" aria-label="Your wrong answer"></i>' : ''}
          </div>`;
      }).join('');

      const explanationHTML = q.explanation
        ? `<div class="review-explanation"><strong>Explanation</strong>${escapeHTML(q.explanation)}</div>`
        : '';

      return {
        status,
        html: `
          <div class="review-item ${status}" data-status="${status}">
            <div class="review-item-header">
              <span class="review-q-num">Question ${idx + 1}</span>
              <span class="review-status-badge ${badgeClass}">${statusLabel}</span>
            </div>
            <p class="review-q-text">${escapeHTML(q.text || q.question)}</p>
            <div class="review-options">${optionsHTML}</div>
            ${explanationHTML}
          </div>`,
      };
    });
  };

  /* ══════════════════════════════
     FILTER TABS
  ══════════════════════════════ */
  let reviewItems = [];
  let activeFilter = 'all';

  const renderReviewList = (filter) => {
    const list = document.getElementById('reviewList');
    const filtered = filter === 'all'
      ? reviewItems
      : reviewItems.filter(item => item.status === filter);

    if (!filtered.length) {
      list.innerHTML = emptyState('fa-circle-check', `No ${filter === 'all' ? '' : filter + ' '}questions.`);
      return;
    }

    list.innerHTML = filtered.map(item => item.html).join('');
  };

  document.querySelectorAll('.review-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.review-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeFilter = tab.dataset.filter;
      renderReviewList(activeFilter);
    });
  });

  /* ══════════════════════════════
     RETAKE QUIZ
  ══════════════════════════════ */
  document.getElementById('btnRetake').addEventListener('click', () => {
    sessionStorage.removeItem('ss_quiz_result');
    window.location.href = `quizzes.html?id=${quizId}`;
  });

  /* ══════════════════════════════
     FETCH ENRICHED REVIEW FROM API
     (gets updated explanations / correct answers if server has them)
  ══════════════════════════════ */
  const loadEnrichedReview = async () => {
    try {
      const data = await api(`/quizzes/${quizId}/review`);
      if (!data) return;

      // Merge server explanations into local questions
      const serverQs = data.questions || [];
      const merged   = questions.map(q => {
        const serverQ = serverQs.find(sq => sq.id === q.id);
        return serverQ ? { ...q, ...serverQ } : q;
      });

      reviewItems = buildReviewItems(merged, answers);
      renderReviewList(activeFilter);
    } catch {
      // Fall back to local data already rendered
    }
  };

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  renderSummary();
  reviewItems = buildReviewItems(questions, answers);
  renderReviewList('all');

  // Try to enrich with server data
  loadEnrichedReview();

});