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

document.addEventListener('DOMContentLoaded', () => {
  let page=1, perPage=15, searchQ='', filterSubject='', filterLevel='';

  const loadQuizzes = async () => {
    try {
      const params = new URLSearchParams({page, limit:perPage, search:searchQ, subject:filterSubject, level:filterLevel});
      const data   = await adminApi(`/quizzes?${params}`);
      if (!data) return;
      const quizzes = data.quizzes || data;
      document.getElementById('quizCount').textContent = `${data.total ?? quizzes.length} quizzes`;
      const tbody = document.getElementById('quizzesTbody');
      if (!quizzes.length) { tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-light);">No quizzes found.</td></tr>'; return; }
      tbody.innerHTML = quizzes.map(q => `
        <tr>
          <td style="font-weight:500;">${escapeHTML(q.title)}</td>
          <td>${escapeHTML(q.subject)}</td>
          <td><span class="badge badge-purple">${q.level}</span></td>
          <td>${q.question_count??q.questionCount??0}</td>
          <td>${q.timed?q.time_limit_minutes+'m':'—'}</td>
          <td>${q.attempt_count??0}</td>
          <td>${q.avg_score!=null?q.avg_score+'%':'—'}</td>
          <td><span class="badge ${q.is_active?'badge-active':'badge-inactive'}">${q.is_active?'Active':'Inactive'}</span></td>
          <td><div class="action-btns">
            <button class="action-btn edit-btn" data-id="${q.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="action-btn danger delete-btn" data-id="${q.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div></td>
        </tr>`).join('');
      document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.id, quizzes)));
      document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deleteQuiz(btn.dataset.id)));
      document.getElementById('tableInfo').textContent = `${quizzes.length} quizzes`;
    } catch(err) { showToast(err.message,'error'); }
  };

  const openModal = (id=null, quizzes=[]) => {
    document.getElementById('quizModalTitle').textContent = id ? 'Edit Quiz' : 'New Quiz';
    document.getElementById('quizId').value = id || '';
    if (id) {
      const q = quizzes.find(q=>q.id==id);
      if (q) {
        document.getElementById('quizTitle').value     = q.title;
        document.getElementById('quizSubject').value   = q.subject;
        document.getElementById('quizLevel').value     = q.level;
        document.getElementById('quizTimed').value     = String(q.timed);
        document.getElementById('quizTimeLimit').value = q.time_limit_minutes;
        document.getElementById('quizActive').value    = String(q.is_active);
      }
    } else { document.getElementById('quizForm').reset(); }
    document.getElementById('quizModal').classList.add('show');
  };

  const deleteQuiz = async (id) => {
    if (!confirm('Delete this quiz and all its questions?')) return;
    try { await adminApi(`/quizzes/${id}`, {method:'DELETE'}); showToast('Quiz deleted.'); loadQuizzes(); }
    catch(err) { showToast(err.message,'error'); }
  };

  document.getElementById('btnAddQuiz')?.addEventListener('click', () => openModal());
  document.getElementById('quizModalClose')?.addEventListener('click', () => document.getElementById('quizModal').classList.remove('show'));
  document.getElementById('quizBtnCancel')?.addEventListener('click', () => document.getElementById('quizModal').classList.remove('show'));

  document.getElementById('quizForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id  = document.getElementById('quizId').value;
    const btn = document.getElementById('quizBtnSave');
    btn.disabled=true; btn.classList.add('loading');
    const payload = {
      title:            document.getElementById('quizTitle').value.trim(),
      subject:          document.getElementById('quizSubject').value,
      level:            document.getElementById('quizLevel').value,
      timed:            document.getElementById('quizTimed').value === 'true',
      timeLimitMinutes: parseInt(document.getElementById('quizTimeLimit').value),
      isActive:         document.getElementById('quizActive').value === 'true',
    };
    try {
      if (id) { await adminApi(`/quizzes/${id}`, {method:'PUT', body:JSON.stringify(payload)}); showToast('Quiz updated.'); }
      else    { await adminApi('/quizzes', {method:'POST', body:JSON.stringify(payload)}); showToast('Quiz created!'); }
      document.getElementById('quizModal').classList.remove('show');
      loadQuizzes();
    } catch(err) { showToast(err.message,'error'); }
    finally { btn.disabled=false; btn.classList.remove('loading'); }
  });

  document.getElementById('searchInput')?.addEventListener('input',  e => { searchQ=e.target.value; page=1; loadQuizzes(); });
  document.getElementById('filterSubject')?.addEventListener('change',e => { filterSubject=e.target.value; page=1; loadQuizzes(); });
  document.getElementById('filterLevel')?.addEventListener('change',  e => { filterLevel=e.target.value; page=1; loadQuizzes(); });
  loadQuizzes();
});