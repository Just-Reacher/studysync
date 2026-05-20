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
  let period = '30';

  const loadAnalytics = async () => {
    try {
      const data = await adminApi(`/analytics?period=${period}`);
      if (!data) return;

      document.getElementById('statTotalUsers').textContent    = data.totalUsers    ?? '—';
      document.getElementById('statTotalAttempts').textContent = data.totalAttempts ?? '—';
      document.getElementById('statPlatformAvg').textContent   = data.platformAvg != null ? data.platformAvg+'%' : '—';
      document.getElementById('statTotalFocus').textContent    = data.totalFocusHours != null ? data.totalFocusHours+'h' : '—';

      // Subject performance bars
      const subjectEl = document.getElementById('subjectChart');
      if (data.subjectStats?.length) {
        subjectEl.innerHTML = data.subjectStats.map(s => `
          <div style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
              <span style="font-size:13px;font-weight:500;">${escapeHTML(s.subject)}</span>
              <span style="font-size:12px;color:var(--text-mid);">${s.attempts} attempts · ${s.avgScore}%</span>
            </div>
            <div style="height:7px;background:var(--primary-pale);border-radius:99px;overflow:hidden;">
              <div style="height:100%;width:${s.avgScore}%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:99px;transition:width 0.8s;"></div>
            </div>
          </div>`).join('');
      } else { subjectEl.innerHTML = '<p style="font-size:13px;color:var(--text-light);">No data yet.</p>'; }

      // Top students
      const topEl = document.getElementById('topStudentsTbody');
      if (data.topStudents?.length) {
        topEl.innerHTML = data.topStudents.map((s,i) => `
          <tr>
            <td style="font-weight:600;color:var(--primary);">#${i+1}</td>
            <td><div style="display:flex;align-items:center;gap:8px;"><div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#fff;">${(s.name||'S').slice(0,2).toUpperCase()}</div>${escapeHTML(s.name||'—')}</div></td>
            <td>${s.quizCount??0}</td>
            <td style="font-weight:500;color:var(--success);">${s.avgScore??0}%</td>
          </tr>`).join('');
      } else { topEl.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-light);">No data yet.</td></tr>'; }

      // Daily activity chart
      const actEl = document.getElementById('activityChart');
      if (data.dailyActivity?.length) {
        const max = Math.max(...data.dailyActivity.map(d=>d.count||0), 1);
        actEl.innerHTML = `<div style="display:flex;align-items:flex-end;gap:3px;height:100px;">
          ${data.dailyActivity.slice(-30).map(d => {
            const h = Math.round(((d.count||0)/max)*100);
            return `<div title="${d.date}: ${d.count} quizzes" style="flex:1;height:${Math.max(h,3)}%;background:linear-gradient(180deg,var(--primary),var(--primary-soft));border-radius:3px 3px 0 0;min-height:3px;"></div>`;
          }).join('')}
        </div>`;
      } else { actEl.innerHTML = '<p style="font-size:13px;color:var(--text-light);">No activity data yet.</p>'; }

      // Top quizzes
      const quizEl = document.getElementById('topQuizzesTbody');
      if (data.topQuizzes?.length) {
        quizEl.innerHTML = data.topQuizzes.map(q => `
          <tr>
            <td style="font-weight:500;">${escapeHTML(q.title)}</td>
            <td>${escapeHTML(q.subject)}</td>
            <td><span class="badge badge-purple">${q.level}</span></td>
            <td>${q.attempts}</td>
            <td>${q.avgScore??0}%</td>
            <td>${q.passRate!=null?q.passRate+'%':'—'}</td>
          </tr>`).join('');
      } else { quizEl.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-light);">No data yet.</td></tr>'; }

    } catch(err) { console.error('Analytics error:', err); }
  };

  document.getElementById('periodSelect')?.addEventListener('change', e => { period=e.target.value; loadAnalytics(); });
  loadAnalytics();
});