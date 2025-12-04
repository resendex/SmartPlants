document.addEventListener('DOMContentLoaded', () => {
  const form = /** @type {HTMLFormElement | null} */ (document.querySelector('.register-form'));
  const msg = /** @type {HTMLDivElement | null} */ (document.getElementById('register-message'));

  if (!form || !msg) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const usernameInput = /** @type {HTMLInputElement | null} */ (form.querySelector('#username'));
    const emailInput = /** @type {HTMLInputElement | null} */ (form.querySelector('#email'));
    const ageInput = /** @type {HTMLInputElement | null} */ (form.querySelector('#age'));
    const passwordInput = /** @type {HTMLInputElement | null} */ (form.querySelector('#password'));
    const confirmInput = /** @type {HTMLInputElement | null} */ (form.querySelector('#confirm-password'));
    const genderEl = /** @type {HTMLInputElement | null} */ (form.querySelector('input[name="gender"]:checked'));
    const locationInput = /** @type {HTMLInputElement | null} */ (form.querySelector('#location'));

    if (!usernameInput || !emailInput || !ageInput || !passwordInput || !confirmInput || !locationInput) {
      msg.style.color = 'red';
      msg.textContent = 'Formulário inválido. Atualize a página.';
      return;
    }

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const age = ageInput.value;
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const gender = genderEl ? genderEl.value : '';
    const locationValue = locationInput.value.trim();

    msg.textContent = '';

    if (!username || !email || !password || !confirm) {
      msg.style.color = 'red';
      msg.textContent = 'Preencha os campos obrigatórios.';
      return;
    }

    if (password !== confirm) {
      msg.style.color = 'red';
      msg.textContent = 'As passwords não coincidem.';
      return;
    }

    // Load existing users from localStorage
    const usersJson = localStorage.getItem('sp_users');
    /**
     * @type {Array<{
     *  username: string,
     *  email: string,
     *  password: string,
     *  age?: number | null,
     *  gender?: string,
     *  location?: string,
     *  preferences?: { emailTips?: boolean, pushAlerts?: boolean },
     *  lastLogin?: string,
     *  photo?: string
     * }>}
     */
    let users = [];
    try {
      users = usersJson ? JSON.parse(usersJson) : [];
    } catch (err) {
      users = [];
    }

    // Check for duplicate email
    const exists = users.some(u => u.email === email);
    if (exists) {
      msg.style.color = 'red';
      msg.textContent = 'Já existe uma conta com esse e-mail.';
      return;
    }

    // Create user object (note: password stored in plain text for this demo)
    const nowIso = new Date().toISOString();

    const user = {
      username,
      email,
      age: age ? Number(age) : null,
      gender,
      location: locationValue,
      password,
      preferences: {
        emailTips: true,
        pushAlerts: true
      },
      lastLogin: nowIso
    };

    users.push(user);
    localStorage.setItem('sp_users', JSON.stringify(users));

    // Auto-login: set current user and logged flag
    localStorage.setItem('sp_currentUser', JSON.stringify(user));
    localStorage.setItem('sp_isLoggedIn', 'true');

    msg.style.color = 'green';
    msg.textContent = 'Conta criada com sucesso! A iniciar sessão...';

    // Small delay so user sees the message, then redirect to inicio (logged-in landing)
    setTimeout(() => {
      // Redirect to the page used for logged-in users. Many pages link to inicio.html as post-login.
    window.location.href = 'inicio.html';
    }, 1000);
  });
});
