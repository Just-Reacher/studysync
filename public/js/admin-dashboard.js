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
  try {
    const data = await adminApi('/dashboard');
    if (!data) return;

    document.getElementById('statUsers').textContent    = data.totalUsers    ?? '—';
    document.getElementById('statQuizzes').textContent  = data.quizzesToday  ?? '—';
    document.getElementById('statActive').textContent   = data.activeToday   ?? '—';
    document.getElementById('statAvgScore').textContent = data.platformAvg != null ? data.platformAvg + '%' : '—';
    document.getElementById('trendUsers').textContent   = `+${data.newThisWeek ?? 0} this week`;
    document.getElementById('trendQuizzes').textContent = `${data.quizzesToday ?? 0} today`;
    document.getElementById('trendActive').textContent  = `${data.activeToday ?? 0} online`;
    document.getElementById('trendAvg').textContent     = data.platformAvg != null ? (data.platformAvg >= 70 ? '↑ Good' : '↓ Review') : '—';

    // Recent users table
    const tbody = document.getElementById('recentUsersTbody');
    if (data.recentUsers?.length) {
      tbody.innerHTML = data.recentUsers.map(u => `
        <tr>
          <td><div style="display:flex;align-items:center;gap:9px;">
            <div class="user-avatar-sm">${(u.name||'S').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</div>
            <div><div style="font-size:13px;font-weight:500;">${escapeHTML(u.name)}</div><div style="font-size:11px;color:var(--text-light);">${escapeHTML(u.email)}</div></div>
          </div></td>
          <td><span class="badge badge-purple">${u.shs_level||'—'}</span></td>
          <td>${formatDate(u.created_at)}</td>
          <td><span class="badge ${u.is_active ? 'badge-active' : 'badge-inactive'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
        </tr>`).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-light);padding:20px;">No users yet.</td></tr>';
    }

    // Subject stats
    const subjectEl = document.getElementById('subjectStats');
    if (data.subjectStats?.length) {
      subjectEl.innerHTML = data.subjectStats.map(s => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-size:13px;font-weight:500;">${escapeHTML(s.subject)}</span>
            <span style="font-size:12px;color:var(--text-mid);">${s.attempts} attempts · ${s.avgScore}%</span>
          </div>
          <div style="height:6px;background:var(--primary-pale);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${s.avgScore}%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:99px;transition:width 0.8s;"></div>
          </div>
        </div>`).join('');
    } else {
      subjectEl.innerHTML = '<p style="font-size:13px;color:var(--text-light);">No quiz data yet.</p>';
    }

    // Activity feed
    const feedEl = document.getElementById('activityFeed');
    if (data.recentActivity?.length) {
      const colours = { login:'green', quiz:'purple', task:'teal', error:'red', register:'green' };
      feedEl.innerHTML = data.recentActivity.map(a => `
        <div class="activity-item">
          <div class="activity-dot ${colours[a.type]||'purple'}"></div>
          <div class="activity-text">${escapeHTML(a.message)}</div>
          <div class="activity-time">${formatDateTime(a.created_at)}</div>
        </div>`).join('');
    } else {
      feedEl.innerHTML = '<p style="font-size:13px;color:var(--text-light);">No recent activity.</p>';
    }

  } catch (err) { console.error('Dashboard error:', err); }
});