document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.login-form');
  const msg = document.getElementById('login-message');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    msg.textContent = '';

    const identifier = form.querySelector('#username').value.trim();
    const password = form.querySelector('#password').value;

    if (!identifier || !password) {
      msg.textContent = 'Introduza nome de utilizador e password.';
      return;
    }

    let users = [];
    try {
      users = JSON.parse(localStorage.getItem('sp_users') || '[]');
    } catch (err) {
      users = [];
    }

    // allow login by username OR email
    const user = users.find(u => (u.username === identifier || u.email === identifier.toLowerCase()) && u.password === password);

    if (!user) {
      msg.textContent = 'Credenciais inválidas.';
      return;
    }

    // set session
    localStorage.setItem('sp_currentUser', JSON.stringify(user));
    localStorage.setItem('sp_isLoggedIn', 'true');

    // redirect to logged-in landing
    location.href = 'inicio.html';
  });
});
