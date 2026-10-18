// ===== LOADER =====
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('hidden'), 350);
});

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

// ===== SCROLL (progress bar, navbar state, active link) — one rAF-batched handler =====
const scrollBar = document.getElementById('scrollProgress');
const navbar = document.getElementById('navbar');
const navLinkEls = document.querySelectorAll('.nav-link');
const sectionEls = [...document.querySelectorAll('section[id]')];
let sectionTops = [];
function measureSections() { sectionTops = sectionEls.map(s => ({ id: s.id, top: s.offsetTop })); }
measureSections();
window.addEventListener('load', measureSections);
window.addEventListener('resize', measureSections, { passive: true });

let scrollTicking = false;
function onScrollFrame() {
  scrollTicking = false;
  const y = window.scrollY;
  const max = document.body.scrollHeight - window.innerHeight;
  scrollBar.style.width = (max > 0 ? y / max * 100 : 0) + '%';
  navbar.classList.toggle('scrolled', y > 40);
  let current = '';
  for (const s of sectionTops) if (y >= s.top - 120) current = s.id;
  navLinkEls.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + current));
}
window.addEventListener('scroll', () => {
  if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(onScrollFrame); }
}, { passive: true });
onScrollFrame();

// ===== MOBILE MENU =====
const hamburger = document.getElementById('hamburger');
const navLinksEl = document.getElementById('navLinks');
function setMenu(open) {
  hamburger.classList.toggle('open', open);
  navLinksEl.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  hamburger.setAttribute('aria-expanded', open);
}
hamburger.addEventListener('click', () => setMenu(!navLinksEl.classList.contains('open')));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', e => {
  if (navLinksEl.classList.contains('open') && !navLinksEl.contains(e.target) && !hamburger.contains(e.target)) setMenu(false);
});
window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); }, { passive: true });
navLinksEl.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => setMenu(false));
});

// ===== TYPEWRITER =====
(function () {
  const el = document.getElementById('typewriter');
  const words = ['Full Stack Developer', 'WordPress Specialist', 'AI-augmented Developer', 'Freelancer'];
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


// ===== LIQUID CHROME BACKGROUND (WebGL) =====
(function () {
  const canvas = document.getElementById('liquidBg');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return;

  const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }';

  // Original liquid look: 4-octave nested domain warp, lit with finite differences (sharp detail).
  const fs = `
    precision highp float;
    uniform vec2 res; uniform float t;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f = f*f*(3.0-2.0*f);
      return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for(int i=0;i<4;i++){ v += a*noise(p); p = p*2.03 + vec2(1.7,9.2); a *= 0.5; }
      return v;
    }
    float height(vec2 p){
      vec2 q = vec2(fbm(p + vec2(0.0, t*0.10)), fbm(p + vec2(5.2, 1.3) - t*0.08));
      vec2 r = vec2(fbm(p + 3.0*q + vec2(1.7, 9.2) + t*0.12), fbm(p + 3.0*q + vec2(8.3, 2.8) - t*0.10));
      return fbm(p + 3.2*r) + 0.35*sin(p.y*3.0 + r.x*6.0 - t*0.35);
    }
    void main(){
      vec2 uv = gl_FragCoord.xy / res.xy;
      vec2 p = vec2(uv.x * res.x / res.y * 2.2, uv.y * 1.3);
      p.y += uv.x * 0.8;
      float h = height(p);
      float e = 0.004;
      float hx = height(p + vec2(e, 0.0));
      float hy = height(p + vec2(0.0, e));
      vec2 g = vec2(hx - h, hy - h) / e;
      vec3 n = normalize(vec3(-g * 0.045, 1.0));
      vec3 L = normalize(vec3(-0.45, 0.6, 0.65));
      float diff = clamp(dot(n, L), 0.0, 1.0);
      vec3 V = vec3(0.0, 0.0, 1.0);
      float spec = pow(clamp(dot(reflect(-L, n), V), 0.0, 1.0), 26.0);
      float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 1.6);
      vec3 navy = vec3(0.02, 0.02, 0.28);
      vec3 royal = vec3(0.10, 0.12, 0.82);
      vec3 peri = vec3(0.56, 0.58, 0.97);
      float k = smoothstep(0.25, 0.95, diff + (h - 0.6) * 0.6);
      vec3 col = mix(navy, royal, smoothstep(0.0, 0.55, k));
      col = mix(col, peri, smoothstep(0.5, 1.0, k + rim * 0.5));
      col += vec3(0.85, 0.88, 1.0) * spec * 0.9;
      col *= 0.82 + 0.25 * smoothstep(0.0, 1.0, uv.y);
      gl_FragColor = vec4(col, 1.0);
    }`;

  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'res'), uT = gl.getUniformLocation(prog, 't');

  // render at reduced resolution (CSS scales it up); adapt to the device's speed
  let scale = 0.5;
  const MIN_SCALE = 0.3;
  function resize() {
    canvas.width = Math.max(2, Math.floor(window.innerWidth * scale));
    canvas.height = Math.max(2, Math.floor(window.innerHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FRAME_MS = 1000 / 60;
  const start = performance.now();
  let last = 0, slow = 0, running = false;

  function draw(now) {
    if (document.hidden) { running = false; return; }
    if (!reduce) requestAnimationFrame(draw);
    const dt = now - last;
    if (dt < FRAME_MS - 2) return;
    last = now;

    // if frames keep taking too long, drop the resolution a notch
    if (dt > 40) { if (++slow > 20 && scale > MIN_SCALE) { scale = Math.max(MIN_SCALE, scale - 0.05); slow = 0; resize(); } }
    else if (slow > 0) slow--;

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uT, reduce ? 3.0 : (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (reduce) { running = false; }
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(draw); } }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  kick();
})();


// ===== PHILIPPINE CLOCK (footer) =====
(function () {
  const el = document.getElementById('phTime');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => { el.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 1000);
})();


// ===== PROJECT HOVER: scan + floating picture preview =====
(function () {
  const preview = document.getElementById('projectPreview');
  const cards = document.querySelectorAll('.project-card[data-project]');
  if (!preview || !cards.length) return;

  const img = document.getElementById('ppImg');
  const mock = document.getElementById('ppMock');
  const ppTitle = document.getElementById('ppTitle');
  const ppCat = document.getElementById('ppCat');
  const ppScreen = document.getElementById('ppScreen');
  const ppKiosk = document.getElementById('ppKiosk');
  const ppKioskImg = document.getElementById('ppKioskImg');
  const ppMockTitle = document.getElementById('ppMockTitle');
  const touch = window.matchMedia('(hover: none)').matches;
  const EXTS = ['webp', 'png', 'jpg', 'jpeg'];
  const found = {};                       // slug -> url | null (cache of image lookups)

  // find a real screenshot in assets/projects/<slug>.(webp|png|jpg|jpeg); fall back to the generated mock
  function findImage(slug) {
    if (slug in found) return Promise.resolve(found[slug]);
    return new Promise(resolve => {
      let i = 0;
      (function next() {
        if (i >= EXTS.length) { found[slug] = null; return resolve(null); }
        const url = `assets/projects/${slug}.${EXTS[i++]}`;
        const probe = new Image();
        probe.onload = () => { found[slug] = url; resolve(url); };
        probe.onerror = next;
        probe.src = url;
      })();
    });
  }

  let current = null, x = 0, y = 0, tx = 0, ty = 0, raf = 0;

  function place(instant) {
    const w = preview.offsetWidth, hgt = preview.offsetHeight, pad = 18;
    let nx = tx + 28, ny = ty - hgt / 2;
    if (nx + w + pad > window.innerWidth) nx = tx - w - 28;      // flip to the left near the right edge
    nx = Math.max(pad, Math.min(nx, window.innerWidth - w - pad));
    ny = Math.max(pad, Math.min(ny, window.innerHeight - hgt - pad));
    if (instant) { x = nx; y = ny; } else { x += (nx - x) * 0.18; y += (ny - y) * 0.18; }
    preview.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  }
  function loop() {
    if (!current) { raf = 0; return; }
    place(false);
    raf = requestAnimationFrame(loop);
  }

  async function show(card, clientX, clientY) {
    current = card;
    const slug = card.dataset.project;
    const title = card.querySelector('h3').textContent;
    const cat = card.querySelector('.project-category').textContent;
    const year = card.querySelector('.project-year').textContent;
    ppTitle.textContent = title; ppCat.textContent = cat + ' · ' + year;
    ppMockTitle.textContent = title;
    tx = clientX; ty = clientY;
    const kiosk = card.dataset.device === 'kiosk';
    preview.classList.toggle('is-kiosk', kiosk);
    ppKiosk.hidden = !kiosk; ppScreen.hidden = kiosk; ppKioskImg.hidden = true;
    img.hidden = true; mock.hidden = false; ppScreen.classList.remove('has-img');
    preview.classList.remove('live'); void preview.offsetWidth;   // restart the scan-reveal animation
    place(true);
    preview.classList.add('open', 'live');
    preview.setAttribute('aria-hidden', 'false');
    if (!raf) raf = requestAnimationFrame(loop);

    const url = await findImage(slug);
    if (current !== card) return;
    if (url && kiosk) { ppKioskImg.src = url; ppKioskImg.alt = title + ' kiosk screen'; ppKioskImg.hidden = false; }
    else if (url) { img.src = url; img.alt = title + ' screenshot'; img.hidden = false; mock.hidden = true; ppScreen.classList.add('has-img'); }
  }
  function hide() {
    current = null;
    preview.classList.remove('open', 'live');
    preview.setAttribute('aria-hidden', 'true');
  }

  cards.forEach(card => {
    if (!touch) {
      card.addEventListener('mouseenter', e => show(card, e.clientX, e.clientY));
      card.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; if (!current) show(card, tx, ty); }, { passive: true });
      card.addEventListener('mouseleave', hide);
    }
    card.addEventListener('focus', () => { const r = card.getBoundingClientRect(); show(card, r.right - 40, r.top + r.height / 2); });
    card.addEventListener('blur', hide);
    if (touch) {
      card.addEventListener('click', e => {
        if (current === card) return hide();
        show(card, window.innerWidth / 2 - preview.offsetWidth / 2 - 28, window.innerHeight / 2);
        preview.classList.add('sheet');
        e.stopPropagation();
      });
    }
  });
  if (touch) document.addEventListener('click', () => { if (current) { hide(); preview.classList.remove('sheet'); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', () => { if (current && !touch) hide(); }, { passive: true });
})();
