/* Exercise: Figure Eight
 * A dot traces a horizontal figure-eight (lemniscate-like curve):
 *   x = A sin(s), y = B sin(2s), one full loop every 6 seconds.
 * A faint trail is drawn with an inline SVG using var(--muted).
 * The trail and dot are recomputed from the current stage size, so
 * rotation/resize is handled by rebuilding the path when the size changes.
 */
(function () {
  'use strict';

  var DOT_SIZE = 28;        // px
  var LOOP_SECONDS = 6;     // calm pace: one full loop every 6 s
  var AMP_X = 0.4;          // fraction of stage width (keeps 10% margin each side)
  var AMP_Y = 0.35;         // fraction of stage height (keeps 15% margin each side)
  var TRAIL_POINTS = 180;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function pointAt(s, w, h) {
    return {
      x: w * (0.5 + AMP_X * Math.sin(s)),
      y: h * (0.5 + AMP_Y * Math.sin(2 * s))
    };
  }

  window.EyeExercises = window.EyeExercises || [];
  window.EyeExercises.push({
    id: 'figure-eight',
    order: 50,
    title: 'Figure Eight',
    instruction: 'Trace the figure eight with your eyes.',
    duration: 30,

    start: function (stage) {
      var svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.cssText =
        'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;';

      var trail = document.createElementNS(SVG_NS, 'path');
      trail.setAttribute('fill', 'none');
      trail.setAttribute('stroke-width', '2');
      trail.setAttribute('stroke-linejoin', 'round');
      trail.style.stroke = 'var(--muted)';
      trail.style.opacity = '0.3';
      svg.appendChild(trail);
      stage.appendChild(svg);

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
      var builtW = -1;
      var builtH = -1;

      function buildTrail(w, h) {
        var d = '';
        for (var i = 0; i <= TRAIL_POINTS; i++) {
          var s = (2 * Math.PI * i) / TRAIL_POINTS;
          var p = pointAt(s, w, h);
          d += (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ' ';
        }
        d += 'Z';
        trail.setAttribute('d', d);
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        builtW = w;
        builtH = h;
      }

      function frame(now) {
        if (stopped) return;
        if (t0 === null) t0 = now;
        var t = (now - t0) / 1000;

        var w = stage.clientWidth;
        var h = stage.clientHeight;
        if (w !== builtW || h !== builtH) buildTrail(w, h);

        var s = (2 * Math.PI * t) / LOOP_SECONDS;
        var p = pointAt(s, w, h);

        dot.style.transform =
          'translate3d(' + (p.x - DOT_SIZE / 2).toFixed(1) + 'px,' +
          (p.y - DOT_SIZE / 2).toFixed(1) + 'px,0)';

        rafId = requestAnimationFrame(frame);
      }

      rafId = requestAnimationFrame(frame);

      return function cleanup() {
        stopped = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (dot.parentNode) dot.parentNode.removeChild(dot);
        if (svg.parentNode) svg.parentNode.removeChild(svg);
      };
    }
  });
})();
