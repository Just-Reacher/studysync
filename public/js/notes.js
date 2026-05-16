/* ─────────────────────────────────────────────
   StudySync — notes.js
   Full CRUD notes. Search, bookmark, subject
   filter, grid/list toggle. Real API.
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
      },
      ...options,
    });
    if (res.status === 401) { logout(); return null; }
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || `Error ${res.status}`);
    }
    return res.json();
  };

  /* ══════════════════════════════
     LOGOUT
  ══════════════════════════════ */
  const logout = () => {
    ['ss_token', 'ss_user'].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    window.location.href = 'login.html';
  };
  document.getElementById('logoutBtn').addEventListener('click', logout);

  /* ══════════════════════════════
     SIDEBAR TOGGLE
  ══════════════════════════════ */
  const sidebar        = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const menuToggle     = document.getElementById('menuToggle');
  menuToggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
  });

  /* ══════════════════════════════
     SIDEBAR USER
  ══════════════════════════════ */
  document.getElementById('sidebarUserName').textContent = user.name || 'Student';
  const avatarEl = document.getElementById('sidebarAvatar');
  if (user.avatar) {
    avatarEl.innerHTML = `<img src="${user.avatar}" alt="${user.name}" />`;
  } else {
    avatarEl.textContent = (user.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  /* ══════════════════════════════
     HELPERS
  ══════════════════════════════ */
  const escapeHTML = str => {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  };

  const subjectMeta = s => ({
    'Mathematics':        { icon: 'fa-square-root-variable', bg: '#EEF2FF', color: '#4F46E5' },
    'English':            { icon: 'fa-book',                  bg: '#F0FDF4', color: '#16A34A' },
    'ICT':                { icon: 'fa-laptop-code',           bg: '#FFF7ED', color: '#EA580C' },
    'Integrated Science': { icon: 'fa-flask',                 bg: '#FDF4FF', color: '#C026D3' },
    'Social Studies':     { icon: 'fa-globe',                 bg: '#FFF1F2', color: '#E11D48' },
    'Elective':           { icon: 'fa-star',                  bg: 'var(--accent-pale)', color: 'var(--accent)' },
  }[s] || { icon: 'fa-book-open', bg: 'var(--primary-pale)', color: 'var(--primary)' });

  const typeLabel = t => ({
    summary:     'Summary',
    formula:     'Formulas',
    definition:  'Definitions',
    'key-points':'Key Points',
  }[t] || t);

  const formatDate = iso => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  /* ══════════════════════════════
     TOAST
  ══════════════════════════════ */
  let toastTimer;
  const showToast = (msg, type = 'success') => {
    const toast = document.getElementById('toast');
    toast.className = `toast show ${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check' : 'fa-circle-exclamation'}"></i> ${msg}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  };

  /* ══════════════════════════════
     STATE
  ══════════════════════════════ */
  let allNotes       = [];
  let activeSubject  = 'all';
  let activeType     = '';
  let activeBookmark = '';
  let searchQuery    = '';
  let viewMode       = 'grid'; // 'grid' | 'list'
  let editingId      = null;
  let deletingId     = null;

  /* ══════════════════════════════
     LOAD NOTES
  ══════════════════════════════ */
  const loadNotes = async () => {
    renderSkeletons();
    try {
      const data = await api('/notes');
      if (!data) return;
      allNotes = data.notes || data;
      buildSubjectTabs();
      updateSubtitle();
      applyFilters();
    } catch {
      document.getElementById('notesGrid').innerHTML =
        `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Could not load notes.</p></div>`;
    }
  };

  /* ══════════════════════════════
     SUBTITLE
  ══════════════════════════════ */
  const updateSubtitle = () => {
    const total      = allNotes.length;
    const bookmarked = allNotes.filter(n => n.bookmarked).length;
    document.getElementById('notesSubtitle').textContent =
      `${total} note${total !== 1 ? 's' : ''} · ${bookmarked} bookmarked`;
  };

  /* ══════════════════════════════
     BUILD SUBJECT TABS
  ══════════════════════════════ */
  const SUBJECTS = ['Mathematics', 'English', 'ICT', 'Integrated Science', 'Social Studies', 'Elective'];

  const buildSubjectTabs = () => {
    const tabsEl = document.getElementById('subjectTabs');
    const subjects = ['all', ...SUBJECTS.filter(s => allNotes.some(n => n.subject === s))];

    tabsEl.innerHTML = subjects.map(s => {
      const sm    = s === 'all' ? { icon: 'fa-layer-group', bg: '', color: '' } : subjectMeta(s);
      const count = s === 'all' ? allNotes.length : allNotes.filter(n => n.subject === s).length;
      const label = s === 'all' ? 'All' : s;
      const isActive = activeSubject === s;

      const style = isActive && s !== 'all'
        ? `background:${sm.bg};color:${sm.color};border-color:transparent;`
        : isActive
          ? `background:var(--primary);color:#fff;border-color:transparent;`
          : '';

      return `<button class="subject-tab ${isActive ? 'active' : ''}" data-subject="${s}"
        style="${style}" role="tab" aria-selected="${isActive}">
        <i class="fa-solid ${sm.icon}"></i> ${label} (${count})
      </button>`;
    }).join('');

    tabsEl.querySelectorAll('.subject-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeSubject = tab.dataset.subject;
        buildSubjectTabs();
        applyFilters();
      });
    });
  };

  /* ══════════════════════════════
     APPLY FILTERS
  ══════════════════════════════ */
  const applyFilters = () => {
    let filtered = allNotes.filter(n => {
      if (activeSubject !== 'all' && n.subject !== activeSubject) return false;
      if (activeType     && n.type !== activeType)               return false;
      if (activeBookmark && !n.bookmarked)                       return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle   = (n.title   || '').toLowerCase().includes(q);
        const inContent = (n.content || '').toLowerCase().includes(q);
        const inTags    = (n.tags    || []).some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inContent && !inTags) return false;
      }
      return true;
    });

    // Sort: bookmarked first, then newest
    filtered.sort((a, b) => {
      if (a.bookmarked && !b.bookmarked) return -1;
      if (!a.bookmarked && b.bookmarked) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    renderNotes(filtered);
  };

  /* ══════════════════════════════
     RENDER SKELETONS
  ══════════════════════════════ */
  const renderSkeletons = () => {
    const grid = document.getElementById('notesGrid');
    grid.className = 'notes-grid';
    grid.innerHTML = Array(6).fill(`
      <div class="note-card" style="pointer-events:none;">
        <div class="skeleton" style="width:40px;height:40px;border-radius:10px;"></div>
        <div class="skeleton" style="height:15px;width:65%;"></div>
        <div class="skeleton" style="height:12px;width:100%;"></div>
        <div class="skeleton" style="height:12px;width:80%;"></div>
      </div>`).join('');
  };

  /* ══════════════════════════════
     RENDER NOTES
  ══════════════════════════════ */
  const renderNotes = (notes) => {
    const grid = document.getElementById('notesGrid');
    grid.className = viewMode === 'grid' ? 'notes-grid' : 'notes-list';

    if (!notes.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-book-open"></i>
          <p>${searchQuery || activeSubject !== 'all' ? 'No notes match your filters.' : 'No notes yet.'}</p>
          ${!searchQuery && activeSubject === 'all'
            ? `<button class="btn-empty" id="emptyAddBtn"><i class="fa-solid fa-plus"></i> Add your first note</button>`
            : ''}
        </div>`;
      document.getElementById('emptyAddBtn')?.addEventListener('click', openAddModal);
      return;
    }

    if (viewMode === 'grid') {
      grid.innerHTML = notes.map(n => buildGridCard(n)).join('');
    } else {
      grid.innerHTML = notes.map(n => buildListRow(n)).join('');
    }

    bindNoteEvents();
  };

  /* ── Grid card ── */
  const buildGridCard = (n) => {
    const sm      = subjectMeta(n.subject);
    const tags    = Array.isArray(n.tags) ? n.tags : (n.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const preview = (n.content || '').replace(/\n/g, ' ').slice(0, 140);

    return `
      <div class="note-card" data-id="${n.id}" role="button" tabindex="0" aria-label="Open note: ${escapeHTML(n.title)}">
        <div class="note-card-top">
          <div class="note-subj-icon" style="background:${sm.bg};color:${sm.color};">
            <i class="fa-solid ${sm.icon}" aria-hidden="true"></i>
          </div>
          <div class="note-card-actions">
            <button class="note-action-btn bookmark ${n.bookmarked ? 'bookmarked' : ''}"
              data-id="${n.id}" aria-label="${n.bookmarked ? 'Remove bookmark' : 'Bookmark note'}" title="Bookmark">
              <i class="fa-${n.bookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
            </button>
            <button class="note-action-btn edit-btn" data-id="${n.id}" aria-label="Edit note" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="note-action-btn delete delete-btn" data-id="${n.id}" aria-label="Delete note" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        <div>
          <div class="note-title">${escapeHTML(n.title)}</div>
          <div class="note-subject-label">${escapeHTML(n.subject)} · ${typeLabel(n.type)}</div>
        </div>
        <p class="note-preview">${escapeHTML(preview)}${(n.content || '').length > 140 ? '…' : ''}</p>
        ${tags.length ? `<div class="note-tags">${tags.map(t => `<span class="note-tag">${escapeHTML(t)}</span>`).join('')}</div>` : ''}
        <div class="note-footer">
          <span class="note-date">${formatDate(n.createdAt || n.updatedAt)}</span>
          <button class="note-expand-btn view-btn" data-id="${n.id}">Read more →</button>
        </div>
      </div>`;
  };

  /* ── List row ── */
  const buildListRow = (n) => {
    const sm   = subjectMeta(n.subject);
    const tags = Array.isArray(n.tags) ? n.tags : (n.tags || '').split(',').map(t => t.trim()).filter(Boolean);

    return `
      <div class="note-row" data-id="${n.id}" role="button" tabindex="0" aria-label="Open note: ${escapeHTML(n.title)}">
        <div class="note-row-icon" style="background:${sm.bg};color:${sm.color};">
          <i class="fa-solid ${sm.icon}" aria-hidden="true"></i>
        </div>
        <div class="note-row-info">
          <div class="note-row-title">${escapeHTML(n.title)}</div>
          <div class="note-row-meta">${escapeHTML(n.subject)} · ${typeLabel(n.type)} · ${formatDate(n.createdAt || n.updatedAt)}
            ${tags.length ? ` · ${tags.slice(0,3).map(t => escapeHTML(t)).join(', ')}` : ''}
          </div>
        </div>
        <div class="note-row-actions">
          <button class="note-action-btn bookmark ${n.bookmarked ? 'bookmarked' : ''}"
            data-id="${n.id}" aria-label="${n.bookmarked ? 'Remove bookmark' : 'Bookmark'}" title="Bookmark">
            <i class="fa-${n.bookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
          </button>
          <button class="note-action-btn edit-btn" data-id="${n.id}" aria-label="Edit" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="note-action-btn delete delete-btn" data-id="${n.id}" aria-label="Delete" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>`;
  };

  /* ── Bind note events ── */
  const bindNoteEvents = () => {
    const container = document.getElementById('notesGrid');

    // Open view modal on card/row click
    container.querySelectorAll('.note-card, .note-row').forEach(el => {
      const openView = (e) => {
        if (e.target.closest('button')) return; // don't open if clicking a button
        openViewModal(el.dataset.id);
      };
      el.addEventListener('click', openView);
      el.addEventListener('keydown', e => { if (e.key === 'Enter') openView(e); });
    });

    // View more buttons
    container.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openViewModal(btn.dataset.id); });
    });

    // Bookmark
    container.querySelectorAll('.bookmark').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); toggleBookmark(btn.dataset.id); });
    });

    // Edit
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openEditModal(btn.dataset.id); });
    });

    // Delete
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openDeleteModal(btn.dataset.id); });
    });
  };

  /* ══════════════════════════════
     VIEW MODAL
  ══════════════════════════════ */
  const viewModal = document.getElementById('viewModal');

  const openViewModal = (id) => {
    const n  = allNotes.find(n => n.id == id);
    if (!n) return;
    const sm = subjectMeta(n.subject);
    const tags = Array.isArray(n.tags) ? n.tags : (n.tags || '').split(',').map(t => t.trim()).filter(Boolean);

    document.getElementById('viewNoteIcon').style.cssText    = `background:${sm.bg};color:${sm.color};`;
    document.getElementById('viewNoteIcon').innerHTML        = `<i class="fa-solid ${sm.icon}"></i>`;
    document.getElementById('viewNoteTitle').textContent     = n.title;
    document.getElementById('viewNoteSubject').textContent   = `${n.subject} · ${typeLabel(n.type)}`;
    document.getElementById('viewNoteContent').textContent   = n.content || '';
    document.getElementById('viewNoteTags').innerHTML        = tags.map(t =>
      `<span class="note-tag">${escapeHTML(t)}</span>`).join('');

    viewModal.classList.add('show');
  };

  document.getElementById('viewModalClose').addEventListener('click', () => viewModal.classList.remove('show'));
  viewModal.addEventListener('click', e => { if (e.target === viewModal) viewModal.classList.remove('show'); });

  /* ══════════════════════════════
     BOOKMARK TOGGLE
  ══════════════════════════════ */
  const toggleBookmark = async (id) => {
    const note    = allNotes.find(n => n.id == id);
    if (!note) return;
    const newVal  = !note.bookmarked;

    // Optimistic
    allNotes = allNotes.map(n => n.id == id ? { ...n, bookmarked: newVal } : n);
    updateSubtitle();
    applyFilters();

    try {
      await api(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify({ bookmarked: newVal }) });
      showToast(newVal ? 'Note bookmarked.' : 'Bookmark removed.');
    } catch {
      allNotes = allNotes.map(n => n.id == id ? { ...n, bookmarked: !newVal } : n);
      updateSubtitle();
      applyFilters();
      showToast('Failed to update bookmark.', 'error');
    }
  };

  /* ══════════════════════════════
     ADD / EDIT MODAL
  ══════════════════════════════ */
  const editModal  = document.getElementById('editModal');
  const noteForm   = document.getElementById('noteForm');
  const editTitle  = document.getElementById('editModalTitle');
  const btnSave    = document.getElementById('editBtnSave');

  const openAddModal = () => {
    editingId = null;
    editTitle.textContent = 'New Note';
    noteForm.reset();
    document.getElementById('noteId').value = '';
    document.getElementById('titleError').textContent   = '';
    document.getElementById('contentError').textContent = '';
    btnSave.querySelector('.btn-label').textContent = 'Save Note';
    editModal.classList.add('show');
    setTimeout(() => document.getElementById('noteTitle').focus(), 100);
  };

  const openEditModal = (id) => {
    const n = allNotes.find(n => n.id == id);
    if (!n) return;
    editingId = id;
    editTitle.textContent = 'Edit Note';
    document.getElementById('noteId').value      = n.id;
    document.getElementById('noteTitle').value   = n.title   || '';
    document.getElementById('noteSubject').value = n.subject || 'Mathematics';
    document.getElementById('noteType').value    = n.type    || 'summary';
    document.getElementById('noteContent').value = n.content || '';
    const tags = Array.isArray(n.tags) ? n.tags.join(', ') : (n.tags || '');
    document.getElementById('noteTags').value    = tags;
    document.getElementById('titleError').textContent   = '';
    document.getElementById('contentError').textContent = '';
    btnSave.querySelector('.btn-label').textContent = 'Update Note';
    editModal.classList.add('show');
    setTimeout(() => document.getElementById('noteTitle').focus(), 100);
  };

  const closeEditModal = () => {
    editModal.classList.remove('show');
    editingId = null;
  };

  document.getElementById('fabAdd').addEventListener('click', openAddModal);
  document.getElementById('editModalClose').addEventListener('click', closeEditModal);
  document.getElementById('editBtnCancel').addEventListener('click', closeEditModal);
  editModal.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });

  noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    const title   = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const titleErr   = document.getElementById('titleError');
    const contentErr = document.getElementById('contentError');
    titleErr.textContent   = '';
    contentErr.textContent = '';

    if (!title)   { titleErr.innerHTML   = '<i class="fa-solid fa-circle-exclamation"></i> Title is required.'; valid = false; }
    if (!content) { contentErr.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Content is required.'; valid = false; }
    if (!valid) return;

    const rawTags = document.getElementById('noteTags').value;
    const tags    = rawTags.split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
      title,
      subject: document.getElementById('noteSubject').value,
      type:    document.getElementById('noteType').value,
      content,
      tags,
    };

    btnSave.disabled = true;
    btnSave.classList.add('loading');

    try {
      if (editingId) {
        const data = await api(`/notes/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (!data) return;
        allNotes = allNotes.map(n => n.id == editingId ? { ...n, ...payload, id: editingId } : n);
        showToast('Note updated.');
      } else {
        const data = await api('/notes', { method: 'POST', body: JSON.stringify(payload) });
        if (!data) return;
        allNotes.unshift(data.note || data);
        showToast('Note saved!');
      }
      buildSubjectTabs();
      updateSubtitle();
      applyFilters();
      closeEditModal();
    } catch (err) {
      showToast(err.message || 'Failed to save note.', 'error');
    } finally {
      btnSave.disabled = false;
      btnSave.classList.remove('loading');
    }
  });

  /* ══════════════════════════════
     DELETE MODAL
  ══════════════════════════════ */
  const deleteModal = document.getElementById('deleteModal');

  const openDeleteModal = (id) => {
    deletingId = id;
    const n = allNotes.find(n => n.id == id);
    document.getElementById('deleteModalText').textContent =
      `Are you sure you want to delete "${n?.title || 'this note'}"? This cannot be undone.`;
    deleteModal.classList.add('show');
  };

  const closeDeleteModal = () => { deleteModal.classList.remove('show'); deletingId = null; };

  document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

  document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
    if (!deletingId) return;
    const id      = deletingId;
    const removed = allNotes.find(n => n.id == id);
    closeDeleteModal();

    allNotes = allNotes.filter(n => n.id != id);
    buildSubjectTabs();
    updateSubtitle();
    applyFilters();

    try {
      await api(`/notes/${id}`, { method: 'DELETE' });
      showToast('Note deleted.');
    } catch {
      if (removed) allNotes.unshift(removed);
      buildSubjectTabs();
      updateSubtitle();
      applyFilters();
      showToast('Failed to delete note.', 'error');
    }
  });

  /* ══════════════════════════════
     VIEW TOGGLE (grid / list)
  ══════════════════════════════ */
  document.getElementById('viewGrid').addEventListener('click', () => {
    viewMode = 'grid';
    document.getElementById('viewGrid').classList.add('active');
    document.getElementById('viewList').classList.remove('active');
    applyFilters();
  });

  document.getElementById('viewList').addEventListener('click', () => {
    viewMode = 'list';
    document.getElementById('viewList').classList.add('active');
    document.getElementById('viewGrid').classList.remove('active');
    applyFilters();
  });

  /* ══════════════════════════════
     FILTER EVENTS
  ══════════════════════════════ */
  document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    applyFilters();
  });

  document.getElementById('filterType').addEventListener('change', e => {
    activeType = e.target.value;
    applyFilters();
  });

  document.getElementById('filterBookmark').addEventListener('change', e => {
    activeBookmark = e.target.value;
    applyFilters();
  });

  /* ══════════════════════════════
     KEYBOARD: Escape closes modals
  ══════════════════════════════ */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (viewModal.classList.contains('show'))   viewModal.classList.remove('show');
      if (editModal.classList.contains('show'))   closeEditModal();
      if (deleteModal.classList.contains('show')) closeDeleteModal();
    }
  });

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  loadNotes();

});