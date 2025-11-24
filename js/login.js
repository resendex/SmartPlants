document.addEventListener('DOMContentLoaded', () => {
  const form = /** @type {HTMLFormElement | null} */ (document.querySelector('.login-form'));
  const msg = /** @type {HTMLDivElement | null} */ (document.getElementById('login-message'));
  if (!form || !msg) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    msg.textContent = '';

    const usernameInput = /** @type {HTMLInputElement | null} */ (form.querySelector('#username'));
    const passwordInput = /** @type {HTMLInputElement | null} */ (form.querySelector('#password'));

    if (!usernameInput || !passwordInput) {
      msg.textContent = 'O formulário está incompleto.';
      return;
    }

    const identifier = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!identifier || !password) {
      msg.textContent = 'Introduza nome de utilizador e password.';
      return;
    }

    /**
     * @type {Array<{
     *  username: string,
     *  email: string,
     *  password: string,
     *  preferences?: { emailTips?: boolean, pushAlerts?: boolean },
     *  lastLogin?: string,
     *  age?: number | null,
     *  location?: string,
     *  gender?: string,
     *  photo?: string
     * }>}
     */
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem('sp_users') || '[]');
    } catch (err) {
      users = [];
    }

    // allow login by username OR email
  const userIndex = users.findIndex((u) => (u.username === identifier || u.email === identifier.toLowerCase()) && u.password === password);
    const user = userIndex >= 0 ? users[userIndex] : null;

    if (!user) {
      msg.textContent = 'Credenciais inválidas.';
      return;
    }

    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString(),
      preferences: {
        emailTips: user.preferences?.emailTips ?? true,
        pushAlerts: user.preferences?.pushAlerts ?? true,
      },
    };

    users[userIndex] = updatedUser;
    localStorage.setItem('sp_users', JSON.stringify(users));

    // set session
    localStorage.setItem('sp_currentUser', JSON.stringify(updatedUser));
    localStorage.setItem('sp_isLoggedIn', 'true');

    // redirect to logged-in landing
    location.href = 'inicio.html';
  });
});
