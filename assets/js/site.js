
/* ============ Ritzy Hotel — site scripts ============ */
/* CENTRAL CONFIG — edit the numbers here and the whole site follows. */
var RITZY = {
  name: 'Ritzy Hotel',
  whatsappNumber: '233204651919',          /* 020 465 1919 in international format (no +) */
  whatsappDisplay: '020 465 1919',
  phones: ['0204651919', '0595611944', '0273680002', '0273680003'],
  email: 'info@ritzyhotelgh.com',
  mapsUrl: 'https://www.google.com/maps/place/Ritzy+Hotel/@6.4223954,-2.7058805,848m/data=!3m2!1e3!4b1!4m6!3m5!1s0xfc4a159e36b4143:0x629ad00cf30612c1!8m2!3d6.4223954!4d-2.7058805',
  facebookUrl: 'https://web.facebook.com/p/RITZY-HOTEL-61594269758020/'
};

(function () {
  'use strict';

  /* ---- WhatsApp links (built from the one config above) ---- */
  function waLink(message) {
    var base = 'https://wa.me/' + RITZY.whatsappNumber;
    return message ? base + '?text=' + encodeURIComponent(message) : base;
  }
  document.querySelectorAll('[data-wa]').forEach(function (el) {
    el.setAttribute('href', waLink(el.getAttribute('data-wa-msg') || ''));
  });

  /* ---- Mobile menu ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
  }

  /* ---- Footer year ---- */
  var yr = document.getElementById('year');
  if (yr) { yr.textContent = new Date().getFullYear(); }

  /* ---- Reveal on scroll ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Date minimums (no past dates) ---- */
  var today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(function (inp) {
    inp.setAttribute('min', today);
  });

  /* ---- Booking enquiry forms ---- */
  function fmtDate(v) { return v || 'Not set'; }

  function buildMessage(f) {
    var lines = [
      'Hello Ritzy Hotel, I would like to enquire about a stay.',
      '',
      'Name: ' + f.name.value.trim(),
      'Phone: ' + f.phone.value.trim(),
      'Email: ' + (f.email.value.trim() || 'Not given'),
      'Check-in: ' + fmtDate(f.checkin.value),
      'Check-out: ' + fmtDate(f.checkout.value),
      'Guests: ' + f.guests.value,
      'Rooms: ' + f.rooms.value,
      'Preferred room: ' + f.room.value,
      'Requests: ' + (f.requests.value.trim() || 'None')
    ];
    return lines.join('\n');
  }

  document.querySelectorAll('.booking-form').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = form.querySelector('.form-error');
      var f = {
        name: form.querySelector('[name="name"]'),
        phone: form.querySelector('[name="phone"]'),
        email: form.querySelector('[name="email"]'),
        checkin: form.querySelector('[name="checkin"]'),
        checkout: form.querySelector('[name="checkout"]'),
        guests: form.querySelector('[name="guests"]'),
        rooms: form.querySelector('[name="rooms"]'),
        room: form.querySelector('[name="room"]'),
        requests: form.querySelector('[name="requests"]')
      };
      function fail(msg) {
        err.textContent = msg;
        err.classList.add('show');
        err.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      err.classList.remove('show');
      if (!f.name.value.trim()) { return fail('Please enter your full name.'); }
      if (!f.phone.value.trim()) { return fail('Please enter your phone number so the hotel can reach you.'); }
      if (!f.checkin.value) { return fail('Please choose a check-in date.'); }
      if (!f.checkout.value) { return fail('Please choose a check-out date.'); }
      if (f.checkout.value <= f.checkin.value) { return fail('Check-out must be after check-in.'); }
      /* Open WhatsApp with the enquiry, then show the confirmation. */
      window.open(waLink(buildMessage(f)), '_blank');
      var fields = form.querySelector('.form-fields');
      var ok = form.querySelector('.form-ok');
      if (fields) { fields.style.display = 'none'; }
      if (ok) { ok.classList.add('show'); ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
    var again = form.querySelector('[data-again]');
    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        var fields = form.querySelector('.form-fields');
        var ok = form.querySelector('.form-ok');
        if (fields) { fields.style.display = ''; }
        if (ok) { ok.classList.remove('show'); }
      });
    }
  });

  /* ---- Hero availability search -> feeds the booking form ---- */
  var searchForm = document.querySelector('.hero-search');
  if (searchForm) {
    searchForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var target = document.querySelector('#book');
      if (!target) { return; }
      var bookForm = target.querySelector('.booking-form') || document.querySelector('.booking-form');
      if (bookForm) {
        var map = { checkin: 'checkin', checkout: 'checkout', guests: 'guests', rooms: 'rooms' };
        Object.keys(map).forEach(function (k) {
          var src = searchForm.querySelector('[name="' + k + '"]');
          var dst = bookForm.querySelector('[name="' + map[k] + '"]');
          if (src && dst && src.value) { dst.value = src.value; }
        });
      }
      target.scrollIntoView({ behavior: 'smooth' });
      var nameField = bookForm && bookForm.querySelector('[name="name"]');
      if (nameField) { setTimeout(function () { nameField.focus({ preventScroll: true }); }, 700); }
    });
  }

  /* ---- "Book This Room" buttons ---- */
  document.querySelectorAll('[data-book-room]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var room = btn.getAttribute('data-book-room');
      var target = document.querySelector('#book');
      if (!target) { return; }
      var bookForm = target.querySelector('.booking-form') || document.querySelector('.booking-form');
      if (bookForm) {
        var sel = bookForm.querySelector('[name="room"]');
        if (sel) { sel.value = room; }
      }
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---- Room detail thumbnails ---- */
  var mainImg = document.querySelector('.room-detail .img-frame img');
  document.querySelectorAll('.thumb-row img').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      if (!mainImg) { return; }
      mainImg.src = thumb.getAttribute('data-full') || thumb.src;
      mainImg.alt = thumb.alt;
      document.querySelectorAll('.thumb-row img').forEach(function (t) { t.classList.remove('active'); });
      thumb.classList.add('active');
    });
  });

  /* ---- Gallery filter + lightbox ---- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var items = document.querySelectorAll('.masonry figure');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var cat = btn.getAttribute('data-filter');
      items.forEach(function (it) {
        it.style.display = (cat === 'all' || it.getAttribute('data-cat') === cat) ? '' : 'none';
      });
    });
  });

  var lb = document.querySelector('.lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lb-cap');
    var figures = Array.prototype.slice.call(document.querySelectorAll('.masonry figure'));
    var current = 0;
    function visibleFigures() { return figures.filter(function (f) { return f.style.display !== 'none'; }); }
    function show(i) {
      var vis = visibleFigures();
      if (!vis.length) { return; }
      current = (i + vis.length) % vis.length;
      var img = vis[current].querySelector('img');
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = vis[current].querySelector('figcaption').textContent;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }
    figures.forEach(function (fig, i) {
      fig.addEventListener('click', function () { show(i); });
    });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(current - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) { close(); } });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) { return; }
      if (e.key === 'Escape') { close(); }
      if (e.key === 'ArrowLeft') { show(current - 1); }
      if (e.key === 'ArrowRight') { show(current + 1); }
    });
  }
})();

/* ---- Live preview expiry countdown (7 days) ---- */
(function () {
  /* Live preview expiry — change PREVIEW_EXPIRY to move the date, or remove
     the preview bar and this script to take the countdown off the site. */
  var PREVIEW_EXPIRY = new Date("2026-12-02T23:59:00Z");
  var bar = document.getElementById("previewBar");
  var expired = document.getElementById("previewExpired");
  /* Keep the sticky header sitting just below the countdown bar, whatever
     height the bar wraps to (desktop one line, mobile three). */
  function syncHeaderOffset() {
    var h = bar ? bar.offsetHeight : 0;
    document.documentElement.style.setProperty("--preview-h", h + "px");
  }
  syncHeaderOffset();
  window.addEventListener("resize", syncHeaderOffset);
  /* Slim on scroll: keep the bar pinned, shrink all the text (nothing hidden). */
  var slim = false;
  function onScroll() {
    var shouldSlim = window.scrollY > 40;
    if (shouldSlim !== slim) {
      slim = shouldSlim;
      if (bar) bar.classList.toggle("slim", slim);
      syncHeaderOffset();
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  function pad(n) { return String(n).padStart(2, "0"); }
  function set(id, v) { var el = document.getElementById(id); if (el) el.textContent = pad(v); }
  function tick() {
    var diff = PREVIEW_EXPIRY - Date.now();
    if (diff <= 0) {
      if (bar) bar.style.display = "none";
      if (expired) expired.hidden = false;
      syncHeaderOffset();
      return;
    }
    var s = Math.floor(diff / 1000);
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600); s -= h * 3600;
    var m = Math.floor(s / 60); s -= m * 60;
    set("pvDays", d); set("pvHours", h); set("pvMins", m); set("pvSecs", s);
  }
  tick();
  setInterval(tick, 1000);
})();

/* ---- Back to top (small button above the WhatsApp button) ---- */
(function () {
  var btn = document.createElement("button");
  btn.className = "to-top";
  btn.type = "button";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
  document.body.appendChild(btn);
  var shown = false;
  function onScroll() {
    var shouldShow = window.scrollY > 300;
    if (shouldShow !== shown) {
      shown = shouldShow;
      btn.classList.toggle("show", shown);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  btn.addEventListener("click", function () {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
})();
