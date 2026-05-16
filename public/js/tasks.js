/* ─────────────────────────────────────────────
   StudySync — tasks.js
   Full CRUD task management. Real API. No mock data.
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
    menuToggle.setAttribute('aria-expanded', 'false');
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

  const priorityClass = p => ({ high: 'priority-high', medium: 'priority-medium' }[p] || 'priority-low');
  const priorityLabel = p => ({ high: 'High', medium: 'Medium', low: 'Low' }[p] || 'Low');

  const deadlineStatus = (iso) => {
    if (!iso) return null;
    const diff = Math.round((new Date(iso) - new Date()) / 86400000);
    if (diff < 0)  return { label: `Overdue by ${Math.abs(diff)}d`, cls: 'overdue' };
    if (diff === 0) return { label: 'Due today', cls: 'due-today' };
    if (diff === 1) return { label: 'Due tomorrow', cls: '' };
    return { label: `Due in ${diff}d`, cls: '' };
  };

  const formatDatetimeLocal = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  };

  /* ══════════════════════════════
     STATE
  ══════════════════════════════ */
  let allTasks     = [];
  let activeFilter = 'all';
  let filterPriority = '';
  let searchQuery  = '';
  let editingId    = null;
  let deletingId   = null;

  /* ══════════════════════════════
     LOAD TASKS
  ══════════════════════════════ */
  const loadTasks = async () => {
    renderSkeletons();
    try {
      const data = await api('/tasks');
      if (!data) return;
      allTasks = data.tasks || data;
      updateStats();
      applyFilters();
    } catch (err) {
      document.getElementById('taskList').innerHTML =
        `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Could not load tasks.</p></div>`;
      console.error(err);
    }
  };

  /* ══════════════════════════════
     UPDATE STAT CHIPS
  ══════════════════════════════ */
  const updateStats = () => {
    const total    = allTasks.length;
    const done     = allTasks.filter(t => t.completed).length;
    const pending  = total - done;
    const overdue  = allTasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length;

    document.getElementById('statTotal').textContent   = total;
    document.getElementById('statDone').textContent    = done;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statOverdue').textContent = overdue;
    document.getElementById('taskSubtitle').textContent =
      `${pending} pending · ${done} completed · ${overdue} overdue`;
  };

  /* ══════════════════════════════
     FILTER + SEARCH
  ══════════════════════════════ */
  const applyFilters = () => {
    const now = new Date();
    let filtered = allTasks.filter(t => {
      // Status filter
      if (activeFilter === 'pending'   && t.completed) return false;
      if (activeFilter === 'completed' && !t.completed) return false;
      if (activeFilter === 'overdue'   && (t.completed || !t.deadline || new Date(t.deadline) >= now)) return false;

      // Priority filter
      if (filterPriority && t.priority !== filterPriority) return false;

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (t.title || '').toLowerCase().includes(q) ||
                      (t.description || '').toLowerCase().includes(q) ||
                      (t.subject || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });

    // Sort: incomplete first, then by deadline, then priority weight
    const priorityWeight = { high: 0, medium: 1, low: 2 };
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return (priorityWeight[a.priority] ?? 1) - (priorityWeight[b.priority] ?? 1);
    });

    renderTasks(filtered);
  };

  /* ══════════════════════════════
     RENDER TASKS
  ══════════════════════════════ */
  const renderSkeletons = () => {
    const list = document.getElementById('taskList');
    list.innerHTML = Array(4).fill(`
      <div class="task-item" style="pointer-events:none;">
        <div class="skeleton" style="width:20px;height:20px;border-radius:6px;flex-shrink:0;"></div>
        <div style="flex:1;">
          <div class="skeleton" style="height:14px;width:55%;margin-bottom:6px;"></div>
          <div class="skeleton" style="height:11px;width:35%;"></div>
        </div>
      </div>`).join('');
  };

  const renderTasks = (tasks) => {
    const list = document.getElementById('taskList');

    if (!tasks.length) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-list-check"></i>
          <p>${activeFilter === 'all' ? 'No tasks yet.' : `No ${activeFilter} tasks.`}</p>
          ${activeFilter === 'all' ? `<button class="btn-empty" id="emptyAddBtn"><i class="fa-solid fa-plus"></i> Add your first task</button>` : ''}
        </div>`;
      document.getElementById('emptyAddBtn')?.addEventListener('click', openAddModal);
      return;
    }

    list.innerHTML = tasks.map(t => {
      const ds         = deadlineStatus(t.deadline);
      const isOverdue  = ds?.cls === 'overdue';
      const isDueToday = ds?.cls === 'due-today';

      return `
        <div class="task-item ${t.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${isDueToday ? 'due-today' : ''}"
          data-id="${t.id}">

          <div class="task-check ${t.completed ? 'done' : ''}"
            role="checkbox" aria-checked="${t.completed}"
            tabindex="0" aria-label="Mark task as ${t.completed ? 'incomplete' : 'complete'}">
            ${t.completed ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : ''}
          </div>

          <div class="task-info">
            <div class="task-name">${escapeHTML(t.title)}</div>
            <div class="task-meta">
              ${ds ? `<span class="task-meta-item ${ds.cls}"><i class="fa-regular fa-clock"></i> ${ds.label}</span>` : ''}
              ${t.subject ? `<span class="task-meta-item"><i class="fa-solid fa-book"></i> ${escapeHTML(t.subject)}</span>` : ''}
            </div>
          </div>

          <span class="priority-badge ${priorityClass(t.priority)}">${priorityLabel(t.priority)}</span>

          <div class="task-actions">
            <button class="task-action-btn edit-btn" data-id="${t.id}" aria-label="Edit task" title="Edit">
              <i class="fa-solid fa-pen" aria-hidden="true"></i>
            </button>
            <button class="task-action-btn delete delete-btn" data-id="${t.id}" aria-label="Delete task" title="Delete">
              <i class="fa-solid fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>`;
    }).join('');

    // Bind events
    list.querySelectorAll('.task-check').forEach(check => {
      const act = () => {
        const taskEl = check.closest('.task-item');
        const id     = taskEl.dataset.id;
        const done   = check.classList.contains('done');
        toggleComplete(id, !done);
      };
      check.addEventListener('click', act);
      check.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });

    list.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
    });
  };

  /* ══════════════════════════════
     TOGGLE COMPLETE
  ══════════════════════════════ */
  const toggleComplete = async (id, completed) => {
    // Optimistic update
    allTasks = allTasks.map(t => t.id == id ? { ...t, completed } : t);
    updateStats();
    applyFilters();

    try {
      await api(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ completed }) });
      showToast(completed ? 'Task completed! 🎉' : 'Task marked incomplete.');
    } catch (err) {
      // Revert
      allTasks = allTasks.map(t => t.id == id ? { ...t, completed: !completed } : t);
      updateStats();
      applyFilters();
      showToast('Failed to update task.', 'error');
    }
  };

  /* ══════════════════════════════
     ADD / EDIT MODAL
  ══════════════════════════════ */
  const taskModal  = document.getElementById('taskModal');
  const taskForm   = document.getElementById('taskForm');
  const modalTitle = document.getElementById('modalTitle');
  const btnSave    = document.getElementById('btnSave');

  const openAddModal = () => {
    editingId = null;
    modalTitle.textContent = 'New Task';
    taskForm.reset();
    document.getElementById('taskId').value = '';
    document.getElementById('titleError').textContent = '';
    btnSave.querySelector('.btn-label').textContent = 'Save Task';
    taskModal.classList.add('show');
    setTimeout(() => document.getElementById('taskTitle').focus(), 100);
  };

  const openEditModal = (id) => {
    const task = allTasks.find(t => t.id == id);
    if (!task) return;

    editingId = id;
    modalTitle.textContent = 'Edit Task';
    document.getElementById('taskId').value       = task.id;
    document.getElementById('taskTitle').value    = task.title || '';
    document.getElementById('taskDesc').value     = task.description || '';
    document.getElementById('taskDeadline').value = task.deadline ? formatDatetimeLocal(task.deadline) : '';
    document.getElementById('taskPriority').value = task.priority || 'medium';
    document.getElementById('taskSubject').value  = task.subject  || '';
    document.getElementById('titleError').textContent = '';
    btnSave.querySelector('.btn-label').textContent = 'Update Task';
    taskModal.classList.add('show');
    setTimeout(() => document.getElementById('taskTitle').focus(), 100);
  };

  const closeModal = () => {
    taskModal.classList.remove('show');
    editingId = null;
  };

  document.getElementById('fabAdd').addEventListener('click', openAddModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('btnCancel').addEventListener('click', closeModal);
  taskModal.addEventListener('click', e => { if (e.target === taskModal) closeModal(); });

  /* ── Form submit ── */
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const titleErr = document.getElementById('titleError');

    if (!title) {
      titleErr.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Title is required.';
      document.getElementById('taskTitle').focus();
      return;
    }
    titleErr.textContent = '';

    const payload = {
      title,
      description: document.getElementById('taskDesc').value.trim(),
      deadline:    document.getElementById('taskDeadline').value || null,
      priority:    document.getElementById('taskPriority').value,
      subject:     document.getElementById('taskSubject').value || null,
    };

    btnSave.disabled = true;
    btnSave.classList.add('loading');

    try {
      if (editingId) {
        const data = await api(`/tasks/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (!data) return;
        allTasks = allTasks.map(t => t.id == editingId ? { ...t, ...payload } : t);
        showToast('Task updated.');
      } else {
        const data = await api('/tasks', { method: 'POST', body: JSON.stringify(payload) });
        if (!data) return;
        allTasks.unshift(data.task || data);
        showToast('Task added!');
      }

      updateStats();
      applyFilters();
      closeModal();
    } catch (err) {
      showToast(err.message || 'Failed to save task.', 'error');
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
    const task = allTasks.find(t => t.id == id);
    document.getElementById('deleteModalText').textContent =
      `Are you sure you want to delete "${task?.title || 'this task'}"? This cannot be undone.`;
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
    const id = deletingId;
    closeDeleteModal();

    // Optimistic
    const removed = allTasks.find(t => t.id == id);
    allTasks = allTasks.filter(t => t.id != id);
    updateStats();
    applyFilters();

    try {
      await api(`/tasks/${id}`, { method: 'DELETE' });
      showToast('Task deleted.');
    } catch {
      // Revert
      if (removed) allTasks.push(removed);
      updateStats();
      applyFilters();
      showToast('Failed to delete task.', 'error');
    }
  });

  /* ══════════════════════════════
     FILTER TABS
  ══════════════════════════════ */
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeFilter = tab.dataset.filter;
      applyFilters();
    });
  });

  document.getElementById('filterPriority').addEventListener('change', e => {
    filterPriority = e.target.value;
    applyFilters();
  });

  document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    applyFilters();
  });

  /* ══════════════════════════════
     KEYBOARD: close modals on Escape
  ══════════════════════════════ */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (taskModal.classList.contains('show'))   closeModal();
      if (deleteModal.classList.contains('show')) closeDeleteModal();
    }
  });

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  loadTasks();

});