/* ─────────────────────────────────────────────
   StudySync — reminders.js
   Full CRUD reminders. Real API. No mock data.
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

  const formatTime12 = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
  };

  const typeMeta = (type) => ({
    prayer: { icon: 'fa-hands-praying', bg: '#F0FDF4', color: '#16A34A', badgeCls: 'type-prayer' },
    study:  { icon: 'fa-book-open',     bg: 'var(--primary-pale)', color: 'var(--primary)', badgeCls: 'type-study' },
    school: { icon: 'fa-school',        bg: '#FFF5E0', color: '#D97706', badgeCls: 'type-school' },
    custom: { icon: 'fa-star',          bg: 'var(--accent-pale)', color: 'var(--accent)', badgeCls: 'type-custom' },
  }[type] || { icon: 'fa-bell', bg: 'var(--primary-pale)', color: 'var(--primary)', badgeCls: 'type-custom' });

  const repeatLabel = (r) => ({
    daily:    'Every day',
    weekdays: 'Weekdays',
    weekends: 'Weekends',
    once:     'Once',
  }[r] || r);

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
  let allReminders = [];
  let activeType   = 'all';
  let editingId    = null;
  let deletingId   = null;
  let selectedRepeat = 'daily';

  /* ══════════════════════════════
     LOAD REMINDERS
  ══════════════════════════════ */
  const loadReminders = async () => {
    renderSkeletons();
    try {
      const data = await api('/reminders');
      if (!data) return;
      allReminders = data.reminders || data;
      updateSubtitle();
      applyFilter();
      renderTodaySchedule();
    } catch {
      document.getElementById('reminderList').innerHTML =
        `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Could not load reminders.</p></div>`;
    }
  };

  /* ══════════════════════════════
     SUBTITLE
  ══════════════════════════════ */
  const updateSubtitle = () => {
    const total  = allReminders.length;
    const active = allReminders.filter(r => r.active !== false).length;
    document.getElementById('reminderSubtitle').textContent =
      `${total} reminder${total !== 1 ? 's' : ''} · ${active} active`;
  };

  /* ══════════════════════════════
     FILTER
  ══════════════════════════════ */
  const applyFilter = () => {
    const filtered = activeType === 'all'
      ? allReminders
      : allReminders.filter(r => r.type === activeType);

    // Sort by time
    filtered.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    renderReminders(filtered);
  };

  /* ══════════════════════════════
     RENDER SKELETONS
  ══════════════════════════════ */
  const renderSkeletons = () => {
    document.getElementById('reminderList').innerHTML = Array(4).fill(`
      <div class="reminder-card" style="pointer-events:none;">
        <div class="skeleton" style="width:44px;height:44px;border-radius:12px;flex-shrink:0;"></div>
        <div style="flex:1;">
          <div class="skeleton" style="height:14px;width:50%;margin-bottom:7px;"></div>
          <div class="skeleton" style="height:11px;width:35%;"></div>
        </div>
      </div>`).join('');
  };

  /* ══════════════════════════════
     RENDER REMINDERS
  ══════════════════════════════ */
  const renderReminders = (reminders) => {
    const list = document.getElementById('reminderList');

    if (!reminders.length) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-bell-slash"></i>
          <p>${activeType === 'all' ? 'No reminders yet.' : `No ${activeType} reminders.`}</p>
          <button class="btn-empty" id="emptyAddBtn"><i class="fa-solid fa-plus"></i> Add Reminder</button>
        </div>`;
      document.getElementById('emptyAddBtn')?.addEventListener('click', () => openModal());
      return;
    }

    list.innerHTML = reminders.map(r => {
      const tm       = typeMeta(r.type);
      const isActive = r.active !== false;
      return `
        <div class="reminder-card ${isActive ? '' : 'inactive'}" data-id="${r.id}">
          <div class="reminder-type-icon" style="background:${tm.bg};color:${tm.color};">
            <i class="fa-solid ${tm.icon}" aria-hidden="true"></i>
          </div>

          <div class="reminder-info">
            <div class="reminder-title">${escapeHTML(r.title)}</div>
            <div class="reminder-meta">
              <span class="reminder-meta-item">
                <i class="fa-regular fa-clock"></i> ${formatTime12(r.time)}
              </span>
              <span class="reminder-meta-item">
                <i class="fa-solid fa-rotate"></i> ${repeatLabel(r.repeat)}
              </span>
              ${r.note ? `<span class="reminder-meta-item"><i class="fa-solid fa-note-sticky"></i> ${escapeHTML(r.note)}</span>` : ''}
            </div>
          </div>

          <span class="reminder-type-badge ${tm.badgeCls}">${r.type}</span>

          <div class="toggle-wrap">
            <label class="toggle" aria-label="Toggle reminder ${escapeHTML(r.title)}">
              <input type="checkbox" class="toggle-input" data-id="${r.id}" ${isActive ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="reminder-actions">
            <button class="reminder-action-btn edit-btn" data-id="${r.id}" aria-label="Edit reminder" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="reminder-action-btn delete delete-btn" data-id="${r.id}" aria-label="Delete reminder" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>`;
    }).join('');

    // Toggle active
    list.querySelectorAll('.toggle-input').forEach(toggle => {
      toggle.addEventListener('change', () => toggleActive(toggle.dataset.id, toggle.checked));
    });

    // Edit
    list.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    // Delete
    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
    });
  };

  /* ══════════════════════════════
     TODAY'S SCHEDULE
  ══════════════════════════════ */
  const renderTodaySchedule = () => {
    const container = document.getElementById('todaySchedule');
    const today     = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const dayName   = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const todayReminders = allReminders.filter(r => {
      if (r.active === false) return false;
      if (r.repeat === 'daily')    return true;
      if (r.repeat === 'weekdays') return !['saturday','sunday'].includes(dayName);
      if (r.repeat === 'weekends') return ['saturday','sunday'].includes(dayName);
      if (r.repeat === 'once')     return r.date === today;
      return false;
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    if (!todayReminders.length) {
      container.innerHTML = `<p style="font-size:13px;color:var(--text-light);text-align:center;padding:8px 0;">No reminders for today.</p>`;
      return;
    }

    const lineColors = { prayer: '#16A34A', study: 'var(--primary)', school: '#D97706', custom: 'var(--accent)' };

    container.innerHTML = todayReminders.map(r => `
      <div class="schedule-item">
        <span class="schedule-time">${formatTime12(r.time)}</span>
        <div class="schedule-line" style="background:${lineColors[r.type] || 'var(--primary)'};" aria-hidden="true"></div>
        <span class="schedule-label">${escapeHTML(r.title)}</span>
      </div>`).join('');
  };

  /* ══════════════════════════════
     TOGGLE ACTIVE
  ══════════════════════════════ */
  const toggleActive = async (id, active) => {
    // Optimistic
    allReminders = allReminders.map(r => r.id == id ? { ...r, active } : r);
    updateSubtitle();

    try {
      await api(`/reminders/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) });
      showToast(active ? 'Reminder enabled.' : 'Reminder disabled.');
    } catch {
      // Revert
      allReminders = allReminders.map(r => r.id == id ? { ...r, active: !active } : r);
      applyFilter();
      showToast('Failed to update reminder.', 'error');
    }
  };

  /* ══════════════════════════════
     TYPE FILTER PILLS
  ══════════════════════════════ */
  document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.type-pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');
      activeType = pill.dataset.type;
      applyFilter();
    });
  });

  /* ══════════════════════════════
     MODAL
  ══════════════════════════════ */
  const reminderModal = document.getElementById('reminderModal');
  const reminderForm  = document.getElementById('reminderForm');
  const modalTitle    = document.getElementById('reminderModalTitle');
  const btnSave       = document.getElementById('btnSave');

  const setSelectedRepeat = (val) => {
    selectedRepeat = val;
    document.querySelectorAll('.repeat-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.repeat === val);
    });
    // Show date picker only for "once"
    document.getElementById('dateGroup').style.display = val === 'once' ? 'block' : 'none';
  };

  document.querySelectorAll('.repeat-btn').forEach(btn => {
    btn.addEventListener('click', () => setSelectedRepeat(btn.dataset.repeat));
  });

  const openModal = (presetType = 'study') => {
    editingId = null;
    modalTitle.textContent = 'New Reminder';
    reminderForm.reset();
    document.getElementById('reminderId').value = '';
    document.getElementById('reminderType').value = presetType;
    document.getElementById('titleError').textContent = '';
    document.getElementById('timeError').textContent  = '';
    setSelectedRepeat('daily');
    btnSave.querySelector('.btn-label').textContent = 'Save Reminder';
    reminderModal.classList.add('show');
    setTimeout(() => document.getElementById('reminderTitle').focus(), 100);
  };

  const openEditModal = (id) => {
    const r = allReminders.find(r => r.id == id);
    if (!r) return;
    editingId = id;
    modalTitle.textContent = 'Edit Reminder';
    document.getElementById('reminderId').value    = r.id;
    document.getElementById('reminderTitle').value = r.title  || '';
    document.getElementById('reminderType').value  = r.type   || 'custom';
    document.getElementById('reminderTime').value  = r.time   || '';
    document.getElementById('reminderNote').value  = r.note   || '';
    document.getElementById('reminderDate').value  = r.date   || '';
    document.getElementById('titleError').textContent = '';
    document.getElementById('timeError').textContent  = '';
    setSelectedRepeat(r.repeat || 'daily');
    btnSave.querySelector('.btn-label').textContent = 'Update Reminder';
    reminderModal.classList.add('show');
    setTimeout(() => document.getElementById('reminderTitle').focus(), 100);
  };

  const closeModal = () => {
    reminderModal.classList.remove('show');
    editingId = null;
  };

  document.getElementById('fabAdd').addEventListener('click', () => openModal());
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('btnCancel').addEventListener('click', closeModal);
  reminderModal.addEventListener('click', e => { if (e.target === reminderModal) closeModal(); });

  // Quick add buttons
  document.querySelectorAll('.quick-type-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.preset));
  });

  /* ── Form submit ── */
  reminderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('reminderTitle').value.trim();
    const time  = document.getElementById('reminderTime').value;
    let valid   = true;

    const titleErr = document.getElementById('titleError');
    const timeErr  = document.getElementById('timeError');
    titleErr.textContent = '';
    timeErr.textContent  = '';

    if (!title) {
      titleErr.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Title is required.';
      valid = false;
    }
    if (!time) {
      timeErr.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Time is required.';
      valid = false;
    }
    if (!valid) return;

    const payload = {
      title,
      type:   document.getElementById('reminderType').value,
      time,
      repeat: selectedRepeat,
      date:   selectedRepeat === 'once' ? (document.getElementById('reminderDate').value || null) : null,
      note:   document.getElementById('reminderNote').value.trim() || null,
      active: true,
    };

    btnSave.disabled = true;
    btnSave.classList.add('loading');

    try {
      if (editingId) {
        const data = await api(`/reminders/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (!data) return;
        allReminders = allReminders.map(r => r.id == editingId ? { ...r, ...payload, id: editingId } : r);
        showToast('Reminder updated.');
      } else {
        const data = await api('/reminders', { method: 'POST', body: JSON.stringify(payload) });
        if (!data) return;
        allReminders.unshift(data.reminder || data);
        showToast('Reminder added!');
      }
      updateSubtitle();
      applyFilter();
      renderTodaySchedule();
      closeModal();
    } catch (err) {
      showToast(err.message || 'Failed to save reminder.', 'error');
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
    const r = allReminders.find(r => r.id == id);
    document.getElementById('deleteModalText').textContent =
      `Are you sure you want to delete "${r?.title || 'this reminder'}"?`;
    deleteModal.classList.add('show');
  };

  const closeDeleteModal = () => {
    deleteModal.classList.remove('show');
    deletingId = null;
  };

  document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

  document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
    if (!deletingId) return;
    const id      = deletingId;
    const removed = allReminders.find(r => r.id == id);
    closeDeleteModal();

    // Optimistic
    allReminders = allReminders.filter(r => r.id != id);
    updateSubtitle();
    applyFilter();
    renderTodaySchedule();

    try {
      await api(`/reminders/${id}`, { method: 'DELETE' });
      showToast('Reminder deleted.');
    } catch {
      if (removed) allReminders.push(removed);
      updateSubtitle();
      applyFilter();
      renderTodaySchedule();
      showToast('Failed to delete reminder.', 'error');
    }
  });

  /* ══════════════════════════════
     KEYBOARD: Escape closes modals
  ══════════════════════════════ */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (reminderModal.classList.contains('show')) closeModal();
      if (deleteModal.classList.contains('show'))   closeDeleteModal();
    }
  });

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  loadReminders();

});