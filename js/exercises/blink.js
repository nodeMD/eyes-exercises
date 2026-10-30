/* Exercise: Blink. Self-contained plugin, registers itself with window.EyeExercises. */
(function () {
  'use strict';

  var PERIOD = 2.8;      // seconds per blink cycle (~1 blink every 2.8s)
  var CLOSE_END = 0.2;   // lid closes during 0 .. 0.2s
  var HOLD_END = 0.32;   // lid stays closed until 0.32s
  var OPEN_END = 0.6;    // lid opens again during 0.32 .. 0.6s

  function ease(x) {
    x = Math.min(1, Math.max(0, x));
    return 0.5 - 0.5 * Math.cos(Math.PI * x);
  }

  // Vertical scale of the eye for a position p (seconds) inside one cycle.
  function lidScale(p) {
    if (p < CLOSE_END) return 1 - 0.95 * ease(p / CLOSE_END);
    if (p < HOLD_END) return 0.05;
    if (p < OPEN_END) return 0.05 + 0.95 * ease((p - HOLD_END) / (OPEN_END - HOLD_END));
    return 1;
  }

  window.EyeExercises = window.EyeExercises || [];
  window.EyeExercises.push({
    id: 'blink',
    order: 10,
    title: 'Blink',
    instruction: 'Blink fully and gently in time with the shape.',
    duration: 25,
    start: function (stage) {
      var shape = document.createElement('div');
      var cue = document.createElement('div');

      shape.style.cssText =
        'position:absolute;border-radius:50%;background:var(--dot);' +
        'box-shadow:0 0 40px var(--dot);transform-origin:50% 50%;' +
        'will-change:transform;pointer-events:none;';
      cue.style.cssText =
        'position:absolute;left:0;right:0;text-align:center;color:var(--muted);' +
        'font-weight:500;letter-spacing:0.08em;pointer-events:none;';

      stage.appendChild(shape);
      stage.appendChild(cue);

      var rafId = 0;
      var startT = null;
      var cueText = null;

      function frame(now) {
        if (startT === null) startT = now;
        var t = ((now - startT) / 1000) % PERIOD;

        // Recompute layout from the current stage size every frame.
        var w = stage.clientWidth;
        var h = stage.clientHeight;
        var d = Math.min(w, h) * 0.42; // stays well inside the 10% margins
        var fs = Math.max(14, Math.min(22, Math.min(w, h) * 0.06));

        shape.style.width = d + 'px';
        shape.style.height = d + 'px';
        shape.style.left = ((w - d) / 2) + 'px';
        shape.style.top = ((h - d) / 2) + 'px';
        shape.style.transform = 'scaleY(' + lidScale(t).toFixed(3) + ')';

        cue.style.fontSize = fs + 'px';
        var cueTop = (h + d) / 2 + fs * 0.6;
        cueTop = Math.max(0, Math.min(cueTop, h - fs * 1.6));
        cue.style.top = cueTop + 'px';

        var txt = t < HOLD_END ? 'Blink' : '';
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
        if (shape.parentNode) shape.parentNode.removeChild(shape);
        if (cue.parentNode) cue.parentNode.removeChild(cue);
      };
    }
  });
})();
