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
  let allUsers = [], page = 1, perPage = 15, searchQ = '', filterLevel = '', filterStatus = '';
  let selectedUserId = null;

  const loadUsers = async () => {
    document.getElementById('usersTbody').innerHTML = '<tr><td colspan="8"><div class="skeleton" style="height:14px;margin:10px 16px;"></div></td></tr>';
    try {
      const params = new URLSearchParams({ page, limit: perPage, search: searchQ, level: filterLevel, status: filterStatus });
      const data   = await adminApi(`/users?${params}`);
      if (!data) return;
      allUsers = data.users || [];
      document.getElementById('userCount').textContent = `${data.total ?? allUsers.length} students registered`;
      renderTable(allUsers);
      renderPagination(data.total ?? allUsers.length, page, perPage);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const renderTable = (users) => {
    const tbody = document.getElementById('usersTbody');
    document.getElementById('tableInfo').textContent = `${users.length} students`;
    if (!users.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-light);">No students found.</td></tr>'; return; }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><div style="display:flex;align-items:center;gap:10px;">
          <div class="user-avatar-sm">${(u.name||'S').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</div>
          <div><div style="font-size:13px;font-weight:500;">${escapeHTML(u.name||'—')}</div><div style="font-size:11px;color:var(--text-light);">${escapeHTML(u.email)}</div></div>
        </div></td>
        <td><span class="badge badge-purple">${u.shs_level||'—'}</span></td>
        <td style="font-size:12px;color:var(--text-mid);">${escapeHTML(u.track||'—')}</td>
        <td>${u.quiz_count??0}</td>
        <td>${u.avg_score!=null ? u.avg_score+'%' : '—'}</td>
        <td>${formatDate(u.created_at)}</td>
        <td><span class="badge ${u.is_active ? 'badge-active':'badge-inactive'}">${u.is_active?'Active':'Inactive'}</span></td>
        <td><div class="action-btns">
          <button class="action-btn view-btn" data-id="${u.id}" title="View details"><i class="fa-solid fa-eye"></i></button>
          <button class="action-btn danger delete-btn" data-id="${u.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div></td>
      </tr>`).join('');

    document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', () => openUserModal(btn.dataset.id)));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deleteUser(btn.dataset.id)));
  };

  const renderPagination = (total, curr, per) => {
    const pages = Math.ceil(total / per);
    const el    = document.getElementById('pagination');
    el.innerHTML = Array.from({length: Math.min(pages, 7)}, (_, i) => i+1).map(p =>
      `<button class="page-btn ${p===curr?'active':''}" data-p="${p}">${p}</button>`).join('');
    el.querySelectorAll('.page-btn').forEach(btn => btn.addEventListener('click', () => { page = parseInt(btn.dataset.p); loadUsers(); }));
  };

  const openUserModal = async (id) => {
    selectedUserId = id;
    const u = allUsers.find(u => u.id == id);
    if (!u) return;
    document.getElementById('modalUserName').textContent = u.name || 'User Details';
    document.getElementById('userDetailContent').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0;">
        ${[['Email', u.email],['Level', u.shs_level||'—'],['Track', u.track||'—'],['Quizzes', u.quiz_count??0],['Avg Score', u.avg_score!=null?u.avg_score+'%':'—'],['Joined', formatDate(u.created_at)],['Status', u.is_active?'Active':'Inactive']].map(([l,v])=>`
        <div class="detail-row"><span class="detail-label">${l}</span><span class="detail-value">${escapeHTML(String(v))}</span></div>`).join('')}
      </div>`;
    document.getElementById('btnDeactivate').textContent = u.is_active ? 'Deactivate' : 'Activate';
    document.getElementById('userModal').classList.add('show');
  };

  document.getElementById('userModalClose')?.addEventListener('click', () => document.getElementById('userModal').classList.remove('show'));
  document.getElementById('btnResetPw')?.addEventListener('click', async () => {
    if (!selectedUserId) return;
    try { await adminApi(`/users/${selectedUserId}/reset-password`, {method:'POST'}); showToast('Password reset email sent.'); }
    catch (err) { showToast(err.message,'error'); }
  });
  document.getElementById('btnDeactivate')?.addEventListener('click', async () => {
    if (!selectedUserId) return;
    const u = allUsers.find(u=>u.id==selectedUserId);
    try { await adminApi(`/users/${selectedUserId}/toggle-active`, {method:'PATCH'}); showToast(u?.is_active?'User deactivated.':'User activated.'); document.getElementById('userModal').classList.remove('show'); loadUsers(); }
    catch (err) { showToast(err.message,'error'); }
  });
  document.getElementById('btnDeleteUser')?.addEventListener('click', () => deleteUser(selectedUserId, true));

  const deleteUser = async (id, fromModal=false) => {
    if (!confirm('Delete this user permanently?')) return;
    try { await adminApi(`/users/${id}`, {method:'DELETE'}); showToast('User deleted.'); if(fromModal) document.getElementById('userModal').classList.remove('show'); loadUsers(); }
    catch (err) { showToast(err.message,'error'); }
  };

  document.getElementById('searchInput')?.addEventListener('input', e => { searchQ = e.target.value; page = 1; loadUsers(); });
  document.getElementById('filterLevel')?.addEventListener('change', e => { filterLevel = e.target.value; page = 1; loadUsers(); });
  document.getElementById('filterStatus')?.addEventListener('change', e => { filterStatus = e.target.value; page = 1; loadUsers(); });

  loadUsers();
});