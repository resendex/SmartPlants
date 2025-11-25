document.addEventListener('DOMContentLoaded', () => {
  const form = /** @type {HTMLFormElement | null} */ (document.getElementById('recovery-form'));
  const emailInput = /** @type {HTMLInputElement | null} */ (document.getElementById('recovery-email'));
  const feedback = /** @type {HTMLDivElement | null} */ (document.getElementById('recovery-message'));

  if (!form || !emailInput || !feedback) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    feedback.hidden = true;
    feedback.classList.remove('form-feedback--error');

    if (!email || !email.includes('@')) {
      feedback.textContent = 'Introduza um email válido.';
      feedback.classList.add('form-feedback--error');
      feedback.hidden = false;
      emailInput.focus();
      return;
    }

    try {
      /** @type {Array<{ email: string }>} */
      const users = JSON.parse(localStorage.getItem('sp_users') || '[]');
      const matchedUser = users.some((user) => user.email?.toLowerCase?.() === email.toLowerCase());

      if (!matchedUser) {
        // still show success to avoid exposing accounts
        feedback.classList.remove('form-feedback--error');
      }
    } catch (error) {
      // ignore parsing issues and continue showing success message
      console.error('[recuperar_pass] Erro ao ler utilizadores:', error);
    }

  feedback.textContent = 'Foi enviado um email para a recuperação da palavra passe.';
    feedback.hidden = false;
    form.reset();
  });
});
