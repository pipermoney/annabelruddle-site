// Nav toggle (mobile) + dropdown handling, and scroll reveal.
document.addEventListener('DOMContentLoaded', function () {
  var body = document.body;
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', body.classList.contains('nav-open'));
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.site-nav__item.is-open').forEach(function (i) { i.classList.remove('is-open'); });
  }

  // Desktop dropdown panels use position: fixed (see styles.css) so their
  // coordinates are set here in viewport space, anchored to the trigger
  // button's current position rather than left to CSS containing-block
  // rules that can vary across browsers/ancestors.
  function positionDropdown(trigger, dropdown) {
    if (getComputedStyle(dropdown).position !== 'fixed') return;
    var r = trigger.getBoundingClientRect();
    var width = dropdown.offsetWidth || 260;
    var left = Math.min(r.right - width, window.innerWidth - width - 12);
    left = Math.max(12, left);
    dropdown.style.left = left + 'px';
    dropdown.style.top = (r.bottom + 14) + 'px';
  }

  document.querySelectorAll('.site-nav__item').forEach(function (item) {
    var trigger = item.querySelector('button');
    var dropdown = item.querySelector('.site-nav__dropdown');
    if (!trigger || !dropdown) return;
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = item.classList.contains('is-open');
      closeAllDropdowns();
      if (!wasOpen) {
        positionDropdown(trigger, dropdown);
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      } else {
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
    window.addEventListener('resize', function () {
      if (item.classList.contains('is-open')) positionDropdown(trigger, dropdown);
    });
  });

  document.addEventListener('click', function () {
    closeAllDropdowns();
    document.querySelectorAll('.site-nav__item button[aria-expanded="true"]').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      document.querySelectorAll('.site-nav__item button[aria-expanded="true"]').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Scroll reveal
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }
});
