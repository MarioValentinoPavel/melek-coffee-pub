// Melek Coffee Pub · estado en vivo (hora de Bucarest), portada de vídeo, vídeos, planificador de platou en una mesa redonda
// (sillas y platos que se reparten, la tabla real en el centro, bengalas), carta, bebidas y horario. Los textos dinámicos siguen al idioma (evento langchange).
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const L = () => root.lang || 'ro';
  const T = (o) => (o && (o[L()] ?? o.ro)) || '';
  const nf = (d = 0) => new Intl.NumberFormat(L() === 'en' ? 'en-GB' : L() === 'es' ? 'es-ES' : 'ro-RO', { minimumFractionDigits: d, maximumFractionDigits: d });
  const lei = (n) => nf().format(n) + ' lei';
  const grams = (n) => nf().format(n) + ' g';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PHONE = '40744307000';
  let ready = false;
  const SHOT = /[?&]shot=1/.test(location.search); // solo para capturas de prueba: todo cargado y la mesa ya servida
  if (SHOT) {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; if (i.getAttribute('src')) i.src = i.getAttribute('src'); });
    const st = document.createElement('style'); st.textContent = '.ck{display:none!important}'; document.head.appendChild(st);
  }

  /* ---------- estado abierto / cerrado (todos los días 12:00–00:00, Europe/Bucharest) ---------- */
  const DAYS = [1, 2, 3, 4, 5, 6, 0];
  function nowRO() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
    return { wd, h: +p.hour, m: +p.minute };
  }
  function dayName(wd) {
    const d = new Date(Date.UTC(2026, 0, 4 + wd)); // 4 ene 2026 = domingo
    const s = new Intl.DateTimeFormat(L(), { weekday: 'long', timeZone: 'UTC' }).format(d);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function renderStatus() {
    const { wd, h } = nowRO();
    const open = h >= 12;
    const head = open ? T({ ro: 'Deschis acum', en: 'Open now', es: 'Abierto ahora' }) : T({ ro: 'Închis acum', en: 'Closed now', es: 'Cerrado ahora' });
    const tail = open ? T({ ro: 'până la 00:00', en: 'until midnight', es: 'hasta las 00:00' }) : T({ ro: 'deschidem la 12:00', en: 'we open at 12:00', es: 'abrimos a las 12:00' });
    const txt = head + ' · ' + tail;
    $$('[data-status]').forEach((el) => { el.classList.toggle('is-open', open); const s = $('[data-status-text]', el); if (s) s.innerHTML = `${esc(head)}<span class="status-more"> · ${esc(tail)}</span>`; });
    const big = $('[data-status-big]');
    if (big) { big.textContent = txt; big.classList.toggle('is-open', open); }
    const ul = $('[data-hours]');
    if (ul) {
      ul.innerHTML = DAYS.map((d) => `<li class="${d === wd ? 'today' : ''}"><span>${esc(dayName(d))}${d === wd ? ' · ' + esc(T({ ro: 'azi', en: 'today', es: 'hoy' })) : ''}</span><span>12:00–00:00</span></li>`).join('');
    }
  }

  /* ---------- cabecera ---------- */
  const header = $('[data-header]'), heroEl = $('[data-hero]');
  // sobre el vídeo de la portada la cabecera es transparente; al bajar vuelve a ser crema
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-stuck', scrollY > 8);
    header.classList.toggle('on-dark', !!heroEl && !header.classList.contains('menu-open') && scrollY < heroEl.offsetHeight - header.offsetHeight - 40);
  };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
  const mBtn = $('[data-menu-btn]'), mMenu = $('[data-mobile-menu]');
  function setMenu(open) {
    if (!mBtn) return;
    mBtn.setAttribute('aria-expanded', String(open));
    mMenu.hidden = !open;
    header.classList.toggle('menu-open', open);
    root.style.overflow = open ? 'hidden' : '';
    onScroll();
    const lab = $('.sr', mBtn);
    if (lab) lab.textContent = open ? T({ ro: 'Închide meniul', en: 'Close the menu', es: 'Cerrar el menú' }) : T({ ro: 'Deschide meniul', en: 'Open the menu', es: 'Abrir el menú' });
  }
  mBtn && mBtn.addEventListener('click', () => setMenu(mBtn.getAttribute('aria-expanded') !== 'true'));
  mMenu && mMenu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && mBtn && mBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); mBtn.focus(); } });

  // anclas: desplazamiento suave por JS (sin scroll-behavior en CSS) y foco en la sección
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id);
  });

  /* ---------- portada: vídeo a pantalla completa, horizontal o vertical según la pantalla ---------- */
  const hv = $('[data-hero-vid]');
  if (hv && heroEl) {
    let cur = '', heroVisible = true;
    const pick = () => {
      if (!innerWidth || !innerHeight) return; // ventana sin tamaño (pestaña oculta)
      const port = innerWidth / innerHeight < .8;
      const want = port ? 'port' : 'land';
      if (want === cur) return;
      cur = want;
      hv.poster = port ? hv.dataset.posterPort : hv.dataset.posterLand;
      if (RM.matches) return; // movimiento reducido: solo la imagen fija
      hv.src = port ? hv.dataset.port : hv.dataset.land;
      hv.load();
      if (heroVisible) hv.play().catch(() => {});
    };
    new IntersectionObserver(([en]) => {
      heroVisible = en.isIntersecting;
      if (!hv.getAttribute('src')) return;
      if (heroVisible) hv.play().catch(() => {}); else hv.pause();
    }, { threshold: .05 }).observe(heroEl);
    pick();
    addEventListener('resize', pick);
  }

  /* ---------- vídeos (se cargan y reproducen solo a la vista) ---------- */
  function lazyVideo(v, onFirst) {
    let loaded = false;
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) {
        if (!loaded) { loaded = true; v.src = v.dataset.src; onFirst && onFirst(); }
        if (!v.closest('.is-full')) v.play().catch(() => {});
      } else if (!v.paused && !v.closest('.is-full')) v.pause();
    }, { threshold: .3 });
    io.observe(v);
    if (v.dataset.end) v.addEventListener('timeupdate', () => { if (v.currentTime > +v.dataset.end) v.currentTime = 0; });
  }
  const tk = $('[data-tiktok]');
  if (tk) {
    const v = $('video', tk);
    lazyVideo(v);
    $('[data-sound]', tk).addEventListener('click', () => {
      tk.classList.add('is-full');
      v.loop = false; v.controls = true; v.muted = false; v.preload = 'auto';
      v.src = v.dataset.full; v.currentTime = 0;
      v.play().catch(() => {});
      v.focus();
    });
  }
  $$('[data-loopvid] video').forEach((v) => lazyVideo(v));

  // contadores del TikTok
  function renderStats(animate) {
    $$('[data-count]').forEach((b) => {
      const end = +b.dataset.count, dec = +b.dataset.dec || 0, f = nf(dec);
      if (!animate || RM.matches) { b.textContent = f.format(end); return; }
      const t0 = performance.now(), dur = 1400;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); b.textContent = f.format(end * e); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  const statsBox = $('.melek-stats');
  if (statsBox) { const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { renderStats(true); io.disconnect(); } }, { threshold: .5 }); io.observe(statsBox); }

  /* ---------- planificador: ¿cuántos sois? Mesa redonda vista desde arriba ---------- */
  const P = window.PLATTERS || {};
  const OPTIONS = { 1: ['melek1', 'vanator1'], 2: ['melek2'], 3: ['melek3', 'pane3'], 4: ['melek4', 'vanator4'], 5: ['melek5'], 6: ['melek6', 'vanator6'], 7: [['melek4', 'melek3']], 8: [['melek4', 'melek4']], 9: [['melek5', 'melek4']], 10: ['oriental10', ['melek5', 'melek5']] };
  const MAXN = 10;
  // fotos reales: todas las Melek son la misma tabla redonda en distintos tamaños; la Pane no tiene foto
  const PIMG = (k) => k.startsWith('melek') ? 'plt-melek' : k.startsWith('vanator') ? 'plt-vanator-sq' : k === 'oriental10' ? 'plt-long-sq' : '';
  const IMG = {
    'plt-melek': { src: 'assets/img/plt-melek-720.webp', srcset: 'assets/img/plt-melek-720.webp 720w, assets/img/plt-melek-1100.webp 1100w' },
    'plt-vanator-sq': { src: 'assets/img/plt-vanator-sq-830.webp', srcset: 'assets/img/plt-vanator-sq-830.webp 830w' },
    'plt-long-sq': { src: 'assets/img/plt-long-sq-600.webp', srcset: 'assets/img/plt-long-sq-600.webp 600w, assets/img/plt-long-sq-900.webp 900w' }
  };
  const ALT = {
    'plt-melek': { ro: 'Platou Melek pe tabla rotundă: ceafă, mici, cârnați, cartofi cu mozzarella, murături și sosuri', en: 'Melek platter on its round board: pork neck, mici, sausages, potatoes with mozzarella, pickles and sauces', es: 'Tabla Melek redonda: presa de cerdo, mici, salchichas, patatas con mozzarella, encurtidos y salsas' },
    'plt-vanator-sq': { ro: 'Platou vânătoresc: cotlete, pastramă pe mămăligă și cartofi', en: 'Hunter’s platter: chops, pastrami on polenta and potatoes', es: 'Tabla del cazador: chuletas, pastrami sobre polenta y patatas' },
    'plt-long-sq': { ro: 'Platou lung cu adana, frigărui, roșii coapte și cartofi cu brânză', en: 'Long platter with adana, skewers, roasted tomatoes and potatoes with cheese', es: 'Tabla larga con adana, brochetas, tomates asados y patatas con queso' }
  };
  const shortName = (k) => k.startsWith('melek') ? 'Platou Melek' : k.startsWith('vanator') ? (k === 'vanator4' ? 'Platou Melek Vânătoresc' : 'Platou Vânătoresc') : k === 'pane3' ? 'Platou Melek Pane' : 'Platou Melek Oriental';
  const people = (n) => n + ' ' + (n === 1 ? T({ ro: 'persoană', en: 'person', es: 'persona' }) : T({ ro: 'persoane', en: 'people', es: 'personas' }));

  const plan = { n: 4, choice: 0, started: false };
  const tableEl = $('[data-table]');
  const cvWood = tableEl && $('.board-wood', tableEl), cvFx = tableEl && $('.board-fx', tableEl);
  const chairs = [], plates = [], platters = tableEl ? $$('.platter', tableEl) : [];
  let layout = [];

  function buildTable() {
    const cl = $('[data-chairs]', tableEl), pl = $('[data-plates]', tableEl);
    for (let i = 0; i < MAXN; i++) {
      const c = document.createElement('i'); c.className = 'chair'; cl.appendChild(c); chairs.push(c);
      const p = document.createElement('i'); p.className = 'plate'; pl.appendChild(p); plates.push(p);
    }
    placeState();
  }
  // el primero se sienta abajo (frente a quien mira) y el resto se reparte a partes iguales;
  // las sillas libres esperan donde se sentaría el siguiente
  const angle = (i, n) => 180 + i * 360 / n;
  function placeState() {
    const n = plan.started ? plan.n : 0;
    for (let i = 0; i < MAXN; i++) {
      const on = i < n, a = on ? angle(i, n) : angle(i, i + 1);
      chairs[i].style.transform = `translate(-50%, -50%) rotate(${a}deg) translateY(${on ? -43.5 : -49}cqw)`;
      plates[i].style.transform = `translate(-50%, -50%) rotate(${a}deg) translateY(-31cqw) scale(${on ? 1 : .3})`;
      chairs[i].classList.toggle('on', on); plates[i].classList.toggle('on', on);
    }
  }
  // tamaño de las tablas (en % del ancho de la mesa): crecen con las personas; dos tablas van una junto a otra
  function platterLayout(keys) {
    if (keys.length === 1) return [{ d: keys[0] === 'oriental10' ? 46 : 25 + Math.min(6, P[keys[0]].n) * 3.7, x: 0 }];
    const ds = keys.map((k) => 18 + P[k].n * 1.4), tot = ds[0] + ds[1] - 1.5;
    return [{ d: ds[0], x: -tot / 2 + ds[0] / 2 }, { d: ds[1], x: tot / 2 - ds[1] / 2 }];
  }
  function platterState(keys, animate) {
    layout = plan.started ? platterLayout(keys) : [];
    platters.forEach((el, j) => {
      const lay = layout[j], k = keys[j];
      el.classList.toggle('on', !!lay);
      if (!lay) return;
      el.style.setProperty('--d', lay.d.toFixed(2)); el.style.setProperty('--x', lay.x.toFixed(2));
      const ik = PIMG(k), img = $('img', el);
      el.classList.toggle('no-photo', !ik);
      $('.platter-name', el).textContent = ik ? '' : 'Pane';
      if (!ik) { img.removeAttribute('src'); img.removeAttribute('srcset'); img.dataset.k = ''; img.alt = ''; return; }
      const alt = j && keys[0] === k ? '' : T(ALT[ik]); // la segunda tabla igual a la primera: decorativa
      if (img.dataset.k === ik) { img.alt = alt; return; }
      const swap = () => {
        img.srcset = IMG[ik].srcset; img.src = IMG[ik].src; img.dataset.k = ik; img.alt = alt;
        const show = () => img.classList.remove('is-swapping');
        img.decode ? img.decode().then(show, show) : show();
      };
      if (img.dataset.k && animate && !RM.matches) { img.classList.add('is-swapping'); setTimeout(swap, 240); } else swap();
    });
  }

  /* la madera de la mesa (canvas, se repinta solo al cambiar de tamaño) */
  let DPR = 1;
  function sizeTable() {
    const r = tableEl.getBoundingClientRect(); if (!r.width) return;
    DPR = Math.min(2, devicePixelRatio || 1);
    [cvWood, cvFx].forEach((c) => { c.width = Math.round(r.width * DPR); c.height = Math.round(r.height * DPR); });
    drawWood();
  }
  function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function drawWood() {
    const g = cvWood.getContext('2d'), w = cvWood.width, cx = w / 2, cy = cvWood.height / 2, R = w * .38, TAU = Math.PI * 2;
    g.clearRect(0, 0, w, cvWood.height);
    // sombra blanda sobre el suelo
    g.save(); g.shadowColor = 'rgba(43,24,16,.4)'; g.shadowBlur = w * .05; g.shadowOffsetY = w * .025;
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fillStyle = '#b47a42'; g.fill(); g.restore();
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    const base = g.createLinearGradient(0, cy - R, 0, cy + R);
    base.addColorStop(0, '#d6a066'); base.addColorStop(.5, '#c98f53'); base.addColorStop(1, '#b17641');
    g.fillStyle = base; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    const r = rnd(1234), x0 = cx - R - 10, x1 = cx + R + 10;
    // vetas largas, horizontales y algo onduladas
    for (let k = 0; k < 160; k++) {
      const y0 = cy - R + r() * R * 2, amp = (2 + r() * 7) * DPR, f = (0.6 + r() * 2.4) / (R * 2) * TAU, ph = r() * 6.28, dark = r() < .62;
      g.strokeStyle = dark ? `rgba(110,62,28,${.05 + r() * .12})` : `rgba(240,196,140,${.05 + r() * .12})`;
      g.lineWidth = (.5 + r() * 1.8) * DPR;
      g.beginPath();
      for (let x = x0; x <= x1; x += 14 * DPR) { const y = y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.1 + ph * 2) * amp * .25; x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke();
    }
    // juntas entre los tablones
    for (let k = 1; k < 6; k++) {
      const y = cy - R + R * 2 * k / 6;
      g.fillStyle = 'rgba(78,40,15,.3)'; g.fillRect(x0, y - .7 * DPR, x1 - x0, 1.2 * DPR);
      g.fillStyle = 'rgba(255,228,186,.16)'; g.fillRect(x0, y + .6 * DPR, x1 - x0, 1 * DPR);
    }
    // barniz: luz arriba a la izquierda, el canto más oscuro
    const lit = g.createRadialGradient(cx - R * .3, cy - R * .35, R * .05, cx, cy, R);
    lit.addColorStop(0, 'rgba(255,238,205,.26)'); lit.addColorStop(.6, 'rgba(255,238,205,0)'); lit.addColorStop(.92, 'rgba(70,36,14,.12)'); lit.addColorStop(1, 'rgba(70,36,14,.4)');
    g.fillStyle = lit; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    g.restore();
    // canto y filete de latón
    g.lineWidth = Math.max(1.5, w * .006); g.strokeStyle = '#6e3d1a';
    g.beginPath(); g.arc(cx, cy, R - g.lineWidth / 2, 0, TAU); g.stroke();
    const brass = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    brass.addColorStop(0, '#f3dc9f'); brass.addColorStop(.35, '#b98b3f'); brass.addColorStop(.6, '#ecca80'); brass.addColorStop(1, '#94692a');
    g.lineWidth = Math.max(1.2, w * .0042); g.strokeStyle = brass;
    g.beginPath(); g.arc(cx, cy, R * .962, 0, TAU); g.stroke();
  }

  /* bengalas clavadas en la tabla (al llegar a 10 con la Oriental), vistas desde arriba */
  const sparks = []; let sparkUntil = 0;
  function fireSparklers() {
    if (RM.matches || !cvFx) return;
    sparkUntil = performance.now() + 2800; loop();
  }
  function stepSparks(dt, now) {
    const g = cvFx.getContext('2d'), w = cvFx.width, h = cvFx.height, u = w / 100;
    const lay = layout[0] || { d: 40, x: 0 }, pr = lay.d * u * .5;
    const em = [-90, 30, 150].map((a) => [w / 2 + lay.x * u + Math.cos(a * Math.PI / 180) * pr * .42, h / 2 + Math.sin(a * Math.PI / 180) * pr * .42]);
    const on = now < sparkUntil;
    if (on) for (let k = 0; k < 300 * dt; k++) for (const [ex, ey] of em) {
      const a = Math.random() * Math.PI * 2, sp = (16 + Math.random() * 46) * u;
      sparks.push({ x: ex, y: ey, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .35 + Math.random() * .75, age: 0 });
    }
    g.clearRect(0, 0, w, h);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    if (on) for (const [ex, ey] of em) { // resplandor que parpadea bajo cada bengala
      const rr = u * (5 + Math.random() * 2.5), gl = g.createRadialGradient(ex, ey, 0, ex, ey, rr);
      gl.addColorStop(0, 'rgba(255,236,190,.95)'); gl.addColorStop(.3, 'rgba(255,170,70,.45)'); gl.addColorStop(1, 'rgba(255,120,40,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(ex, ey, rr, 0, Math.PI * 2); g.fill();
    }
    const B = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], drag = Math.exp(-2.4 * dt);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.age += dt; if (s.age > s.life) { sparks.splice(i, 1); continue; }
      s.vx *= drag; s.vy *= drag; s.x += s.vx * dt; s.y += s.vy * dt;
      const b = Math.min(3, Math.floor((1 - s.age / s.life) * 4));
      B[b].moveTo(s.x - s.vx * .035, s.y - s.vy * .035); B[b].lineTo(s.x, s.y);
    }
    B.forEach((p, b) => {
      const k = (b + 1) / 4;
      g.strokeStyle = `rgba(255,140,50,${.35 * k})`; g.lineWidth = (2.6 + k * 2) * DPR; g.stroke(p);
      g.strokeStyle = `rgba(255,${200 + 50 * k | 0},${140 + 100 * k | 0},${k})`; g.lineWidth = (.8 + k * .9) * DPR; g.stroke(p);
    });
    g.restore();
    return sparks.length > 0 || on;
  }
  let raf = 0, last = 0;
  function loop() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(now) {
    raf = 0;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (stepSparks(dt, now)) raf = requestAnimationFrame(tick);
  }

  function optionLabel(o) {
    if (Array.isArray(o)) return o[0] === o[1] ? `2 × ${shortName(o[0])} ${P[o[0]].n}` : o.map((k) => `${shortName(k)} ${P[k].n}`).join(' + ');
    return o.startsWith('vanator') ? T({ ro: 'Vânătoresc', en: 'Hunter’s', es: 'Del cazador' }) : o === 'pane3' ? 'Pane' : o === 'oriental10' ? 'Oriental' : 'Platou Melek';
  }
  function renderPlan(animate) {
    if (!tableEl) return;
    const n = plan.n, opts = OPTIONS[n], o = opts[Math.min(plan.choice, opts.length - 1)];
    const list = Array.isArray(o) ? o.map((k) => P[k]) : [P[o]];
    const keys = Array.isArray(o) ? o : [o];
    const total = list.reduce((a, p) => a + p.p, 0), g = list.every((p) => p.g) ? list.reduce((a, p) => a + p.g, 0) : 0;
    $('[data-count-out]').textContent = n;
    $('[data-count-label]').textContent = n === 1 ? T({ ro: 'persoană', en: 'person', es: 'persona' }) : T({ ro: 'persoane', en: 'people', es: 'personas' });
    $('[data-step="-1"]').disabled = n <= 1; $('[data-step="1"]').disabled = n >= 10;
    // elección entre tablas de la carta para el mismo grupo
    const ch = $('[data-choice]');
    ch.innerHTML = opts.length > 1 ? opts.map((x, i) => `<button type="button" aria-pressed="${i === plan.choice}" data-ch="${i}">${esc(optionLabel(x))}</button>`).join('') : '';
    // ficha
    $('[data-r-name]').textContent = list.map((p) => p.ro).join(' + ');
    $('[data-r-meta]').textContent = people(n) + (g ? ' · ' + grams(g) : '');
    $('[data-r-price]').textContent = lei(total);
    $('[data-r-pp]').textContent = lei(Math.round(total / n)) + ' ' + T({ ro: 'de persoană', en: 'per person', es: 'por persona' });
    const ul = $('[data-contents]');
    ul.innerHTML = list.map((p, j) => (list.length > 1 ? `<li><b>${esc(p.ro)}</b></li>` : '') + p.c.map((c) => `<li>${esc(c)}</li>`).join('')).join('');
    ul.classList.toggle('is-long', ul.children.length > 11);
    const gift = $('[data-gift]');
    const hasGift = list.some((p) => p.gift);
    gift.hidden = !hasGift;
    if (hasGift) gift.textContent = T({ ro: 'Din partea casei: o sticlă de vin Aerosoli și foc de artificii.', en: 'On the house: a bottle of Aerosoli wine and sparklers.', es: 'Por cuenta de la casa: una botella de vino Aerosoli y bengalas.' });
    // WhatsApp: el mensaje va en rumano, que es lo que lee el local
    const lines = list.map((p) => `${p.ro}${p.g ? ` (${new Intl.NumberFormat('ro-RO').format(p.g)} g)` : ''} – ${new Intl.NumberFormat('ro-RO').format(p.p)} lei`);
    const msg = `Bună! Doresc să plasez o comandă: ${lines.join(' și ')}${list.length > 1 ? `. Total: ${new Intl.NumberFormat('ro-RO').format(total)} lei` : ''}. Suntem ${n} ${n === 1 ? 'persoană' : 'persoane'}.`;
    $('[data-wa]').href = `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
    // un solo aviso breve para lectores de pantalla cuando cambia la elección
    const ann = $('[data-announce]');
    if (ann && animate) ann.textContent = `${people(n)}: ${list.map((p) => p.ro).join(' + ')}, ${lei(total)}.`;
    // la mesa
    placeState(); platterState(keys, animate);
    if (animate && plan.started && n === 10 && o === 'oriental10') fireSparklers();
  }
  function setCount(n, opts = {}) {
    n = Math.max(1, Math.min(10, n));
    if (n !== plan.n) plan.choice = opts.choice ?? 0; else if (opts.choice != null) plan.choice = opts.choice;
    plan.n = n;
    renderPlan(true);
  }
  function renderAll() {
    const tb = $('[data-all]'); if (!tb) return;
    const keys = ['melek1', 'melek2', 'melek3', 'melek4', 'melek5', 'melek6', 'pane3', 'vanator1', 'vanator4', 'vanator6', 'oriental10'];
    tb.innerHTML = keys.map((k) => { const p = P[k]; return `<tr data-n="${p.n}" data-k="${k}"><td><button type="button">${esc(p.ro)}</button></td><td>${p.n}</td><td>${p.g ? esc(grams(p.g)) : '–'}</td><td>${esc(lei(p.p))}</td></tr>`; }).join('');
  }
  if (tableEl) {
    buildTable(); renderAll();
    const allD = $('[data-all-details]'); if (allD) allD.open = false; // abierta solo sin JavaScript (no hay mesa interactiva)
    $$('[data-step]').forEach((b) => b.addEventListener('click', () => setCount(plan.n + +b.dataset.step)));
    $('[data-choice]').addEventListener('click', (e) => { const b = e.target.closest('[data-ch]'); if (b) { plan.choice = +b.dataset.ch; renderPlan(true); } });
    $('[data-all]').addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-n]'); if (!tr) return;
      const n = +tr.dataset.n, k = tr.dataset.k, i = OPTIONS[n].findIndex((x) => x === k);
      plan.n = 0; setCount(n, { choice: Math.max(0, i) });
      tableEl.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'center' });
    });
    new ResizeObserver(() => sizeTable()).observe(tableEl);
    renderPlan(false);
    // la mesa se llena la primera vez que se ve: los comensales se sientan uno a uno
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting || plan.started) return;
      plan.started = true; io.disconnect();
      if (RM.matches) { renderPlan(false); return; }
      const target = plan.n; plan.n = 1; renderPlan(true);
      let k = 1; const iv = setInterval(() => { k++; plan.n = k; renderPlan(k === target); if (k >= target) clearInterval(iv); }, 420);
    }, { threshold: .35 });
    if (SHOT) {
      plan.started = true; const q = new URLSearchParams(location.search), qn = +q.get('n'), qc = +q.get('c') || 0;
      if (qn >= 1 && qn <= 10) plan.n = qn; plan.choice = qc;
      tableEl.classList.add('no-anim'); renderPlan(false);
      if (q.get('spark') && !RM.matches) { sparkUntil = performance.now() + 60000; loop(); } // ver las bengalas en una captura
    } else io.observe(tableEl);
  }

  /* ---------- carta ---------- */
  const MENU = window.MENU || [];
  // una foto por categoría; las de stock (Unsplash) llevan la nota «imagine de prezentare», la de sosuri es de Melek
  const mi = (k, big = 1400, stock = true) => ({ src: `assets/img/m-${k}-800.webp`, srcset: `assets/img/m-${k}-800.webp 800w, assets/img/m-${k}-${big}.webp ${big}w`, stock });
  const MIMG = { gratar: mi('gratar'), gatita: mi('gatita'), ciorbe: mi('ciorbe'), garnituri: mi('garnituri'), salate: mi('salate'), sosuri: mi('sosuri', 1100, false), desert: mi('desert') };
  const MALT = {
    gratar: { ro: 'Frigărui, cotlete, cartofi copți, vinete și ardei la grătar, cu sosuri', en: 'Skewers, chops, baked potatoes, grilled aubergine and peppers, with sauces', es: 'Brochetas, chuletas, patatas asadas, berenjena y pimiento a la brasa, con salsas' },
    gatita: { ro: 'Carne înăbușită în sos, pe mămăligă', en: 'Meat braised in sauce, on polenta', es: 'Carne guisada en salsa, sobre polenta' },
    ciorbe: { ro: 'Ciorbă roșie cu carne de vită, într-un bol de lut', en: 'Red soup with beef in a clay bowl', es: 'Sopa roja con ternera en un cuenco de barro' },
    garnituri: { ro: 'Cartofi țărănești cu verdeață', en: 'Country-style potatoes with herbs', es: 'Patatas de campo con hierbas' },
    salate: { ro: 'Salată cu roșii, castraveți, măsline și brânză', en: 'Salad with tomatoes, cucumber, olives and cheese', es: 'Ensalada con tomate, pepino, aceitunas y queso' },
    sosuri: { ro: 'Sosul de smântână cu usturoi și sosul de ardei, pe platoul Melek', en: 'Garlic sour cream and pepper sauce on a Melek platter', es: 'Salsa de nata agria con ajo y salsa de pimiento en una tabla Melek' },
    desert: { ro: 'Clătite pe o farfurie cu motive populare', en: 'Pancakes on a plate with folk motifs', es: 'Crepes en un plato con motivos populares' }
  };
  let tabSel = 0;
  function renderMenu() {
    const tabs = $('[data-menu-tabs]'), panel = $('[data-menu-panel]');
    if (!tabs || !MENU.length) return;
    tabs.innerHTML = MENU.map((c, i) => `<button type="button" role="tab" class="tab" id="tab-${c.id}" aria-controls="menu-panel" aria-selected="${i === tabSel}" tabindex="${i === tabSel ? 0 : -1}">${esc(T(c))}</button>`).join('');
    const c = MENU[tabSel], im = MIMG[c.id] || MIMG.sosuri;
    const cap = im.stock ? `<figcaption class="stock-note">${esc(T({ ro: 'Imagine de prezentare', en: 'Illustrative photo', es: 'Foto ilustrativa' }))}</figcaption>` : '';
    panel.id = 'menu-panel'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 'tab-' + c.id);
    const note = L() === 'ro' ? '' : `<span class="tr-note">${esc(T({ en: 'Ingredient list in Romanian, as on the Melek menu.', es: 'Lista de ingredientes en rumano, como en la carta de Melek.' }))}</span>`;
    panel.innerHTML = `<div class="mp-head"><h3>${esc(T(c))}</h3><figure><img src="${im.src}" srcset="${im.srcset}" sizes="(max-width: 899px) 92vw, 40vw" width="1400" height="788" loading="lazy" decoding="async" alt="${esc(T(MALT[c.id]))}">${cap}</figure><p>${esc(c.items.length + ' ' + T({ ro: 'preparate', en: 'dishes', es: 'platos' }))}</p></div>
      <div class="items">${c.items.map((it) => `<article class="item"><div class="item-top"><h4 class="item-n">${esc(it.ro)}</h4><span class="item-dots" aria-hidden="true"></span><span class="item-p">${esc(lei(it.p))}</span></div>
        <p class="item-sub">${it.g ? `<span>${esc(grams(it.g))}</span>` : ''}${L() !== 'ro' ? `<span lang="${L()}">${esc(it[L()])}</span>` : ''}</p>
        ${it.d ? `<details class="item-d"><summary>${esc(T({ ro: 'Ingrediente și alergeni', en: 'Ingredients and allergens', es: 'Ingredientes y alérgenos' }))}</summary><p lang="ro">${esc(it.d)}</p>${note}</details>` : ''}</article>`).join('')}</div>`;
  }
  const tabsEl = $('[data-menu-tabs]');
  if (tabsEl) {
    tabsEl.addEventListener('click', (e) => { const b = e.target.closest('[role="tab"]'); if (!b) return; tabSel = [...tabsEl.children].indexOf(b); renderMenu(); tabsEl.children[tabSel].focus(); });
    tabsEl.addEventListener('keydown', (e) => {
      const n = MENU.length; let k = null;
      if (e.key === 'ArrowRight') k = (tabSel + 1) % n; if (e.key === 'ArrowLeft') k = (tabSel - 1 + n) % n; if (e.key === 'Home') k = 0; if (e.key === 'End') k = n - 1;
      if (k == null) return; e.preventDefault(); tabSel = k; renderMenu(); tabsEl.children[tabSel].focus();
    });
  }

  /* ---------- bebidas ---------- */
  const D = window.DRINKS;
  let wineSel = 0;
  const li = (name, price, sub, extra = '') => `<li><span class="n">${name}${sub ? `<span class="s">${sub}</span>` : ''}</span><span class="dots" aria-hidden="true"></span><span class="p">${esc(lei(price))}</span>${extra}</li>`;
  const WINE_TABS = [
    ['ro', { ro: 'România', en: 'Romania', es: 'Rumanía' }],
    ['import', { ro: 'Import', en: 'Imported', es: 'Importación' }],
    ['glass', { ro: 'La pahar', en: 'By the glass', es: 'Por copas' }],
    ['sparkling', { ro: 'Spumant și șampanie', en: 'Sparkling and Champagne', es: 'Espumosos y champán' }]
  ];
  function renderDrinks() {
    if (!D) return;
    const set = (k, html) => { const el = $(`[data-drinks="${k}"]`); if (el) el.innerHTML = html; };
    set('coffee', `<h3>${esc(T({ ro: 'Cafea', en: 'Coffee', es: 'Café' }))}</h3><ul class="dl">${D.coffee.map(([n, p]) => li(esc(n), p)).join('')}</ul>`);
    set('lemonade', `<h3>${esc(T({ ro: 'Limonadă', en: 'Lemonade', es: 'Limonada' }))}</h3><ul class="dl">${D.lemonade.map(([n, p]) => li(esc(n), p)).join('')}</ul>`);
    const alc = { ro: 'cu sau fără alcool', en: 'with or without alcohol', es: 'con o sin alcohol' };
    set('cocktails', `<h3>${esc(T({ ro: 'Cocktailuri', en: 'Cocktails', es: 'Cócteles' }))}</h3><ul class="dl">${D.cocktails.map(([n, s, p]) => li(esc(n), p, s ? esc(T(alc)) : '')).join('')}</ul>`);
    const beerN = { 'Bere la draft': { ro: 'Bere la draft', en: 'Draught beer', es: 'Cerveza de barril' }, 'Bere la sticlă': { ro: 'Bere la sticlă', en: 'Bottled beer', es: 'Cerveza de botella' } };
    const any = { ro: 'orice bere', en: 'any beer', es: 'cualquier cerveza' };
    set('beer-soft', `<h3>${esc(T({ ro: 'Bere și răcoritoare', en: 'Beer and soft drinks', es: 'Cerveza y refrescos' }))}</h3><ul class="dl">${D.beer.map(([n, s, p]) => li(esc(T(beerN[n])), p, esc(T(any)))).join('')}${D.soft.map(([n, s, p]) => li(esc(n), p, esc(s))).join('')}</ul>`);
    const wt = $('[data-wine-tabs]'), wp = $('[data-wine-panel]');
    if (wt) {
      wt.innerHTML = WINE_TABS.map(([k, lab], i) => `<button type="button" role="tab" class="tab" id="wt-${k}" aria-controls="wine-panel" aria-selected="${i === wineSel}" tabindex="${i === wineSel ? 0 : -1}">${esc(T(lab))} <span aria-hidden="true">· ${D.wines[k].length}</span></button>`).join('');
      const k = WINE_TABS[wineSel][0];
      wp.id = 'wine-panel'; wp.setAttribute('role', 'tabpanel'); wp.setAttribute('aria-labelledby', 'wt-' + k);
      wp.innerHTML = `<p class="wine-note">${esc(T(k === 'glass' ? { ro: 'Prețuri pe pahar.', en: 'Prices per glass.', es: 'Precios por copa.' } : { ro: 'Prețuri pe sticla de 0,75 l.', en: 'Prices per 0.75 l bottle.', es: 'Precios por botella de 0,75 l.' }))}</p><ul class="dl">${D.wines[k].map(([pr, n, p]) => li(`<span class="prod">${esc(pr)}</span>${esc(n)}`, p)).join('')}</ul>${D.wines[k].length > 8 ? `<button type="button" class="btn btn-ghost wine-more" data-wine-more aria-expanded="false">${esc(T({ ro: 'Vezi toate cele ', en: 'See all ', es: 'Ver los ' }) + D.wines[k].length + T({ ro: ' vinuri', en: ' wines', es: ' vinos' }))}</button>` : ''}`;
      wp.classList.remove('is-open');
    }
    const sp = $('[data-drinks="spirits"]');
    if (sp) {
      const half = Math.ceil(D.spirits.length / 2);
      const head = `<thead><tr><th scope="col">${esc(T({ ro: 'Spirtoasă', en: 'Spirit', es: 'Destilado' }))}</th><th scope="col">${esc(T({ ro: 'La gramaj', en: 'Per measure', es: 'Por medida' }))}</th><th scope="col">${esc(T({ ro: 'Sticla', en: 'Bottle', es: 'Botella' }))}</th></tr></thead>`;
      const rows = (a) => a.map(([n, g, b]) => `<tr><td>${esc(n)}</td><td>${esc(lei(g))}</td><td>${esc(lei(b))}</td></tr>`).join('');
      sp.innerHTML = `<div class="sp-cols"><table class="sp-t">${head}<tbody>${rows(D.spirits.slice(0, half))}</tbody></table><table class="sp-t">${head}<tbody>${rows(D.spirits.slice(half))}</tbody></table></div>`;
      const c = $('[data-spirits-count]'); if (c) c.textContent = '· ' + D.spirits.length;
    }
  }
  const wpEl = $('[data-wine-panel]');
  wpEl && wpEl.addEventListener('click', (e) => { const b = e.target.closest('[data-wine-more]'); if (!b) return; wpEl.classList.add('is-open'); b.remove(); });
  const wtEl = $('[data-wine-tabs]');
  if (wtEl) {
    wtEl.addEventListener('click', (e) => { const b = e.target.closest('[role="tab"]'); if (!b) return; wineSel = [...wtEl.children].indexOf(b); renderDrinks(); wtEl.children[wineSel].focus(); });
    wtEl.addEventListener('keydown', (e) => {
      const n = WINE_TABS.length; let k = null;
      if (e.key === 'ArrowRight') k = (wineSel + 1) % n; if (e.key === 'ArrowLeft') k = (wineSel - 1 + n) % n;
      if (k == null) return; e.preventDefault(); wineSel = k; renderDrinks(); wtEl.children[wineSel].focus();
    });
  }

  /* ---------- idioma: todo lo dinámico se vuelve a pintar ---------- */
  function renderLang() {
    renderStatus(); renderStats(false); renderMenu(); renderDrinks(); renderAll();
    if (tableEl) renderPlan(false);
    const lab = mBtn && $('.sr', mBtn); if (lab && mBtn.getAttribute('aria-expanded') !== 'true') lab.textContent = T({ ro: 'Deschide meniul', en: 'Open the menu', es: 'Abrir el menú' });
  }
  document.addEventListener('langchange', () => {
    renderLang();
    if (!ready) {
      ready = true;
      // la entrada de la portada arranca con las letras ya cargadas (o a los 1,5 s, desde el <head>)
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => root.classList.add('ready'));
    }
  });
  setInterval(renderStatus, 60000);
})();
