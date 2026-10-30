(function () {
  'use strict';

  var DURATION = 30;        // seconds, owned by the app
  var CYCLE = 8;            // seconds for one near + far cycle
  var DOT_BASE = 28;        // px, base dot size
  var MIN_SCALE = 0.8;      // ~22px when "far"
  var MAX_SCALE = 1.3;      // ~36px when "near"

  window.EyeExercises = window.EyeExercises || [];
  window.EyeExercises.push({
    id: 'near-far',
    order: 70,
    title: 'Near and Far',
    instruction: 'Hold a finger in front of your face. Alternate between focusing on your finger (near) and on the dot or something far away (far), following the cues.',
    duration: DURATION,
    start: function (stage) {
      var dot = document.createElement('div');
      dot.style.cssText =
        'position:absolute;left:50%;top:50%;width:' + DOT_BASE + 'px;height:' + DOT_BASE + 'px;' +
        'margin:0;border-radius:50%;background:var(--dot);will-change:transform;pointer-events:none;' +
        'transform:translate(-50%,-50%) scale(' + MIN_SCALE + ');';

      var cue = document.createElement('div');
      cue.setAttribute('aria-live', 'polite');
      cue.style.cssText =
        'position:absolute;left:0;right:0;top:6%;text-align:center;' +
        'color:var(--muted);font-size:18px;font-weight:600;pointer-events:none;';

      stage.appendChild(dot);
      stage.appendChild(cue);

      var t0 = performance.now();
      var rafId = 0;
      var done = false;
      var cueText = null;

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

        var phase = (t % CYCLE) / CYCLE;                 // 0..1 within one cycle
        var s = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase); // smooth 0 -> 1 -> 0
        var scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * s;

        // Growing (first half of the cycle) = near, shrinking = far.
        var growing = phase < 0.5;

        dot.style.transform = 'translate(-50%,-50%) scale(' + scale.toFixed(4) + ')';
        setCue(growing ? 'Look near' : 'Look far');

        rafId = requestAnimationFrame(frame);
      }

      rafId = requestAnimationFrame(frame);

      return function cleanup() {
        done = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (dot.parentNode) dot.parentNode.removeChild(dot);
        if (cue.parentNode) cue.parentNode.removeChild(cue);
      };
    }
  });
})();
