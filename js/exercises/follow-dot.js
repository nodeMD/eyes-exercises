/* Exercise: Follow the Dot
 * A dot wanders smoothly around the stage along a deterministic,
 * pseudo-random path built from a sum of sines. Positions are recomputed
 * from the current stage size on every frame, so rotation/resize is safe.
 */
(function () {
  'use strict';

  var DOT_SIZE = 30;   // px, visible on phones
  var MARGIN = 0.12;   // fraction of stage size kept clear at each edge

  // Smooth value in [-1, 1]. Amplitudes sum to 1, so the result never exceeds the range.
  function wave(t, k) {
    return 0.5 * Math.sin(0.19 * t + k) +
           0.3 * Math.sin(0.43 * t + 1.7 + k) +
           0.2 * Math.sin(0.89 * t + 0.9 + k);
  }

  window.EyeExercises = window.EyeExercises || [];
  window.EyeExercises.push({
    id: 'follow-dot',
    order: 40,
    title: 'Follow the Dot',
    instruction: 'Follow the dot with your eyes only, keeping your head still.',
    duration: 30,

    start: function (stage) {
      var dot = document.createElement('div');
      dot.setAttribute('aria-hidden', 'true');
      dot.style.cssText =
        'position:absolute;left:0;top:0;' +
        'width:' + DOT_SIZE + 'px;height:' + DOT_SIZE + 'px;' +
        'border-radius:50%;background:var(--dot);' +
        'will-change:transform;pointer-events:none;';
      stage.appendChild(dot);

      var rafId = 0;
      var t0 = null;
      var stopped = false;

      function frame(now) {
        if (stopped) return;
        if (t0 === null) t0 = now;
        var t = (now - t0) / 1000;

        var w = stage.clientWidth;
        var h = stage.clientHeight;
        var nx = (wave(t, 0) + 1) / 2;   // 0..1
        var ny = (wave(t, 2.3) + 1) / 2; // 0..1

        var mx = w * MARGIN;
        var my = h * MARGIN;
        var x = mx + (w - 2 * mx) * nx;
        var y = my + (h - 2 * my) * ny;

        dot.style.transform =
          'translate3d(' + (x - DOT_SIZE / 2).toFixed(1) + 'px,' +
          (y - DOT_SIZE / 2).toFixed(1) + 'px,0)';

        rafId = requestAnimationFrame(frame);
      }

      rafId = requestAnimationFrame(frame);

      return function cleanup() {
        stopped = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (dot.parentNode) dot.parentNode.removeChild(dot);
      };
    }
  });
})();
