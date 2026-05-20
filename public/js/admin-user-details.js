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
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');
  if (!userId) { window.location.href = 'admin-users.html'; return; }

  try {
    const [userRes, statsRes, historyRes] = await Promise.allSettled([
      adminApi(`/users/${userId}`),
      adminApi(`/users/${userId}/stats`),
      adminApi(`/users/${userId}/history?limit=8`),
    ]);

    const user    = userRes.value;
    const stats   = statsRes.value;
    const history = historyRes.value;

    if (!user) { window.location.href = 'admin-users.html'; return; }

    // Profile card
    document.getElementById('profileName').textContent  = user.name  || '—';
    document.getElementById('profileEmail').textContent = user.email || '—';
    const av = document.getElementById('profileAvatar');
    if (user.avatar) av.innerHTML = `<img src="${user.avatar}" alt="${user.name}" />`;
    else av.textContent = (user.name||'S').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
    document.getElementById('profileMeta').innerHTML = [user.shs_level, user.track, user.is_active?'Active':'Inactive'].filter(Boolean).map(c=>`<span class="profile-chip">${escapeHTML(c)}</span>`).join('');

    // Stats
    if (stats) {
      document.getElementById('statMiniRow').innerHTML = `
        <div class="stat-mini"><div class="stat-mini-val">${stats.quizCount??0}</div><div class="stat-mini-label">Quizzes Taken</div></div>
        <div class="stat-mini"><div class="stat-mini-val">${stats.avgScore!=null?stats.avgScore+'%':'—'}</div><div class="stat-mini-label">Avg. Score</div></div>
        <div class="stat-mini"><div class="stat-mini-val">${stats.streak??0}🔥</div><div class="stat-mini-label">Day Streak</div></div>`;
    }

    // Profile details
    document.getElementById('profileDetails').innerHTML = [
      ['Full Name', user.name],['Email', user.email],['SHS Level', user.shs_level||'—'],
      ['Track', user.track||'—'],['Joined', formatDate(user.created_at)],['Status', user.is_active?'Active':'Inactive'],
    ].map(([l,v]) => `<div class="detail-row"><span class="detail-label">${l}</span><span class="detail-value">${escapeHTML(String(v||'—'))}</span></div>`).join('');

    // Subject performance
    const subjectEl = document.getElementById('subjectPerf');
    if (stats?.subjects?.length) {
      subjectEl.innerHTML = stats.subjects.map(s => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-size:13px;font-weight:500;">${escapeHTML(s.subject)}</span><span style="font-size:12px;">${s.avgScore}%</span></div>
          <div style="height:6px;background:var(--primary-pale);border-radius:99px;overflow:hidden;"><div style="height:100%;width:${s.avgScore}%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:99px;"></div></div>
        </div>`).join('');
    } else { subjectEl.innerHTML = '<p style="font-size:13px;color:var(--text-light);">No quiz data yet.</p>'; }

    // Quiz history
    const histEl = document.getElementById('quizHistory');
    const hist   = history?.history || [];
    if (hist.length) {
      histEl.innerHTML = hist.map(h => {
        const cls = h.score>=75?'score-good':h.score>=50?'score-mid':'score-low';
        return `<div class="history-item">
          <div class="history-icon" style="background:var(--primary-pale);color:var(--primary);"><i class="fa-solid fa-brain"></i></div>
          <div class="history-info"><div class="history-title">${escapeHTML(h.quizTitle||h.title)}</div><div class="history-meta">${escapeHTML(h.subject)} · ${formatDate(h.completedAt)}</div></div>
          <span class="${cls}">${h.score}%</span>
        </div>`;}).join('');
    } else { histEl.innerHTML = '<p style="text-align:center;color:var(--text-light);font-size:13px;padding:20px 0;">No quiz history.</p>'; }

    // Action buttons
    document.getElementById('btnToggleActive')?.addEventListener('click', async () => {
      try { await adminApi(`/users/${userId}/toggle-active`, {method:'PATCH'}); showToast('User status updated.'); setTimeout(()=>location.reload(),1000); }
      catch(err) { showToast(err.message,'error'); }
    });
    document.getElementById('btnResetPw')?.addEventListener('click', async () => {
      try { await adminApi(`/users/${userId}/reset-password`, {method:'POST'}); showToast('Password reset email sent.'); }
      catch(err) { showToast(err.message,'error'); }
    });
    document.getElementById('btnDeleteUser')?.addEventListener('click', async () => {
      if (!confirm('Permanently delete this user?')) return;
      try { await adminApi(`/users/${userId}`, {method:'DELETE'}); showToast('User deleted.'); setTimeout(()=>window.location.href='admin-users.html',1000); }
      catch(err) { showToast(err.message,'error'); }
    });

  } catch(err) { console.error(err); showToast('Could not load user.','error'); }
});