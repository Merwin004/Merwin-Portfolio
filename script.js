// ===== CAPRICORN CONSTELLATION (3D Interactive) =====
(function () {
  const canvas = document.getElementById('constellationCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const RES = 580;
  canvas.width = RES;
  canvas.height = RES;

  const cx = RES / 2;
  const cy = RES / 2 + 15;
  const SCALE = 192;
  const FOV   = 680;

  // ---- Capricornus stars — 3D world coords + apparent magnitude ----
  const STARS = [
    { x: -1.30, y:  0.14, z:  0.22, mag: 3.6 },  // 0  α — Algedi
    { x: -0.88, y:  0.28, z:  0.10, mag: 3.1 },  // 1  β — Dabih
    { x: -0.48, y:  0.09, z:  0.03, mag: 4.2 },  // 2  ψ
    { x: -0.08, y:  0.04, z: -0.06, mag: 4.1 },  // 3  ω
    { x:  0.38, y:  0.15, z: -0.11, mag: 4.0 },  // 4  π
    { x:  0.82, y:  0.25, z:  0.00, mag: 4.3 },  // 5  ι
    { x:  1.08, y:  0.20, z:  0.11, mag: 4.7 },  // 6  κ
    { x:  1.34, y:  0.04, z:  0.17, mag: 2.9 },  // 7  δ — Deneb Algedi ★
    { x:  1.12, y: -0.31, z:  0.06, mag: 3.7 },  // 8  γ — Nashira
    { x:  0.62, y: -0.53, z: -0.04, mag: 4.7 },  // 9  ε
    { x:  0.12, y: -0.58, z: -0.17, mag: 4.5 },  // 10 ζ
    { x: -0.36, y: -0.43, z: -0.10, mag: 4.1 },  // 11 η
    { x: -0.76, y: -0.22, z:  0.00, mag: 4.4 },  // 12 θ
  ];

  // IAU-style connection lines
  const LINES = [
    [0,  1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], // upper arc α→δ
    [7,  8],                                                     // δ→γ (right drop)
    [8,  9], [9, 10], [10, 11], [11, 12],                      // lower arc γ→θ
    [0, 12],                                                     // left close α→θ
    [1, 12],                                                     // inner β→θ
    [3, 11],                                                     // inner ω→η
  ];

  // ---- Background micro-stars (static space effect) ----
  const BG_STARS = Array.from({ length: 55 }, () => ({
    x: Math.random() * RES,
    y: Math.random() * RES,
    r: Math.random() * 0.9 + 0.15,
    a: Math.random() * 0.35 + 0.08,
    phase: Math.random() * Math.PI * 2,
    rate:  Math.random() * 0.02 + 0.008,
  }));

  // ---- Rotation state ----
  let rotX = 0.18, rotY = -0.22;
  let velX = 0,    velY = 0;
  let isDragging = false;
  let lastMX = 0,  lastMY = 0;
  let lastDX = 0,  lastDY = 0;
  const AUTO_SPIN = 0.0007;

  // ---- Tracking dots — slide along constellation edges ----
  const trackers = [];
  LINES.forEach((seg, li) => {
    const count = li < 7 ? 3 : 2;
    for (let d = 0; d < count; d++) {
      trackers.push({
        seg,
        t:         d / count,
        speed:     0.0013 + Math.random() * 0.0024,
        dir:       Math.random() < 0.6 ? 1 : -1,
        size:      0.9 + Math.random() * 1.2,
        trail:     [],
        TRAIL_LEN: 14 + Math.floor(Math.random() * 7),
      });
    }
  });

  // Twinkle phases per star
  STARS.forEach(s => {
    s.twPhase = Math.random() * Math.PI * 2;
    s.twRate  = 0.025 + Math.random() * 0.04;
  });

  // ---- Interaction — mouse ----
  function onDown(mx, my) {
    isDragging = true; lastMX = mx; lastMY = my; lastDX = 0; lastDY = 0;
  }
  function onMove(mx, my) {
    if (!isDragging) return;
    lastDX = mx - lastMX; lastDY = my - lastMY;
    rotY += lastDX * 0.007; rotX += lastDY * 0.007;
    rotX = Math.max(-1.1, Math.min(1.1, rotX));
    lastMX = mx; lastMY = my;
  }
  function onUp() {
    if (!isDragging) return;
    isDragging = false;
    velY = lastDX * 0.004; velX = lastDY * 0.004;
  }

  canvas.addEventListener('mousedown',  e => onDown(e.clientX, e.clientY));
  window.addEventListener('mousemove',  e => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup',    onUp);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); onDown(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  canvas.addEventListener('touchend',   onUp);

  // ---- 3D helpers ----
  function rotate(px, py, pz) {
    const cY = Math.cos(rotY), sY = Math.sin(rotY);
    const x1 = px * cY + pz * sY;
    const z1 = -px * sY + pz * cY;
    const cX = Math.cos(rotX), sX = Math.sin(rotX);
    return { x: x1, y: py * cX - z1 * sX, z: py * sX + z1 * cX };
  }

  function project(x, y, z) {
    const s = FOV / (FOV + z * SCALE);
    return { sx: cx + x * SCALE * s, sy: cy + y * SCALE * s, s, z };
  }

  function starProj(i) {
    const r = rotate(STARS[i].x, STARS[i].y, STARS[i].z);
    return project(r.x, r.y, r.z);
  }

  function trackerWorld(seg, t) {
    const [ai, bi] = seg;
    const a = STARS[ai], b = STARS[bi];
    return { x: a.x+(b.x-a.x)*t, y: a.y+(b.y-a.y)*t, z: a.z+(b.z-a.z)*t };
  }

  // ---- Main loop ----
  let frame = 0;

  function tick() {
    frame++;

    if (!isDragging) {
      velX *= 0.91; velY *= 0.91;
      if (Math.abs(velY) < 0.0003) velY = AUTO_SPIN;
      rotY += velY; rotX += velX;
      rotX = Math.max(-1.1, Math.min(1.1, rotX));
    }

    // Advance trackers + build trail
    trackers.forEach(tr => {
      tr.t += tr.speed * tr.dir;
      if (tr.t > 1) { tr.t = 1; tr.dir = -1; }
      if (tr.t < 0) { tr.t = 0; tr.dir =  1; }
      const w = trackerWorld(tr.seg, tr.t);
      const r = rotate(w.x, w.y, w.z);
      const p = project(r.x, r.y, r.z);
      tr.trail.unshift({ x: p.sx, y: p.sy, s: p.s });
      if (tr.trail.length > tr.TRAIL_LEN) tr.trail.pop();
    });

    render();
    requestAnimationFrame(tick);
  }

  function render() {
    ctx.clearRect(0, 0, RES, RES);
    const breathe = Math.sin(frame * 0.02) * 0.5 + 0.5;

    // ---- Deep space background glow ----
    const bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, RES * 0.6);
    bg.addColorStop(0, `rgba(25,12,70,${0.22 + breathe * 0.08})`);
    bg.addColorStop(0.6, 'rgba(10,5,30,0.1)');
    bg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, RES, RES);

    // ---- Micro background stars ----
    BG_STARS.forEach(s => {
      const flicker = Math.sin(frame * s.rate + s.phase) * 0.35 + 0.65;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,190,255,${s.a * flicker})`; ctx.fill();
    });

    // ---- Rotating HUD ring ----
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(frame * 0.0018);
    ctx.beginPath();
    ctx.arc(0, 0, RES * 0.41, -0.4, Math.PI * 1.65);
    ctx.strokeStyle = `rgba(99,102,241,${0.07 + breathe * 0.05})`;
    ctx.lineWidth = 0.7; ctx.setLineDash([3, 14]); ctx.stroke(); ctx.setLineDash([]);
    ctx.rotate(-frame * 0.0036);
    ctx.beginPath();
    ctx.arc(0, 0, RES * 0.43, 0.8, Math.PI * 1.1);
    ctx.strokeStyle = `rgba(6,182,212,${0.05 + breathe * 0.04})`;
    ctx.lineWidth = 0.6; ctx.setLineDash([2, 18]); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();

    // ---- Project all stars ----
    const SP = STARS.map((_, i) => starProj(i));

    // ---- Constellation lines ----
    LINES.forEach(([ai, bi]) => {
      const a = SP[ai], b = SP[bi];
      const avgZ = (a.z + b.z) * 0.5;
      const df = Math.max(0.2, Math.min(1, (avgZ + 0.4) * 1.3));

      // Outer glow
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy);
      ctx.strokeStyle = `rgba(99,102,241,${df * 0.17})`;
      ctx.lineWidth = 6; ctx.stroke();

      // Inner glow
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy);
      ctx.strokeStyle = `rgba(139,92,246,${df * 0.22})`;
      ctx.lineWidth = 2.5; ctx.stroke();

      // Core line — gradient indigo→violet→cyan
      const lg = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy);
      lg.addColorStop(0,   `rgba(139,92,246,${df * 0.9})`);
      lg.addColorStop(0.5, `rgba(99,102,241,${df * 0.7})`);
      lg.addColorStop(1,   `rgba(6,182,212,${df * 0.9})`);
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy);
      ctx.strokeStyle = lg; ctx.lineWidth = 1.1; ctx.stroke();
    });

    // ---- Tracking dots with glowing trails ----
    trackers.forEach(tr => {
      const len = tr.trail.length;

      // Trail — fading dots behind the head
      tr.trail.forEach((pt, i) => {
        const ratio = 1 - i / len;
        const r = tr.size * pt.s * ratio * 1.8;
        if (r < 0.1) return;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6,182,212,${ratio * ratio * 0.7})`; ctx.fill();
      });

      // Head — bright white core + cyan halo
      if (len > 0) {
        const h = tr.trail[0];
        const haloR = tr.size * h.s * 5.5;
        const hg = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, haloR);
        hg.addColorStop(0, 'rgba(6,182,212,0.65)');
        hg.addColorStop(0.4, 'rgba(99,102,241,0.2)');
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(h.x, h.y, haloR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(h.x, h.y, tr.size * h.s * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
      }
    });

    // ---- Stars ----
    SP.forEach((p, i) => {
      const star = STARS[i];
      const tw = Math.sin(frame * star.twRate + star.twPhase) * 0.28 + 0.72;
      const baseR = (6.3 - star.mag) * 0.95;
      const r = baseR * p.s * tw;
      const df = Math.max(0.35, Math.min(1, (p.z + 0.5) * 0.9 + 0.4)) * tw;

      // Wide soft glow
      const glowR = r * 6.5 + 2.5;
      const sg = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glowR);
      sg.addColorStop(0,    `rgba(200,210,255,${df * 0.8})`);
      sg.addColorStop(0.3,  `rgba(120,100,255,${df * 0.35})`);
      sg.addColorStop(0.65, `rgba(99,102,241,${df * 0.12})`);
      sg.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(p.sx, p.sy, glowR, 0, Math.PI * 2); ctx.fill();

      // Star core
      ctx.beginPath(); ctx.arc(p.sx, p.sy, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,235,255,${df})`; ctx.fill();

      // Diffraction cross-spikes — top 3 brightest stars
      if (star.mag < 3.8) {
        const spike = r * 7 * df;
        ctx.save();
        ctx.globalAlpha = df * 0.45;
        ctx.strokeStyle = 'rgba(210,220,255,1)';
        ctx.lineWidth = 0.65;
        [0, Math.PI / 4].forEach(angle => {
          ctx.save(); ctx.translate(p.sx, p.sy); ctx.rotate(angle);
          ctx.beginPath(); ctx.moveTo(-spike, 0); ctx.lineTo(spike, 0); ctx.stroke();
          ctx.restore();
        });
        ctx.restore();
      }

      // Tiny tech diamond marker at each star position
      const d = Math.max(1.8, r * 1.3) * df;
      ctx.save();
      ctx.strokeStyle = `rgba(99,102,241,${df * 0.4})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(p.sx, p.sy - d * 1.8); ctx.lineTo(p.sx + d, p.sy);
      ctx.lineTo(p.sx, p.sy + d * 1.8); ctx.lineTo(p.sx - d, p.sy);
      ctx.closePath(); ctx.stroke();
      ctx.restore();
    });
  }

  tick();
})();

// ===== LOADER =====
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('hidden'), 350);
});

// ===== PARTICLE CANVAS =====
(function () {
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles;
  const COUNT = 70;
  const MAX_DIST = 130;
  let mouseX = -9999, mouseY = -9999;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() { this.reset(); }
  Particle.prototype.reset = function () {
    this.x = Math.random() * W; this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.45; this.vy = (Math.random() - 0.5) * 0.45;
    this.r = Math.random() * 1.4 + 0.5;
  };
  Particle.prototype.update = function () {
    const dx = this.x - mouseX, dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 100 && dist > 0) {
      const force = (100 - dist) / 100 * 0.8;
      this.vx += (dx / dist) * force * 0.04;
      this.vy += (dy / dist) * force * 0.04;
    }
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 1.5) { this.vx *= 1.5 / speed; this.vy *= 1.5 / speed; }
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
  };

  function init() { resize(); particles = Array.from({ length: COUNT }, () => new Particle()); }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      const p = particles[i];
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99,102,241,0.75)'; ctx.fill();
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.22;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(99,102,241,${alpha})`; ctx.lineWidth = 0.7; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
  init(); draw();
})();

// ===== CUSTOM CURSOR =====
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  let fx = 0, fy = 0, mx = 0, my = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
  }, { passive: true });

  (function animateFollower() {
    fx += (mx - fx) * 0.11; fy += (my - fy) * 0.11;
    follower.style.left = fx + 'px'; follower.style.top = fy + 'px';
    requestAnimationFrame(animateFollower);
  })();

  document.querySelectorAll('a, button, .tilt-card, input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.classList.add('hover'); follower.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); follower.classList.remove('hover'); });
  });
})();

// ===== SCROLL PROGRESS =====
const scrollBar = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  scrollBar.style.width = pct + '%';
}, { passive: true });

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
const navLinkEls = document.querySelectorAll('.nav-link');
const sectionEls = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  let current = '';
  sectionEls.forEach(sec => { if (window.scrollY >= sec.offsetTop - 120) current = sec.id; });
  navLinkEls.forEach(link => { link.classList.toggle('active', link.getAttribute('href') === '#' + current); });
}, { passive: true });

// ===== MOBILE MENU =====
const hamburger = document.getElementById('hamburger');
const navLinksEl = document.getElementById('navLinks');
hamburger.addEventListener('click', () => { hamburger.classList.toggle('open'); navLinksEl.classList.toggle('open'); });
navLinksEl.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => { hamburger.classList.remove('open'); navLinksEl.classList.remove('open'); });
});

// ===== TYPEWRITER =====
(function () {
  const el = document.getElementById('typewriter');
  const words = ['Full Stack Developer', 'ML Engineer', 'SQA Specialist', 'Freelancer'];
  let wi = 0, ci = 0, deleting = false;
  function type() {
    const word = words[wi];
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(type, 2000); return; }
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
    }
    setTimeout(type, deleting ? 55 : 85);
  }
  setTimeout(type, 800);
})();

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));

// ===== COUNTER =====
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.count;
    let cur = 0;
    const timer = setInterval(() => {
      cur += target / 45;
      if (cur >= target) { cur = target; clearInterval(timer); }
      el.textContent = Math.floor(cur);
    }, 28);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-num').forEach(el => counterObserver.observe(el));

// ===== SKILL BARS =====
const skillObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.style.width = e.target.style.getPropertyValue('--w'); skillObserver.unobserve(e.target); }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.skill-fill').forEach(el => skillObserver.observe(el));

// ===== FAQ =====
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ===== 3D CARD TILT =====
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

// ===== MAGNETIC BUTTONS =====
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.28;
      const y = (e.clientY - r.top - r.height / 2) * 0.28;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
})();

// ===== CONTACT FORM =====
document.getElementById('contactForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const success = document.getElementById('formSuccess');
  const originalHTML = btn.innerHTML;
  btn.textContent = 'Sending…';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    success.classList.add('show');
    this.reset();
    setTimeout(() => success.classList.remove('show'), 4500);
  }, 1500);
});
