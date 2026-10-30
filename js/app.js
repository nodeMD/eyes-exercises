/*
 * Eye Exercises - app shell.
 * Home -> (Get ready -> Exercise) x N -> Congrats -> Home.
 * Classic script, no modules, no globals (wrapped in an IIFE).
 */
(function () {
  'use strict';

  var THEME_KEY = 'eyeExercises.theme';
  var READY_MS = 3000;
  var root = document.documentElement;

  function $(id) { return document.getElementById(id); }
  function noop() {}

  var screens = {
    home: $('screen-home'),
    ready: $('screen-ready'),
    session: $('screen-session'),
    congrats: $('screen-congrats')
  };

  var els = {
    themeToggle: $('theme-toggle'),
    iconSun: $('icon-sun'),
    iconMoon: $('icon-moon'),
    playBtn: $('play-btn'),
    readyStep: $('ready-step'),
    readyTitle: $('ready-title'),
    readyInstruction: $('ready-instruction'),
    readyCount: $('ready-count'),
    sessionStep: $('session-step'),
    sessionTitle: $('session-title'),
    sessionInstruction: $('session-instruction'),
    progress: $('session-progress'),
    progressFill: $('progress-fill'),
    stage: $('stage'),
    congratsTitle: $('congrats-title'),
    congratsMsg: $('congrats-msg'),
    homeBtn: $('home-btn')
  };

  var currentScreen = 'home';
  var session = null; // { list, index, raf, cleanup }

  /* ---------- Exercises ---------- */

  function getExercises() {
    var src = window.EyeExercises;
    if (!Array.isArray(src)) return [];
    var items = [];
    for (var i = 0; i < src.length; i++) {
      var ex = src[i];
      if (ex && typeof ex.start === 'function') {
        items.push({ ex: ex, i: i });
      } else {
        console.warn('Eye Exercises: skipping invalid exercise entry', ex);
      }
    }
    items.sort(function (a, b) {
      var oa = Number(a.ex.order) || 0;
      var ob = Number(b.ex.order) || 0;
      return oa !== ob ? oa - ob : a.i - b.i;
    });
    return items.map(function (x) { return x.ex; });
  }

  /* ---------- Screens & focus ---------- */

  function showScreen(name) {
    currentScreen = name;
    for (var k in screens) {
      if (!Object.prototype.hasOwnProperty.call(screens, k)) continue;
      var on = k === name;
      screens[k].classList.toggle('active', on);
      screens[k].inert = !on;
      screens[k].setAttribute('aria-hidden', on ? 'false' : 'true');
    }
  }

  function focusEl(el) {
    if (!el || !el.focus) return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  /* ---------- Theme ---------- */

  function readTheme() {
    try {
      var v = window.localStorage.getItem(THEME_KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function saveTheme(theme) {
    try { window.localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
  }

  function systemTheme() {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  }

  function applyTheme(theme) {
    var isDark = theme === 'dark';
    root.setAttribute('data-theme', theme);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0c1716' : '#f3f7f6');

    var label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    els.themeToggle.setAttribute('aria-label', label);
    els.themeToggle.setAttribute('title', label);
    els.iconSun.hidden = !isDark;
    els.iconMoon.hidden = isDark;
  }

  /* ---------- Wake lock (feature-detected, errors ignored) ---------- */

  var wakeLock = null;
  var wakePending = false;
  var wantWakeLock = false;

  function safeRelease(lock) {
    try {
      var p = lock.release();
      if (p && p.catch) p.catch(noop);
    } catch (e) { /* ignore */ }
  }

  function requestWakeLock() {
    wantWakeLock = true;
    try {
      if (!navigator.wakeLock || wakeLock || wakePending) return;
      wakePending = true;
      navigator.wakeLock.request('screen').then(function (lock) {
        wakePending = false;
        if (!wantWakeLock) { safeRelease(lock); return; }
        wakeLock = lock;
        if (lock.addEventListener) {
          lock.addEventListener('release', function () {
            if (wakeLock === lock) wakeLock = null;
          });
        }
      }).catch(function () {
        wakePending = false;
      });
    } catch (e) {
      wakePending = false;
    }
  }

  function releaseWakeLock() {
    wantWakeLock = false;
    var lock = wakeLock;
    wakeLock = null;
    if (lock) safeRelease(lock);
  }

  /* ---------- Session flow ---------- */

  function setProgress(p) {
    p = Math.max(0, Math.min(1, p || 0));
    els.progressFill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    els.progress.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  }

  // Calls the running exercise's cleanup (guarded) and empties the stage.
  function stopPhase(s) {
    if (s.raf) {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    }
    if (s.cleanup) {
      var fn = s.cleanup;
      s.cleanup = null;
      try { fn(); } catch (err) { console.error('Eye Exercises: exercise cleanup failed', err); }
    }
    els.stage.textContent = '';
  }

  function startSession() {
    if (session) return;
    var list = getExercises();
    if (!list.length) {
      console.warn('Eye Exercises: no exercises available (window.EyeExercises is empty or missing).');
      return;
    }
    session = { list: list, index: 0, raf: 0, cleanup: null };
    requestWakeLock();
    showReady();
  }

  // Leaves the session (if any), cleans up, and shows the target screen.
  function endSession(target) {
    var s = session;
    session = null;
    if (s) stopPhase(s);
    releaseWakeLock();
    els.stage.textContent = '';
    showScreen(target);
    if (target === 'home') focusEl(els.playBtn);
    else if (target === 'congrats') focusEl(els.congratsTitle);
  }

  function showReady() {
    var s = session;
    var ex = s.list[s.index];
    s.cleanup = null;

    els.readyStep.textContent = 'Exercise ' + (s.index + 1) + ' of ' + s.list.length;
    els.readyTitle.textContent = ex.title || ex.id || 'Exercise';
    els.readyInstruction.textContent = ex.instruction || '';
    els.readyCount.textContent = String(Math.ceil(READY_MS / 1000));
    showScreen('ready');
    focusEl(els.readyTitle);

    var t0 = performance.now();
    var lastShown = -1;

    function frame(now) {
      if (session !== s) return;
      var left = Math.max(0, READY_MS - (now - t0));
      var secs = Math.ceil(left / 1000);
      if (secs !== lastShown) {
        lastShown = secs;
        els.readyCount.textContent = String(secs);
      }
      if (left <= 0) {
        s.raf = 0;
        startExercise();
        return;
      }
      s.raf = requestAnimationFrame(frame);
    }
    s.raf = requestAnimationFrame(frame);
  }

  function startExercise() {
    var s = session;
    var idx = s.index;
    var ex = s.list[idx];

    els.sessionStep.textContent = (idx + 1) + ' / ' + s.list.length;
    els.sessionTitle.textContent = ex.title || ex.id || 'Exercise';
    els.sessionInstruction.textContent = ex.instruction || '';
    setProgress(0);
    els.stage.textContent = '';
    showScreen('session');

    var cleanup = null;
    try {
      cleanup = ex.start(els.stage);
    } catch (err) {
      console.error('Eye Exercises: exercise "' + (ex.id || idx) + '" failed to start, skipping.', err);
      els.stage.textContent = '';
      advance();
      return;
    }
    s.cleanup = typeof cleanup === 'function' ? cleanup : null;

    var seconds = Number(ex.duration) > 0 ? Number(ex.duration) : 30;
    var duration = seconds * 1000;
    var t0 = performance.now();

    function frame(now) {
      if (session !== s) return;
      var elapsed = Math.max(0, now - t0);
      setProgress(elapsed / duration);
      if (elapsed >= duration) {
        s.raf = 0;
        finishExercise();
        return;
      }
      s.raf = requestAnimationFrame(frame);
    }
    s.raf = requestAnimationFrame(frame);
  }

  function finishExercise() {
    var s = session;
    if (!s) return;
    stopPhase(s);
    advance();
  }

  function advance() {
    var s = session;
    if (!s) return;
    s.index += 1;
    if (s.index >= s.list.length) {
      var count = s.list.length;
      els.congratsMsg.textContent = 'You finished all ' + count + ' ' +
        (count === 1 ? 'exercise' : 'exercises') + '. Your eyes thank you for the break.';
      endSession('congrats');
    } else {
      showReady();
    }
  }

  /* ---------- Init ---------- */

  function init() {
    var saved = readTheme();
    applyTheme(saved || systemTheme());

    els.themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
    });

    // Follow OS theme changes only while the user has not chosen a theme.
    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onSystemChange = function () {
        if (!readTheme()) applyTheme(systemTheme());
      };
      if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
      else if (mq.addListener) mq.addListener(onSystemChange);
    } catch (e) { /* matchMedia unavailable */ }

    els.playBtn.addEventListener('click', startSession);
    els.homeBtn.addEventListener('click', function () { endSession('home'); });

    Array.prototype.forEach.call(document.querySelectorAll('[data-quit]'), function (btn) {
      btn.addEventListener('click', function () { endSession('home'); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && (currentScreen === 'ready' || currentScreen === 'session')) {
        endSession('home');
      }
    });

    // Re-acquire the wake lock when the page becomes visible again mid-session.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && session && wantWakeLock) {
        requestWakeLock();
      }
    });

    if (!getExercises().length) {
      els.playBtn.disabled = true;
      console.warn('Eye Exercises: no exercises registered (window.EyeExercises is empty or missing). Showing home only.');
    }

    showScreen('home');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
