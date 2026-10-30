(function () {
  'use strict';

  var DOT_SIZE = 30;
  var HOLD_MS = 1200;
  var MOVE_MS = 300;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  window.EyeExercises = window.EyeExercises || [];
  window.EyeExercises.push({
    id: 'vertical',
    order: 30,
    title: 'Up and down',
    instruction: 'Keep your head still and move only your eyes to follow the dot up and down.',
    duration: 25,
    start: function (stage) {
      var r = DOT_SIZE / 2;

      var dot = document.createElement('div');
      dot.setAttribute('aria-hidden', 'true');
      dot.style.cssText =
        'position:absolute;left:0;top:0;' +
        'width:' + DOT_SIZE + 'px;height:' + DOT_SIZE + 'px;' +
        'border-radius:50%;background:var(--dot);will-change:transform;';
      stage.appendChild(dot);

      // Recomputed from the current stage size on every call.
      function positions() {
        var w = stage.clientWidth;
        var h = stage.clientHeight;
        var m = Math.max(h * 0.1, r + 6);
        return { top: m, bottom: Math.max(m, h - m), x: w / 2 };
      }

      function place(x, y) {
        dot.style.transform =
          'translate3d(' + (x - r) + 'px,' + (y - r) + 'px,0)';
      }

      var side = 0; // 0 = top, 1 = bottom
      var phase = 'hold'; // 'hold' or 'move'
      var phaseStart = null;
      var rafId = null;
      var done = false;

      var initial = positions();
      place(initial.x, initial.top);

      function frame(now) {
        if (done) return;
        if (phaseStart === null) phaseStart = now;

        var p = positions();
        var fromY = side === 0 ? p.top : p.bottom;
        var toY = side === 0 ? p.bottom : p.top;
        var y = fromY;

        if (phase === 'hold' && now - phaseStart >= HOLD_MS) {
          phase = 'move';
          phaseStart = now;
        }

        if (phase === 'move') {
          var t = Math.min(1, (now - phaseStart) / MOVE_MS);
          y = fromY + (toY - fromY) * easeInOutCubic(t);
          if (t >= 1) {
            side = 1 - side;
            phase = 'hold';
            phaseStart = now;
            y = toY;
          }
        }

        place(p.x, y);
        rafId = requestAnimationFrame(frame);
      }

      rafId = requestAnimationFrame(frame);

      return function cleanup() {
        if (done) return;
        done = true;
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
        if (dot.parentNode) dot.parentNode.removeChild(dot);
      };
    }
  });
})();
