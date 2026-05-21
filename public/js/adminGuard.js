/* ─────────────────────────────────────────────
   StudySync — adminGuard.js
───────────────────────────────────────────── */
(function () {
  const token =
    localStorage.getItem('ss_admin_token') ||
    sessionStorage.getItem('ss_admin_token');

  const user = JSON.parse(
    localStorage.getItem('ss_admin') ||
    sessionStorage.getItem('ss_admin') ||
    '{}'
  );

  if (!token || user.role !== 'admin') {
    window.location.replace('/admin-login.html');
    return;
  }
})();