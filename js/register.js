document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.register-form');
  const msg = document.getElementById('register-message');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = form.querySelector('#username').value.trim();
    const email = form.querySelector('#email').value.trim().toLowerCase();
    const age = form.querySelector('#age').value;
    const password = form.querySelector('#password').value;
    const confirm = form.querySelector('#confirm-password').value;
    const genderEl = form.querySelector('input[name="gender"]:checked');
    const gender = genderEl ? genderEl.value : '';
    const location = form.querySelector('#location').value.trim();

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
    const user = {
      username,
      email,
      age: age ? Number(age) : null,
      gender,
      location,
      password
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
      location.href = 'inicio.html';
    }, 1000);
  });
});
