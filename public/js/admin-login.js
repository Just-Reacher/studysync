document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('ss_admin_token')) { window.location.href = 'admin-dashboard.html'; return; }

  const form    = document.getElementById('adminLoginForm');
  const alert   = document.getElementById('loginAlert');
  const alertMsg= document.getElementById('loginAlertMsg');
  const btn     = document.getElementById('loginBtn');
  const toggle  = document.getElementById('togglePw');
  const pwInput = document.getElementById('adminPassword');

  toggle?.addEventListener('click', () => {
    const hidden = pwInput.type === 'password';
    pwInput.type = hidden ? 'text' : 'password';
    toggle.querySelector('i').className = hidden ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    alert.classList.remove('show');
    btn.disabled = true; btn.classList.add('loading');
    const email    = document.getElementById('adminEmail').value.trim();
    const password = pwInput.value;
    try {
      const res  = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid credentials.');
      if (data.user?.role !== 'admin') throw new Error('Access denied. Admin accounts only.');
      localStorage.setItem('ss_admin_token', data.token);
      localStorage.setItem('ss_admin', JSON.stringify(data.user));
      window.location.href = 'admin-dashboard.html';
    } catch (err) {
      alertMsg.textContent = err.message;
      alert.classList.add('show');
      btn.disabled = false; btn.classList.remove('loading');
    }
  });
});u