/* ─────────────────────────────────────────────
   StudySync — js/theme.js
   Global theme system: dark mode, accent colour,
   font size. Include on every page via:
     <script src="js/theme.js"></script>
   Place it in <head> (before any other scripts)
   so the theme is applied before paint.
───────────────────────────────────────────── */

(() => {

  /* ─────────────────────────────
     ACCENT COLOUR MAP
  ───────────────────────────────
     Maps accent names → [primary, soft, pale]
     Mirrors the values already used in CSS.
  ───────────────────────────────────────────── */
  const ACCENT_MAP = {
    purple: { primary: '#5B5BD6', soft: '#7C7CF0', pale: '#EEEEFF' },
    teal:   { primary: '#22C9A5', soft: '#3DD9B5', pale: '#E0FAF4' },
    rose:   { primary: '#E05475', soft: '#F07090', pale: '#FFF0F3' },
    amber:  { primary: '#F59E0B', soft: '#FBBF24', pale: '#FFF5E0' },
    indigo: { primary: '#4F46E5', soft: '#6D63F5', pale: '#EDEDFF' },
    green:  { primary: '#16A34A', soft: '#22C55E', pale: '#DCFCE7' },
  };

  /* ─────────────────────────────
     FONT SIZE MAP
  ───────────────────────────────────────────── */
  const FONT_SIZE_MAP = { small: '14px', medium: '16px', large: '18px' };

  /* ─────────────────────────────
     DARK MODE CSS
  ───────────────────────────────
     Injected once into <head> as a <style> tag.
     Uses the `.dark` class on <html> as the gate.
  ───────────────────────────────────────────── */
  const DARK_CSS = `
    html.dark,
    html.dark body {
      --bg:       #0F0F1A;
      --bg-card:  #1A1A2E;
      --text-dark: #E8E8F8;
      --text-mid:  #9999BB;
      --text-light: #5A5A7A;
      --border:       rgba(255,255,255,0.07);
      --border-input: rgba(255,255,255,0.12);
      --shadow-sm: 0 2px 12px rgba(0,0,0,0.35);
      --shadow-md: 0 8px 32px rgba(0,0,0,0.45);
      color-scheme: dark;
    }

    /* Topbar / sidebar glass in dark mode */
    html.dark .topbar {
      background: rgba(15,15,26,0.88) !important;
    }
    html.dark .sidebar {
      background: var(--bg-card);
      border-right-color: var(--border);
    }

    /* Cards */
    html.dark .section-card,
    html.dark .stat-card,
    html.dark .settings-section,
    html.dark .settings-nav,
    html.dark .modal,
    html.dark .notif-popup,
    html.dark .quote-chip,
    html.dark .quick-btn {
      background: var(--bg-card);
      border-color: var(--border);
    }

    /* Form inputs */
    html.dark .form-input,
    html.dark .form-select {
      background: #0F0F1A;
      color: var(--text-dark);
      border-color: var(--border-input);
    }
    html.dark .form-input:focus,
    html.dark .form-select:focus {
      background: #1A1A2E;
    }

    /* Task / quiz / reminder rows */
    html.dark .task-item,
    html.dark .quiz-item,
    html.dark .reminder-item {
      background: #13132B;
      border-color: var(--border);
    }
    html.dark .task-item:hover,
    html.dark .quiz-item:hover {
      background: #1E1E36;
    }

    /* Misc surfaces */
    html.dark .perf-bar-wrap    { background: #25253D; }
    html.dark .cal-day:hover    { background: rgba(255,255,255,0.08); }
    html.dark .toggle-slider    { background: #2E2E4D; }
    html.dark .btn-cancel       { background: #1A1A2E; color: var(--text-mid); border-color: var(--border); }
    html.dark .btn-danger       { background: #2D0F18; }
    html.dark .modal-overlay    { background: rgba(0,0,0,0.6); }
    html.dark .bg-blob          { opacity: 0.12; }
    html.dark .nav-item:hover,
    html.dark .nav-item.active  { background: rgba(255,255,255,0.06); }
    html.dark .sidebar-user:hover { background: rgba(255,255,255,0.05); }
    html.dark .icon-btn         { background: #1A1A2E; border-color: var(--border); }
    html.dark .icon-btn:hover   { background: rgba(255,255,255,0.06); }

    /* Smooth colour transition on theme switch */
    html.dark *,
    html.dark *::before,
    html.dark *::after {
      transition: background-color 0.25s ease, border-color 0.25s ease, color 0.15s ease;
    }
  `;

  /* ─────────────────────────────
     INJECT DARK CSS ONCE
  ───────────────────────────────────────────── */
  const injectDarkStyles = (() => {
    let injected = false;
    return () => {
      if (injected) return;
      const style = document.createElement('style');
      style.id = 'ss-dark-mode-styles';
      style.textContent = DARK_CSS;
      document.head.appendChild(style);
      injected = true;
    };
  })();

  /* ─────────────────────────────
     applyTheme(settings)
  ───────────────────────────────
     Call with the object returned by
     GET /api/settings/appearance:
       { darkMode, accentColour, fontSize }

     Also accepts the localStorage cache shape.
  ───────────────────────────────────────────── */
  const applyTheme = (settings = {}) => {
    const root   = document.documentElement;
    const colour = settings.accentColour || settings.accent_colour || 'purple';
    const size   = settings.fontSize     || settings.font_size     || 'medium';
    const dark   = settings.darkMode     ?? settings.dark_mode     ?? false;

    /* 1. Accent colour ──────────────────────── */
    const theme = ACCENT_MAP[colour] || ACCENT_MAP.purple;
    root.style.setProperty('--primary',      theme.primary);
    root.style.setProperty('--primary-soft', theme.soft);
    root.style.setProperty('--primary-pale', theme.pale);

    /* 2. Font size ──────────────────────────── */
    root.style.fontSize = FONT_SIZE_MAP[size] || '16px';

    /* 3. Dark mode ──────────────────────────── */
    injectDarkStyles();
    root.classList.toggle('dark', Boolean(dark));
  };

  /* ─────────────────────────────
     PERSIST + RETRIEVE FROM localStorage
  ───────────────────────────────────────────── */
  const STORAGE_KEY = 'ss_appearance';

  const saveThemeLocally = (settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_) { /* storage disabled */ }
  };

  const loadThemeLocally = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  };

  /* ─────────────────────────────
     FETCH FROM API + APPLY
  ───────────────────────────────
     Reads the auth token from localStorage or
     sessionStorage (same pattern as settings.js).
  ───────────────────────────────────────────── */
  const fetchAndApplyTheme = async () => {
    const token =
      localStorage.getItem('ss_token') ||
      sessionStorage.getItem('ss_token');

    if (!token) return; // not logged in — nothing to do

    try {
      const res = await fetch('/api/settings/appearance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('appearance fetch failed');

      const data = await res.json();

      /* Normalise keys (API returns camelCase) */
      const settings = {
        accentColour: data.accentColour || 'purple',
        fontSize:     data.fontSize     || 'medium',
        darkMode:     data.darkMode     ?? false,
      };

      applyTheme(settings);
      saveThemeLocally(settings);

    } catch (_) {
      /* API unreachable — fall back to cached value */
    }
  };

  /* ─────────────────────────────
     BOOT SEQUENCE
  ───────────────────────────────
     1. Apply cached theme IMMEDIATELY (before paint)
        so there is no flash of unstyled content.
     2. Then fetch fresh settings from the server
        and re-apply if anything changed.
  ───────────────────────────────────────────── */
  const boot = () => {
    /* Step 1 — instant paint from cache */
    const cached = loadThemeLocally();
    if (cached) applyTheme(cached);

    /* Step 2 — server sync after DOM is ready */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fetchAndApplyTheme);
    } else {
      fetchAndApplyTheme();
    }
  };

  /* ─────────────────────────────
     PUBLIC API
  ───────────────────────────────
     window.StudySyncTheme is available to all pages:

     // Apply theme from a settings object:
     window.StudySyncTheme.apply({ darkMode: true, accentColour: 'teal', fontSize: 'large' });

     // Save to localStorage + apply:
     window.StudySyncTheme.save({ ... });

     // Force a fresh fetch from the server:
     window.StudySyncTheme.refresh();
  ───────────────────────────────────────────── */
  window.StudySyncTheme = {
    apply:   applyTheme,
    save:    (s) => { applyTheme(s); saveThemeLocally(s); },
    refresh: fetchAndApplyTheme,
  };

  /* Start */
  boot();

})();