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
  let page=1, perPage=20, searchQ='', filterType='', filterLevel='', filterDateFrom='', filterDateTo='', logTab='all';

  const SEVERITY_BADGES = { info:'badge-active', warning:'badge-amber', error:'badge-inactive' };
  const TYPE_COLOURS    = { auth:'var(--primary)', quiz:'var(--accent)', error:'var(--error)', email:'#D97706', system:'#888' };

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams({page, limit:perPage, search:searchQ, type:filterType, level:filterLevel, from:filterDateFrom, to:filterDateTo, tab:logTab});
      const data   = await adminApi(`/logs?${params}`);
      if (!data) return;
      const logs = data.logs || data;
      document.getElementById('logCount').textContent = `${data.total ?? logs.length} log entries`;
      document.getElementById('tableInfo').textContent = `${logs.length} shown`;
      const tbody = document.getElementById('logsTbody');
      if (!logs.length) { tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-light);">No logs found.</td></tr>'; return; }
      tbody.innerHTML = logs.map(l => `
        <tr>
          <td style="font-size:12px;color:var(--text-light);white-space:nowrap;">${formatDateTime(l.created_at)}</td>
          <td><span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:99px;background:rgba(${l.type==='error'?'224,84,117':'91,91,214'},0.1);color:${TYPE_COLOURS[l.type]||'var(--primary)'};">${l.type||'—'}</span></td>
          <td><span class="badge ${SEVERITY_BADGES[l.level]||'badge-purple'}">${l.level||'info'}</span></td>
          <td style="font-size:12px;color:var(--text-mid);">${escapeHTML(l.user_name||l.user_email||'System')}</td>
          <td style="font-size:13px;">${escapeHTML(l.action||'—')}</td>
          <td style="font-size:12px;color:var(--text-light);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(l.details||'—')}</td>
          <td style="font-size:12px;color:var(--text-light);">${l.ip_address||'—'}</td>
        </tr>`).join('');

      // Pagination
      const pages = Math.ceil((data.total||logs.length)/perPage);
      const pagEl = document.getElementById('pagination');
      pagEl.innerHTML = Array.from({length:Math.min(pages,7)},(_,i)=>i+1).map(p=>`<button class="page-btn ${p===page?'active':''}" data-p="${p}">${p}</button>`).join('');
      pagEl.querySelectorAll('.page-btn').forEach(btn => btn.addEventListener('click', ()=>{ page=parseInt(btn.dataset.p); loadLogs(); }));
    } catch(err) { showToast(err.message,'error'); }
  };

  // Log tab switching
  document.querySelectorAll('[data-log]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-log]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      logTab = btn.dataset.log;
      filterType = logTab === 'all' ? '' : logTab;
      page = 1; loadLogs();
    });
  });

  // Export CSV
  document.getElementById('btnExport')?.addEventListener('click', async () => {
    try {
      const data = await adminApi(`/logs/export?type=${filterType}&level=${filterLevel}&from=${filterDateFrom}&to=${filterDateTo}`);
      if (!data) return;
      const rows  = [['Timestamp','Type','Severity','User','Action','Details','IP']];
      (data.logs||[]).forEach(l => rows.push([l.created_at, l.type, l.level, l.user_email||'System', l.action, l.details, l.ip_address||'']));
      const csv   = rows.map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob  = new Blob([csv], {type:'text/csv'});
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a'); a.href=url; a.download=`studysync-logs-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch(err) { showToast(err.message,'error'); }
  });

  document.getElementById('searchInput')?.addEventListener('input',   e => { searchQ=e.target.value; page=1; loadLogs(); });
  document.getElementById('filterType')?.addEventListener('change',   e => { filterType=e.target.value; page=1; loadLogs(); });
  document.getElementById('filterLevel')?.addEventListener('change',  e => { filterLevel=e.target.value; page=1; loadLogs(); });
  document.getElementById('filterDateFrom')?.addEventListener('change',e => { filterDateFrom=e.target.value; page=1; loadLogs(); });
  document.getElementById('filterDateTo')?.addEventListener('change', e => { filterDateTo=e.target.value; page=1; loadLogs(); });
  document.getElementById('btnClearFilters')?.addEventListener('click',() => {
    searchQ=filterType=filterLevel=filterDateFrom=filterDateTo='';
    document.getElementById('searchInput').value='';
    document.getElementById('filterType').value='';
    document.getElementById('filterLevel').value='';
    document.getElementById('filterDateFrom').value='';
    document.getElementById('filterDateTo').value='';
    page=1; loadLogs();
  });

  loadLogs();
});