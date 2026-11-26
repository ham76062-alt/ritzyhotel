
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

  /* ---- Scroll to the booking form ----
     Lazy images above the form can still be loading and push it down
     while a smooth scroll runs, so the first scroll can land short.
     Re-aim once the layout has settled (900ms) if it is still off. */
  function scrollToBook(target) {
    target.scrollIntoView({ behavior: 'smooth' });
    setTimeout(function () {
      var top = target.getBoundingClientRect().top;
      if (top > 120 || top < -120) { target.scrollIntoView({ behavior: 'smooth' }); }
    }, 900);
  }

  /* ---- Prices from the staff dashboard (demo store) ---- */
  /* Room cards, room detail pages and footer links carry a
     <span data-price-for="room-id"> around the displayed price; booking-form
     options carry data-room="room-id". When the dashboard changes a price,
     the public site shows it on the next load. Hardcoded prices stay as
     the fallback when the store is unavailable. */
  if (window.RitzyDemo) {
    var money = function (n) { return 'GH\u20b5' + Number(n).toLocaleString('en-GH'); };
    window.RitzyDemo.getRooms().forEach(function (r) {
      document.querySelectorAll('[data-price-for="' + r.id + '"]').forEach(function (el) {
        el.textContent = money(r.price);
      });
      document.querySelectorAll('option[data-room="' + r.id + '"]').forEach(function (opt) {
        opt.textContent = r.name + ' \u2014 ' + money(r.price) + ' / night';
      });
    });
    document.querySelectorAll('[data-min-price]').forEach(function (el) {
      el.textContent = money(window.RitzyDemo.getMinPrice());
    });
  }

  /* ---- Tonight availability badges (rooms) ----
     Every room card and room detail page carries an empty
     <p class="avail-badge" data-avail-for="room-id"> under the price.
     The store decides tonight: blocked in the calendar, or active
     bookings covering tonight already filling every room of the type,
     means "Not available". Plain text only — no background, no border,
     no padding. Read at page load, so a dashboard change flips the
     badge on the next load. */
  document.querySelectorAll('[data-avail-for]').forEach(function (el) {
    if (!window.RitzyDemo) { return; }
    var ok = window.RitzyDemo.isAvailableTonight(el.getAttribute('data-avail-for'));
    el.textContent = ok ? 'Available' : 'Not available';
    el.classList.add(ok ? 'avail-ok' : 'avail-no');
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
      /* Check the room is free, then save the enquiry in the staff dashboard
         as "New" (no guest is created until staff confirm it). */
      if (window.RitzyDemo) {
        var avail = window.RitzyDemo.check(f.room.value, f.checkin.value, f.checkout.value);
        if (!avail.ok) { return fail(avail.reason); }
        window.RitzyDemo.addBooking({
          guest: f.name.value.trim(),
          phone: f.phone.value.trim(),
          email: f.email.value.trim(),
          room: f.room.value,
          checkin: f.checkin.value,
          checkout: f.checkout.value,
          guests: f.guests.value,
          requests: f.requests.value.trim(),
          status: 'New'
        });
      }
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

  /* ---- Hero availability search -> checks the staff dashboard store,
     then fills the booking form for the room type the visitor picks ---- */
  var searchForm = document.querySelector('.hero-search');
  if (searchForm) {
    var heroResult = document.getElementById('heroResult');
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function showHeroResult(kind, html) {
      if (!heroResult) { return; }
      heroResult.className = 'hero-result show ' + kind;
      heroResult.innerHTML = html;
    }
    function fillBookingForm(roomName) {
      var target = document.querySelector('#book');
      if (!target) { return null; }
      var bookForm = target.querySelector('.booking-form') || document.querySelector('.booking-form');
      if (bookForm) {
        var map = { checkin: 'checkin', checkout: 'checkout', guests: 'guests', rooms: 'rooms' };
        Object.keys(map).forEach(function (k) {
          var src = searchForm.querySelector('[name="' + k + '"]');
          var dst = bookForm.querySelector('[name="' + map[k] + '"]');
          if (src && dst && src.value) { dst.value = src.value; }
        });
        if (roomName) {
          var sel = bookForm.querySelector('[name="room"]');
          if (sel) { sel.value = roomName; }
        }
      }
      return target;
    }
    function continueToBooking(roomName) {
      var target = fillBookingForm(roomName);
      if (!target) { return; }
      scrollToBook(target);
      var bookForm = target.querySelector('.booking-form') || document.querySelector('.booking-form');
      var nameField = bookForm && bookForm.querySelector('[name="name"]');
      if (nameField) { setTimeout(function () { nameField.focus({ preventScroll: true }); }, 1700); }
    }
    function roomsRequested() {
      var v = (searchForm.querySelector('[name="rooms"]').value || '1 room');
      var n = parseInt(v, 10);
      return isNaN(n) || n < 1 ? 1 : n;
    }
    function runHeroCheck() {
      var checkin = searchForm.querySelector('[name="checkin"]').value;
      var checkout = searchForm.querySelector('[name="checkout"]').value;
      if (!checkin) { showHeroResult('no', '<p>Please choose a check-in date.</p>'); return; }
      if (!checkout) { showHeroResult('no', '<p>Please choose a check-out date.</p>'); return; }
      var today = new Date().toISOString().split('T')[0];
      if (checkin < today) { showHeroResult('no', '<p>Check-in cannot be in the past.</p>'); return; }
      if (checkout <= checkin) { showHeroResult('no', '<p>Check-out must be after check-in.</p>'); return; }
      var demo = window.RitzyDemo;
      if (!demo) { continueToBooking(); return; }
      var rooms = roomsRequested();
      var nights = demo.nightsBetween(checkin, checkout);
      var nightWord = nights === 1 ? ' night' : ' nights';
      var available = demo.checkAll(checkin, checkout, rooms).filter(function (r) { return r.available; });
      if (available.length) {
        var html = '';
        available.forEach(function (r) {
          html += '<button type="button" class="hero-alt" data-hero-room="' + esc(r.name) + '">' +
            esc(r.name) + ' is available from ' + esc(demo.prettyDate(checkin)) + ' to ' + esc(demo.prettyDate(checkout)) +
            ' (' + nights + nightWord + ') — GH₵' + demo.fmt(r.price) + ' / night</button>';
        });
        showHeroResult('ok', html);
        return;
      }
      showHeroResult('no', '<p>Sorry — no rooms are available from ' + esc(demo.prettyDate(checkin)) +
        ' to ' + esc(demo.prettyDate(checkout)) + ' for ' + rooms + (rooms === 1 ? ' room' : ' rooms') +
        '. Please pick different dates.</p>');
    }
    searchForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      runHeroCheck();
    });
    if (heroResult) {
      heroResult.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-hero-room]');
        if (btn) { continueToBooking(btn.getAttribute('data-hero-room')); }
      });
    }
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
      scrollToBook(target);
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
