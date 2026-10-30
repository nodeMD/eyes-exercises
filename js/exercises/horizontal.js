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
    id: 'horizontal',
    order: 20,
    title: 'Side to side',
    instruction: 'Keep your head still and move only your eyes to follow the dot left and right.',
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
        var m = Math.max(w * 0.1, r + 6);
        return { left: m, right: Math.max(m, w - m), y: h / 2 };
      }

      function place(x, y) {
        dot.style.transform =
          'translate3d(' + (x - r) + 'px,' + (y - r) + 'px,0)';
      }

      var side = 0; // 0 = left, 1 = right
      var phase = 'hold'; // 'hold' or 'move'
      var phaseStart = null;
      var rafId = null;
      var done = false;

      var initial = positions();
      place(initial.left, initial.y);

      function frame(now) {
        if (done) return;
        if (phaseStart === null) phaseStart = now;

        var p = positions();
        var fromX = side === 0 ? p.left : p.right;
        var toX = side === 0 ? p.right : p.left;
        var x = fromX;

        if (phase === 'hold' && now - phaseStart >= HOLD_MS) {
          phase = 'move';
          phaseStart = now;
        }

        if (phase === 'move') {
          var t = Math.min(1, (now - phaseStart) / MOVE_MS);
          x = fromX + (toX - fromX) * easeInOutCubic(t);
          if (t >= 1) {
            side = 1 - side;
            phase = 'hold';
            phaseStart = now;
            x = toX;
          }
        }

        place(x, p.y);
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
