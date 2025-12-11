// Modo Dark para SmartPlants

function setDarkMode(enabled) {
  document.body.classList.toggle('dark-mode', enabled);
  document.documentElement.classList.toggle('dark-mode', enabled);
  localStorage.setItem('smartplants-darkmode', enabled ? '1' : '0');
}

function getDarkMode() {
  return localStorage.getItem('smartplants-darkmode') === '1';
}

document.addEventListener('DOMContentLoaded', function() {
  setDarkMode(getDarkMode());
  var toggle = document.getElementById('pf_pref_darkmode');
  if (toggle) {
    toggle.checked = getDarkMode();
    toggle.addEventListener('change', function() {
      setDarkMode(toggle.checked);
    });
  }
});
