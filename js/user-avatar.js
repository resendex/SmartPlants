const CURRENT_USER_KEY = 'sp_currentUser';
const DEFAULT_PHOTO_PATH = '../multimedia/image/user-icon-placeholder.png';
const FALLBACK_EMOJI = '👤';
const AVATAR_STYLE_ID = 'sp-avatar-style';

const ensureAvatarStyles = () => {
  if (document.getElementById(AVATAR_STYLE_ID) || !document.head) {
    return;
  }

  const style = document.createElement('style');
  style.id = AVATAR_STYLE_ID;
  style.textContent = `
    .user-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      background: rgba(102, 126, 234, 0.12);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .user-icon:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(102, 126, 234, 0.25);
    }

    .user-icon img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }

    .user-icon .user-placeholder {
      width: 100%;
      height: 100%;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 600;
      color: #ffffff;
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .user-icon .user-placeholder.is-visible {
      display: flex;
    }
  `;

  document.head.appendChild(style);
};

/**
 * @returns {{ username?: string, email?: string, photo?: string } | null}
 */
const readActiveUser = () => {
  try {
    const stored = window.localStorage.getItem(CURRENT_USER_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch (error) {
    console.error('SmartPlants: não foi possível ler o utilizador atual.', error);
    return null;
  }
};

/**
 * @param {string | undefined} text
 * @returns {string}
 */
const buildInitialAvatar = (text) => {
  if (!text) return '';
  const trimmed = text.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '';
};

document.addEventListener('DOMContentLoaded', () => {
  ensureAvatarStyles();

  const activeUser = readActiveUser();
  const photoValue = activeUser?.photo && typeof activeUser.photo === 'string' ? activeUser.photo : null;
  const avatarInitial =
    buildInitialAvatar(activeUser?.username) || buildInitialAvatar(activeUser?.email) || FALLBACK_EMOJI;

  /**
   * @param {HTMLDivElement} placeholder
   * @param {HTMLImageElement} img
   */
  const showPlaceholder = (placeholder, img) => {
    placeholder.textContent = avatarInitial;
    placeholder.classList.add('is-visible');
    placeholder.style.display = 'flex';
    img.style.display = 'none';
  };

  document.querySelectorAll('.user-icon').forEach((icon) => {
    let img = icon.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      icon.prepend(img);
    }

    let placeholder = icon.querySelector('.user-placeholder');
    if (!placeholder) {
      placeholder = document.createElement('div');
      placeholder.className = 'user-placeholder';
      icon.appendChild(placeholder);
    }
    const placeholderDiv = /** @type {HTMLDivElement} */ (placeholder);
  placeholderDiv.classList.remove('is-visible');
  placeholderDiv.style.display = '';

    img.alt = activeUser?.username ? `Foto de ${activeUser.username}` : 'Utilizador';
    img.style.display = 'block';

    const handleError = () => {
      img.removeEventListener('error', handleError);
      img.src = DEFAULT_PHOTO_PATH;
      showPlaceholder(placeholderDiv, img);
    };

    if (photoValue) {
      placeholderDiv.classList.remove('is-visible');
      placeholderDiv.style.display = '';
      img.style.display = 'block';
      img.src = photoValue;
      img.addEventListener('error', handleError);
    } else {
      img.src = DEFAULT_PHOTO_PATH;
      showPlaceholder(placeholderDiv, img);
    }
  });
});
