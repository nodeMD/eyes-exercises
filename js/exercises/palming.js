/* Exercise: Palming (relaxation). Self-contained plugin, registers itself with window.EyeExercises. */
(function () {
  'use strict';

  var HALF = 4;             // seconds to breathe in, same again to breathe out
  var PERIOD = HALF * 2;    // full breath cycle

  function ease(x) {
    x = Math.min(1, Math.max(0, x));
    return 0.5 - 0.5 * Math.cos(Math.PI * x);
  }

  window.EyeExercises = window.EyeExercises || [];
  window.EyeExercises.push({
    id: 'palming',
    order: 80,
    title: 'Palming',
    instruction: 'Rub your palms together, cover your closed eyes gently and breathe.',
    duration: 25,
    start: function (stage) {
      var circle = document.createElement('div');
      var cue = document.createElement('div');

      circle.style.cssText =
        'position:absolute;border-radius:50%;background:var(--dot);' +
        'box-shadow:0 0 60px var(--dot);transform-origin:50% 50%;' +
        'will-change:transform,opacity;pointer-events:none;';
      cue.style.cssText =
        'position:absolute;left:0;right:0;text-align:center;color:var(--muted);' +
        'font-weight:400;letter-spacing:0.06em;pointer-events:none;';

      stage.appendChild(circle);
      stage.appendChild(cue);

      var rafId = 0;
      var startT = null;
      var cueText = null;

      function frame(now) {
        if (startT === null) startT = now;
        var t = ((now - startT) / 1000) % PERIOD;
        var inhale = t < HALF;
        // x goes 0 -> 1 while breathing in, 1 -> 0 while breathing out.
        var x = inhale ? ease(t / HALF) : 1 - ease((t - HALF) / HALF);

        var w = stage.clientWidth;
        var h = stage.clientHeight;
        var base = Math.min(w, h) * 0.5;   // diameter at full breath (inside margins)
        var scale = 0.6 + 0.4 * x;         // 60% .. 100% of base
        var fs = Math.max(14, Math.min(22, Math.min(w, h) * 0.06));

        circle.style.width = base + 'px';
        circle.style.height = base + 'px';
        circle.style.left = ((w - base) / 2) + 'px';
        circle.style.top = ((h - base) / 2) + 'px';
        circle.style.transform = 'scale(' + scale.toFixed(3) + ')';
        circle.style.opacity = (0.3 + 0.4 * x).toFixed(3);

        cue.style.fontSize = fs + 'px';
        var cueTop = (h + base) / 2 + fs * 0.6;
        cueTop = Math.max(0, Math.min(cueTop, h - fs * 1.6));
        cue.style.top = cueTop + 'px';

        var txt = inhale ? 'Breathe in' : 'Breathe out';
        if (txt !== cueText) {
          cue.textContent = txt;
          cueText = txt;
        }

        rafId = requestAnimationFrame(frame);
      }

      rafId = requestAnimationFrame(frame);

      return function cleanup() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (circle.parentNode) circle.parentNode.removeChild(circle);
        if (cue.parentNode) cue.parentNode.removeChild(cue);
      };
    }
  });
})();
