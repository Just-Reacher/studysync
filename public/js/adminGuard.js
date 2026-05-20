/* ─────────────────────────────────────────────
   StudySync — adminGuard.js
   Include at the top of every admin HTML page.
   Redirects away if no token or role !== admin.
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

  if (!token || user.role !== 'admin') {
    // Not logged in or not an admin — boot them out
    window.location.replace('/login');
  }
})();