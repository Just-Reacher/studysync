/* ─────────────────────────────────────────────
   StudySync — quizzes.js
   Quiz list, filtering, taking, timer, scoring.
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
  const openSidebar    = () => { sidebar.classList.add('open'); sidebarOverlay.classList.add('show'); };
  const closeSidebar   = () => { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); };
  menuToggle.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  sidebarOverlay.addEventListener('click', closeSidebar);

  /* ══════════════════════════════
     SIDEBAR USER
  ══════════════════════════════ */
  document.getElementById('sidebarUserName').textContent = user.name || 'Student';
  const avatarEl = document.getElementById('sidebarAvatar');
  avatarEl.textContent = (user.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);

  /* ══════════════════════════════
     VIEW MANAGER
  ══════════════════════════════ */
  const showView = (id) => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  };

  /* ══════════════════════════════
     HELPERS
  ══════════════════════════════ */
  const escapeHTML = str => { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; };
  const LETTERS = ['A','B','C','D','E'];

  const subjectMeta = s => ({
    'Mathematics':        { icon:'fa-square-root-variable', bg:'#EEF2FF', color:'#4F46E5' },
    'English':            { icon:'fa-book',                  bg:'#F0FDF4', color:'#16A34A' },
    'ICT':                { icon:'fa-laptop-code',           bg:'#FFF7ED', color:'#EA580C' },
    'Integrated Science': { icon:'fa-flask',                 bg:'#FDF4FF', color:'#C026D3' },
    'Social Studies':     { icon:'fa-globe',                 bg:'#FFF1F2', color:'#E11D48' },
  }[s] || { icon:'fa-book-open', bg:'var(--primary-pale)', color:'var(--primary)' });

  const emptyState = (icon, msg) =>
    `<div class="empty-state"><i class="fa-solid ${icon}"></i><p>${msg}</p></div>`;

  const skeletonCards = (n) => Array(n).fill(
    `<div class="quiz-card" style="pointer-events:none;">
      <div class="skeleton" style="height:44px;width:44px;border-radius:11px;"></div>
      <div class="skeleton" style="height:16px;width:70%;margin-top:8px;"></div>
      <div class="skeleton" style="height:12px;width:45%;margin-top:6px;"></div>
      <div class="skeleton" style="height:38px;border-radius:10px;margin-top:8px;"></div>
    </div>`
  ).join('');

  /* ══════════════════════════════
     QUIZ LIST
  ══════════════════════════════ */
  let allQuizzes  = [];
  let filterSub   = '';
  let filterLevel = '';
  let searchQuery = '';

  const renderQuizGrid = (quizzes) => {
    const grid = document.getElementById('quizGrid');

    if (!quizzes.length) {
      grid.innerHTML = emptyState('fa-brain', 'No quizzes match your filters.');
      return;
    }

    grid.innerHTML = quizzes.map(q => {
      const sm       = subjectMeta(q.subject);
      const hasScore = q.lastScore !== null && q.lastScore !== undefined;
      return `
        <div class="quiz-card" data-id="${q.id}" role="button" tabindex="0" aria-label="Start ${escapeHTML(q.title)}">
          <div class="quiz-card-top">
            <div class="quiz-subj-icon" style="background:${sm.bg};color:${sm.color};">
              <i class="fa-solid ${sm.icon}" aria-hidden="true"></i>
            </div>
            <div class="quiz-card-badges">
              <span class="badge badge-level">${escapeHTML(q.level || 'SHS')}</span>
              ${q.timed ? `<span class="badge badge-timed"><i class="fa-regular fa-clock"></i> Timed</span>` : ''}
              ${hasScore ? `<span class="badge badge-done">Done</span>` : ''}
            </div>
          </div>
          <div>
            <div class="quiz-card-title">${escapeHTML(q.title)}</div>
            <div class="quiz-card-subject">${escapeHTML(q.subject)}</div>
          </div>
          <div class="quiz-card-meta">
            <span class="quiz-meta-item"><i class="fa-solid fa-circle-question"></i> ${q.questionCount} questions</span>
            ${q.timed ? `<span class="quiz-meta-item"><i class="fa-regular fa-clock"></i> ${q.timeLimitMinutes}m</span>` : ''}
          </div>
          ${hasScore ? `
            <div class="quiz-card-score">
              <div style="display:flex;justify-content:space-between;">
                <span class="score-label">Last score</span>
                <span class="score-val">${q.lastScore}%</span>
              </div>
              <div class="score-bar-wrap"><div class="score-bar" style="width:${q.lastScore}%"></div></div>
            </div>` : ''}
          <button class="btn-start" data-id="${q.id}">
            ${hasScore ? 'Retake Quiz' : 'Start Quiz'} <i class="fa-solid fa-arrow-right" style="font-size:12px;"></i>
          </button>
        </div>`;
    }).join('');

    // Attach click handlers
    grid.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', () => startQuiz(el.dataset.id));
      el.addEventListener('keydown', e => { if (e.key === 'Enter') startQuiz(el.dataset.id); });
    });
  };

  const applyFilters = () => {
    let filtered = allQuizzes.filter(q => {
      const matchSub   = !filterSub   || q.subject === filterSub;
      const matchLevel = !filterLevel || q.level   === filterLevel;
      const matchSearch= !searchQuery || q.title.toLowerCase().includes(searchQuery) || q.subject.toLowerCase().includes(searchQuery);
      return matchSub && matchLevel && matchSearch;
    });
    renderQuizGrid(filtered);
  };

  const loadQuizList = async () => {
    document.getElementById('quizGrid').innerHTML = skeletonCards(6);
    try {
      const data = await api('/quizzes');
      if (!data) return;
      allQuizzes = data.quizzes || data;
      applyFilters();
    } catch {
      document.getElementById('quizGrid').innerHTML = emptyState('fa-triangle-exclamation', 'Could not load quizzes.');
    }
  };

  document.getElementById('filterSubject').addEventListener('change', e => { filterSub = e.target.value; applyFilters(); });
  document.getElementById('filterLevel').addEventListener('change',   e => { filterLevel = e.target.value; applyFilters(); });
  document.getElementById('searchInput').addEventListener('input',    e => { searchQuery = e.target.value.toLowerCase().trim(); applyFilters(); });

  /* ══════════════════════════════
     QUIZ TAKING STATE
  ══════════════════════════════ */
  let currentQuiz     = null;
  let questions       = [];
  let currentIndex    = 0;
  let answers         = {}; // { questionId: selectedIndex }
  let timerInterval   = null;
  let secondsLeft     = 0;
  let startTime       = null;
  let attemptId       = null;

  /* ══════════════════════════════
     START QUIZ
  ══════════════════════════════ */
  const startQuiz = async (quizId) => {
    try {
      // Fetch quiz + questions
      const [quizData, startData] = await Promise.all([
        api(`/quizzes/${quizId}`),
        api(`/quizzes/${quizId}/start`, { method: 'POST' }),
      ]);
      if (!quizData || !startData) return;

      currentQuiz  = quizData.quiz || quizData;
      questions    = startData.questions || startData;
      currentIndex = 0;
      answers      = {};
      attemptId    = startData.attemptId || null;
      startTime    = Date.now();

      document.getElementById('topbarTitle').textContent = currentQuiz.title || 'Quiz';

      // Timer
      if (currentQuiz.timed && currentQuiz.timeLimitMinutes) {
        secondsLeft = currentQuiz.timeLimitMinutes * 60;
        startTimer();
      } else {
        document.getElementById('quizTimer').style.display = 'none';
      }

      showView('viewTaking');
      renderQuestion();

    } catch (err) {
      alert('Could not load quiz. Please try again.');
      console.error(err);
    }
  };

  /* ══════════════════════════════
     TIMER
  ══════════════════════════════ */
  const startTimer = () => {
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      secondsLeft--;
      updateTimerDisplay();
      if (secondsLeft <= 0) { clearInterval(timerInterval); submitQuiz(); }
    }, 1000);
  };

  const updateTimerDisplay = () => {
    const timerEl = document.getElementById('quizTimer');
    const display = document.getElementById('timerDisplay');
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    timerEl.classList.toggle('warning', secondsLeft <= 120 && secondsLeft > 30);
    timerEl.classList.toggle('danger',  secondsLeft <= 30);
  };

  const stopTimer = () => clearInterval(timerInterval);

  /* ══════════════════════════════
     RENDER QUESTION
  ══════════════════════════════ */
  const renderQuestion = () => {
    const q        = questions[currentIndex];
    const total    = questions.length;
    const pct      = Math.round(((currentIndex) / total) * 100);
    const answered = answers[q.id] !== undefined;

    document.getElementById('questionNumber').textContent = `Question ${currentIndex + 1}`;
    document.getElementById('questionText').textContent   = q.text || q.question;
    document.getElementById('progressLabel').textContent  = `Question ${currentIndex + 1} of ${total}`;
    document.getElementById('progressPct').textContent    = `${pct}%`;
    document.getElementById('progressBar').style.width    = `${pct}%`;

    const optionsList = document.getElementById('optionsList');
    const options     = q.options || [];

    optionsList.innerHTML = options.map((opt, i) => `
      <button class="option-btn ${answers[q.id] === i ? 'selected' : ''}"
        data-index="${i}" ${answered && answers[q.id] !== i ? 'disabled' : ''}>
        <span class="option-letter">${LETTERS[i]}</span>
        <span class="option-text">${escapeHTML(typeof opt === 'object' ? opt.text : opt)}</span>
      </button>
    `).join('');

    optionsList.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => selectOption(q, parseInt(btn.dataset.index)));
    });

    // Explanation (hidden until answered)
    const explBox  = document.getElementById('explanationBox');
    const explText = document.getElementById('explanationText');
    if (answered && q.explanation) {
      explText.textContent = q.explanation;
      explBox.classList.add('show');
    } else {
      explBox.classList.remove('show');
    }

    // Nav buttons
    document.getElementById('btnPrev').disabled = currentIndex === 0;
    const isLast = currentIndex === total - 1;
    const btnNext = document.getElementById('btnNext');
    btnNext.disabled = !answered;
    btnNext.innerHTML = isLast
      ? `Submit Quiz <i class="fa-solid fa-check" style="font-size:12px;"></i>`
      : `Next <i class="fa-solid fa-arrow-right" style="font-size:12px;"></i>`;
  };

  /* ══════════════════════════════
     SELECT OPTION
  ══════════════════════════════ */
  const selectOption = (q, selectedIndex) => {
    if (answers[q.id] !== undefined) return; // already answered

    answers[q.id] = selectedIndex;
    const options  = q.options || [];
    const correct  = typeof q.correctIndex === 'number' ? q.correctIndex
                   : options.findIndex(o => o.correct === true);

    const btns = document.querySelectorAll('.option-btn');
    btns.forEach((btn, i) => {
      btn.disabled = true;
      if (i === correct) btn.classList.add('correct');
      if (i === selectedIndex && selectedIndex !== correct) btn.classList.add('wrong');
    });

    // Show explanation
    if (q.explanation) {
      document.getElementById('explanationText').textContent = q.explanation;
      document.getElementById('explanationBox').classList.add('show');
    }

    document.getElementById('btnNext').disabled = false;
  };

  /* ══════════════════════════════
     NAVIGATION
  ══════════════════════════════ */
  document.getElementById('btnPrev').addEventListener('click', () => {
    if (currentIndex > 0) { currentIndex--; renderQuestion(); }
  });

  document.getElementById('btnNext').addEventListener('click', () => {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      submitQuiz();
    }
  });

  document.getElementById('backToListBtn').addEventListener('click', () => {
    stopTimer();
    document.getElementById('quizTimer').style.display = '';
    document.getElementById('topbarTitle').textContent = 'Quizzes';
    showView('viewList');
  });

  /* ══════════════════════════════
     SUBMIT QUIZ
  ══════════════════════════════ */
  const submitQuiz = async () => {
    stopTimer();

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const total     = questions.length;
    let correct     = 0;

    questions.forEach(q => {
      const selected = answers[q.id];
      if (selected === undefined) return;
      const correctIdx = typeof q.correctIndex === 'number' ? q.correctIndex
                       : (q.options || []).findIndex(o => o.correct === true);
      if (selected === correctIdx) correct++;
    });

    const wrong   = Object.keys(answers).length - correct;
    const skipped = total - Object.keys(answers).length;
    const pct     = Math.round((correct / total) * 100);

    // POST result to API
    try {
      const payload = {
        attemptId,
        answers: Object.entries(answers).map(([qId, idx]) => ({ questionId: qId, selectedIndex: idx })),
        timeTaken,
      };
      await api(`/quizzes/${currentQuiz.id}/submit`, { method: 'POST', body: JSON.stringify(payload) });
    } catch (err) {
      console.error('Submit error:', err);
    }

    // Save result for review page
    sessionStorage.setItem('ss_quiz_result', JSON.stringify({
      quizId:    currentQuiz.id,
      quizTitle: currentQuiz.title,
      subject:   currentQuiz.subject,
      questions,
      answers,
      correct,
      wrong,
      skipped,
      pct,
      timeTaken,
    }));

    showScoreModal({ correct, wrong, skipped, pct, total, timeTaken });
  };

  /* ══════════════════════════════
     SCORE MODAL
  ══════════════════════════════ */
  const showScoreModal = ({ correct, wrong, skipped, pct, total, timeTaken }) => {
    const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : pct >= 40 ? '📖' : '💪';
    const title = pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : pct >= 40 ? 'Keep studying!' : 'Don\'t give up!';
    const sub   = `You scored ${pct}% on ${currentQuiz.title}`;

    document.getElementById('scoreEmoji').textContent    = emoji;
    document.getElementById('scoreTitle').textContent    = title;
    document.getElementById('scoreSub').textContent      = sub;
    document.getElementById('scorePct').textContent      = `${pct}%`;
    document.getElementById('scoreFraction').textContent = `${correct} out of ${total} correct`;
    document.getElementById('statCorrect').textContent   = correct;
    document.getElementById('statWrong').textContent     = wrong + skipped;

    const m = Math.floor(timeTaken / 60);
    const s = timeTaken % 60;
    document.getElementById('statTime').textContent = m > 0 ? `${m}m ${s}s` : `${s}s`;

    document.getElementById('scoreModal').classList.add('show');
  };

  document.getElementById('btnReview').addEventListener('click', () => {
    window.location.href = 'quiz-review.html';
  });

  document.getElementById('btnBackToQuizzes').addEventListener('click', () => {
    document.getElementById('scoreModal').classList.remove('show');
    document.getElementById('quizTimer').style.display = '';
    document.getElementById('topbarTitle').textContent = 'Quizzes';
    loadQuizList();
    showView('viewList');
  });

  /* ══════════════════════════════
     URL PARAM — auto-open quiz
  ══════════════════════════════ */
  const params = new URLSearchParams(window.location.search);
  const quizIdParam = params.get('id');

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  loadQuizList().then(() => {
    if (quizIdParam) startQuiz(quizIdParam);
  });

});