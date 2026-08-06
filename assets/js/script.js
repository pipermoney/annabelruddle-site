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

  document.querySelectorAll('.site-nav__item').forEach(function (item) {
    var trigger = item.querySelector('button');
    if (!trigger) return;
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = item.classList.contains('is-open');
      document.querySelectorAll('.site-nav__item.is-open').forEach(function (i) { i.classList.remove('is-open'); });
      if (!wasOpen) item.classList.add('is-open');
    });
  });

  document.addEventListener('click', function () {
    document.querySelectorAll('.site-nav__item.is-open').forEach(function (i) { i.classList.remove('is-open'); });
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
