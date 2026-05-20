/* ── SHARED ADMIN BOOTSTRAP ──
   Auth guard, API helper, sidebar toggle,
   logout, sidebar user — used by all admin JS
──────────────────────────────────────────── */
const adminToken = localStorage.getItem('ss_admin_token');
if (!adminToken) { window.location.href = 'admin-login.html'; }

const adminApi = async (endpoint, options = {}) => {
  const res = await fetch(`/api/admin${endpoint}`, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`, ...(options.headers||{}) },
    ...options,
  });
  if (res.status === 401) { adminLogout(); return null; }
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message||`Error ${res.status}`); }
  return res.json();
};

const adminLogout = () => { localStorage.removeItem('ss_admin_token'); localStorage.removeItem('ss_admin'); window.location.href = 'admin-login.html'; };

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logoutBtn')?.addEventListener('click', adminLogout);

  // Sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle  = document.getElementById('menuToggle');
  toggle?.addEventListener('click', () => { sidebar?.classList.toggle('open'); overlay?.classList.toggle('show'); });
  overlay?.addEventListener('click', () => { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); });

  // Admin user display
  const admin = JSON.parse(localStorage.getItem('ss_admin') || '{}');
  const nameEl   = document.getElementById('adminName');
  const avatarEl = document.getElementById('adminAvatar');
  if (nameEl)   nameEl.textContent   = admin.name || 'Admin';
  if (avatarEl) avatarEl.textContent = (admin.name||'A').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  // Topbar date
  const dateEl = document.getElementById('topbarDate');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
});

// Toast helper
let toastTimer;
const showToast = (msg, type='success') => {
  const t = document.getElementById('toast');
  if (!t) return;
  t.className = `toast show ${type}`;
  t.innerHTML = `<i class="fa-solid ${type==='success'?'fa-check':'fa-circle-exclamation'}"></i> ${msg}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
};

const escapeHTML = str => { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; };
const formatDate = iso => iso ? new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';
const formatDateTime = iso => iso ? new Date(iso).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';

document.addEventListener('DOMContentLoaded', async () => {
  let page=1, perPage=15, searchQ='', filterQuiz='', filterSubject='';

  // Populate quiz dropdown
  const populateQuizDropdown = async (targetId) => {
    try {
      const data = await adminApi('/quizzes?limit=100');
      const quizzes = data?.quizzes || data || [];
      const el = document.getElementById(targetId);
      if (el) el.innerHTML = '<option value="">All Quizzes</option>' + quizzes.map(q=>`<option value="${q.id}">${escapeHTML(q.title)} (${q.subject})</option>`).join('');
    } catch {}
  };
  populateQuizDropdown('filterQuiz');
  populateQuizDropdown('questionQuizId');

  const loadQuestions = async () => {
    try {
      const params = new URLSearchParams({page, limit:perPage, search:searchQ, quizId:filterQuiz, subject:filterSubject});
      const data   = await adminApi(`/questions?${params}`);
      if (!data) return;
      const questions = data.questions || data;
      document.getElementById('questionCount').textContent = `${data.total ?? questions.length} questions`;
      const tbody = document.getElementById('questionsTbody');
      if (!questions.length) { tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-light);">No questions found.</td></tr>'; return; }
      tbody.innerHTML = questions.map(q => {
        const opts = typeof q.options==='string'?JSON.parse(q.options):q.options||[];
        const correct = opts[q.correct_index];
        const correctText = typeof correct==='object'?correct.text:correct;
        return `<tr>
          <td style="max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(q.text||q.question||'—')}</td>
          <td style="font-size:12px;color:var(--text-mid);">${escapeHTML(q.quiz_title||'—')}</td>
          <td><span class="badge badge-purple">${escapeHTML(q.subject||'—')}</span></td>
          <td style="font-size:12px;color:var(--success);">${escapeHTML(correctText||'—')}</td>
          <td><span class="badge badge-amber">${q.difficulty||'Medium'}</span></td>
          <td><div class="action-btns">
            <button class="action-btn edit-btn" data-id="${q.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="action-btn danger delete-btn" data-id="${q.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div></td>
        </tr>`;}).join('');
      document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.id, questions)));
      document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deleteQuestion(btn.dataset.id)));
      document.getElementById('tableInfo').textContent = `${questions.length} questions`;
    } catch(err) { showToast(err.message,'error'); }
  };

  const openModal = (id=null, questions=[]) => {
    document.getElementById('questionModalTitle').textContent = id ? 'Edit Question' : 'New Question';
    document.getElementById('questionId').value = id || '';
    if (id) {
      const q = questions.find(q=>q.id==id);
      if (q) {
        document.getElementById('questionText').value        = q.text||q.question||'';
        document.getElementById('questionExplanation').value = q.explanation||'';
        document.getElementById('questionQuizId').value      = q.quiz_id||'';
        const opts = typeof q.options==='string'?JSON.parse(q.options):q.options||[];
        document.querySelectorAll('.option-input').forEach((inp,i) => { inp.value = typeof opts[i]==='object'?opts[i].text:opts[i]||''; });
        const radios = document.querySelectorAll('input[name="correct"]');
        radios.forEach(r => { r.checked = parseInt(r.value)===q.correct_index; });
      }
    } else {
      document.getElementById('questionForm').reset();
    }
    document.getElementById('questionModal').classList.add('show');
  };

  const deleteQuestion = async (id) => {
    if (!confirm('Delete this question?')) return;
    try { await adminApi(`/questions/${id}`, {method:'DELETE'}); showToast('Question deleted.'); loadQuestions(); }
    catch(err) { showToast(err.message,'error'); }
  };

  document.getElementById('btnAddQuestion')?.addEventListener('click', () => openModal());
  document.getElementById('questionModalClose')?.addEventListener('click', () => document.getElementById('questionModal').classList.remove('show'));
  document.getElementById('questionBtnCancel')?.addEventListener('click', () => document.getElementById('questionModal').classList.remove('show'));

  document.getElementById('questionForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id  = document.getElementById('questionId').value;
    const btn = document.getElementById('questionBtnSave');
    btn.disabled=true; btn.classList.add('loading');
    const optionInputs = document.querySelectorAll('.option-input');
    const correctRadio = document.querySelector('input[name="correct"]:checked');
    const options = Array.from(optionInputs).map(inp => ({text: inp.value.trim()}));
    const payload = {
      quizId:       document.getElementById('questionQuizId').value,
      text:         document.getElementById('questionText').value.trim(),
      options,
      correctIndex: correctRadio ? parseInt(correctRadio.value) : 0,
      explanation:  document.getElementById('questionExplanation').value.trim() || null,
    };
    try {
      if (id) { await adminApi(`/questions/${id}`, {method:'PUT', body:JSON.stringify(payload)}); showToast('Question updated.'); }
      else    { await adminApi('/questions', {method:'POST', body:JSON.stringify(payload)}); showToast('Question created!'); }
      document.getElementById('questionModal').classList.remove('show');
      loadQuestions();
    } catch(err) { showToast(err.message,'error'); }
    finally { btn.disabled=false; btn.classList.remove('loading'); }
  });

  document.getElementById('searchInput')?.addEventListener('input',   e => { searchQ=e.target.value; page=1; loadQuestions(); });
  document.getElementById('filterQuiz')?.addEventListener('change',    e => { filterQuiz=e.target.value; page=1; loadQuestions(); });
  document.getElementById('filterSubject')?.addEventListener('change', e => { filterSubject=e.target.value; page=1; loadQuestions(); });
  loadQuestions();
});