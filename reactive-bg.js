// ========== REACTIVE CANVAS BACKGROUND ==========
// Dot grid that reacts to the cursor and scanning sweep, plus a soft
// trailing radial glow. Runs only inside [data-reactive-bg] sections.
(function () {
  // ---- Tunable constants ----
  const DOT_SPACING   = 34;    // px between dots
  const DOT_RADIUS    = 1.4;   // base dot radius in px
  const CURSOR_RADIUS = 140;   // px — how far the push reaches
  const PUSH_STRENGTH = 26;    // px — max displacement per dot
  const SWEEP_RADIUS  = 110;   // px — dot response range around the sweep
  const SWEEP_PUSH    = 0.55;  // px — subtle nudge as the sweep passes
  const SWEEP_X       = Math.sin(115 * Math.PI / 180);
  const SWEEP_Y       = -Math.cos(115 * Math.PI / 180);
  const LINK_SPOKES   = 10;
  const LINK_RADIUS   = CURSOR_RADIUS * 1.4;
  const SPRING_SPEED  = 0.12;  // 0..1 — how fast dots return to rest
  const GLOW_RADIUS   = 260;   // px — soft glow radius
  const DAMPING       = 0.82;  // 0..1 — velocity damping per frame
  const IDLE_EPSILON  = 0.05;  // stop the loop when total motion is below this

  // ---- Environment checks ----
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (reduceMotion || isTouch) return;

  const sections = document.querySelectorAll('[data-reactive-bg]');
  if (!sections.length) return;

  // ---- Per-section setup ----
  sections.forEach(setupSection);

  function setupSection(section) {
    const scanSweep = document.querySelector('.bg-glow .scan-sweep');

    // Make sure the section is a positioning context for the canvas
    const computed = getComputedStyle(section);
    if (computed.position === 'static') {
      section.style.position = 'relative';
    }
    section.style.isolation = 'isolate';

    // Create the canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'reactive-bg-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    section.insertBefore(canvas, section.firstChild);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Read colors from CSS vars on the section (fallback to white)
    function readColors() {
      const cs = getComputedStyle(section);
      const dot = cs.getPropertyValue('--bg-dot').trim() || '255, 255, 255';
      const glow = cs.getPropertyValue('--bg-glow').trim() || '255, 255, 255';
      return { dot, glow };
    }
    let colors = readColors();

    // ---- State ----
    let dots = [];           // { x, y, ox, oy, vx, vy }
    let cols = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let cursor = { x: -9999, y: -9999, active: false };
    let glow = { x: -9999, y: -9999, a: 0 };
    let rafId = null;
    let running = false;
    let lastSweepX = null;
    let lastPassiveFrame = 0;

    function scanSweepIsVisible() {
      if (!scanSweep) return false;
      const rect = scanSweep.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const margin = window.innerHeight * 0.25 + SWEEP_RADIUS;
      return centerX > -margin && centerX < window.innerWidth + margin;
    }

    function readScanWave() {
      if (!scanSweep) return null;

      const sweepRect = scanSweep.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const screenX = sweepRect.left + sweepRect.width / 2;
      const deltaX = lastSweepX === null ? 0 : screenX - lastSweepX;
      lastSweepX = screenX;

      const wrapped = Math.abs(deltaX) > window.innerWidth;
      return {
        x: screenX - sectionRect.left,
        y: sweepRect.top + sweepRect.height / 2 - sectionRect.top,
        visible: scanSweepIsVisible(),
        direction: deltaX < 0 ? -1 : 1,
        strength: wrapped ? 0 : Math.min(1, Math.abs(deltaX) / 5)
      };
    }

    // ---- Sizing ----
    function resize() {
      const rect = section.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Rebuild the dot grid
      cols = Math.ceil(width / DOT_SPACING) + 1;
      rows = Math.ceil(height / DOT_SPACING) + 1;
      dots = new Array(cols * rows);
      let i = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * DOT_SPACING;
          const y = r * DOT_SPACING;
          dots[i++] = { x, y, ox: x, oy: y, vx: 0, vy: 0, wave: 0 };
        }
      }
    }

    function drawConnections() {
      if (glow.a <= 0.01) return;

      const spokes = new Array(LINK_SPOKES);
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = dot.x - glow.x;
        const dy = dot.y - glow.y;
        const distance = Math.hypot(dx, dy);
        if (distance < DOT_SPACING * 0.6 || distance > LINK_RADIUS) continue;

        const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
        const sector = Math.floor(angle / (Math.PI * 2) * LINK_SPOKES);
        if (!spokes[sector] || distance < spokes[sector].distance) {
          spokes[sector] = { dot, distance };
        }
      }

      for (let i = 0; i < spokes.length; i++) {
        const spoke = spokes[i];
        if (!spoke) continue;

        const distanceFade = 1 - spoke.distance / LINK_RADIUS;
        ctx.beginPath();
        ctx.moveTo(glow.x, glow.y);
        ctx.lineTo(spoke.dot.x, spoke.dot.y);
        ctx.strokeStyle = `rgba(${colors.glow}, ${(0.04 + distanceFade * 0.16) * glow.a})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // ---- Pointer ----
    function onMove(e) {
      const rect = section.getBoundingClientRect();
      cursor.x = e.clientX - rect.left;
      cursor.y = e.clientY - rect.top;
      cursor.active = true;

      // Grow glow toward cursor
      glow.x = cursor.x;
      glow.y = cursor.y;
      glow.a = Math.min(1, glow.a + 0.25);

      start();
    }

    function onLeave() {
      cursor.active = false;
      start();
    }

    // ---- Physics + drawing ----
    function step(timestamp) {
      if (!cursor.active && timestamp - lastPassiveFrame < 1000 / 30) {
        rafId = requestAnimationFrame(step);
        return;
      }
      lastPassiveFrame = timestamp;

      let totalMotion = 0;
      const scanWave = readScanWave();

      // Move glow toward cursor (eased) and fade out when idle
      if (cursor.active) {
        glow.x += (cursor.x - glow.x) * 0.18;
        glow.y += (cursor.y - glow.y) * 0.18;
        glow.a += (1 - glow.a) * 0.12;
      } else {
        glow.a += (0 - glow.a) * 0.08;
      }

      // Update dots
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        d.wave = 0;

        // Push away from cursor
        if (cursor.active) {
          const dx = d.ox - glow.x;
          const dy = d.oy - glow.y;
          const dist = Math.hypot(dx, dy);

          if (dist < CURSOR_RADIUS && dist > 0.0001) {
            const force = (1 - dist / CURSOR_RADIUS);
            const push = force * PUSH_STRENGTH;
            const nx = dx / dist;
            const ny = dy / dist;

            d.vx += nx * push * 0.4;
            d.vy += ny * push * 0.4;
          }
        }

        if (scanWave && scanWave.visible && scanWave.strength > 0) {
          const offset = (d.ox - scanWave.x) * SWEEP_X + (d.oy - scanWave.y) * SWEEP_Y;
          const distance = Math.abs(offset);
          if (distance < SWEEP_RADIUS) {
            d.wave = (1 - distance / SWEEP_RADIUS) * scanWave.strength;
            d.vx += scanWave.direction * SWEEP_PUSH * d.wave;
            d.vy += SWEEP_PUSH * d.wave * 0.16;
          }
        }

        // Spring back to origin
        const sx = (d.ox - d.x) * SPRING_SPEED;
        const sy = (d.oy - d.y) * SPRING_SPEED;
        d.vx += sx;
        d.vy += sy;

        // Damping
        d.vx *= DAMPING;
        d.vy *= DAMPING;

        // Integrate
        d.x += d.vx;
        d.y += d.vy;

        // Track motion for idle detection
        totalMotion += Math.abs(d.vx) + Math.abs(d.vy);
      }

      // Glow contribution
      totalMotion += Math.abs(glow.a) * 0.5 + Math.abs(cursor.x - glow.x) * 0.02;

      // ---- Draw ----
      ctx.clearRect(0, 0, width, height);

      // Radial glow (drawn first, under the dots)
      if (glow.a > 0.01) {
        const g = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, GLOW_RADIUS);
        g.addColorStop(0, `rgba(${colors.glow}, ${0.10 * glow.a})`);
        g.addColorStop(0.4, `rgba(${colors.glow}, ${0.04 * glow.a})`);
        g.addColorStop(1, `rgba(${colors.glow}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(glow.x, glow.y, GLOW_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      drawConnections();

      // Dots
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        // Brightness + size based on distance to cursor
        let t = 0;
        if (cursor.active) {
          const dist = Math.hypot(d.ox - glow.x, d.oy - glow.y);
          t = Math.max(0, 1 - dist / CURSOR_RADIUS);
          t = t * t; // ease-out
        }
        t = Math.max(t, d.wave);

        const r = DOT_RADIUS + t * 1.8;
        const alpha = 0.20 + t * 0.75;

        ctx.fillStyle = `rgba(${colors.dot}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Idle check: if nothing is really moving, stop the loop
      const glowMoving = Math.abs(cursor.x - glow.x) > 0.5 || Math.abs(cursor.y - glow.y) > 0.5;
      if (!glowMoving && totalMotion < IDLE_EPSILON && glow.a < 0.01 && !(scanWave && scanWave.visible)) {
        // Draw one final resting frame then stop
        drawResting();
        running = false;
        rafId = null;
        return;
      }

      rafId = requestAnimationFrame(step);
    }

    function drawResting() {
      ctx.clearRect(0, 0, width, height);
      drawConnections();
      ctx.fillStyle = `rgba(${colors.dot}, 0.20)`;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        ctx.beginPath();
        ctx.arc(d.ox, d.oy, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }

    // ---- Wire up ----
    resize();
    drawResting();

    const scanMonitor = scanSweep ? window.setInterval(() => {
      if (!document.hidden && scanSweepIsVisible()) start();
    }, 120) : null;

    section.addEventListener('mousemove', onMove);
    section.addEventListener('mouseleave', onLeave);

    // Resize observer so the grid rebuilds if the section changes size
    let resizeTimeout = null;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resize();
        colors = readColors();
        if (!running) drawResting();
        else start();
      }, 100);
    };

    window.addEventListener('resize', onResize);

    // Re-read colors if the theme changes (e.g. via class toggle)
    const colorObserver = new MutationObserver(() => {
      colors = readColors();
      if (!running) drawResting();
    });
    colorObserver.observe(section, { attributes: true, attributeFilter: ['style', 'class'] });

    // Cleanup if the section is removed
    const removalObserver = new MutationObserver(() => {
      if (!document.body.contains(section)) {
        window.removeEventListener('resize', onResize);
        if (scanMonitor !== null) window.clearInterval(scanMonitor);
        colorObserver.disconnect();
        removalObserver.disconnect();
        if (rafId) cancelAnimationFrame(rafId);
        running = false;
      }
    });
    removalObserver.observe(document.body, { childList: true, subtree: true });
  }
})();