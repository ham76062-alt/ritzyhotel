/* Ritzy Hotel — staff dashboard (DEMO).
   Browser-only: every change is saved to the demo store in localStorage
   (assets/js/demo-store.js). Nothing leaves this browser. Login is a demo
   gate — any email and any password works; the session lives in
   sessionStorage until the tab is closed or the user logs out. */
(function () {
  'use strict';

  var store = window.RitzyDemo;
  var SESSION_KEY = 'ritzy-admin';
  var STATUSES = ['New', 'Confirmed', 'Cancelled', 'Completed'];

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(n) { return 'GH₵' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function dstr(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseDay(s) {
    var p = String(s || '').split('-');
    if (p.length !== 3) { return null; }
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  if (!store) {
    var login = $('adminLogin');
    if (login) {
      var err = login.querySelector('.form-error');
      if (err) { err.textContent = 'The demo store could not load. Please reload the page.'; err.classList.add('show'); }
    }
    return;
  }

  /* ---------- login gate ---------- */
  function isLoggedIn() {
    try { return !!sessionStorage.getItem(SESSION_KEY); } catch (e) { return false; }
  }
  function showApp() {
    $('adminLogin').style.display = 'none';
    $('adminApp').style.display = '';
    var email = '';
    try { email = sessionStorage.getItem(SESSION_KEY) || ''; } catch (e) {}
    $('adminUser').textContent = email;
    renderAll();
  }
  function showLogin() {
    $('adminApp').style.display = 'none';
    $('adminLogin').style.display = '';
  }
  var loginForm = $('adminLoginForm');
  loginForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var err = loginForm.querySelector('.form-error');
    var email = loginForm.querySelector('[name="email"]').value.trim();
    var pass = loginForm.querySelector('[name="password"]').value;
    err.classList.remove('show');
    if (!email || !pass) {
      err.textContent = 'Enter any email and any password — this is a demo, nothing is checked.';
      err.classList.add('show');
      return;
    }
    try { sessionStorage.setItem(SESSION_KEY, email); } catch (e) {}
    showApp();
  });
  $('adminLogout').addEventListener('click', function () {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    showLogin();
  });
  $('adminReset').addEventListener('click', function () {
    if (!window.confirm('Reset the demo? All bookings, guests, prices, blocked dates and details go back to the sample data.')) { return; }
    store.resetDemo();
    avYear = null; avMonth = null;
    crmView = 'guests'; guestFilter = 'all'; guestSearchQ = ''; selectedGuestId = null;
    var gs = $('guestSearch'); if (gs) { gs.value = ''; }
    var baf = $('bookingAddForm'); if (baf) { baf.style.display = 'none'; baf.reset(); }
    renderAll();
    window.scrollTo(0, 0);
  });

  /* ---------- tabs ---------- */
  var currentTab = 'bookings';
  document.querySelectorAll('.admin-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentTab = btn.getAttribute('data-tab');
      document.querySelectorAll('.admin-tab').forEach(function (b) { b.classList.toggle('active', b === btn); });
      document.querySelectorAll('.admin-panel').forEach(function (p) { p.style.display = p.id === 'tab-' + currentTab ? '' : 'none'; });
      renderTab(currentTab);
    });
  });

  function renderAll() {
    fillRoomSelects();
    renderTab(currentTab);
  }
  function renderTab(tab) {
    if (tab === 'bookings') { renderBookings(); }
    else if (tab === 'guests') { renderGuests(); }
    else if (tab === 'rooms') { renderRooms(); }
    else if (tab === 'availability') { renderAvailability(); }
    else if (tab === 'details') { renderDetails(); }
  }

  function fillRoomSelects() {
    var rooms = store.getRooms();
    [['fltRoom', 'All rooms'], ['avRoom', null]].forEach(function (pair) {
      var sel = $(pair[0]);
      if (!sel) { return; }
      var cur = sel.value;
      sel.innerHTML = (pair[1] ? '<option value="">' + esc(pair[1]) + '</option>' : '') +
        rooms.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>'; }).join('');
      if (cur && rooms.some(function (r) { return r.id === cur; })) { sel.value = cur; }
    });
    var av = $('avRoom');
    if (av && !av.value) { av.value = rooms.length ? rooms[0].id : ''; }
    /* Add-booking form: room options carry the nightly price. */
    var ba = $('ba-room');
    if (ba) {
      var curBa = ba.value;
      ba.innerHTML = rooms.map(function (r) {
        return '<option value="' + esc(r.name) + '">' + esc(r.name) + ' — GH₵' + store.fmt(r.price) + ' / night</option>';
      }).join('');
      if (curBa && rooms.some(function (r) { return r.name === curBa; })) { ba.value = curBa; }
    }
  }

  /* ---------- bookings ---------- */
  function renderBookings() {
    var list = store.getBookings();
    var statusF = $('fltStatus').value;
    var roomF = $('fltRoom').value;
    var filtered = list.filter(function (b) {
      if (statusF && b.status !== statusF) { return false; }
      if (roomF && b.roomId !== roomF) { return false; }
      return true;
    });
    var active = list.filter(function (b) { return b.status !== 'Cancelled'; });
    var revenue = active.reduce(function (sum, b) { return sum + (b.total || 0); }, 0);
    $('bookingStats').innerHTML =
      '<div class="admin-stat"><b>' + list.length + '</b><span>Bookings</span></div>' +
      '<div class="admin-stat"><b>' + list.filter(function (b) { return b.status === 'New'; }).length + '</b><span>New</span></div>' +
      '<div class="admin-stat"><b>' + list.filter(function (b) { return b.status === 'Confirmed'; }).length + '</b><span>Confirmed</span></div>' +
      '<div class="admin-stat"><b>' + fmt(revenue) + '</b><span>Value (not cancelled)</span></div>';
    var el = $('bookingList');
    if (!filtered.length) {
      el.innerHTML = '<p class="admin-note">No bookings match these filters.</p>';
      return;
    }
    var rows = filtered.map(function (b) {
      var opts = STATUSES.map(function (s) {
        return '<option value="' + s + '"' + (b.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('');
      return '<tr>' +
        '<td data-label="Guest"><b>' + esc(b.guest) + '</b>' + (b.sample ? '<span class="sample-pill">Sample</span>' : '') + '<br><span style="color:var(--muted);font-size:.85rem">' + esc(b.phone || '') + '</span></td>' +
        '<td data-label="Room">' + esc(b.room) + '</td>' +
        '<td data-label="Dates">' + esc(b.checkin) + ' → ' + esc(b.checkout) + '</td>' +
        '<td data-label="Nights">' + (b.nights || '') + '</td>' +
        '<td data-label="Guests">' + esc(b.guests || '') + '</td>' +
        '<td data-label="Total">' + (b.total != null ? fmt(b.total) : '—') + '</td>' +
        '<td data-label="Status"><select data-booking-status="' + esc(b.id) + '">' + opts + '</select></td>' +
        '<td data-label=""><button class="btn ghost-dark small" type="button" data-booking-delete="' + esc(b.id) + '">Delete</button></td>' +
        '</tr>';
    }).join('');
    el.innerHTML = '<table class="admin-table"><thead><tr><th>Guest</th><th>Room</th><th>Dates</th><th>Nights</th><th>Guests</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
    el.querySelectorAll('[data-booking-status]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var id = sel.getAttribute('data-booking-status');
        var old = null;
        store.getBookings().forEach(function (b) { if (b.id === id) { old = b.status; } });
        store.updateBooking(id, { status: sel.value });
        /* Guests: a booking only becomes a guest record when staff
           confirm it; completing it adds the stay to their history.
           A WhatsApp enquiry ("New") never creates a guest. */
        if (old !== sel.value) { store.syncBookingGuest(id); }
        renderBookings();
      });
    });
    el.querySelectorAll('[data-booking-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!window.confirm('Delete this booking? This cannot be undone.')) { return; }
        var id = btn.getAttribute('data-booking-delete');
        store.deleteBooking(id);
        store.removeBookingStay(id);
        renderBookings();
      });
    });
  }
  $('fltStatus').addEventListener('change', renderBookings);
  $('fltRoom').addEventListener('change', renderBookings);

  /* ---------- add booking (staff) ----------
     Staff add a booking here with room, dates, guests, total and status —
     the Guests tab has no add form. The booking is saved with the chosen
     status, then the guest wiring runs: Confirmed -> guest appears with
     the upcoming stay; Completed -> the stay joins their history; New
     (a WhatsApp enquiry) -> no guest is created. */
  function bookingAddCalc() {
    var roomName = $('ba-room').value;
    var ci = $('ba-checkin').value, co = $('ba-checkout').value;
    var nights = store.nightsBetween(ci, co);
    var price = roomName ? store.getPrice(roomName) : null;
    $('ba-nights').textContent = nights > 0 ? nights + (nights === 1 ? ' night' : ' nights') : '—';
    var totalEl = $('ba-total');
    if (price != null && nights > 0) { totalEl.value = price * nights; }
    else if (nights <= 0) { totalEl.value = ''; }
  }
  $('bookingAddBtn').addEventListener('click', function () {
    var f = $('bookingAddForm');
    var show = f.style.display === 'none';
    f.style.display = show ? '' : 'none';
    $('bookingAddSaved').textContent = '';
    if (show) {
      var today = dstr(new Date());
      $('ba-checkin').min = today;
      $('ba-checkout').min = today;
      bookingAddCalc();
    }
  });
  $('bookingAddCancel').addEventListener('click', function () {
    $('bookingAddForm').style.display = 'none';
    $('bookingAddForm').reset();
    $('ba-status').value = 'Confirmed';
    bookingAddCalc();
  });
  function onBaFieldChange() {
    if ($('ba-checkin').value) {
      var d = parseDay($('ba-checkin').value);
      if (d) {
        d.setDate(d.getDate() + 1);
        $('ba-checkout').min = dstr(d);
      }
    }
    bookingAddCalc();
  }
  ['ba-room', 'ba-checkin', 'ba-checkout'].forEach(function (id) {
    $(id).addEventListener('change', onBaFieldChange);
    /* Date fields fire 'input' when picked/typed — calc live on both. */
    if (id !== 'ba-room') { $(id).addEventListener('input', onBaFieldChange); }
  });
  $('bookingAddForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = $('bookingAddForm');
    var err = f.querySelector('.form-error');
    var saved = $('bookingAddSaved');
    err.classList.remove('show');
    saved.textContent = '';
    var name = f.querySelector('[name="name"]').value.trim();
    var phone = f.querySelector('[name="phone"]').value.trim();
    var room = f.querySelector('[name="room"]').value;
    var ci = f.querySelector('[name="checkin"]').value;
    var co = f.querySelector('[name="checkout"]').value;
    var guests = f.querySelector('[name="guests"]').value;
    var status = f.querySelector('[name="status"]').value;
    var totalVal = f.querySelector('[name="total"]').value;
    if (!name) { err.textContent = 'Enter the guest\u2019s name.'; err.classList.add('show'); return; }
    if (!phone) { err.textContent = 'Enter the guest\u2019s phone number.'; err.classList.add('show'); return; }
    if (!room) { err.textContent = 'Choose a room type.'; err.classList.add('show'); return; }
    if (!ci) { err.textContent = 'Please choose a check-in date.'; err.classList.add('show'); return; }
    if (!co) { err.textContent = 'Please choose a check-out date.'; err.classList.add('show'); return; }
    if (co <= ci) { err.textContent = 'Check-out must be after check-in.'; err.classList.add('show'); return; }
    if (ci < dstr(new Date())) { err.textContent = 'Check-in cannot be in the past.'; err.classList.add('show'); return; }
    var total = totalVal === '' ? null : Math.round(Number(totalVal));
    if (total != null && !(total > 0)) { err.textContent = 'Enter a total above 0.'; err.classList.add('show'); return; }
    var chk = store.check(room, ci, co);
    if (!chk.ok) { err.textContent = chk.reason; err.classList.add('show'); return; }
    var booking = store.addBooking({ guest: name, phone: phone, room: room, checkin: ci, checkout: co, guests: guests, total: total, status: status });
    store.syncBookingGuest(booking.id);
    f.reset();
    $('ba-status').value = 'Confirmed';
    f.style.display = 'none';
    bookingAddCalc();
    renderBookings();
    saved.textContent = 'Booking saved.';
  });

  /* ---------- guests (CRM) ----------
     Stats and insights are computed from the guest records in the demo
     store, so they move when a guest is added or a stay is completed. */
  var crmView = 'guests';
  var guestFilter = 'all';
  var guestSearchQ = '';
  var selectedGuestId = null;

  document.querySelectorAll('.crm-subtab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      crmView = btn.getAttribute('data-crm');
      document.querySelectorAll('.crm-subtab').forEach(function (b) { b.classList.toggle('active', b === btn); });
      $('crm-guests').style.display = crmView === 'guests' ? '' : 'none';
      $('crm-followups').style.display = crmView === 'followups' ? '' : 'none';
      $('crm-insights').style.display = crmView === 'insights' ? '' : 'none';
      renderGuests();
    });
  });
  document.querySelectorAll('[data-guest-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      guestFilter = btn.getAttribute('data-guest-filter');
      document.querySelectorAll('[data-guest-filter]').forEach(function (b) { b.classList.toggle('active', b === btn); });
      renderGuestList();
    });
  });
  $('guestSearch').addEventListener('input', function () {
    guestSearchQ = $('guestSearch').value.trim().toLowerCase();
    renderGuestList();
  });

  function renderGuests() {
    if (crmView === 'followups') { renderFollowups(); }
    else if (crmView === 'insights') { renderInsights(); }
    else { renderGuestList(); }
  }
  function guestTagHtml(g, st) {
    var tags = [];
    if (st.isVip) { tags.push('<span class="guest-tag vip">VIP</span>'); }
    if (st.isRepeat) { tags.push('<span class="guest-tag">Repeat guest</span>'); }
    else if (st.isNew) { tags.push('<span class="guest-tag">New</span>'); }
    return '<span class="guest-tags">' + tags.join('') + '</span>';
  }
  function renderGuestList() {
    var guests = store.getGuests();
    var repeat = guests.filter(function (g) { return store.guestStats(g).isRepeat; }).length;
    var today = dstr(new Date());
    var weekEnd = dstr(new Date(Date.now() + 7 * 86400000));
    var checkins = store.getBookings().filter(function (b) {
      return (b.status === 'New' || b.status === 'Confirmed') && b.checkin >= today && b.checkin <= weekEnd;
    }).length;
    var due = store.getFollowups().filter(function (f) { return !f.sent; }).length;
    $('guestStats').innerHTML =
      '<div class="admin-stat"><b>' + guests.length + '</b><span>Total guests</span></div>' +
      '<div class="admin-stat"><b>' + repeat + '</b><span>Repeat guests</span></div>' +
      '<div class="admin-stat"><b>' + checkins + '</b><span>Check-ins this week</span></div>' +
      '<div class="admin-stat"><b>' + due + '</b><span>Follow-ups due</span></div>';
    var filtered = guests.filter(function (g) {
      var st = store.guestStats(g);
      if (guestFilter === 'repeat' && !st.isRepeat) { return false; }
      if (guestFilter === 'new' && !st.isNew) { return false; }
      if (guestFilter === 'vip' && !st.isVip) { return false; }
      if (guestSearchQ && g.name.toLowerCase().indexOf(guestSearchQ) === -1) { return false; }
      return true;
    });
    var el = $('guestList');
    if (!filtered.length) {
      el.innerHTML = '<p class="admin-note">No guests match this search.</p>';
      renderGuestDetail();
      return;
    }
    var rows = filtered.map(function (g) {
      var st = store.guestStats(g);
      return '<tr class="guest-row" data-guest-row="' + esc(g.id) + '">' +
        '<td data-label="Guest"><b>' + esc(g.name) + '</b>' + (g.sample ? '<span class="sample-pill">Sample</span>' : '') + '<br><span style="color:var(--muted);font-size:.85rem">' + esc(g.phone || '') + '</span></td>' +
        '<td data-label="Stays">' + st.stays + (st.upcoming ? ' <span style="color:var(--muted)">(+' + st.upcoming + ' upcoming)</span>' : '') + '</td>' +
        '<td data-label="Last stay">' + (st.lastStay ? esc(store.prettyDate(st.lastStay)) : '—') + '</td>' +
        '<td data-label="Total spent">' + fmt(st.total) + '</td>' +
        '<td data-label="Tags">' + guestTagHtml(g, st) + '</td>' +
        '</tr>';
    }).join('');
    el.innerHTML = '<table class="admin-table"><thead><tr><th>Guest</th><th>Stays</th><th>Last stay</th><th>Total spent</th><th>Tags</th></tr></thead><tbody>' + rows + '</tbody></table>';
    el.querySelectorAll('[data-guest-row]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        selectedGuestId = tr.getAttribute('data-guest-row');
        renderGuestDetail();
        var d = $('guestDetail');
        if (d) { d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      });
    });
    renderGuestDetail();
  }
  function renderGuestDetail() {
    var el = $('guestDetail');
    if (!el) { return; }
    var g = selectedGuestId ? store.getGuest(selectedGuestId) : null;
    if (!g) { el.innerHTML = ''; return; }
    var st = store.guestStats(g);
    var done = (g.stays || []).filter(function (s) { return s.status === 'Completed'; }).slice()
      .sort(function (a, b) { return String(b.checkout).localeCompare(String(a.checkout)); });
    var upcoming = (g.stays || []).filter(function (s) { return s.status === 'Confirmed'; });
    function stayRows(list) {
      return list.map(function (s) {
        return '<tr><td data-label="Dates">' + esc(store.prettyDate(s.checkin)) + ' → ' + esc(store.prettyDate(s.checkout)) + '</td>' +
          '<td data-label="Room">' + esc(s.room) + '</td>' +
          '<td data-label="Nights">' + (s.nights || '') + '</td>' +
          '<td data-label="Total">' + fmt(s.total || 0) + '</td>' +
          '<td data-label="Status">' + esc(s.status) + '</td></tr>';
      }).join('');
    }
    el.innerHTML = '<div class="guest-detail">' +
      '<h3>' + esc(g.name) + '</h3>' +
      '<p class="meta">' + esc(g.phone || '') + (g.email ? ' · ' + esc(g.email) : '') + ' · ' + st.stays + ' stay' + (st.stays === 1 ? '' : 's') + ' · ' + fmt(st.total) + ' spent</p>' +
      '<p>' + guestTagHtml(g, st) + '</p>' +
      (g.prefs ? '<p><b>Preferences:</b> ' + esc(g.prefs) + '</p>' : '') +
      (upcoming.length ? '<h4 style="margin:16px 0 8px">Upcoming stay</h4><table class="admin-table"><thead><tr><th>Dates</th><th>Room</th><th>Nights</th><th>Total</th><th>Status</th></tr></thead><tbody>' + stayRows(upcoming) + '</tbody></table>' : '') +
      (done.length ? '<h4 style="margin:16px 0 8px">Stay history</h4><table class="admin-table"><thead><tr><th>Dates</th><th>Room</th><th>Nights</th><th>Total</th><th>Status</th></tr></thead><tbody>' + stayRows(done) + '</tbody></table>' : '<p class="admin-note">No completed stays yet.</p>') +
      '<div class="field" style="margin-top:16px"><label for="guestNotes">Staff notes</label><textarea id="guestNotes" placeholder="Notes only staff can see — e.g. prefers a quiet room, allergic to peanuts">' + esc(g.notes || '') + '</textarea></div>' +
      '<button class="btn small" type="button" id="guestNotesSave">Save notes</button>' +
      '<span class="admin-saved" id="guestNotesSaved" role="status"></span>' +
      '</div>';
    $('guestNotesSave').addEventListener('click', function () {
      store.updateGuest(g.id, { notes: $('guestNotes').value });
      $('guestNotesSaved').textContent = 'Saved.';
    });
  }
  function renderFollowups() {
    var list = store.getFollowups();
    var el = $('followupList');
    if (!list.length) { el.innerHTML = '<p class="admin-note">No follow-ups.</p>'; return; }
    el.innerHTML = list.map(function (f) {
      return '<div class="followup-card' + (f.sent ? ' sent' : '') + '">' +
        '<h3>' + esc(f.guest) + '</h3>' +
        '<p>' + esc(f.reason) + '</p>' +
        '<button class="btn ghost-dark small" type="button" data-fu-show="' + esc(f.id) + '">' + (f.sent ? 'Message sent' : 'Show message') + '</button> ' +
        (f.sent
          ? '<button class="btn ghost-dark small" type="button" data-fu-undo="' + esc(f.id) + '">Mark not sent</button>'
          : '<button class="btn small" type="button" data-fu-sent="' + esc(f.id) + '">Mark as sent</button>') +
        '<div class="followup-msg" data-fu-msg="' + esc(f.id) + '" style="display:none">' + esc(f.message) + '</div>' +
        '</div>';
    }).join('');
    el.querySelectorAll('[data-fu-show]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-fu-show');
        var msg = el.querySelector('[data-fu-msg="' + id + '"]');
        var show = msg.style.display === 'none';
        msg.style.display = show ? '' : 'none';
        btn.textContent = show ? 'Hide message' : 'Show message';
      });
    });
    el.querySelectorAll('[data-fu-sent]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        store.markFollowupSent(btn.getAttribute('data-fu-sent'), true);
        renderFollowups();
      });
    });
    el.querySelectorAll('[data-fu-undo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        store.markFollowupSent(btn.getAttribute('data-fu-undo'), false);
        renderFollowups();
      });
    });
  }
  function renderInsights() {
    var guests = store.getGuests();
    var repeat = guests.filter(function (g) { return store.guestStats(g).isRepeat; }).length;
    var rate = guests.length ? Math.round(repeat / guests.length * 100) : 0;
    var roomCounts = {};
    var monthCounts = {};
    var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    guests.forEach(function (g) {
      (g.stays || []).forEach(function (s) {
        if (s.status !== 'Completed') { return; }
        roomCounts[s.room] = (roomCounts[s.room] || 0) + 1;
        var m = parseDay(s.checkin);
        if (m) { var key = MONTHS_SHORT[m.getMonth()]; monthCounts[key] = (monthCounts[key] || 0) + 1; }
      });
    });
    function topEntries(counts, n) {
      return Object.keys(counts).map(function (k) { return { label: k, n: counts[k] }; })
        .sort(function (a, b) { return b.n - a.n; }).slice(0, n);
    }
    var topRooms = topEntries(roomCounts, 3);
    var topMonths = topEntries(monthCounts, 3);
    function barRow(label, value, max, suffix) {
      var pct = max > 0 ? Math.round(value / max * 100) : 0;
      return '<div class="crm-bar-row"><div class="bar-label"><span>' + esc(label) + '</span><b>' + esc(suffix) + '</b></div>' +
        '<div class="crm-bar"><i style="width:' + pct + '%"></i></div></div>';
    }
    var h = '<div class="crm-bars">' +
      '<div><h3>Repeat guests</h3><p class="admin-note">' + repeat + ' of ' + guests.length + ' guests have stayed more than once.</p>' +
      barRow('Repeat-guest rate', rate, 100, rate + '%') + '</div>' +
      '<div><h3>Top rooms by stays</h3>' +
      (topRooms.length ? topRooms.map(function (r) { return barRow(r.label, r.n, topRooms[0].n, r.n + ' stay' + (r.n === 1 ? '' : 's')); }).join('') : '<p class="admin-note">No completed stays yet.</p>') + '</div>' +
      '<div><h3>Busiest months</h3>' +
      (topMonths.length ? topMonths.map(function (r) { return barRow(r.label, r.n, topMonths[0].n, r.n + ' stay' + (r.n === 1 ? '' : 's')); }).join('') : '<p class="admin-note">No completed stays yet.</p>') + '</div>' +
      '</div>';
    $('insightsView').innerHTML = h;
  }

  /* ---------- rooms & prices ---------- */
  function renderRooms() {
    var rooms = store.getRooms();
    $('roomList').innerHTML = rooms.map(function (r) {
      return '<div class="admin-room">' +
        '<h3>' + esc(r.name) + '</h3>' +
        '<p class="meta">' + esc(r.size) + ' · ' + esc(r.bed) + '</p>' +
        '<div class="row">' +
        '<div class="field"><label for="price-' + esc(r.id) + '">Nightly price (GH₵)</label><input id="price-' + esc(r.id) + '" type="number" min="0" step="1" value="' + r.price + '" data-room-price-input="' + esc(r.id) + '"></div>' +
        '<div class="field"><label for="count-' + esc(r.id) + '">Rooms of this type</label><input id="count-' + esc(r.id) + '" type="number" min="0" step="1" value="' + r.count + '" data-room-count-input="' + esc(r.id) + '"></div>' +
        '</div>' +
        '<button class="btn small" type="button" data-room-save="' + esc(r.id) + '">Save</button>' +
        '<span class="admin-saved" data-room-saved="' + esc(r.id) + '" role="status"></span>' +
        '</div>';
    }).join('');
    $('roomList').querySelectorAll('[data-room-save]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-room-save');
        var price = Number(document.querySelector('[data-room-price-input="' + id + '"]').value);
        var count = Number(document.querySelector('[data-room-count-input="' + id + '"]').value);
        if (!(price > 0) || !(count >= 0)) {
          document.querySelector('[data-room-saved="' + id + '"]').textContent = 'Enter a price above 0 and a room count of 0 or more.';
          return;
        }
        store.updateRoom(id, { price: price, count: count });
        document.querySelector('[data-room-saved="' + id + '"]').textContent = 'Saved — the public site now shows GH₵' + store.fmt(price) + ' for this room.';
      });
    });
  }

  /* ---------- availability ---------- */
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var avYear = null, avMonth = null;
  function renderAvailability() {
    var now = new Date();
    if (avYear == null) { avYear = now.getFullYear(); avMonth = now.getMonth(); }
    var roomId = $('avRoom').value;
    var room = store.getRoom(roomId) || store.getRooms()[0];
    if (!room) { $('avCal').innerHTML = '<p class="admin-note">No rooms yet.</p>'; return; }
    $('avTitle').textContent = MONTHS[avMonth] + ' ' + avYear + ' — ' + room.name + ' (' + room.count + ' rooms)';
    var first = new Date(avYear, avMonth, 1);
    var lead = (first.getDay() + 6) % 7; /* Monday first */
    var days = new Date(avYear, avMonth + 1, 0).getDate();
    var today = dstr(new Date());
    var h = '';
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(function (d) { h += '<div style="text-align:center;font-size:.75rem;color:var(--muted);font-weight:600">' + d + '</div>'; });
    for (var i = 0; i < lead; i++) { h += '<div></div>'; }
    for (var d = 1; d <= days; d++) {
      var key = avYear + '-' + String(avMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var blocked = store.isBlocked(room.id, key);
      var taken = store.bookedCount(room.id, key);
      var past = key < today;
      var cls = 'av-day' + (blocked ? ' blocked' : '') + (taken > 0 && !blocked ? ' has-bookings' : '') + (key === today ? ' today' : '') + (past ? ' past' : '');
      h += '<button type="button" class="' + cls + '" data-av-day="' + key + '"' + (past ? ' disabled' : '') + '><span class="n">' + d + '</span>' +
        (blocked ? '<span class="b">Blocked</span>' : (taken > 0 ? '<span class="b">' + taken + '/' + room.count + ' booked</span>' : '<span class="b">&nbsp;</span>')) +
        '</button>';
    }
    $('avCal').innerHTML = h;
    $('avCal').querySelectorAll('[data-av-day]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-av-day');
        var res = store.toggleBlocked(room.id, key);
        $('avHint').textContent = res.ok
          ? (res.blocked ? key + ' is now blocked for the ' + room.name + '.' : key + ' is free again for the ' + room.name + '.')
          : (res.reason || 'That day cannot be blocked.');
        renderAvailability();
      });
    });
  }
  $('avRoom').addEventListener('change', function () { $('avHint').textContent = ''; renderAvailability(); });
  $('avPrev').addEventListener('click', function () {
    if (avYear == null) { var n = new Date(); avYear = n.getFullYear(); avMonth = n.getMonth(); }
    avMonth--;
    if (avMonth < 0) { avMonth = 11; avYear--; }
    renderAvailability();
  });
  $('avNext').addEventListener('click', function () {
    if (avYear == null) { var n = new Date(); avYear = n.getFullYear(); avMonth = n.getMonth(); }
    avMonth++;
    if (avMonth > 11) { avMonth = 0; avYear++; }
    renderAvailability();
  });

  /* ---------- hotel details ---------- */
  function normalizeWhatsApp(v) {
    var digits = String(v || '').replace(/\D/g, '');
    if (digits.indexOf('233') === 0) { return digits; }
    if (digits.charAt(0) === '0') { return '233' + digits.slice(1); }
    return digits;
  }
  function renderDetails() {
    var s = store.getSettings();
    var f = $('detailsForm');
    f.querySelector('[name="phone"]').value = s.phone;
    f.querySelector('[name="whatsapp"]').value = s.whatsapp;
    f.querySelector('[name="checkin"]').value = s.checkin;
    f.querySelector('[name="checkout"]').value = s.checkout;
    f.querySelector('[name="email"]').value = s.email || '';
    $('detailsSaved').textContent = '';
  }
  $('detailsForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = $('detailsForm');
    var err = f.querySelector('.form-error');
    var saved = $('detailsSaved');
    err.classList.remove('show');
    saved.textContent = '';
    var phone = f.querySelector('[name="phone"]').value.trim();
    var wa = normalizeWhatsApp(f.querySelector('[name="whatsapp"]').value);
    var checkin = f.querySelector('[name="checkin"]').value;
    var checkout = f.querySelector('[name="checkout"]').value;
    var email = f.querySelector('[name="email"]').value.trim();
    if (!phone) { err.textContent = 'Enter the phone number guests should call.'; err.classList.add('show'); return; }
    if (!wa) { err.textContent = 'Enter the WhatsApp number for booking enquiries (digits only, e.g. 233557974777).'; err.classList.add('show'); return; }
    /* Check-in/out times are optional here — the hotel has not confirmed them yet. */
    if (!email) { err.textContent = 'Enter the hotel email address.'; err.classList.add('show'); return; }
    store.updateSettings({ phone: phone, whatsapp: wa, checkin: checkin, checkout: checkout, email: email });
    saved.textContent = 'Saved — the public site now shows the new details.';
  });

  /* ---------- boot ---------- */
  if (isLoggedIn()) { showApp(); } else { showLogin(); }
})();
