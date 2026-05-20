/* ─────────────────────────────────────────────
   StudySync — login.js
   Handles: tab switching, login form, register
   form, forgot-password panel, password toggle,
   strength meter, inline validation, loading
   states, and simulated API calls.
───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════
     DOM REFERENCES
  ══════════════════════════════ */

  // Tabs
  const tabLogin      = document.getElementById('tabLogin');
  const tabRegister   = document.getElementById('tabRegister');
  const panelLogin    = document.getElementById('panelLogin');
  const panelRegister = document.getElementById('panelRegister');
  const panelForgot   = document.getElementById('panelForgot');

  // Global alert
  const globalAlert   = document.getElementById('globalAlert');
  const globalAlertMsg= document.getElementById('globalAlertMsg');

  // Login form
  const loginForm     = document.getElementById('loginForm');
  const loginEmail    = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginEmailErr = document.getElementById('loginEmailErr');
  const loginPwErr    = document.getElementById('loginPwErr');
  const loginSubmit   = document.getElementById('loginSubmit');
  const toggleLoginPw = document.getElementById('toggleLoginPw');
  const rememberMe    = document.getElementById('rememberMe');

  // Register form
  const registerForm    = document.getElementById('registerForm');
  const regName         = document.getElementById('regName');
  const regEmail        = document.getElementById('regEmail');
  const regPassword     = document.getElementById('regPassword');
  const regConfirm      = document.getElementById('regConfirm');
  const regNameErr      = document.getElementById('regNameErr');
  const regEmailErr     = document.getElementById('regEmailErr');
  const regPwErr        = document.getElementById('regPwErr');
  const regConfirmErr   = document.getElementById('regConfirmErr');
  const registerSubmit  = document.getElementById('registerSubmit');
  const toggleRegPw     = document.getElementById('toggleRegPw');

  // Password strength
  const pwBar1          = document.getElementById('pwBar1');
  const pwBar2          = document.getElementById('pwBar2');
  const pwBar3          = document.getElementById('pwBar3');
  const pwBar4          = document.getElementById('pwBar4');
  const pwStrengthLabel = document.getElementById('pwStrengthLabel');

  // Forgot password
  const showForgotBtn   = document.getElementById('showForgotBtn');
  const backToLoginBtn  = document.getElementById('backToLoginBtn');
  const forgotForm      = document.getElementById('forgotForm');
  const forgotEmail     = document.getElementById('forgotEmail');
  const forgotEmailErr  = document.getElementById('forgotEmailErr');
  const forgotSubmit    = document.getElementById('forgotSubmit');


  /* ══════════════════════════════
     TAB SWITCHING
  ══════════════════════════════ */

  const showPanel = (panelName) => {
    // Hide all panels
    panelLogin.classList.remove('active');
    panelRegister.classList.remove('active');
    panelForgot.classList.remove('active');

    // Reset tab states
    tabLogin.classList.remove('active');
    tabRegister.classList.remove('active');
    tabLogin.setAttribute('aria-selected', 'false');
    tabRegister.setAttribute('aria-selected', 'false');

    hideAlert();

    if (panelName === 'login') {
      panelLogin.classList.add('active');
      tabLogin.classList.add('active');
      tabLogin.setAttribute('aria-selected', 'true');
    } else if (panelName === 'register') {
      panelRegister.classList.add('active');
      tabRegister.classList.add('active');
      tabRegister.setAttribute('aria-selected', 'true');
    } else if (panelName === 'forgot') {
      panelForgot.classList.add('active');
      // Keep login tab highlighted when forgot panel is open
      tabLogin.classList.add('active');
      tabLogin.setAttribute('aria-selected', 'true');
    }
  };

  tabLogin.addEventListener('click',    () => showPanel('login'));
  tabRegister.addEventListener('click', () => showPanel('register'));
  showForgotBtn.addEventListener('click', () => showPanel('forgot'));
  backToLoginBtn.addEventListener('click', () => showPanel('login'));


  /* ══════════════════════════════
     ALERT HELPERS
  ══════════════════════════════ */

  const showAlert = (msg, type = 'error') => {
    globalAlert.className = `alert show alert-${type}`;
    globalAlertMsg.textContent = msg;
  };

  const hideAlert = () => {
    globalAlert.classList.remove('show');
  };


  /* ══════════════════════════════
     FIELD ERROR HELPERS
  ══════════════════════════════ */

  const setError = (input, errEl, msg) => {
    input.classList.add('input-error');
    input.classList.remove('input-success');
    errEl.innerHTML = msg
      ? `<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> ${msg}`
      : '';
  };

  const setSuccess = (input, errEl) => {
    input.classList.remove('input-error');
    input.classList.add('input-success');
    errEl.innerHTML = '';
  };

  const clearState = (input, errEl) => {
    input.classList.remove('input-error', 'input-success');
    errEl.innerHTML = '';
  };


  /* ══════════════════════════════
     VALIDATION HELPERS
  ══════════════════════════════ */

  const isValidEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const isValidName = (val) =>
    val.trim().length >= 2;

  const isValidPassword = (val) =>
    val.length >= 8;


  /* ══════════════════════════════
     PASSWORD TOGGLE VISIBILITY
  ══════════════════════════════ */

  const buildTogglePw = (btn, input) => {
    btn.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.querySelector('i').className = isHidden
        ? 'fa-regular fa-eye-slash'
        : 'fa-regular fa-eye';
      btn.setAttribute('aria-label',
        isHidden ? 'Hide password' : 'Show password');
    });
  };

  buildTogglePw(toggleLoginPw, loginPassword);
  buildTogglePw(toggleRegPw,   regPassword);


  /* ══════════════════════════════
     PASSWORD STRENGTH METER
  ══════════════════════════════ */

  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8)                    score++;
    if (pw.length >= 12)                   score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw))                  score++;
    if (/[^A-Za-z0-9]/.test(pw))           score++;
    return Math.min(4, score);
  };

  const strengthMeta = [
    { label: '',       cls: '' },
    { label: 'Weak',   cls: 'weak' },
    { label: 'Fair',   cls: 'fair' },
    { label: 'Good',   cls: 'good' },
    { label: 'Strong', cls: 'strong' },
  ];

  const updateStrength = (pw) => {
    const bars  = [pwBar1, pwBar2, pwBar3, pwBar4];
    const score = pw.length > 0 ? getStrength(pw) : 0;
    const meta  = strengthMeta[score];

    bars.forEach((bar, i) => {
      bar.className = 'pw-bar';
      if (i < score) bar.classList.add(meta.cls);
    });

    pwStrengthLabel.textContent = pw.length > 0
      ? `Password strength: ${meta.label}`
      : '';
  };

  regPassword.addEventListener('input', () => {
    updateStrength(regPassword.value);
    // live clear confirm error when typing
    if (regConfirm.value) {
      regPassword.value === regConfirm.value
        ? setSuccess(regConfirm, regConfirmErr)
        : setError(regConfirm, regConfirmErr, 'Passwords do not match');
    }
  });


  /* ══════════════════════════════
     LIVE FIELD VALIDATION (blur)
  ══════════════════════════════ */

  // Login
  loginEmail.addEventListener('blur', () => {
    if (!loginEmail.value) return clearState(loginEmail, loginEmailErr);
    isValidEmail(loginEmail.value)
      ? setSuccess(loginEmail, loginEmailErr)
      : setError(loginEmail, loginEmailErr, 'Enter a valid email address');
  });

  loginPassword.addEventListener('blur', () => {
    if (!loginPassword.value) return clearState(loginPassword, loginPwErr);
    loginPassword.value.length >= 1
      ? setSuccess(loginPassword, loginPwErr)
      : setError(loginPassword, loginPwErr, 'Password is required');
  });

  // Register
  regName.addEventListener('blur', () => {
    if (!regName.value) return clearState(regName, regNameErr);
    isValidName(regName.value)
      ? setSuccess(regName, regNameErr)
      : setError(regName, regNameErr, 'Enter at least 2 characters');
  });

  regEmail.addEventListener('blur', () => {
    if (!regEmail.value) return clearState(regEmail, regEmailErr);
    isValidEmail(regEmail.value)
      ? setSuccess(regEmail, regEmailErr)
      : setError(regEmail, regEmailErr, 'Enter a valid email address');
  });

  regPassword.addEventListener('blur', () => {
    if (!regPassword.value) return clearState(regPassword, regPwErr);
    isValidPassword(regPassword.value)
      ? setSuccess(regPassword, regPwErr)
      : setError(regPassword, regPwErr, 'Password must be at least 8 characters');
  });

  regConfirm.addEventListener('blur', () => {
    if (!regConfirm.value) return clearState(regConfirm, regConfirmErr);
    regPassword.value === regConfirm.value
      ? setSuccess(regConfirm, regConfirmErr)
      : setError(regConfirm, regConfirmErr, 'Passwords do not match');
  });


  /* ══════════════════════════════
     LOADING STATE HELPERS
  ══════════════════════════════ */

  const setLoading = (btn, state) => {
    btn.disabled = state;
    state
      ? btn.classList.add('loading')
      : btn.classList.remove('loading');
  };


  /* ══════════════════════════════
     REMEMBER ME — persist email
  ══════════════════════════════ */

  // Restore remembered email on load
  const savedEmail = localStorage.getItem('ss_remember_email');
  if (savedEmail) {
    loginEmail.value   = savedEmail;
    rememberMe.checked = true;
  }


  /* ══════════════════════════════
     LOGIN FORM SUBMIT
  ══════════════════════════════ */

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    let valid = true;
    const emailVal = loginEmail.value.trim();
    const pwVal    = loginPassword.value;

    if (!emailVal || !isValidEmail(emailVal)) {
      setError(loginEmail, loginEmailErr, 'Enter a valid email address');
      valid = false;
    } else {
      setSuccess(loginEmail, loginEmailErr);
    }

    if (!pwVal) {
      setError(loginPassword, loginPwErr, 'Password is required');
      valid = false;
    } else {
      setSuccess(loginPassword, loginPwErr);
    }

    if (!valid) return;

    setLoading(loginSubmit, true);

    try {
      // ── API call ──
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    emailVal,
          password: pwVal,
          remember: rememberMe.checked,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      // Store token
const storage = rememberMe.checked ? localStorage : sessionStorage;
storage.setItem('ss_token', data.token);
storage.setItem('ss_user',  JSON.stringify(data.user));

// Remember email if checked
if (rememberMe.checked) {
  localStorage.setItem('ss_remember_email', emailVal);
} else {
  localStorage.removeItem('ss_remember_email');
}

// ── Role-based redirect ──
if (data.user.role === 'admin') {
  window.location.href = '/admin/dashboard';
} else {
  window.location.href = '/dashboard';
}

    } catch (err) {
      showAlert(err.message || 'Something went wrong. Please try again.');
      setLoading(loginSubmit, false);
    }
  });


  /* ══════════════════════════════
     REGISTER FORM SUBMIT
  ══════════════════════════════ */

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    let valid = true;

    const nameVal    = regName.value.trim();
    const emailVal   = regEmail.value.trim();
    const pwVal      = regPassword.value;
    const confirmVal = regConfirm.value;

    if (!isValidName(nameVal)) {
      setError(regName, regNameErr, 'Enter your full name');
      valid = false;
    } else setSuccess(regName, regNameErr);

    if (!isValidEmail(emailVal)) {
      setError(regEmail, regEmailErr, 'Enter a valid email address');
      valid = false;
    } else setSuccess(regEmail, regEmailErr);

    if (!isValidPassword(pwVal)) {
      setError(regPassword, regPwErr, 'Password must be at least 8 characters');
      valid = false;
    } else setSuccess(regPassword, regPwErr);

    if (pwVal !== confirmVal) {
      setError(regConfirm, regConfirmErr, 'Passwords do not match');
      valid = false;
    } else if (confirmVal) {
      setSuccess(regConfirm, regConfirmErr);
    }

    if (!valid) return;

    setLoading(registerSubmit, true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     nameVal,
          email:    emailVal,
          password: pwVal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      // Auto-login after register
      sessionStorage.setItem('ss_token', data.token);
      sessionStorage.setItem('ss_user',  JSON.stringify(data.user));

      window.location.href = 'dashboard.html';

    } catch (err) {
      showAlert(err.message || 'Something went wrong. Please try again.');
      setLoading(registerSubmit, false);
    }
  });


  /* ══════════════════════════════
     FORGOT PASSWORD SUBMIT
  ══════════════════════════════ */

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const emailVal = forgotEmail.value.trim();

    if (!isValidEmail(emailVal)) {
      setError(forgotEmail, forgotEmailErr, 'Enter a valid email address');
      return;
    }

    setSuccess(forgotEmail, forgotEmailErr);
    setLoading(forgotSubmit, true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Could not send reset link.');
      }

      showAlert(
        `Reset link sent to ${emailVal}. Check your inbox!`,
        'success'
      );

      // Swap alert style
      globalAlert.className = 'alert show alert-success';
      forgotForm.reset();

    } catch (err) {
      showAlert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(forgotSubmit, false);
    }
  });


  const existingToken =
  localStorage.getItem('ss_token') ||
  sessionStorage.getItem('ss_token');

if (existingToken) {
  const savedUser = JSON.parse(
    localStorage.getItem('ss_user') ||
    sessionStorage.getItem('ss_user') ||
    '{}'
  );
  if (savedUser.role === 'admin') {
    window.location.href = '/admin/dashboard';
  } else {
    window.location.href = '/dashboard';
  }
}

});