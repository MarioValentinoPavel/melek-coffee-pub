// Melek Coffee Pub · estado en vivo (hora de Bucarest), portada a dos aguas, vídeos, planificador de platou
// con quemado Lichtenberg y bengalas, carta, bebidas y horario. Los textos dinámicos siguen al idioma (evento langchange).
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
  const header = $('[data-header]');
  const onScroll = () => header && header.classList.toggle('is-stuck', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const mBtn = $('[data-menu-btn]'), mMenu = $('[data-mobile-menu]');
  function setMenu(open) {
    if (!mBtn) return;
    mBtn.setAttribute('aria-expanded', String(open));
    mMenu.hidden = !open;
    header.classList.toggle('menu-open', open);
    root.style.overflow = open ? 'hidden' : '';
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

  /* ---------- portada: fachada a dos aguas, titular en dos tonos y tejado ---------- */
  const stage = $('[data-hero]'), gable = $('[data-gable]'), h1 = $('[data-h1]'), h1c = $('[data-h1-copy]'), roof = $('[data-roof]');
  // el titular no puede pasar del ancho útil: en escritorio la primera línea entera, en móvil la palabra más larga
  function fitH1() {
    if (!h1) return;
    h1.style.removeProperty('--h1'); h1c && h1c.style.removeProperty('--h1');
    const gut = Math.max(20, Math.min(56, innerWidth * .04));
    const max = stage.clientWidth - 2 * gut - 8;
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font:inherit;letter-spacing:inherit';
    h1.appendChild(probe);
    const l1 = $('.l1', h1).textContent.trim();
    const parts = innerWidth < 900 ? l1.split(/\s+/) : [l1];
    let w = 0;
    for (const t of parts) { probe.textContent = t; w = Math.max(w, probe.getBoundingClientRect().width); }
    probe.style.fontSize = '1.32em'; probe.textContent = 'Melek'; w = Math.max(w, probe.getBoundingClientRect().width);
    h1.removeChild(probe);
    const fs = parseFloat(getComputedStyle(h1).fontSize);
    if (w > max) { const v = Math.floor(fs * max / w) + 'px'; h1.style.setProperty('--h1', v); h1c && h1c.style.setProperty('--h1', v); }
  }
  const roofK = () => (innerWidth < 900 ? .3 : .34); // misma pendiente que --gr en el CSS
  function syncHero() {
    if (!stage || !gable || !h1) return;
    fitH1();
    const s = stage.getBoundingClientRect(), g = gable.getBoundingClientRect(), r = h1.getBoundingClientRect();
    if (h1c) { h1c.style.left = (r.left - g.left) + 'px'; h1c.style.top = (r.top - g.top) + 'px'; h1c.style.width = r.width + 'px'; }
    if (roof) {
      const gw = g.width, gr = gw * roofK();
      const x0 = g.left - s.left, y0 = g.top - s.top, cx = x0 + gw / 2, slope = gr / (gw / 2), d = Math.min(30, gw * .06, Math.max(0, x0 - 2));
      const L1 = `M${x0 - d},${y0 + gr + d * slope} L${cx},${y0}`, R1 = `M${x0 + gw + d},${y0 + gr + d * slope} L${cx},${y0}`;
      roof.setAttribute('viewBox', `0 0 ${s.width} ${s.height}`);
      roof.innerHTML = `<path class="r-board" d="${L1}" pathLength="1"/><path class="r-board" d="${R1}" pathLength="1"/><path class="r-edge" d="${L1}" pathLength="1"/><path class="r-edge" d="${R1}" pathLength="1"/>`;
    }
  }
  function heroIntro() {
    const g = window.gsap;
    if (!g || RM.matches || !gable) return;
    const gw = gable.offsetWidth, gh = gable.offsetHeight, gr = gw * roofK();
    const from = `polygon(0px ${gh}px, ${gw / 2}px ${gh}px, ${gw}px ${gh}px, ${gw}px ${gh}px, 0px ${gh}px)`;
    const to = `polygon(0px ${gr}px, ${gw / 2}px 0px, ${gw}px ${gr}px, ${gw}px ${gh}px, 0px ${gh}px)`;
    const tl = g.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(gable, { clipPath: from }, { clipPath: to, duration: 1.15, ease: 'power3.inOut', clearProps: 'clipPath' })
      .fromTo($('img', gable), { scale: 1.12 }, { scale: 1, duration: 1.6, clearProps: 'scale' }, 0)
      .fromTo($$('path', roof), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .8, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' }, .75)
      .fromTo([...$$('.l1', h1), ...$$('.l1', h1c)], { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .9, clearProps: 'transform,opacity' }, .55)
      .fromTo([...$$('.l2', h1), ...$$('.l2', h1c)], { yPercent: 50, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, clearProps: 'transform,opacity' }, .7)
      .fromTo(['.hero-foot', '.hero-side'], { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .08, clearProps: 'transform,opacity' }, 1.05);
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

  /* ---------- planificador: ¿cuántos sois? ---------- */
  const P = window.PLATTERS || {};
  const OPTIONS = { 1: ['melek1', 'vanator1'], 2: ['melek2'], 3: ['melek3', 'pane3'], 4: ['melek4', 'vanator4'], 5: ['melek5'], 6: ['melek6', 'vanator6'], 7: [['melek4', 'melek3']], 8: [['melek4', 'melek4']], 9: [['melek5', 'melek4']], 10: ['oriental10', ['melek5', 'melek5']] };
  const SEATS_X = [140, 320, 500, 680, 860];
  const ORDER = [['top', 2], ['bottom', 2], ['top', 1], ['bottom', 1], ['top', 3], ['bottom', 3], ['top', 0], ['bottom', 0], ['top', 4], ['bottom', 4]];
  const IMG = {
    'plt-melek': { src: 'assets/img/plt-melek-720.webp', srcset: 'assets/img/plt-melek-720.webp 720w, assets/img/plt-melek-1100.webp 1100w' },
    'platou2-top': { src: 'assets/img/platou2-top-680.webp', srcset: 'assets/img/platou2-top-680.webp 680w' },
    'plt-grill-sq': { src: 'assets/img/plt-grill-sq-600.webp', srcset: 'assets/img/plt-grill-sq-600.webp 600w, assets/img/plt-grill-sq-900.webp 900w' },
    'plt-vanator-sq': { src: 'assets/img/plt-vanator-sq-830.webp', srcset: 'assets/img/plt-vanator-sq-830.webp 830w' },
    'plt-long-sq': { src: 'assets/img/plt-long-sq-600.webp', srcset: 'assets/img/plt-long-sq-600.webp 600w, assets/img/plt-long-sq-900.webp 900w' }
  };
  const ALT = {
    'plt-melek': { ro: 'Platou Melek pe o tablă rotundă: ceafă, mici, cârnați, cartofi cu mozzarella, murături și sosuri', en: 'Melek platter on a round board: pork neck, mici, sausages, potatoes with mozzarella, pickles and sauces', es: 'Tabla Melek redonda: presa de cerdo, mici, salchichas, patatas con mozzarella, encurtidos y salsas' },
    'platou2-top': { ro: 'Platou Melek de 2 persoane văzut de sus, pe o tablă rotundă de lemn', en: 'Melek platter for 2 seen from above, on a round wooden board', es: 'Tabla Melek para 2 vista desde arriba, sobre una tabla redonda de madera' },
    'plt-grill-sq': { ro: 'Platou Melek cu cârnați, mici, ceafă, cartofi cu brânză rasă și lămâie', en: 'Melek platter with sausages, mici, pork neck, potatoes with grated cheese and lemon', es: 'Tabla Melek con salchichas, mici, presa, patatas con queso rallado y limón' },
    'plt-vanator-sq': { ro: 'Platou vânătoresc pe o tablă lungă: cotlete, pastramă pe mămăligă și cartofi', en: 'Hunter’s platter on a long board: chops, pastrami on polenta and potatoes', es: 'Tabla del cazador: chuletas, pastrami sobre polenta y patatas' },
    'plt-long-sq': { ro: 'Platou lung pe masă, cu adana, frigărui, roșii coapte și ardei iute', en: 'Long platter on the table with adana, skewers, roasted tomatoes and chillies', es: 'Tabla larga en la mesa con adana, brochetas, tomates asados y guindillas' }
  };
  const shortName = (k) => k.startsWith('melek') ? 'Platou Melek' : k.startsWith('vanator') ? (k === 'vanator4' ? 'Platou Melek Vânătoresc' : 'Platou Vânătoresc') : k === 'pane3' ? 'Platou Melek Pane' : 'Platou Melek Oriental';
  const people = (n) => n + ' ' + (n === 1 ? T({ ro: 'persoană', en: 'person', es: 'persona' }) : T({ ro: 'persoane', en: 'people', es: 'personas' }));

  const plan = { n: 4, choice: 0, shown: 0, started: false };
  const tableEl = $('[data-table]');
  const board = $('[data-board]');
  const cvWood = board && $('.board-wood', board), cvBurn = board && $('.board-burn', board), cvFx = board && $('.board-fx', board);
  const label = $('[data-board-label]');
  const seatBtns = {}; const plates = {};

  function buildSeats() {
    if (!tableEl) return;
    ['top', 'bottom'].forEach((side) => {
      const row = $(`[data-seats="${side}"]`, tableEl);
      SEATS_X.forEach((x, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'seat'; b.style.left = (x / 10) + '%';
        b.dataset.side = side; b.dataset.i = i;
        row.appendChild(b); seatBtns[side + i] = b;
        const pl = document.createElement('i');
        pl.className = 'plate'; pl.style.left = (x / 10) + '%'; pl.style.top = side === 'top' ? '12%' : '88%';
        $('[data-plates]', board).appendChild(pl); plates[side + i] = pl;
      });
    });
    tableEl.addEventListener('click', (e) => {
      const b = e.target.closest('.seat'); if (!b) return;
      const k = ORDER.findIndex(([s, i]) => s === b.dataset.side && i === +b.dataset.i);
      setCount(k + 1 === plan.n ? Math.max(1, k) : k + 1);
    });
  }

  /* madera de la tabla (canvas, una vez por tamaño) */
  let W = 0, H = 0, DPR = 1;
  function sizeBoard() {
    if (!board) return;
    const r = board.getBoundingClientRect();
    DPR = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    [cvWood, cvBurn].forEach((c) => { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
    const fr = cvFx.getBoundingClientRect(); cvFx.width = Math.round(fr.width * DPR); cvFx.height = Math.round(fr.height * DPR);
    drawWood(); drawBurns();
  }
  function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function drawWood() {
    const g = cvWood.getContext('2d'), w = cvWood.width, h = cvWood.height, R = Math.min(h * .2, w * .05);
    g.clearRect(0, 0, w, h);
    g.save();
    g.beginPath(); g.roundRect(0, 0, w, h, R); g.clip();
    const base = g.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, '#d39c61'); base.addColorStop(.45, '#c98f53'); base.addColorStop(1, '#b47a42');
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const r = rnd(1234);
    // vetas largas, horizontales y algo onduladas
    for (let k = 0; k < 170; k++) {
      const y0 = r() * h, amp = (2 + r() * 7) * DPR, f = (0.6 + r() * 2.4) / w * Math.PI * 2, ph = r() * 6.28;
      const dark = r() < .62;
      g.strokeStyle = dark ? `rgba(110,62,28,${.05 + r() * .12})` : `rgba(240,196,140,${.05 + r() * .12})`;
      g.lineWidth = (.5 + r() * 1.8) * DPR;
      g.beginPath();
      for (let x = -10; x <= w + 10; x += 14 * DPR) { const y = y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.1 + ph * 2) * amp * .25; x < 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke();
    }
    // bandas de color
    for (let k = 0; k < 6; k++) { const y = r() * h, bh = (8 + r() * 30) * DPR; g.fillStyle = `rgba(${r() < .5 ? '120,70,30' : '235,190,130'},${.05 + r() * .06})`; g.fillRect(0, y, w, bh); }
    // bisel: luz arriba, sombra abajo y en los extremos
    const bev = g.createLinearGradient(0, 0, 0, h);
    bev.addColorStop(0, 'rgba(255,236,205,.35)'); bev.addColorStop(.06, 'rgba(255,236,205,0)'); bev.addColorStop(.9, 'rgba(60,30,10,0)'); bev.addColorStop(1, 'rgba(60,30,10,.35)');
    g.fillStyle = bev; g.fillRect(0, 0, w, h);
    const side = g.createLinearGradient(0, 0, w, 0);
    side.addColorStop(0, 'rgba(60,30,10,.28)'); side.addColorStop(.04, 'rgba(60,30,10,0)'); side.addColorStop(.96, 'rgba(60,30,10,0)'); side.addColorStop(1, 'rgba(60,30,10,.28)');
    g.fillStyle = side; g.fillRect(0, 0, w, h);
    g.restore();
    g.strokeStyle = 'rgba(70,36,14,.55)'; g.lineWidth = 1.5 * DPR;
    g.beginPath(); g.roundRect(.75 * DPR, .75 * DPR, w - 1.5 * DPR, h - 1.5 * DPR, R); g.stroke();
  }

  /* quemado Lichtenberg (datos de js/burns.js) */
  const TREES = [];
  function prepTrees() {
    const B = window.BURNS; if (!B || TREES.length) return;
    B.seats.forEach((s) => {
      const d = s.d, n = d.length / 4, X = new Float32Array(n), Y = new Float32Array(n), Pp = new Int32Array(n), K = new Uint8Array(n), kids = new Uint16Array(n), first = new Int32Array(n).fill(-1);
      for (let i = 0; i < n; i++) { X[i] = d[i * 4]; Y[i] = d[i * 4 + 1]; Pp[i] = i ? i - d[i * 4 + 2] : -1; K[i] = d[i * 4 + 3]; if (i) { kids[Pp[i]]++; if (first[Pp[i]] < 0) first[Pp[i]] = i; } }
      for (let it = 0; it < 3; it++) { // suavizado: quita el dentado de la rejilla sin mover puntas ni bifurcaciones
        const nx = X.slice(), ny = Y.slice();
        for (let i = 1; i < n; i++) { if (kids[i] !== 1) continue; const a = Pp[i], b = first[i]; nx[i] = X[i] * .5 + (X[a] + X[b]) * .25; ny[i] = Y[i] * .5 + (Y[a] + Y[b]) * .25; }
        X.set(nx); Y.set(ny);
      }
      TREES.push({ side: s.side, x: s.x, n, X, Y, P: Pp, K, prog: 0, target: 0, alpha: 0, flash: 1 });
    });
  }
  const treeOf = (side, i) => TREES[(side === 'top' ? 0 : 5) + i];
  function drawBurns() {
    if (!cvBurn || !TREES.length) return;
    const g = cvBurn.getContext('2d'), sx = cvBurn.width / 1000, sy = cvBurn.height / 300, sc = Math.max(.42, sx);
    g.clearRect(0, 0, cvBurn.width, cvBurn.height);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const t of TREES) {
      if (t.alpha <= 0 || t.prog <= 0) continue;
      const m = Math.max(1, Math.floor(t.prog * t.n));
      const buckets = new Map();
      for (let i = 1; i < m; i++) {
        const k = t.K[i], main = k >= 10, b = main ? 10 : k;
        let p = buckets.get(b); if (!p) { p = new Path2D(); buckets.set(b, p); }
        const a = t.P[i]; p.moveTo(t.X[a] * sx, t.Y[a] * sy); p.lineTo(t.X[i] * sx, t.Y[i] * sy);
      }
      for (const [b, p] of buckets) { // halo chamuscado
        const w = (b === 10 ? 3 : .6 + b * .26) * sc;
        g.strokeStyle = `rgba(120,58,18,${.18 * t.alpha})`; g.lineWidth = w * 2.6; g.stroke(p);
      }
      for (const [b, p] of buckets) { // surco quemado
        const w = (b === 10 ? 3 : .6 + b * .26) * sc;
        g.strokeStyle = `rgba(48,22,9,${.9 * t.alpha})`; g.lineWidth = Math.max(.6 * DPR, w); g.stroke(p);
      }
      // brasa: la punta que avanza y, al tocar el rótulo, el destello del canal principal
      if (t.prog < 1 || t.flash < 1) {
        g.save(); g.globalCompositeOperation = 'lighter';
        const hot = Math.max(8, Math.floor(t.n * .1));
        const glow = new Path2D();
        if (t.prog < 1) for (let i = Math.max(1, m - hot); i < m; i++) { const a = t.P[i]; glow.moveTo(t.X[a] * sx, t.Y[a] * sy); glow.lineTo(t.X[i] * sx, t.Y[i] * sy); }
        else for (let i = 1; i < t.n; i++) { if (t.K[i] < 10) continue; const a = t.P[i]; glow.moveTo(t.X[a] * sx, t.Y[a] * sy); glow.lineTo(t.X[i] * sx, t.Y[i] * sy); }
        const ga = t.prog < 1 ? 1 : 1 - t.flash;
        g.shadowColor = `rgba(255,120,40,${.9 * ga})`; g.shadowBlur = 10 * DPR;
        g.strokeStyle = `rgba(255,140,60,${.75 * ga})`; g.lineWidth = 2.4 * sc; g.stroke(glow);
        g.shadowBlur = 0; g.strokeStyle = `rgba(255,226,170,${.8 * ga})`; g.lineWidth = 1 * sc; g.stroke(glow);
        g.restore();
      }
    }
  }

  /* bengalas (al llegar a 10 con la tabla Oriental) */
  const sparks = []; let sparkUntil = 0;
  function fireSparklers() {
    if (RM.matches || !cvFx) return;
    sparkUntil = performance.now() + 2600; loop();
  }
  function stepSparks(dt, now) {
    if (!cvFx) return false;
    const g = cvFx.getContext('2d'), w = cvFx.width, h = cvFx.height;
    // el lienzo de efectos desborda la tabla: 6 % a cada lado y 40 % arriba y abajo
    const by = (v) => (0.4 / 1.8 + v / 300 / 1.8) * h;
    const toX = (u) => (0.06 * (w / 1.12) + u / 1000 * (w / 1.12));
    if (now < sparkUntil) {
      const rate = 340 * dt, sc = w / 1000;
      for (let k = 0; k < rate; k++) {
        for (const ex of [372, 628]) {
          const a = -Math.PI / 2 + (Math.random() - .5) * 2.2, sp = (160 + Math.random() * 300) * sc;
          sparks.push({ x: toX(ex), y: by(112), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .5 + Math.random() * .9, age: 0 });
        }
      }
    }
    g.clearRect(0, 0, w, h);
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.age += dt; if (s.age > s.life) { sparks.splice(i, 1); continue; }
      const px = s.x, py = s.y;
      s.vy += 520 * (w / 1000) * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      const k = 1 - s.age / s.life;
      g.strokeStyle = `rgba(255,${170 + 80 * k | 0},${80 + 140 * k | 0},${k})`;
      g.shadowColor = 'rgba(255,170,60,.9)'; g.shadowBlur = 6 * DPR;
      g.lineWidth = (1.1 + k * 1.6) * DPR;
      g.beginPath(); g.moveTo(px, py); g.lineTo(s.x, s.y); g.stroke();
    }
    g.restore();
    return sparks.length > 0 || now < sparkUntil;
  }

  let raf = 0, last = 0;
  function loop() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(now) {
    raf = 0;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    let busy = false;
    for (const t of TREES) {
      if (t.target > 0) {
        if (t.alpha < 1) { t.alpha = Math.min(1, t.alpha + dt * 6); busy = true; }
        if (t.prog < 1) { t.prog = Math.min(1, t.prog + dt / 1.35); if (t.prog >= 1) t.flash = 0; busy = true; }
        else if (t.flash < 1) { t.flash = Math.min(1, t.flash + dt / .7); busy = true; }
      } else if (t.alpha > 0) { t.alpha = Math.max(0, t.alpha - dt / .45); if (t.alpha === 0) t.prog = 0; busy = true; }
    }
    drawBurns();
    if (stepSparks(dt, now)) busy = true;
    if (busy) raf = requestAnimationFrame(tick);
  }

  function seatState(animate) {
    prepTrees();
    ORDER.forEach(([side, i], k) => {
      const on = k < plan.n;
      const b = seatBtns[side + i]; b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', T({ ro: 'Persoana ', en: 'Person ', es: 'Persona ' }) + (k + 1));
      plates[side + i].classList.toggle('on', on);
      const t = treeOf(side, i); if (!t) return;
      if (on && t.target === 0) { t.target = 1; if (!animate || RM.matches) { t.prog = 1; t.alpha = 1; t.flash = 1; } }
      if (!on && t.target === 1) { t.target = 0; if (!animate || RM.matches) { t.alpha = 0; t.prog = 0; } }
    });
    if (animate && !RM.matches) loop(); else drawBurns();
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
    // rótulo quemado en la tabla
    const lname = list.length > 1 ? (keys[0] === keys[1] ? `2 × ${shortName(keys[0])}` : T({ ro: '2 platouri Melek', en: '2 Melek platters', es: '2 tablas Melek' })) : shortName(keys[0]);
    label.innerHTML = `<b>${esc(lname)}</b><span>${g ? '<i>' + esc(grams(g)) + ' · </i>' : ''}${esc(lei(total))}</span>`;
    if (animate && !RM.matches) { label.classList.remove('burn-in'); void label.offsetWidth; label.classList.add('burn-in'); }
    // ficha
    $('[data-r-name]').textContent = list.map((p) => p.ro).join(' + ');
    $('[data-r-meta]').textContent = people(n) + (g ? ' · ' + grams(g) : '');
    $('[data-r-price]').textContent = lei(total);
    $('[data-r-pp]').textContent = lei(Math.round(total / n)) + ' ' + T({ ro: 'de persoană', en: 'per person', es: 'por persona' });
    const ul = $('[data-contents]');
    ul.innerHTML = list.map((p, j) => (list.length > 1 ? `<li><b>${esc(p.ro)}</b></li>` : '') + p.c.map((c) => `<li>${esc(c)}</li>`).join('')).join('');
    ul.classList.toggle('is-long', ul.children.length > 11); // la Oriental (18) y las dos tablas: en dos columnas
    const gift = $('[data-gift]');
    const hasGift = list.some((p) => p.gift);
    gift.hidden = !hasGift;
    if (hasGift) gift.textContent = T({ ro: 'Din partea casei: o sticlă de vin Aerosoli și foc de artificii.', en: 'On the house: a bottle of Aerosoli wine and sparklers.', es: 'Por cuenta de la casa: una botella de vino Aerosoli y bengalas.' });
    // foto de la tabla (la Pane no tiene foto propia: se muestra solo su nombre quemado)
    const imgKey = list[0].img, img = $('[data-r-img]'), noph = $('[data-r-nophoto]');
    if (imgKey && IMG[imgKey]) {
      noph.hidden = true; img.hidden = false;
      const alt = T(ALT[imgKey]);
      if (img.dataset.k !== imgKey) {
        const swap = () => { img.src = IMG[imgKey].src; img.srcset = IMG[imgKey].srcset; img.sizes = '(max-width: 899px) 76vw, 360px'; img.dataset.k = imgKey; img.alt = alt; requestAnimationFrame(() => img.classList.remove('is-swapping')); };
        if (img.dataset.k && animate && !RM.matches) { img.classList.add('is-swapping'); setTimeout(swap, 260); } else swap();
      } else img.alt = alt;
    } else { img.hidden = true; noph.hidden = false; img.dataset.k = ''; }
    // WhatsApp: el mensaje va en rumano, que es lo que lee el local
    const lines = list.map((p) => `${p.ro}${p.g ? ` (${new Intl.NumberFormat('ro-RO').format(p.g)} g)` : ''} – ${new Intl.NumberFormat('ro-RO').format(p.p)} lei`);
    const msg = `Bună! Doresc să plasez o comandă: ${lines.join(' și ')}${list.length > 1 ? `. Total: ${new Intl.NumberFormat('ro-RO').format(total)} lei` : ''}. Suntem ${n} ${n === 1 ? 'persoană' : 'persoane'}.`;
    $('[data-wa]').href = `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
    // un solo aviso breve para lectores de pantalla cuando cambia la elección
    const ann = $('[data-announce]');
    if (ann && animate) ann.textContent = `${people(n)}: ${list.map((p) => p.ro).join(' + ')}, ${lei(total)}.`;
    if (plan.started) seatState(animate);
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
    buildSeats(); renderAll();
    const allD = $('[data-all-details]'); if (allD) allD.open = false; // abierta solo sin JavaScript (no hay mesa interactiva)
    $$('[data-step]').forEach((b) => b.addEventListener('click', () => setCount(plan.n + +b.dataset.step)));
    $('[data-choice]').addEventListener('click', (e) => { const b = e.target.closest('[data-ch]'); if (b) { plan.choice = +b.dataset.ch; renderPlan(true); } });
    $('[data-all]').addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-n]'); if (!tr) return;
      const n = +tr.dataset.n, k = tr.dataset.k, i = OPTIONS[n].findIndex((x) => x === k);
      plan.n = 0; setCount(n, { choice: Math.max(0, i) });
      tableEl.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'center' });
    });
    const ro = new ResizeObserver(() => sizeBoard()); ro.observe(board);
    // la mesa se llena la primera vez que se ve: los comensales se sientan uno a uno
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting || plan.started) return;
      plan.started = true; io.disconnect();
      if (RM.matches) { renderPlan(false); return; }
      const target = plan.n; plan.n = 1; renderPlan(true);
      let k = 1; const iv = setInterval(() => { k++; plan.n = k; renderPlan(k === target); if (k >= target) clearInterval(iv); }, 380);
    }, { threshold: .35 });
    if (SHOT) { plan.started = true; const qn = +new URLSearchParams(location.search).get('n'); if (qn >= 1 && qn <= 10) plan.n = qn; renderPlan(false); } else io.observe(tableEl);
  }

  /* ---------- carta ---------- */
  const MENU = window.MENU || [];
  const MIMG = {
    'plt-grill': ['assets/img/plt-grill-640.webp', 'assets/img/plt-grill-640.webp 640w, assets/img/plt-grill-1080.webp 1080w'],
    'kitchen': ['assets/img/kitchen-720.webp', 'assets/img/kitchen-720.webp 720w, assets/img/kitchen-1200.webp 1200w'],
    'ciorbe': ['assets/img/ciorbe-640.webp', 'assets/img/ciorbe-640.webp 640w, assets/img/ciorbe-1000.webp 1000w'],
    'plt-ciorba': ['assets/img/plt-ciorba-1000.webp', 'assets/img/plt-ciorba-1000.webp 1000w, assets/img/plt-ciorba-1800.webp 1800w'],
    'plt-melek': ['assets/img/plt-melek-720.webp', 'assets/img/plt-melek-720.webp 720w, assets/img/plt-melek-1100.webp 1100w'],
    'desert': ['assets/img/desert-720.webp', 'assets/img/desert-720.webp 720w, assets/img/desert-1200.webp 1200w']
  };
  const MALT = {
    gratar: { ro: 'Platou cu cârnați, mici, ceafă și cartofi cu brânză rasă', en: 'Platter with sausages, mici, pork neck and potatoes with grated cheese', es: 'Tabla con salchichas, mici, presa y patatas con queso rallado' },
    gatita: { ro: 'Bucătăria Melek: tăvi cu mâncare gătită', en: 'The Melek kitchen: trays of cooked dishes', es: 'La cocina de Melek: bandejas de platos de cocina' },
    ciorbe: { ro: 'Boluri de ciorbă cu ardei iute', en: 'Bowls of soup with chillies', es: 'Cuencos de sopa con guindillas' },
    garnituri: { ro: 'Cartofi cu brânză rasă, murături și sos, lângă un bol de ciorbă', en: 'Potatoes with grated cheese, pickles and sauce next to a bowl of soup', es: 'Patatas con queso rallado, encurtidos y salsa junto a un cuenco de sopa' },
    salate: { ro: 'Murături, ardei copt și sos pe un platou', en: 'Pickles, roasted peppers and sauce on a platter', es: 'Encurtidos, pimientos asados y salsa en una tabla' },
    sosuri: { ro: 'Sos de smântână cu usturoi și sos de ardei pe platou', en: 'Garlic sour cream and pepper sauce on a platter', es: 'Salsa de nata agria con ajo y salsa de pimiento en una tabla' },
    desert: { ro: 'Desert: prăjitură de ciocolată și cremă cu portocală', en: 'Desserts: chocolate cake and a cream with orange', es: 'Postres: pastel de chocolate y crema con naranja' }
  };
  let tabSel = 0;
  function renderMenu() {
    const tabs = $('[data-menu-tabs]'), panel = $('[data-menu-panel]');
    if (!tabs || !MENU.length) return;
    tabs.innerHTML = MENU.map((c, i) => `<button type="button" role="tab" class="tab" id="tab-${c.id}" aria-controls="menu-panel" aria-selected="${i === tabSel}" tabindex="${i === tabSel ? 0 : -1}">${esc(T(c))}</button>`).join('');
    const c = MENU[tabSel], im = MIMG[c.img] || MIMG['plt-melek'];
    panel.id = 'menu-panel'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 'tab-' + c.id);
    const note = L() === 'ro' ? '' : `<span class="tr-note">${esc(T({ en: 'Ingredient list in Romanian, as on the Melek menu.', es: 'Lista de ingredientes en rumano, como en la carta de Melek.' }))}</span>`;
    panel.innerHTML = `<div class="mp-head"><h3>${esc(T(c))}</h3><figure><img src="${im[0]}" srcset="${im[1]}" sizes="(max-width: 899px) 92vw, 46vw" width="1000" height="563" loading="lazy" decoding="async" alt="${esc(T(MALT[c.id]))}"></figure><p>${esc(c.items.length + ' ' + T({ ro: 'preparate', en: 'dishes', es: 'platos' }))}</p></div>
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
    syncHero();
  }
  document.addEventListener('langchange', () => {
    renderLang();
    if (!ready) {
      ready = true;
      // la entrada fija sus estados iniciales en el mismo fotograma: después ya se puede mostrar la portada
      const go = () => { syncHero(); try { heroIntro(); } finally { root.classList.remove('intro'); } };
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go);
    }
  });
  addEventListener('resize', () => { syncHero(); });
  if (document.fonts) document.fonts.addEventListener('loadingdone', syncHero);
  setInterval(renderStatus, 60000);
})();
