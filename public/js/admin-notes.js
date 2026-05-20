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
  let page=1, perPage=15, searchQ='', filterSubject='', filterType='';

  const loadNotes = async () => {
    try {
      const params = new URLSearchParams({page, limit:perPage, search:searchQ, subject:filterSubject, type:filterType});
      const data   = await adminApi(`/notes?${params}`);
      if (!data) return;
      const notes  = data.notes || data;
      document.getElementById('noteCount').textContent = `${data.total ?? notes.length} notes`;
      const tbody  = document.getElementById('notesTbody');
      if (!notes.length) { tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-light);">No notes found.</td></tr>'; return; }
      tbody.innerHTML = notes.map(n => {
        const tags = Array.isArray(n.tags)?n.tags:(n.tags||'').split(',').filter(Boolean);
        return `<tr>
          <td style="font-weight:500;">${escapeHTML(n.title)}</td>
          <td>${escapeHTML(n.subject)}</td>
          <td><span class="badge badge-purple">${n.type||'—'}</span></td>
          <td style="font-size:12px;color:var(--text-light);">${tags.slice(0,3).map(t=>`<span class="badge" style="background:var(--primary-pale);color:var(--primary);margin-right:3px;">${escapeHTML(t)}</span>`).join('')}</td>
          <td style="font-size:12px;color:var(--text-light);">${formatDate(n.created_at)}</td>
          <td><div class="action-btns">
            <button class="action-btn edit-btn" data-id="${n.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="action-btn danger delete-btn" data-id="${n.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div></td>
        </tr>`;}).join('');
      document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.id, notes)));
      document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deleteNote(btn.dataset.id)));
      document.getElementById('tableInfo').textContent = `${notes.length} notes`;
    } catch(err) { showToast(err.message,'error'); }
  };

  const openModal = (id=null, notes=[]) => {
    document.getElementById('noteModalTitle').textContent = id ? 'Edit Note' : 'New Note';
    document.getElementById('noteId').value = id || '';
    if (id) {
      const n = notes.find(n=>n.id==id);
      if (n) {
        document.getElementById('noteTitle').value   = n.title;
        document.getElementById('noteSubject').value = n.subject;
        document.getElementById('noteType').value    = n.type;
        document.getElementById('noteContent').value = n.content;
        const tags = Array.isArray(n.tags)?n.tags.join(', '):(n.tags||'');
        document.getElementById('noteTags').value    = tags;
      }
    } else { document.getElementById('noteForm').reset(); }
    document.getElementById('noteModal').classList.add('show');
  };

  const deleteNote = async (id) => {
    if (!confirm('Delete this note?')) return;
    try { await adminApi(`/notes/${id}`, {method:'DELETE'}); showToast('Note deleted.'); loadNotes(); }
    catch(err) { showToast(err.message,'error'); }
  };

  document.getElementById('btnAddNote')?.addEventListener('click', () => openModal());
  document.getElementById('noteModalClose')?.addEventListener('click', () => document.getElementById('noteModal').classList.remove('show'));
  document.getElementById('noteBtnCancel')?.addEventListener('click', () => document.getElementById('noteModal').classList.remove('show'));

  document.getElementById('noteForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id  = document.getElementById('noteId').value;
    const btn = document.getElementById('noteBtnSave');
    btn.disabled=true; btn.classList.add('loading');
    const rawTags = document.getElementById('noteTags').value;
    const payload = {
      title:   document.getElementById('noteTitle').value.trim(),
      subject: document.getElementById('noteSubject').value,
      type:    document.getElementById('noteType').value,
      content: document.getElementById('noteContent').value.trim(),
      tags:    rawTags.split(',').map(t=>t.trim()).filter(Boolean),
    };
    try {
      if (id) { await adminApi(`/notes/${id}`, {method:'PUT', body:JSON.stringify(payload)}); showToast('Note updated.'); }
      else    { await adminApi('/notes', {method:'POST', body:JSON.stringify(payload)}); showToast('Note created!'); }
      document.getElementById('noteModal').classList.remove('show');
      loadNotes();
    } catch(err) { showToast(err.message,'error'); }
    finally { btn.disabled=false; btn.classList.remove('loading'); }
  });

  document.getElementById('searchInput')?.addEventListener('input',    e => { searchQ=e.target.value; page=1; loadNotes(); });
  document.getElementById('filterSubject')?.addEventListener('change', e => { filterSubject=e.target.value; page=1; loadNotes(); });
  document.getElementById('filterType')?.addEventListener('change',    e => { filterType=e.target.value; page=1; loadNotes(); });
  loadNotes();
});