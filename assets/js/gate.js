// Client-side password gate. NOTE: this is a soft gate only — the password
// lives in this file in plain text and is fully visible to anyone who opens
// dev tools or views source. It keeps casual visitors/search engines out;
// it is NOT a real security boundary (see README for details).
(function () {
  var STORAGE_KEY = 'ar-gate-unlocked';
  var PASSWORD = 'annabel';

  var root = document.documentElement;
  var body = document.body;
  var overlay = document.getElementById('gate-overlay');
  if (!overlay) return;

  var form = overlay.querySelector('.gate-form');
  var input = overlay.querySelector('.gate-form__input');
  var error = overlay.querySelector('.gate-form__error');

  function unlock() {
    try { sessionStorage.setItem(STORAGE_KEY, 'true'); } catch (e) {}
    root.classList.add('gate-unlocked');
    body.classList.remove('gate-locked');
  }

  try {
    if (sessionStorage.getItem(STORAGE_KEY) === 'true') unlock();
  } catch (e) {}

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = (input.value || '').trim().toLowerCase();
      if (value === PASSWORD) {
        if (error) error.hidden = true;
        unlock();
      } else {
        if (error) error.hidden = false;
        input.value = '';
        input.focus();
      }
    });
  }
})();
