const USERS_KEY = 'sp_users';
const CURRENT_KEY = 'sp_currentUser';
const DEFAULT_PHOTO = '../multimedia/image/user-icon-placeholder.png';

/**
 * @typedef {Object} SmartPreferences
 * @property {boolean} [emailTips]
 * @property {boolean} [pushAlerts]
 */

/**
 * @typedef {Object} SmartUser
 * @property {string} username
 * @property {string} email
 * @property {string} password
 * @property {number | null} [age]
 * @property {string} [gender]
 * @property {string} [location]
 * @property {string} [photo]
 * @property {SmartPreferences} [preferences]
 * @property {string} [lastLogin]
 */

/**
 * @returns {SmartUser[]}
 */
const readUsers = () => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao ler utilizadores:', error);
    return [];
  }
};

/**
 * @param {SmartUser[]} users
 * @returns {void}
 */
const writeUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * @returns {SmartUser | null}
 */
const readCurrentUser = () => {
  try {
    const current = localStorage.getItem(CURRENT_KEY);
    return current ? JSON.parse(current) : null;
  } catch (error) {
    console.error('Erro ao obter utilizador atual:', error);
    return null;
  }
};

/**
 * @param {SmartUser} user
 * @returns {void}
 */
const writeCurrentUser = (user) => {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
};

/**
 * @param {SmartUser[]} users
 * @param {string} username
 * @returns {number}
 */
const findUserIndex = (users, username) => {
  return users.findIndex((user) => user && user.username === username);
};

/**
 * @param {string | undefined | null} value
 * @returns {string}
 */
const formatDateDisplay = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const countPlants = () => {
  try {
    const stored = localStorage.getItem('myPlants');
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch (error) {
    console.error('Erro ao carregar plantas:', error);
    return 0;
  }
};

const countNotifications = () => {
  try {
    const stored = localStorage.getItem('notificacoes');
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch (error) {
    console.error('Erro ao carregar notificações:', error);
    return 0;
  }
};

const disableProfileForGuests = () => {
  /** @type {NodeListOf<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>} */
  (document.querySelectorAll('#pf_form input, #pf_form select, #pf_form button')).forEach((element) => {
    element.disabled = true;
  });

  /** @type {NodeListOf<HTMLInputElement | HTMLButtonElement>} */
  (document.querySelectorAll('.preferences-card input, .preferences-card button, .security-card button')).forEach((element) => {
    element.disabled = true;
  });
};

/**
 * @typedef {{ label: string, href?: string, onClick?: () => void }} ToastAction
 */

/**
 * @param {string} message
 * @param {'info' | 'error'} [type]
 * @param {ToastAction} [action]
 */
const showToast = (message, type = 'info', action) => {
  const container = document.getElementById('profile-toast');
  if (!container) {
    window.alert(message);
    return;
  }

  const toast = document.createElement('div');
  toast.className = 'profile-toast-message';
  if (type === 'error') {
    toast.classList.add('is-error');
  }

  const content = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = type === 'error' ? 'Algo correu mal' : 'Tudo pronto';
  const text = document.createElement('span');
  text.textContent = message;
  content.appendChild(title);
  content.appendChild(text);

  /**
   * @returns {void}
   */
  const remove = () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  };

  if (action) {
    const actionBtn = document.createElement(action.href ? 'a' : 'button');
    actionBtn.className = 'profile-toast-action';
    actionBtn.textContent = action.label;

    if (action.href) {
      actionBtn.setAttribute('href', action.href);
    } else {
      actionBtn.setAttribute('type', 'button');
    }

    actionBtn.addEventListener('click', (event) => {
      if (action.onClick) {
        event.preventDefault();
        action.onClick();
      }
      remove();
    });

    content.appendChild(actionBtn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Fechar aviso');
  closeBtn.textContent = '×';

  toast.appendChild(content);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  const timer = window.setTimeout(remove, 10500);
  closeBtn.addEventListener('click', () => {
    window.clearTimeout(timer);
    remove();
  });
};

/**
 * @param {string} value
 * @returns {boolean}
 */
const validateEmail = (value) => {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

/**
 * @param {SmartUser | null} user
 * @returns {void}
 */
const syncStats = (user) => {
  /**
   * @param {string} id
   * @param {string | number} value
   */
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = String(value);
    }
  };

  setText('pf_stat_plants', countPlants());
  setText('pf_stat_notifications', countNotifications());
  setText('pf_stat_lastlogin', formatDateDisplay(user?.lastLogin));
};

/**
 * @param {SmartUser | null} user
 * @returns {void}
 */
const updateMetaFromUser = (user) => {
  /**
   * @param {string} id
   * @param {string | undefined | null} value
   */
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value ?? '—';
    }
  };

  setText('pf_meta_email', user?.email);
  setText('pf_meta_location', user?.location);
  setText('pf_meta_gender', user?.gender);
};

document.addEventListener('DOMContentLoaded', () => {
  const preview = /** @type {HTMLImageElement | null} */ (document.getElementById('pf_photo_preview'));
  const inputFile = /** @type {HTMLInputElement | null} */ (document.getElementById('pf_photo_input'));
  const removePhotoBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('pf_remove_photo'));

  if (!preview || !inputFile || !removePhotoBtn) {
    return;
  }

  const formElement = /** @type {HTMLFormElement | null} */ (document.getElementById('pf_form'));
  /**
   * @param {string} id
   * @returns {HTMLElement | null}
   */
  const getEl = (id) => document.getElementById(id);

  let users = readUsers();
  let activeUser = readCurrentUser();

  if (!activeUser) {
    showToast('Inicia sessão para personalizar o teu perfil.', 'error', {
      label: 'Ir para o login',
      onClick: () => {
        window.location.href = 'login.html';
      },
    });
    disableProfileForGuests();
    preview.src = DEFAULT_PHOTO;
    syncStats(null);
    return;
  }

  const userIndex = findUserIndex(users, activeUser.username);
  if (userIndex === -1) {
    showToast('Conta não encontrada. Faz login novamente.', 'error', {
      label: 'Ir para o login',
      onClick: () => {
        window.location.href = 'login.html';
      },
    });
    disableProfileForGuests();
    preview.src = DEFAULT_PHOTO;
    syncStats(null);
    return;
  }

  /**
   * @param {SmartUser | null} user
   * @returns {{ emailTips: boolean, pushAlerts: boolean }}
   */
  const ensurePreferences = (user) => ({
    emailTips: user?.preferences?.emailTips ?? true,
    pushAlerts: user?.preferences?.pushAlerts ?? true,
  });

  const photoState = {
    value: activeUser.photo || null,
  };

  const preferences = ensurePreferences(activeUser);

  /**
   * @param {SmartUser} user
   * @returns {void}
   */
  const fillForm = (user) => {
    const usernameInput = /** @type {HTMLInputElement} */ (getEl('pf_username'));
    const emailInput = /** @type {HTMLInputElement} */ (getEl('pf_email'));
    const ageInput = /** @type {HTMLInputElement} */ (getEl('pf_age'));
    const locationInput = /** @type {HTMLInputElement} */ (getEl('pf_location'));
    const genderSelect = /** @type {HTMLSelectElement} */ (getEl('pf_gender'));
    const emailPref = /** @type {HTMLInputElement} */ (getEl('pf_pref_email'));
    const pushPref = /** @type {HTMLInputElement} */ (getEl('pf_pref_push'));
    const greeting = getEl('pf_greeting_name');

    if (usernameInput) usernameInput.value = user.username || '';
    if (emailInput) emailInput.value = user.email || '';
  if (ageInput) ageInput.value = user.age != null ? String(user.age) : '';
    if (locationInput) locationInput.value = user.location || '';
    if (genderSelect) genderSelect.value = user.gender || '';
    if (emailPref) emailPref.checked = preferences.emailTips;
    if (pushPref) pushPref.checked = preferences.pushAlerts;
    if (greeting) greeting.textContent = user.username || 'Utilizador';
  };

  fillForm(activeUser);

  preview.src = photoState.value || DEFAULT_PHOTO;
  updateMetaFromUser(activeUser);
  syncStats(activeUser);

  if (!activeUser.lastLogin) {
    const withLogin = {
      ...users[userIndex],
      lastLogin: new Date().toISOString(),
      preferences,
    };
    users[userIndex] = withLogin;
    activeUser = withLogin;
    writeUsers(users);
    writeCurrentUser(activeUser);
    syncStats(activeUser);
  }

  /**
   * Comprime e redimensiona uma imagem para evitar exceder o limite do localStorage
   * @param {string} base64 - A imagem em base64
   * @param {number} maxWidth - Largura máxima
   * @param {number} quality - Qualidade da compressão (0-1)
   * @returns {Promise<string>} - A imagem comprimida em base64
   */
  const compressImage = (base64, maxWidth = 400, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Redimensionar mantendo a proporção
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto canvas'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para JPEG com compressão
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = base64;
    });
  };

  inputFile.addEventListener('change', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const file = target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Seleciona uma fotografia válida.', 'error');
      inputFile.value = '';
      return;
    }

    // Verificar tamanho máximo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem é muito grande. Máximo 5MB.', 'error');
      inputFile.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const originalBase64 = typeof reader.result === 'string' ? reader.result : null;
        if (!originalBase64) {
          showToast('Erro ao ler a imagem.', 'error');
          return;
        }
        
        // Comprimir a imagem para evitar problemas de localStorage
        const compressedBase64 = await compressImage(originalBase64, 400, 0.7);
        photoState.value = compressedBase64;
        preview.src = compressedBase64;
        showToast('Pré-visualização atualizada. Guarda para confirmar.');
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        showToast('Erro ao processar a imagem. Tenta outra.', 'error');
      }
    };
    reader.onerror = () => {
      showToast('Erro ao ler o ficheiro.', 'error');
    };
    reader.readAsDataURL(file);
  });

  removePhotoBtn.addEventListener('click', () => {
    photoState.value = null;
    preview.src = DEFAULT_PHOTO;
    showToast('Fotografia removida. Não te esqueças de guardar.');
  });

  formElement?.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  getEl('pf_save')?.addEventListener('click', () => {
    if (!activeUser) {
      showToast('Sessão expirada. Faz login novamente.', 'error');
      return;
    }

    const usernameInput = /** @type {HTMLInputElement} */ (getEl('pf_username'));
    const emailInput = /** @type {HTMLInputElement} */ (getEl('pf_email'));
    const ageInput = /** @type {HTMLInputElement} */ (getEl('pf_age'));
    const locationInput = /** @type {HTMLInputElement} */ (getEl('pf_location'));
    const genderSelect = /** @type {HTMLSelectElement} */ (getEl('pf_gender'));
    const emailPref = /** @type {HTMLInputElement} */ (getEl('pf_pref_email'));
    const pushPref = /** @type {HTMLInputElement} */ (getEl('pf_pref_push'));

    if (!usernameInput || !emailInput || !ageInput || !locationInput || !genderSelect || !emailPref || !pushPref) {
      showToast('Formulário inválido.', 'error');
      return;
    }

    const newUsername = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const ageValue = ageInput.value.trim();
    const location = locationInput.value.trim();
    const gender = genderSelect.value;

    // Validar username
    if (!newUsername || newUsername.length < 2) {
      showToast('O username deve ter pelo menos 2 caracteres.', 'error');
      return;
    }

    // Re-ler os dados mais recentes do localStorage para evitar conflitos
    users = readUsers();
    const currentUserIndex = findUserIndex(users, activeUser.username);
    
    if (currentUserIndex === -1) {
      showToast('Erro ao guardar. Tenta novamente.', 'error');
      return;
    }

    // Verificar se o novo username já existe (se for diferente do atual)
    const oldUsername = activeUser.username;
    if (newUsername.toLowerCase() !== oldUsername.toLowerCase()) {
      const usernameExists = users.some((u, idx) => idx !== currentUserIndex && u.username.toLowerCase() === newUsername.toLowerCase());
      if (usernameExists) {
        showToast('Este username já está em uso.', 'error');
        return;
      }
    }

    if (!validateEmail(email)) {
      showToast('Introduz um email válido.', 'error');
      return;
    }

    /** @type {number | null} */
    let ageNumber = null;
    if (ageValue !== '') {
      const parsedAge = Number(ageValue);
      if (Number.isNaN(parsedAge) || parsedAge < 6 || parsedAge > 120) {
        showToast('Idade inválida.', 'error');
        return;
      }
      ageNumber = parsedAge;
    }

    const updatedUser = {
      ...users[currentUserIndex],
      username: newUsername,
      email,
      age: ageNumber,
      location,
      gender,
      preferences: {
        emailTips: emailPref.checked,
        pushAlerts: pushPref.checked,
      },
    };

    // Atualizar o greeting com o novo username
    const greeting = getEl('pf_greeting_name');
    if (greeting) greeting.textContent = newUsername;

    // Guardar foto se existir
    if (photoState.value) {
      updatedUser.photo = photoState.value;
    } else {
      delete updatedUser.photo;
    }

    // Atualizar arrays e localStorage
    users[currentUserIndex] = updatedUser;
    activeUser = updatedUser;
    
    try {
      writeUsers(users);
      writeCurrentUser(updatedUser);
      updateMetaFromUser(updatedUser);
      syncStats(updatedUser);
      showToast('Alterações guardadas com sucesso!');
    } catch (error) {
      console.error('Erro ao guardar perfil:', error);
      // Verificar se é erro de quota do localStorage
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        showToast('Armazenamento cheio. Tenta uma foto mais pequena.', 'error');
      } else {
        showToast('Erro ao guardar alterações. Tenta novamente.', 'error');
      }
    }
  });

  const changeBox = getEl('pf_change_box');
  getEl('pf_change_show')?.addEventListener('click', () => {
    if (!changeBox) return;
    changeBox.style.display = changeBox.style.display === 'block' ? 'none' : 'block';
  });

  getEl('pf_change_cancel')?.addEventListener('click', () => {
    if (!changeBox) return;
    changeBox.style.display = 'none';
    const currentPwd = /** @type {HTMLInputElement} */ (getEl('pf_current_pwd'));
    const newPwd = /** @type {HTMLInputElement} */ (getEl('pf_new_pwd'));
    const confirmPwd = /** @type {HTMLInputElement} */ (getEl('pf_confirm_new_pwd'));
    if (currentPwd) currentPwd.value = '';
    if (newPwd) newPwd.value = '';
    if (confirmPwd) confirmPwd.value = '';
  });

  getEl('pf_change_submit')?.addEventListener('click', () => {
    const currentPwd = /** @type {HTMLInputElement} */ (getEl('pf_current_pwd'));
    const newPwd = /** @type {HTMLInputElement} */ (getEl('pf_new_pwd'));
    const confirmPwd = /** @type {HTMLInputElement} */ (getEl('pf_confirm_new_pwd'));

    if (!currentPwd || !newPwd || !confirmPwd) {
      showToast('Formulário de password inválido.', 'error');
      return;
    }

    if (!currentPwd.value || !newPwd.value || !confirmPwd.value) {
      showToast('Preenche todos os campos da password.', 'error');
      return;
    }

    if (users[userIndex].password !== currentPwd.value) {
      showToast('A password atual está incorreta.', 'error');
      return;
    }

    if (newPwd.value !== confirmPwd.value) {
      showToast('As novas passwords não coincidem.', 'error');
      return;
    }

    if (newPwd.value.length < 6) {
      showToast('Escolhe uma password com pelo menos 6 caracteres.', 'error');
      return;
    }

    users[userIndex].password = newPwd.value;
    writeUsers(users);
    writeCurrentUser(users[userIndex]);
    currentPwd.value = '';
    newPwd.value = '';
    confirmPwd.value = '';
    if (changeBox) changeBox.style.display = 'none';
    showToast('Password atualizada com sucesso!');
  });

  getEl('pf_logout')?.addEventListener('click', () => {
    const popup = document.createElement('div');
    popup.className = 'delete-confirm-overlay';
    popup.innerHTML = `
      <div class="delete-confirm-container">
        <h3 class="delete-confirm-title">Esta página diz</h3>
        <p class="delete-confirm-message">Tem a certeza que quer terminar sessão?</p>
        <div class="delete-confirm-buttons">
          <button class="delete-confirm-btn" id="confirmLogoutBtn">OK</button>
          <button class="delete-cancel-btn" id="cancelLogoutBtn">Cancelar</button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    popup.querySelector('#confirmLogoutBtn')?.addEventListener('click', () => {
      document.body.removeChild(popup);
      localStorage.removeItem(CURRENT_KEY);
      localStorage.setItem('sp_isLoggedIn', 'false');
      showToast('Sessão terminada. Até já!');
      window.setTimeout(() => {
        window.location.href = 'home.html';
      }, 300);
    });

    popup.querySelector('#cancelLogoutBtn')?.addEventListener('click', () => {
      document.body.removeChild(popup);
    });
  });
});
