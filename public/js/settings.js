/* ─────────────────────────────────────────────
   StudySync — settings.js
   Profile, password, notifications, appearance,
   danger zone. Real API. No mock data.
───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════
     AUTH GUARD
  ══════════════════════════════ */
  const token   = localStorage.getItem('ss_token')  || sessionStorage.getItem('ss_token');
  const userRaw = localStorage.getItem('ss_user')   || sessionStorage.getItem('ss_user');
  if (!token) { window.location.href = 'login.html'; return; }
  let user = userRaw ? JSON.parse(userRaw) : {};

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
     HELPERS
  ══════════════════════════════ */
  const setLoading = (btn, state) => {
    btn.disabled = state;
    btn.classList.toggle('loading', state);
  };

  const setFieldError = (id, msg) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = msg
      ? `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`
      : '';
  };

  const clearFieldErrors = (...ids) => ids.forEach(id => setFieldError(id, ''));

  /* ══════════════════════════════
     SETTINGS NAV
  ══════════════════════════════ */
  document.querySelectorAll('.settings-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const section = document.getElementById(`section-${item.dataset.section}`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ══════════════════════════════
     LOAD USER PROFILE
  ══════════════════════════════ */
  const loadProfile = async () => {
    try {
      const data = await api('/settings/profile');
      if (!data) return;

      // Merge into local user
      user = { ...user, ...data };
      updateStoredUser(user);
      populateProfileForm(data);
      renderProfileCard(data);
      renderSidebarUser(data);
    } catch {
      // Fall back to stored user data
      populateProfileForm(user);
      renderProfileCard(user);
      renderSidebarUser(user);
    }
  };

  const updateStoredUser = (data) => {
    const storage = localStorage.getItem('ss_user') ? localStorage : sessionStorage;
    storage.setItem('ss_user', JSON.stringify(data));
  };

  const renderProfileCard = (data) => {
    const name  = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Student';
    const email = data.email || '';
    document.getElementById('profileName').textContent  = name;
    document.getElementById('profileEmail').textContent = email;
    renderAvatar(document.getElementById('profileAvatar'), data);
  };

  const renderSidebarUser = (data) => {
    const name = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Student';
    document.getElementById('sidebarUserName').textContent = name;
    renderAvatar(document.getElementById('sidebarAvatar'), data);
  };

  const renderAvatar = (el, data) => {
    if (data.avatar) {
      el.innerHTML = `<img src="${data.avatar}" alt="${data.name || 'User'}" />`;
    } else {
      const name = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'S';
      el.textContent = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
  };

  const populateProfileForm = (data) => {
    const nameParts = (data.name || '').split(' ');
    document.getElementById('firstName').value    = data.firstName || nameParts[0] || '';
    document.getElementById('lastName').value     = data.lastName  || nameParts.slice(1).join(' ') || '';
    document.getElementById('displayEmail').value = data.email     || '';
    document.getElementById('shsLevel').value     = data.shsLevel  || '';
    document.getElementById('track').value        = data.track     || '';
  };

  /* ══════════════════════════════
     SAVE PROFILE
  ══════════════════════════════ */
  document.getElementById('saveProfile').addEventListener('click', async () => {
    const btn       = document.getElementById('saveProfile');
    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const email     = document.getElementById('displayEmail').value.trim();

    if (!firstName) { showToast('First name is required.', 'error'); return; }
    if (!email)     { showToast('Email is required.', 'error'); return; }

    setLoading(btn, true);
    try {
      const data = await api('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          email,
          shsLevel: document.getElementById('shsLevel').value,
          track:    document.getElementById('track').value,
        }),
      });
      if (!data) return;
      user = { ...user, ...data };
      updateStoredUser(user);
      renderProfileCard(user);
      renderSidebarUser(user);
      showToast('Profile updated successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  /* ══════════════════════════════
     AVATAR UPLOAD
  ══════════════════════════════ */
  document.getElementById('avatarUploadBtn').addEventListener('click', () => {
    document.getElementById('avatarInput').click();
  });

  document.getElementById('avatarInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB.', 'error');
      return;
    }

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      document.getElementById('profileAvatar').innerHTML  = `<img src="${src}" alt="Avatar" />`;
      document.getElementById('sidebarAvatar').innerHTML  = `<img src="${src}" alt="Avatar" />`;
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/settings/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      user.avatar = data.avatarUrl || data.avatar;
      updateStoredUser(user);
      showToast('Profile photo updated.');
    } catch {
      showToast('Failed to upload photo.', 'error');
    }

    // Reset input
    e.target.value = '';
  });

  /* ══════════════════════════════
     SAVE PASSWORD
  ══════════════════════════════ */
  document.getElementById('savePassword').addEventListener('click', async () => {
    const btn     = document.getElementById('savePassword');
    const current = document.getElementById('currentPassword').value;
    const newPw   = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    clearFieldErrors('currentPwErr', 'newPwErr', 'confirmPwErr');
    let valid = true;

    if (!current) { setFieldError('currentPwErr', 'Current password is required.'); valid = false; }
    if (!newPw || newPw.length < 8) { setFieldError('newPwErr', 'Password must be at least 8 characters.'); valid = false; }
    if (newPw !== confirm) { setFieldError('confirmPwErr', 'Passwords do not match.'); valid = false; }
    if (!valid) return;

    setLoading(btn, true);
    try {
      await api('/settings/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
      });
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value     = '';
      document.getElementById('confirmPassword').value = '';
      showToast('Password updated successfully.');
    } catch (err) {
      setFieldError('currentPwErr', err.message || 'Failed to update password.');
    } finally {
      setLoading(btn, false);
    }
  });

  /* ══════════════════════════════
     LOAD NOTIFICATION PREFERENCES
  ══════════════════════════════ */
  const notifIds = ['notifPrayer', 'notifStudy', 'notifQuiz', 'notifTasks', 'notifMotivation', 'notifWeekly'];

  const loadNotifications = async () => {
    try {
      const data = await api('/settings/notifications');
      if (!data) return;
      notifIds.forEach(id => {
        const key = id.replace('notif', '').toLowerCase();
        const el  = document.getElementById(id);
        if (el && data[key] !== undefined) el.checked = data[key];
      });
    } catch {
      // Use defaults already in HTML
    }
  };

  /* ══════════════════════════════
     SAVE NOTIFICATIONS
  ══════════════════════════════ */
  document.getElementById('saveNotifications').addEventListener('click', async () => {
    const btn     = document.getElementById('saveNotifications');
    const payload = {};
    notifIds.forEach(id => {
      const key     = id.replace('notif', '').toLowerCase();
      payload[key]  = document.getElementById(id).checked;
    });

    setLoading(btn, true);
    try {
      await api('/settings/notifications', { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Notification preferences saved.');
    } catch (err) {
      showToast(err.message || 'Failed to save preferences.', 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  /* ══════════════════════════════
   APPLY FONT SIZE
══════════════════════════════ */
function applyFontSize(size) {

  const sizes = {
    small: '14px',
    medium: '16px',
    large: '18px'
  };

  document.documentElement.style.fontSize =
    sizes[size] || '16px';
}

 /* ══════════════════════════════
   LOAD APPEARANCE
══════════════════════════════ */
const loadAppearance = async () => {
  try {
    const data = await api('/settings/appearance');
    if (!data) return;
 
    /* Populate form controls */
    const accentColour = data.accentColour || 'purple';
    const fontSize     = data.fontSize     || 'medium';
    const darkMode     = data.darkMode     === true;
 
    document.querySelectorAll('.colour-btn').forEach(btn => {
      const active = btn.dataset.colour === accentColour;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
 
    document.getElementById('fontSizeSelect').value = fontSize;
    document.getElementById('darkMode').checked     = darkMode;
 
    /* ← NEW: single call does everything */
    window.StudySyncTheme.apply({ accentColour, fontSize, darkMode });
 
  } catch {
    /* theme.js already applied the localStorage fallback at boot */
  }
};

  /* ══════════════════════════════
   THEME COLOUR BUTTONS
══════════════════════════════ */
const colourMap = {
  purple: '#5B5BD6',
  teal:   '#22C9A5',
  rose:   '#E05475',
  amber:  '#F59E0B',
  indigo: '#4F46E5',
  green:  '#16A34A'
};

document.querySelectorAll('.colour-btn').forEach(btn => {
  btn.addEventListener('click', () => {

    // active button UI
    document.querySelectorAll('.colour-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });

    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');

    // apply colour instantly
    const selected = btn.dataset.colour;
    const colour = colourMap[selected];

    document.documentElement.style.setProperty('--primary', colour);
  });
});

/* ══════════════════════════════
   FONT SIZE LIVE PREVIEW
══════════════════════════════ */
document.getElementById('fontSizeSelect')
  .addEventListener('change', (e) => {
    applyFontSize(e.target.value);
  });

  /* ══════════════════════════════
   APPLY THEME COLOUR
══════════════════════════════ */
const applyThemeColour = (colour) => {

  const root = document.documentElement;

  const themes = {

    purple: '#5B5BD6',
    teal: '#22C9A5',
    rose: '#E05475',
    amber: '#F59E0B',
    indigo: '#4F46E5',
    green: '#16A34A'

  };

  root.style.setProperty('--primary', themes[colour] || themes.purple);

};

  /* ══════════════════════════════
     SAVE APPEARANCE
  ══════════════════════════════ */
  document.getElementById('saveAppearance').addEventListener('click', async () => {
  const btn          = document.getElementById('saveAppearance');
  const activeColour = document.querySelector('.colour-btn.active')?.dataset.colour || 'purple';
  const fontSize     = document.getElementById('fontSizeSelect').value;
  const darkMode     = document.getElementById('darkMode').checked;
 
  setLoading(btn, true);
  try {
    await api('/settings/appearance', {
      method: 'PUT',
      body: JSON.stringify({ accentColour: activeColour, fontSize, darkMode }),
    });
 
    /* ← NEW: persist + apply globally */
    window.StudySyncTheme.save({ accentColour: activeColour, fontSize, darkMode });
 
    showToast('Appearance saved.');
  } catch (err) {
    showToast(err.message || 'Failed to save appearance.', 'error');
  } finally {
    setLoading(btn, false);
  }
});

  /* ══════════════════════════════
     CONFIRM MODAL
  ══════════════════════════════ */
  const confirmModal     = document.getElementById('confirmModal');
  let   confirmCallback  = null;

  const openConfirm = (title, text, callback) => {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmText').textContent  = text;
    confirmCallback = callback;
    confirmModal.classList.add('show');
  };

  const closeConfirm = () => {
    confirmModal.classList.remove('show');
    confirmCallback = null;
  };

  document.getElementById('confirmModalClose').addEventListener('click', closeConfirm);
  document.getElementById('confirmCancelBtn').addEventListener('click', closeConfirm);
  confirmModal.addEventListener('click', e => { if (e.target === confirmModal) closeConfirm(); });

  document.getElementById('confirmActionBtn').addEventListener('click', async () => {
    if (confirmCallback) await confirmCallback();
    closeConfirm();
  });

  /* ══════════════════════════════
     DANGER ZONE ACTIONS
  ══════════════════════════════ */
  document.getElementById('clearProgressBtn').addEventListener('click', () => {
    openConfirm(
      'Clear All Progress?',
      'This will permanently delete all your quiz history, streaks, and analytics data. This cannot be undone.',
      async () => {
        try {
          await api('/settings/clear-progress', { method: 'DELETE' });
          showToast('Progress data cleared.');
        } catch (err) {
          showToast(err.message || 'Failed to clear progress.', 'error');
        }
      }
    );
  });

  document.getElementById('clearTasksBtn').addEventListener('click', () => {
    openConfirm(
      'Delete All Tasks?',
      'This will permanently delete all your tasks. This cannot be undone.',
      async () => {
        try {
          await api('/tasks/all', { method: 'DELETE' });
          showToast('All tasks deleted.');
        } catch (err) {
          showToast(err.message || 'Failed to delete tasks.', 'error');
        }
      }
    );
  });

  document.getElementById('deleteAccountBtn').addEventListener('click', () => {
    openConfirm(
      'Delete Account?',
      'This will permanently delete your account and ALL associated data including notes, tasks, progress, and settings. This absolutely cannot be undone.',
      async () => {
        try {
          await api('/settings/account', { method: 'DELETE' });
          logout();
        } catch (err) {
          showToast(err.message || 'Failed to delete account.', 'error');
        }
      }
    );
  });

  /* ══════════════════════════════
     KEYBOARD
  ══════════════════════════════ */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && confirmModal.classList.contains('show')) closeConfirm();
  });

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  loadProfile();
  loadNotifications();
  loadAppearance();

});