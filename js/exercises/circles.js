(function () {
  'use strict';

  var DURATION = 30;          // seconds, owned by the app
  var HALF = DURATION / 2;    // direction switches at 15s
  var PERIOD = 5;             // seconds per revolution
  var CUE_LEN = 2.5;          // how long "Change direction" stays visible
  var DOT_SIZE = 28;          // px
  var RADIUS_FRAC = 0.36;     // radius as fraction of the smaller stage side

  window.EyeExercises = window.EyeExercises || [];
  window.EyeExercises.push({
    id: 'circles',
    order: 60,
    title: 'Circles',
    instruction: 'Roll your eyes, following the dot around the circle.',
    duration: DURATION,
    start: function (stage) {
      var ring = document.createElement('div');
      ring.style.cssText =
        'position:absolute;left:0;top:0;box-sizing:border-box;' +
        'border:1px dashed var(--muted);border-radius:50%;opacity:0.35;pointer-events:none;';

      var dot = document.createElement('div');
      dot.style.cssText =
        'position:absolute;left:0;top:0;width:' + DOT_SIZE + 'px;height:' + DOT_SIZE + 'px;' +
        'border-radius:50%;background:var(--dot);will-change:transform;pointer-events:none;';

      var cue = document.createElement('div');
      cue.setAttribute('aria-live', 'polite');
      cue.style.cssText =
        'position:absolute;left:0;right:0;top:6%;text-align:center;' +
        'color:var(--muted);font-size:18px;font-weight:600;pointer-events:none;';

      stage.appendChild(ring);
      stage.appendChild(dot);
      stage.appendChild(cue);

      var t0 = performance.now();
      var rafId = 0;
      var done = false;
      var cueText = null;

      // Angle in radians. Clockwise on screen (y grows downward) while angle increases.
      // After the switch the angle keeps going from where it left off, reversing direction,
      // so there is no jump at the 15s mark.
      function angleAt(t) {
        if (t < HALF) {
          return 2 * Math.PI * (t / PERIOD);
        }
        var t2 = t - HALF;
        return 2 * Math.PI * (HALF / PERIOD) - 2 * Math.PI * (t2 / PERIOD);
      }

      function setCue(text) {
        if (text !== cueText) {
          cueText = text;
          cue.textContent = text;
        }
      }

      function frame() {
        if (done) return;

        var t = (performance.now() - t0) / 1000;
        if (t > DURATION) t = DURATION;

        // Recompute from the current stage size every frame (rotation / resize safe).
        var w = stage.clientWidth;
        var h = stage.clientHeight;
        var r = RADIUS_FRAC * Math.min(w, h);
        var cx = w / 2;
        var cy = h / 2;

        var theta = angleAt(t);
        var x = cx + r * Math.cos(theta);
        var y = cy + r * Math.sin(theta);

        ring.style.width = (2 * r) + 'px';
        ring.style.height = (2 * r) + 'px';
        ring.style.transform = 'translate(' + (cx - r) + 'px,' + (cy - r) + 'px)';
        dot.style.transform = 'translate(' + (x - DOT_SIZE / 2) + 'px,' + (y - DOT_SIZE / 2) + 'px)';

        setCue(t >= HALF && t < HALF + CUE_LEN ? 'Change direction' : '');

        rafId = requestAnimationFrame(frame);
      }

      rafId = requestAnimationFrame(frame);

      return function cleanup() {
        done = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (ring.parentNode) ring.parentNode.removeChild(ring);
        if (dot.parentNode) dot.parentNode.removeChild(dot);
        if (cue.parentNode) cue.parentNode.removeChild(cue);
      };
    }
  });
})();
