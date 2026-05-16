/* ─────────────────────────────────────────────
   StudySync — calendar.js
   Month + week views, event CRUD, day panel.
   Real API. No mock data.
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

  const pad = n => String(n).padStart(2, '0');

  const toDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const formatTime12 = t => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDisplayDate = dateStr => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

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
  const today      = new Date();
  let   viewYear   = today.getFullYear();
  let   viewMonth  = today.getMonth();
  let   viewMode   = 'month'; // 'month' | 'week'
  let   selectedDate = toDateStr(today);
  let   allEvents  = []; // flat array of events for current month
  let   editingId  = null;

  /* ══════════════════════════════
     URL PARAM — pre-select date
  ══════════════════════════════ */
  const params     = new URLSearchParams(window.location.search);
  const paramDate  = params.get('date');
  if (paramDate) {
    selectedDate = paramDate;
    const d      = new Date(paramDate + 'T12:00:00');
    viewYear     = d.getFullYear();
    viewMonth    = d.getMonth();
  }

  /* ══════════════════════════════
     LOAD EVENTS
  ══════════════════════════════ */
  const loadEvents = async () => {
    try {
      const data = await api(`/calendar/events?year=${viewYear}&month=${viewMonth + 1}`);
      if (!data) return;
      allEvents = data.events || data;
      renderCalendar();
      renderDayPanel(selectedDate);
    } catch (err) {
      console.error('Calendar load error:', err);
      renderCalendar();
    }
  };

  /* ══════════════════════════════
     EVENTS FOR DATE
  ══════════════════════════════ */
  const eventsForDate = dateStr =>
    allEvents.filter(e => e.date === dateStr)
             .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  /* ══════════════════════════════
     RENDER MONTH CALENDAR
  ══════════════════════════════ */
  const renderCalendar = () => {
    document.getElementById('calMonthTitle').textContent = `${MONTHS[viewMonth]} ${viewYear}`;

    if (viewMode === 'month') {
      renderMonthGrid();
      document.getElementById('calGrid').style.display = 'grid';
      document.getElementById('weekView').classList.remove('active');
    } else {
      document.getElementById('calGrid').style.display = 'none';
      renderWeekView();
      document.getElementById('weekView').classList.add('active');
    }
  };

  const renderMonthGrid = () => {
    const grid       = document.getElementById('calGrid');
    const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMon  = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevEnd    = new Date(viewYear, viewMonth, 0).getDate();
    const todayStr   = toDateStr(today);

    let html = '';

    // Prev month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const d   = prevEnd - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const ds  = `${prevY}-${pad(prevM + 1)}-${pad(d)}`;
      html += buildCell(d, ds, true);
    }

    // Current month
    for (let d = 1; d <= daysInMon; d++) {
      const ds = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
      html += buildCell(d, ds, false);
    }

    // Next month padding
    const total  = firstDay + daysInMon;
    const remain = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let d = 1; d <= remain; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const ds    = `${nextY}-${pad(nextM + 1)}-${pad(d)}`;
      html += buildCell(d, ds, true);
    }

    grid.innerHTML = html;

    // Click handlers
    grid.querySelectorAll('.cal-cell').forEach(cell => {
      cell.addEventListener('click', e => {
        if (e.target.closest('.cell-event')) return;
        selectDate(cell.dataset.date);
      });
    });

    grid.querySelectorAll('.cell-event').forEach(ev => {
      ev.addEventListener('click', e => {
        e.stopPropagation();
        openEditModal(ev.dataset.id);
      });
    });

    grid.querySelectorAll('.cell-more').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        selectDate(btn.dataset.date);
      });
    });
  };

  const buildCell = (dayNum, dateStr, otherMonth) => {
    const isToday    = dateStr === toDateStr(today);
    const isSelected = dateStr === selectedDate;
    const events     = eventsForDate(dateStr);
    const maxShow    = 3;

    const eventsHTML = events.slice(0, maxShow).map(e => `
      <div class="cell-event ev-${e.type}" data-id="${e.id}" title="${escapeHTML(e.title)}">
        ${e.startTime ? formatTime12(e.startTime) + ' ' : ''}${escapeHTML(e.title)}
      </div>`).join('');

    const moreHTML = events.length > maxShow
      ? `<div class="cell-more" data-date="${dateStr}">+${events.length - maxShow} more</div>` : '';

    return `
      <div class="cal-cell ${otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
        data-date="${dateStr}" role="gridcell" tabindex="0"
        aria-label="${dateStr}${events.length ? ', ' + events.length + ' events' : ''}"
        aria-selected="${isSelected}">
        <div class="cell-date">${dayNum}</div>
        <div class="cell-events">${eventsHTML}${moreHTML}</div>
      </div>`;
  };

  /* ══════════════════════════════
     RENDER WEEK VIEW
  ══════════════════════════════ */
  const renderWeekView = () => {
    const wv = document.getElementById('weekView');

    // Get start of week for selected date
    const sel      = new Date(selectedDate + 'T12:00:00');
    const startDay = new Date(sel);
    startDay.setDate(sel.getDate() - sel.getDay());

    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      return d;
    });

    const todayStr = toDateStr(today);
    const hours    = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm

    const headersHTML = `
      <div class="week-row">
        <div></div>
        ${weekDates.map(d => {
          const ds = toDateStr(d);
          const isT = ds === todayStr;
          return `<div class="week-day-header ${isT ? 'today' : ''}"
            style="cursor:pointer;" data-date="${ds}" onclick="selectDateFromWeek('${ds}')">
            ${DAYS[d.getDay()].slice(0,3)} ${d.getDate()}
          </div>`;
        }).join('')}
      </div>`;

    const rowsHTML = hours.map(h => {
      const timeLabel = formatTime12(`${pad(h)}:00`);
      const cells = weekDates.map(d => {
        const ds       = toDateStr(d);
        const isToday  = ds === todayStr;
        const evs      = eventsForDate(ds).filter(e => {
          if (!e.startTime) return h === 8;
          const eh = parseInt(e.startTime.split(':')[0], 10);
          return eh === h;
        });
        const evHTML   = evs.map(e =>
          `<div class="cell-event ev-${e.type}" data-id="${e.id}"
            style="font-size:9px;margin-bottom:2px;"
            title="${escapeHTML(e.title)}">${escapeHTML(e.title.slice(0,14))}…</div>`
        ).join('');
        return `<div class="week-cell ${isToday ? 'today-col' : ''}">${evHTML}</div>`;
      }).join('');
      return `<div class="week-row">
        <div class="week-time">${timeLabel}</div>${cells}
      </div>`;
    }).join('');

    wv.innerHTML = headersHTML + rowsHTML;

    wv.querySelectorAll('.cell-event').forEach(ev => {
      ev.addEventListener('click', () => openEditModal(ev.dataset.id));
    });
  };

  // Make accessible from inline onclick in week view
  window.selectDateFromWeek = (ds) => selectDate(ds);

  /* ══════════════════════════════
     SELECT DATE
  ══════════════════════════════ */
  const selectDate = (dateStr) => {
    selectedDate = dateStr;

    // Update selected cell
    document.querySelectorAll('.cal-cell').forEach(c => {
      c.classList.toggle('selected', c.dataset.date === dateStr);
      c.setAttribute('aria-selected', c.dataset.date === dateStr ? 'true' : 'false');
    });

    renderDayPanel(dateStr);
  };

  /* ══════════════════════════════
     RENDER DAY PANEL
  ══════════════════════════════ */
  const renderDayPanel = (dateStr) => {
    const events = eventsForDate(dateStr);

    document.getElementById('dayPanelDate').textContent = formatDisplayDate(dateStr);
    document.getElementById('dayPanelSub').textContent  =
      events.length ? `${events.length} event${events.length !== 1 ? 's' : ''}` : 'No events';

    const list = document.getElementById('dayEventsList');

    if (!events.length) {
      list.innerHTML = `<div class="day-empty"><i class="fa-regular fa-calendar-xmark"></i><p>No events for this day.</p></div>`;
      return;
    }

    list.innerHTML = events.map(e => `
      <div class="day-event ev-${e.type}" data-id="${e.id}" role="button" tabindex="0"
        aria-label="${escapeHTML(e.title)}">
        <div class="day-event-title">${escapeHTML(e.title)}</div>
        ${e.startTime ? `<div class="day-event-meta">
          ${formatTime12(e.startTime)}${e.endTime ? ' – ' + formatTime12(e.endTime) : ''}
        </div>` : ''}
        ${e.note ? `<div class="day-event-meta">${escapeHTML(e.note)}</div>` : ''}
        <div class="day-event-type">${e.type}</div>
      </div>`).join('');

    list.querySelectorAll('.day-event').forEach(el => {
      const open = () => openEditModal(el.dataset.id);
      el.addEventListener('click', open);
      el.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
    });
  };

  /* ══════════════════════════════
     NAV CONTROLS
  ══════════════════════════════ */
  document.getElementById('calPrev').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    loadEvents();
  });

  document.getElementById('calNext').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    loadEvents();
  });

  document.getElementById('calTodayBtn').addEventListener('click', () => {
    viewYear  = today.getFullYear();
    viewMonth = today.getMonth();
    selectedDate = toDateStr(today);
    loadEvents();
  });

  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.view-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      viewMode = tab.dataset.view;
      renderCalendar();
    });
  });

  /* ══════════════════════════════
     EVENT MODAL
  ══════════════════════════════ */
  const eventModal = document.getElementById('eventModal');
  const eventForm  = document.getElementById('eventForm');
  const btnSave    = document.getElementById('eventBtnSave');

  const openAddModal = (dateStr = selectedDate) => {
    editingId = null;
    document.getElementById('eventModalTitle').textContent = 'New Event';
    eventForm.reset();
    document.getElementById('eventId').value    = '';
    document.getElementById('eventDate').value  = dateStr;
    document.getElementById('eventTitleError').textContent = '';
    document.getElementById('eventDateError').textContent  = '';
    // Reset footer (remove delete btn if present)
    document.getElementById('eventModalFooter').innerHTML = `
      <button type="button" class="btn-cancel" id="eventBtnCancel">Cancel</button>
      <button type="submit" class="btn-save" id="eventBtnSave">
        <span class="btn-label">Save Event</span>
        <span class="spinner" aria-hidden="true"></span>
      </button>`;
    bindModalFooterBtns();
    btnSave.querySelector('.btn-label').textContent = 'Save Event';
    eventModal.classList.add('show');
    setTimeout(() => document.getElementById('eventTitle').focus(), 100);
  };

  const openEditModal = (id) => {
    const ev = allEvents.find(e => e.id == id);
    if (!ev) return;
    editingId = id;
    document.getElementById('eventModalTitle').textContent = 'Edit Event';
    document.getElementById('eventId').value         = ev.id;
    document.getElementById('eventTitle').value      = ev.title      || '';
    document.getElementById('eventType').value       = ev.type       || 'quiz';
    document.getElementById('eventDate').value       = ev.date       || '';
    document.getElementById('eventStartTime').value  = ev.startTime  || '';
    document.getElementById('eventEndTime').value    = ev.endTime    || '';
    document.getElementById('eventNote').value       = ev.note       || '';
    document.getElementById('eventTitleError').textContent = '';
    document.getElementById('eventDateError').textContent  = '';

    // Add delete button
    document.getElementById('eventModalFooter').innerHTML = `
      <button type="button" class="btn-delete-event" id="eventBtnDelete">Delete</button>
      <button type="button" class="btn-cancel" id="eventBtnCancel">Cancel</button>
      <button type="submit" class="btn-save" id="eventBtnSave">
        <span class="btn-label">Update</span>
        <span class="spinner" aria-hidden="true"></span>
      </button>`;
    bindModalFooterBtns();
    eventModal.classList.add('show');
    setTimeout(() => document.getElementById('eventTitle').focus(), 100);
  };

  const bindModalFooterBtns = () => {
    document.getElementById('eventBtnCancel')?.addEventListener('click', closeEventModal);
    document.getElementById('eventBtnDelete')?.addEventListener('click', () => deleteEvent(editingId));
  };

  const closeEventModal = () => {
    eventModal.classList.remove('show');
    editingId = null;
  };

  document.getElementById('eventModalClose').addEventListener('click', closeEventModal);
  eventModal.addEventListener('click', e => { if (e.target === eventModal) closeEventModal(); });
  document.getElementById('btnAddEvent').addEventListener('click', () => openAddModal());

  /* ── Form submit ── */
  eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('eventTitle').value.trim();
    const date  = document.getElementById('eventDate').value;
    let valid   = true;

    document.getElementById('eventTitleError').textContent = '';
    document.getElementById('eventDateError').textContent  = '';

    if (!title) { document.getElementById('eventTitleError').innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Title required.'; valid = false; }
    if (!date)  { document.getElementById('eventDateError').innerHTML  = '<i class="fa-solid fa-circle-exclamation"></i> Date required.';  valid = false; }
    if (!valid) return;

    const payload = {
      title,
      type:      document.getElementById('eventType').value,
      date,
      startTime: document.getElementById('eventStartTime').value || null,
      endTime:   document.getElementById('eventEndTime').value   || null,
      note:      document.getElementById('eventNote').value.trim() || null,
    };

    const saveBtn = document.getElementById('eventBtnSave');
    saveBtn.disabled = true;
    saveBtn.classList.add('loading');

    try {
      if (editingId) {
        const data = await api(`/calendar/events/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (!data) return;
        allEvents = allEvents.map(ev => ev.id == editingId ? { ...ev, ...payload, id: editingId } : ev);
        showToast('Event updated.');
      } else {
        const data = await api('/calendar/events', { method: 'POST', body: JSON.stringify(payload) });
        if (!data) return;
        allEvents.push(data.event || data);
        selectedDate = date;
        showToast('Event added!');
      }

      // If new event is on different month, reload
      const evDate = new Date(date + 'T12:00:00');
      if (evDate.getMonth() !== viewMonth || evDate.getFullYear() !== viewYear) {
        viewMonth = evDate.getMonth();
        viewYear  = evDate.getFullYear();
        await loadEvents();
      } else {
        renderCalendar();
        renderDayPanel(selectedDate);
      }

      closeEventModal();
    } catch (err) {
      showToast(err.message || 'Failed to save event.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.classList.remove('loading');
    }
  });

  /* ══════════════════════════════
     DELETE EVENT
  ══════════════════════════════ */
  const deleteEvent = async (id) => {
    if (!id) return;
    closeEventModal();

    const removed = allEvents.find(e => e.id == id);
    allEvents = allEvents.filter(e => e.id != id);
    renderCalendar();
    renderDayPanel(selectedDate);

    try {
      await api(`/calendar/events/${id}`, { method: 'DELETE' });
      showToast('Event deleted.');
    } catch {
      if (removed) allEvents.push(removed);
      renderCalendar();
      renderDayPanel(selectedDate);
      showToast('Failed to delete event.', 'error');
    }
  };

  /* ══════════════════════════════
     KEYBOARD
  ══════════════════════════════ */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && eventModal.classList.contains('show')) closeEventModal();
  });

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  loadEvents();
  renderDayPanel(selectedDate);

});