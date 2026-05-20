/* ─────────────────────────────────────────────
   StudySync — studentGuard.js
   Include at the top of student-only pages.
   Redirects admins to their dashboard.
───────────────────────────────────────────── */
(function () {
  const token =
    localStorage.getItem('ss_token') ||
    sessionStorage.getItem('ss_token');

  const user = JSON.parse(
    localStorage.getItem('ss_user') ||
    sessionStorage.getItem('ss_user') ||
    '{}'
  );

  if (!token) {
    window.location.replace('/login');
    return;
  }

  if (user.role === 'admin') {
    window.location.replace('/admin/dashboard');
  }
})();