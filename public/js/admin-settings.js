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
  // Load current settings
  try {
    const [profileRes, smtpRes, sysRes] = await Promise.allSettled([
      adminApi('/settings/profile'),
      adminApi('/settings/smtp'),
      adminApi('/settings/system'),
    ]);

    if (profileRes.value) {
      document.getElementById('adminNameInput').value  = profileRes.value.name  || '';
      document.getElementById('adminEmailInput').value = profileRes.value.email || '';
    }
    if (smtpRes.value) {
      document.getElementById('smtpHost').value = smtpRes.value.host  || '';
      document.getElementById('smtpPort').value = smtpRes.value.port  || '587';
      document.getElementById('smtpUser').value = smtpRes.value.user  || '';
      document.getElementById('smtpFrom').value = smtpRes.value.from  || '';
    }
    if (sysRes.value) {
      const info = sysRes.value;
      document.getElementById('systemInfo').innerHTML = [
        ['Node.js Version', info.nodeVersion||'—'],
        ['Database', info.database||'PostgreSQL'],
        ['Total Users', info.totalUsers||'—'],
        ['Total Quizzes', info.totalQuizzes||'—'],
        ['Environment', info.env||'—'],
        ['Server Uptime', info.uptime||'—'],
      ].map(([l,v]) => `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;">
          <div style="font-size:11px;color:var(--text-light);margin-bottom:4px;">${l}</div>
          <div style="font-size:14px;font-weight:500;color:var(--text-dark);">${escapeHTML(String(v))}</div>
        </div>`).join('');
    }
  } catch {}

  // Save profile
  const makeLoadingBtn = (id) => {
    const btn = document.getElementById(id);
    const orig = btn?.innerHTML;
    return { start: () => { if(btn){btn.innerHTML='<span class="spinner" style="display:block;"></span>';btn.disabled=true;} }, stop: () => { if(btn){btn.innerHTML=orig;btn.disabled=false;} } };
  };

  document.getElementById('btnSaveProfile')?.addEventListener('click', async () => {
    const lb = makeLoadingBtn('btnSaveProfile'); lb.start();
    try {
      await adminApi('/settings/profile', {method:'PUT', body:JSON.stringify({name: document.getElementById('adminNameInput').value, email: document.getElementById('adminEmailInput').value})});
      showToast('Profile updated.');
    } catch(err) { showToast(err.message,'error'); }
    finally { lb.stop(); }
  });

  // Change password
  document.getElementById('btnChangePw')?.addEventListener('click', async () => {
    const current = document.getElementById('currentPw').value;
    const newPw   = document.getElementById('newPw').value;
    const confirm = document.getElementById('confirmPw').value;
    if (newPw !== confirm) { showToast('Passwords do not match.','error'); return; }
    if (newPw.length < 8)  { showToast('Password must be at least 8 characters.','error'); return; }
    const lb = makeLoadingBtn('btnChangePw'); lb.start();
    try {
      await adminApi('/settings/password', {method:'PUT', body:JSON.stringify({currentPassword:current, newPassword:newPw})});
      showToast('Password updated.');
      document.getElementById('currentPw').value=document.getElementById('newPw').value=document.getElementById('confirmPw').value='';
    } catch(err) { showToast(err.message,'error'); }
    finally { lb.stop(); }
  });

  // Save SMTP
  document.getElementById('btnSaveSmtp')?.addEventListener('click', async () => {
    const lb = makeLoadingBtn('btnSaveSmtp'); lb.start();
    try {
      await adminApi('/settings/smtp', {method:'PUT', body:JSON.stringify({
        host: document.getElementById('smtpHost').value,
        port: parseInt(document.getElementById('smtpPort').value),
        user: document.getElementById('smtpUser').value,
        pass: document.getElementById('smtpPass').value,
        from: document.getElementById('smtpFrom').value,
      })});
      showToast('SMTP settings saved.');
    } catch(err) { showToast(err.message,'error'); }
    finally { lb.stop(); }
  });

  // Test SMTP
  document.getElementById('btnTestSmtp')?.addEventListener('click', async () => {
    try { await adminApi('/settings/smtp/test', {method:'POST'}); showToast('SMTP connection successful!'); }
    catch(err) { showToast('SMTP test failed: ' + err.message, 'error'); }
  });

  // Clear logs
  document.getElementById('btnClearLogs')?.addEventListener('click', async () => {
    if (!confirm('Permanently delete all system logs?')) return;
    try { await adminApi('/logs/clear', {method:'DELETE'}); showToast('Logs cleared.'); }
    catch(err) { showToast(err.message,'error'); }
  });

  // Maintenance toggle
  const slider = document.getElementById('maintenanceSlider');
  const toggle = document.getElementById('maintenanceToggle');
  toggle?.addEventListener('change', async () => {
    const on = toggle.checked;
    slider.style.background = on ? 'var(--error)' : '#D1D5E8';
    try { await adminApi('/settings/maintenance', {method:'PUT', body:JSON.stringify({enabled:on})}); showToast(on ? 'Maintenance mode ON.' : 'Maintenance mode OFF.'); }
    catch(err) { toggle.checked=!on; slider.style.background='#D1D5E8'; showToast(err.message,'error'); }
  });
});