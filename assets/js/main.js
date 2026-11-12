/* María Villar portfolio · shared script
   Every block checks that its elements exist, so the same file works on every page. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = () => matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* ---------- texts written by the script, in both languages ---------- */
  const ES = (document.documentElement.lang || '').startsWith('es');
  const TXT = ES ? {
    solved: n => n + ' celdas resueltas.', progress: (a, b) => a + ' / ' + b + ' celdas colapsadas',
    playItch: 'Jugar en itch.io ↗', playGen: 'Jugar con el generador ▶', running: 'Mi generador de Unity, funcionando en tu navegador.',
    coverAlt: 'Una isla creada por el generador WFC de María', build: 'Build jugable',
    done: 'Hecho: cada celda tiene exactamente una ficha. Pulsa Reiniciar para un mapa nuevo.',
    fail: 'Una celda se ha quedado sin opciones. Es una contradicción, así que el mapa empieza de nuevo.',
    reset: 'Vuelta a la superposición. Pulsa Paso para colapsar la primera celda.',
    tile: { water: 'agua', sand: 'arena', grass: 'hierba', forest: 'bosque', town: 'pueblo' },
    step: (i, j, o, t, c) => 'La celda (fila ' + i + ', columna ' + j + ') tenía ' + o + ' opciones y ha colapsado a ' + t + '. ' + c + (c === 1 ? ' vecina actualizada' : ' vecinas actualizadas') + ' (discontinuas).',
    play: 'Reproducir', pause: 'Pausa'
  } : {
    solved: n => 'Solved ' + n + ' cells.', progress: (a, b) => a + ' / ' + b + ' cells collapsed',
    playItch: 'Play on itch.io ↗', playGen: 'Play the generator ▶', running: 'My Unity generator, running in your browser.',
    coverAlt: 'An island made by María\'s WFC generator', build: 'Playable build',
    done: 'Done: every cell has exactly one tile. Press Reset for a new map.',
    fail: 'A cell ran out of options. That\'s a contradiction, so the map starts again.',
    reset: 'Back to superposition. Press Step to collapse the first cell.',
    tile: { water: 'water', sand: 'sand', grass: 'grass', forest: 'forest', town: 'village' },
    step: (i, j, o, t, c) => 'Cell (row ' + i + ', col ' + j + ') had ' + o + ' options and collapsed to ' + t + '. ' + c + ' neighbour' + (c === 1 ? '' : 's') + ' updated (dashed).',
    play: 'Play', pause: 'Pause'
  };

  /* ---------- language switch keeps the section you were looking at ---------- */
  $$('.lang a:not([aria-current])').forEach(a => a.addEventListener('click', () => { if (location.hash) a.href = a.href.split('#')[0] + location.hash }));

  /* ---------- WFC solver (used by the hero demo and the explainer) ---------- */
  const T = ['water', 'sand', 'grass', 'forest', 'town'];
  const W = [0.5, 0.7, 2.5, 4, 3];
  const allow = [[0, 1], [0, 1, 2], [1, 2, 3, 4], [2, 3], [2, 4]].map(l => l.reduce((m, i) => m | (1 << i), 0));
  const ALL = (1 << T.length) - 1;
  const pop = x => { let c = 0; while (x) { c += x & 1; x >>= 1 } return c };

  function Solver(R, C, opts) { this.R = R; this.C = C; this.o = opts || {}; this.reset() }
  Solver.prototype.nb = function (k) {
    const C = this.C, i = Math.floor(k / C), j = k % C, r = [];
    if (i > 0) r.push(k - C); if (i < this.R - 1) r.push(k + C); if (j > 0) r.push(k - 1); if (j < C - 1) r.push(k + 1); return r;
  };
  Solver.prototype.prop = function (st, changed) {
    while (st.length) {
      const k = st.pop(); let m = 0;
      for (let t = 0; t < T.length; t++) if (this.g[k] & (1 << t)) m |= allow[t];
      for (const n of this.nb(k)) {
        const v = this.g[n] & m;
        if (v !== this.g[n]) { if (!v) return false; this.g[n] = v; st.push(n); if (changed) changed.add(n) }
      }
    }
    return true;
  };
  Solver.prototype.reset = function () {
    for (let a = 0; a < 30; a++) {
      this.g = new Array(this.R * this.C).fill(ALL); this.last = -1; this.changed = new Set(); const st = [];
      if (this.o.border) for (let i = 0; i < this.R; i++) for (let j = 0; j < this.C; j++)
        if (i === 0 || j === 0 || i === this.R - 1 || j === this.C - 1) { this.g[i * this.C + j] = 1; st.push(i * this.C + j) }
      /* island mode: plant land in the middle so the coast grows outward from it */
      if (this.o.border) { const m = Math.floor(this.R / 2) * this.C + Math.floor(this.C / 2); this.g[m] = 1 << 2; st.push(m) }
      if (this.prop(st)) return;
    }
  };
  Solver.prototype.step = function () {
    let best = -1, be = 1e9;
    const cr = (this.R - 1) / 2, cc = (this.C - 1) / 2;
    for (let k = 0; k < this.g.length; k++) {
      const p = pop(this.g[k]); if (p <= 1) continue;
      /* island mode grows from the centre outward, so land comes first and the sea fills the rest */
      const d = this.o.border ? Math.hypot(Math.floor(k / this.C) - cr, k % this.C - cc) * .9 : 0;
      const e = p + d + Math.random() * .6; if (e < be) { be = e; best = k }
    }
    if (best < 0) return { s: 'done' };
    const opts = []; let sum = 0;
    for (let t = 0; t < T.length; t++) if (this.g[best] & (1 << t)) { opts.push(t); sum += W[t] }
    let r = Math.random() * sum, pick = opts[0];
    for (const t of opts) { r -= W[t]; if (r <= 0) { pick = t; break } }
    const before = opts.length; this.g[best] = 1 << pick; this.last = best; this.changed = new Set();
    const ok = this.prop([best], this.changed);
    return ok ? { s: 'ok', cell: best, tile: pick, options: before, changed: this.changed.size } : { s: 'fail' };
  };
  Solver.prototype.solved = function () { let c = 0; for (const v of this.g) if (pop(v) === 1) c++; return c };
  Solver.prototype.finish = function () { let g = 0, r; while ((r = this.step()).s !== 'done' && g++ < 20000) if (r.s === 'fail') this.reset() };

  /* ---------- drawing helpers ---------- */
  const COL = { water: ['#7CC4E4', '#5BA9CC', '#4A95B8'], sand: ['#F2D99A', '#D9BC74', '#C4A35E'], grass: ['#A7CF4A', '#86AE33', '#6E9327'], forest: ['#A7CF4A', '#86AE33', '#6E9327'], town: ['#B9D766', '#94B744', '#7C9C35'] };
  const DOT = ['#5BA9CC', '#D9BC74', '#86AE33', '#3F8F4E', '#E2692E'];
  function fit(cv, ratio) {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth || 600, h = w * ratio;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) }
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h); return [c, w, h];
  }
  function tree(c, x, y, s, v, ink) {
    c.fillStyle = '#7A5236'; c.fillRect(x - 1.2, y - s * .4, 2.4, s * .5);
    c.beginPath(); c.moveTo(x, y - s * 1.9); c.lineTo(x + s * .7, y - s * .3); c.lineTo(x - s * .7, y - s * .3); c.closePath();
    c.fillStyle = v ? '#3F8F4E' : '#4FA35A'; c.fill(); c.strokeStyle = ink; c.globalAlpha = .5; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1;
  }
  function house(c, x, y, s, v, ink) {
    const hw = s * .95;
    c.fillStyle = v === 2 ? '#F6E6C8' : '#FFF4DD'; c.fillRect(x - hw, y - s * 1.1, hw * 2, s * 1.1);
    c.beginPath(); c.moveTo(x - hw - 2, y - s * 1.1); c.lineTo(x, y - s * 2.1); c.lineTo(x + hw + 2, y - s * 1.1); c.closePath();
    c.fillStyle = v === 1 ? '#C9552A' : '#E2692E'; c.fill();
    c.strokeStyle = ink; c.globalAlpha = .55; c.lineWidth = 1; c.stroke(); c.strokeRect(x - hw, y - s * 1.1, hw * 2, s * 1.1); c.globalAlpha = 1;
    c.fillStyle = '#F7D96B'; c.fillRect(x - s * .25, y - s * .75, s * .5, s * .4);
  }
  function flatTile(c, x, y, s, t, ink, k) {
    c.fillStyle = t === 3 ? '#97C243' : COL[T[t]][0]; c.fillRect(x, y, s, s);
    if (t === 0 && k % 3 === 0) { c.strokeStyle = '#E6F5FC'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + s * .25, y + s * .55); c.quadraticCurveTo(x + s * .5, y + s * .35, x + s * .75, y + s * .55); c.stroke() }
    if (t === 3) tree(c, x + s / 2, y + s * .85, s * .36, k % 2, ink);
    if (t === 4) house(c, x + s / 2, y + s * .88, s * .3, k % 3, ink);
  }

  /* ---------- itch.io embeds: click to play ----------
     Any element with class "play" and a data-embed URL becomes a click-to-play slot.
     data-embed: the iframe src from itch.io (Distribute → Embed game)
     data-itch:  the normal itch.io page, used on phones and as a fallback link */
  function loadEmbed(slot) {
    const src = slot.dataset.embed, page = slot.dataset.itch;
    if (isSmall() && page) { location.href = page; return }
    const f = document.createElement('iframe');
    f.src = src; f.title = slot.dataset.title || TXT.build;
    f.allow = 'autoplay; fullscreen; gamepad'; f.allowFullscreen = true; f.className = 'embed';
    const target = slot.querySelector('.cover') || slot.querySelector('canvas');
    if (target) target.replaceWith(f); else slot.appendChild(f);
    slot.classList.add('playing');
  }
  $$('.play').forEach(slot => {
    const btn = slot.querySelector('.play-btn') || (slot.dataset.button && document.getElementById(slot.dataset.button));
    const soon = slot.querySelector('.soon');
    if (!slot.dataset.embed) { if (btn && !slot.dataset.button) btn.hidden = true; if (soon) soon.hidden = false; return }
    if (soon) soon.hidden = true;
    if (btn) btn.addEventListener('click', e => { e.preventDefault(); btn.hidden = true; loadEmbed(slot) });
  });

  /* ---------- hero: real build if configured, otherwise the JS demo island ---------- */
  const heroSlot = $('.world .play'), hero = $('#wfc'), stat = $('#stat'), gen = $('#gen');
  let drawHero = () => {};
  if (heroSlot && heroSlot.dataset.embed) {
    const cover = document.createElement('img');
    cover.src = heroSlot.dataset.cover; cover.alt = TXT.coverAlt; cover.className = 'cover';
    hero.replaceWith(cover);
    gen.textContent = isSmall() ? TXT.playItch : TXT.playGen;
    if (stat) stat.parentElement.textContent = TXT.running;
  } else if (hero) {
    const HN = 13, HH = [0, 5, 10, 10, 10], hs = new Solver(HN, HN, { border: true }); let anim;
    drawHero = function () {
      const [c, w, h] = fit(hero, .62); const tw = w / (HN + 1), th = tw / 2, ox = w / 2, oy = h * .16, ink = css('--ink'), blank = css('--paper-2'); c.lineJoin = 'round';
      for (let s = 0; s < 2 * HN - 1; s++) for (let i = 0; i < HN; i++) {
        const j = s - i; if (j < 0 || j >= HN) continue;
        const k = i * HN + j, v = hs.g[k], done = pop(v) === 1, t = done ? Math.log2(v) : -1, x = ox + (j - i) * tw / 2, y = oy + (j + i) * th / 2, hh = done ? HH[t] * tw / 40 : 0;
        const dia = (yy, f) => { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + tw / 2, yy + th / 2); c.lineTo(x, yy + th); c.lineTo(x - tw / 2, yy + th / 2); c.closePath(); c.fillStyle = f; c.fill() };
        if (!done) { dia(y, blank); c.strokeStyle = ink; c.globalAlpha = .18; c.lineWidth = 1; c.stroke(); c.globalAlpha = 1; continue }
        const col = COL[T[t]];
        if (hh > 0) {
          c.fillStyle = col[1]; c.beginPath(); c.moveTo(x - tw / 2, y + th / 2 - hh); c.lineTo(x, y + th - hh); c.lineTo(x, y + th); c.lineTo(x - tw / 2, y + th / 2); c.fill();
          c.fillStyle = col[2]; c.beginPath(); c.moveTo(x + tw / 2, y + th / 2 - hh); c.lineTo(x, y + th - hh); c.lineTo(x, y + th); c.lineTo(x + tw / 2, y + th / 2); c.fill();
        }
        dia(y - hh, col[0]);
        if (t === 0 && ((i * 7 + j * 3) % 5 === 0)) { c.strokeStyle = '#E6F5FC'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - tw * .15, y + th / 2); c.quadraticCurveTo(x, y + th * .35, x + tw * .15, y + th / 2); c.stroke() }
        if (t === 3) tree(c, x, y - hh + th / 2, tw * ((i + j) % 2 ? .32 : .26), (i + j) % 2, ink);
        if (t === 4) house(c, x, y - hh + th / 2, tw * .22, (i * 3 + j) % 3, ink);
      }
    };
    const run = () => {
      cancelAnimationFrame(anim); hs.reset();
      if (reduce) { hs.finish(); drawHero(); stat.textContent = TXT.solved(HN * HN); return }
      const tick = () => {
        for (let n = 0; n < 3; n++) { const r = hs.step(); if (r.s === 'fail') { hs.reset(); break } if (r.s === 'done') { drawHero(); stat.textContent = TXT.solved(HN * HN); return } }
        drawHero(); stat.textContent = TXT.progress(hs.solved(), HN * HN); anim = requestAnimationFrame(tick);
      };
      tick();
    };
    gen.addEventListener('click', run);
    run();
  }

  /* ---------- WFC explainer (project page): Boris the Brave's path tileset, interactive ---------- */
  const lab = $('#lab'); let drawLab = () => {};
  if (lab) {
    // edges: [top, right, bottom, left]; 1 = path, 0 = grass
    const TILES = [[0, 0, 0, 0], [1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 1, 1]];
    const ALL = 15, pc = v => (v & 1) + (v >> 1 & 1) + (v >> 2 & 1) + (v >> 3 & 1);
    const L = ES ? {
      names: ['hierba', 'camino vertical', 'camino horizontal', 'cruce'],
      step: (r, c, o, t, n, you) => 'La celda (fila ' + r + ', columna ' + c + ') ' + (you ? 'ha colapsado a ' : 'tenía ' + o + ' opciones y ha colapsado a ') + t + '. ' + (n ? n + (n === 1 ? ' celda ha descartado fichas' : ' celdas han descartado fichas') + ' (discontinuas).' : 'Ninguna otra celda ha cambiado.'),
      done: 'Hecho: cada celda tiene una sola ficha y todos los bordes encajan. Pulsa Reiniciar para otro mapa.',
      fail: 'Contradicción: una celda se ha quedado sin ninguna ficha que encaje con sus vecinas (en rojo). Pulsa Paso o Reiniciar para empezar de nuevo.',
      reset: 'Todas las celdas vuelven a poder ser cualquiera de las cuatro fichas. Pulsa Paso, o haz clic en una ficha pequeña para elegirla tú.',
      play: 'Reproducir', pause: 'Pausa'
    } : {
      names: ['grass', 'vertical path', 'horizontal path', 'crossroads'],
      step: (r, c, o, t, n, you) => 'The cell in row ' + r + ', column ' + c + (you ? ' collapsed to the ' : ' had ' + o + ' options and collapsed to the ') + t + '. ' + (n ? n + (n === 1 ? ' cell dropped tiles' : ' cells dropped tiles') + ' (dashed).' : 'No other cell changed.'),
      done: 'Done: every cell has one tile and every edge matches. Press Reset for another map.',
      fail: 'Contradiction: a cell has no tile left that fits its neighbours (in red). Press Step or Reset to start again.',
      reset: 'Every cell can be any of the four tiles again. Press Step, or click a small tile to choose it yourself.',
      play: 'Play', pause: 'Pause'
    };
    const G = '#64DBC9', P = '#FFDCAD', E = '#DFBB96';
    function tileArt(c, t, x, y, s) {
      c.fillStyle = G; c.fillRect(x, y, s, s);
      const a = s * .13, b = s * .09;
      if (t === 1 || t === 2) {
        c.save(); c.translate(x + s / 2, y + s / 2); if (t === 2) c.rotate(Math.PI / 2); c.translate(-s / 2, -s / 2);
        c.fillStyle = E; c.fillRect(a, 0, s - 2 * a, s); c.fillStyle = P; c.fillRect(a + b, 0, s - 2 * (a + b), s); c.restore();
      } else if (t === 3) {
        c.save(); c.beginPath(); c.rect(x, y, s, s); c.clip();
        c.fillStyle = P; c.fillRect(x, y, s, s);
        [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([i, j]) => {
          const cx = x + i * s, cy = y + j * s;
          c.beginPath(); c.arc(cx, cy, a + b, 0, Math.PI * 2); c.fillStyle = E; c.fill();
          c.beginPath(); c.arc(cx, cy, a, 0, Math.PI * 2); c.fillStyle = G; c.fill();
        });
        c.restore();
      }
    }
    let N = 3, g, last = -1, changed = [], bad = -1, playing = null;
    const log = $('#lab-log'), stepsEl = $$('#lab-steps li'), playBtn = $('#lab-play');
    const hl = n => stepsEl.forEach(li => li.classList.toggle('on', +li.dataset.s === n));
    const reset = () => { g = new Array(N * N).fill(ALL); last = -1; changed = []; bad = -1 };
    const fits = (a, b, d) => TILES[a][d] === TILES[b][(d + 2) % 4];   // tile b sits on side d of tile a
    const nb = k => { const r = Math.floor(k / N), c = k % N, o = []; if (r > 0) o.push([k - N, 0]); if (c < N - 1) o.push([k + 1, 1]); if (r < N - 1) o.push([k + N, 2]); if (c > 0) o.push([k - 1, 3]); return o };
    function collapse(k, t) {
      g[k] = 1 << t; last = k; const ch = new Set(), q = [k];
      while (q.length) {
        const a = q.shift();
        for (const [b, d] of nb(a)) {
          let keep = 0;
          for (let tb = 0; tb < 4; tb++) if (g[b] >> tb & 1) for (let ta = 0; ta < 4; ta++) if ((g[a] >> ta & 1) && fits(ta, tb, d)) { keep |= 1 << tb; break }
          if (keep !== g[b]) { g[b] = keep; ch.add(b); if (!keep) { bad = b; changed = [...ch]; return } q.push(b) }
        }
      }
      changed = [...ch];
    }
    const say = (k, opts, t, you) => { log.textContent = L.step(Math.floor(k / N) + 1, k % N + 1, opts, L.names[t], changed.length, you) };
    function after() {
      if (bad >= 0) { hl(3); log.textContent = L.fail; stop(); drawLab(); return false }
      if (g.every(v => pc(v) === 1)) { hl(3); log.textContent = L.done; stop(); drawLab(); return false }
      hl(changed.length ? 2 : 1); drawLab(); return true;
    }
    function step() {
      if (bad >= 0 || g.every(v => pc(v) === 1)) { reset(); hl(0); log.textContent = L.reset; drawLab(); return true }
      let min = 9, cand = [];
      g.forEach((v, k) => { const n = pc(v); if (n > 1) { if (n < min) { min = n; cand = [k] } else if (n === min) cand.push(k) } });
      const k = cand[Math.floor(Math.random() * cand.length)], opts = [];
      for (let t = 0; t < 4; t++) if (g[k] >> t & 1) opts.push(t);
      const t = opts[Math.floor(Math.random() * opts.length)];
      collapse(k, t); say(k, opts.length, t, false); return after();
    }
    // geometry of the small candidate tiles inside an open cell (2 × 2)
    const mini = (k, t, sz) => { const x = (k % N) * sz, y = Math.floor(k / N) * sz, m = sz * .44, gp = sz * .04; return [x + gp + (t % 2) * (m + gp), y + gp + Math.floor(t / 2) * (m + gp), m] };
    drawLab = function () {
      const [c, w] = fit(lab, 1); const sz = w / N, ink = css('--ink');
      c.fillStyle = css('--paper'); c.fillRect(0, 0, w, w);
      for (let k = 0; k < N * N; k++) {
        const x = (k % N) * sz, y = Math.floor(k / N) * sz, v = g[k];
        if (k === bad) { c.fillStyle = '#F4C7BE'; c.fillRect(x, y, sz, sz); c.strokeStyle = '#C0392B'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + sz * .3, y + sz * .3); c.lineTo(x + sz * .7, y + sz * .7); c.moveTo(x + sz * .7, y + sz * .3); c.lineTo(x + sz * .3, y + sz * .7); c.stroke() }
        else if (pc(v) === 1) tileArt(c, Math.log2(v), x, y, sz);
        else for (let t = 0; t < 4; t++) if (v >> t & 1) { const [mx, my, m] = mini(k, t, sz); c.globalAlpha = .4; tileArt(c, t, mx, my, m); c.strokeStyle = ink; c.globalAlpha = .25; c.lineWidth = 1; c.strokeRect(mx + .5, my + .5, m - 1, m - 1); c.globalAlpha = 1 }
      }
      c.strokeStyle = ink; c.lineWidth = 3; c.beginPath();
      for (let i = 1; i < N; i++) { c.moveTo(i * sz, 0); c.lineTo(i * sz, w); c.moveTo(0, i * sz); c.lineTo(w, i * sz) }
      c.stroke();
      changed.forEach(k => { if (k === bad) return; const x = (k % N) * sz, y = Math.floor(k / N) * sz; c.setLineDash([5, 4]); c.strokeStyle = css('--orange'); c.lineWidth = 2.5; c.strokeRect(x + 2, y + 2, sz - 4, sz - 4); c.setLineDash([]) });
      if (last >= 0) { const x = (last % N) * sz, y = Math.floor(last / N) * sz; c.strokeStyle = ink; c.lineWidth = 3; c.strokeRect(x + 2, y + 2, sz - 4, sz - 4) }
    };
    lab.addEventListener('click', e => {
      if (bad >= 0) return;
      const r = lab.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, sz = r.width / N;
      const k = Math.floor(py / sz) * N + Math.floor(px / sz); if (k < 0 || k >= N * N || pc(g[k]) < 2) return;
      for (let t = 0; t < 4; t++) if (g[k] >> t & 1) { const [mx, my, m] = mini(k, t, sz); if (px >= mx && px <= mx + m && py >= my && py <= my + m) { stop(); const o = pc(g[k]); collapse(k, t); say(k, o, t, true); after(); return } }
    });
    lab.addEventListener('mousemove', e => {
      const r = lab.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, sz = r.width / N, k = Math.floor(py / sz) * N + Math.floor(px / sz);
      let hit = false; if (bad < 0 && k >= 0 && k < N * N && pc(g[k]) > 1) for (let t = 0; t < 4; t++) if (g[k] >> t & 1) { const [mx, my, m] = mini(k, t, sz); if (px >= mx && px <= mx + m && py >= my && py <= my + m) hit = true }
      lab.style.cursor = hit ? 'pointer' : 'default';
    });
    const stop = () => { clearInterval(playing); playing = null; playBtn.textContent = L.play };
    $('#lab-step').addEventListener('click', () => { stop(); step() });
    playBtn.addEventListener('click', () => { if (playing) { stop(); return } if (bad >= 0 || g.every(v => pc(v) === 1)) { reset(); hl(0) } playBtn.textContent = L.pause; playing = setInterval(() => { if (!step()) stop() }, reduce ? 120 : 650) });
    $('#lab-reset').addEventListener('click', () => { stop(); reset(); hl(0); log.textContent = L.reset; drawLab() });
    $$('canvas.tile-ico').forEach(cv => { const s = 44, d = Math.min(devicePixelRatio || 1, 2); cv.width = cv.height = s * d; const c = cv.getContext('2d'); c.scale(d, d); tileArt(c, +cv.dataset.t, 0, 0, s) });
    reset(); hl(0); drawLab();
  }

  /* ---------- doodles: measure, draw on reveal, redraw on hover ---------- */
  $$('.doodle path').forEach(p => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1) } catch (e) {} });
  if (!reduce) $$('.doodle').forEach(d => d.parentElement.addEventListener('pointerenter', () => { d.classList.remove('in'); void d.getBoundingClientRect(); d.classList.add('in') }));

  /* ---------- stick-in and doodle reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: .15 });
    $$('.stick, .doodle').forEach(el => io.observe(el));
  }

  /* ---------- portrait parallax ---------- */
  const b1 = $('.portrait .b1'), b2 = $('.portrait .b2'); let ticking = false;
  if (b1 && !reduce) addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { const y = Math.min(scrollY, 600); b1.style.transform = 'translateY(' + (y * .08) + 'px)'; b2.style.transform = 'translateY(' + (-y * .06) + 'px)'; ticking = false });
  }, { passive: true });

  /* ---------- hover swap to GIF: add data-gif="assets/img/x.gif" to any image ---------- */
  $$('img[data-gif]').forEach(img => {
    const still = img.src, host = img.closest('.piece, .mini, .art') || img;
    new Image().src = img.dataset.gif;
    host.addEventListener('mouseenter', () => img.src = img.dataset.gif);
    host.addEventListener('mouseleave', () => img.src = still);
  });

  /* ---------- looping videos: play only while visible, never with reduced motion ---------- */
  $$('video.loop').forEach(v => {
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); return }
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const p = v.play(); if (p) p.catch(() => {}) } else v.pause() }), { threshold: .25 }).observe(v);
  });

  /* ---------- video gallery: arrows, dots, swipe and keyboard; plays only the visible video ---------- */
  $$('[data-reel]').forEach(reel => {
    const stage = reel.querySelector('.reel-stage'), vids = [...stage.querySelectorAll('video')], dots = [...reel.querySelectorAll('.reel-dot')];
    const capT = reel.querySelector('.reel-cap b'), capC = reel.querySelector('.reel-cap span');
    let i = 0, inView = false, paused = reduce;
    const play = v => { const p = v.play(); if (p) p.catch(() => {}) };
    function sync() { vids.forEach((v, k) => { if (k === i && inView && !paused) play(v); else v.pause() }) }
    function show(n) {
      i = (n + vids.length) % vids.length;
      vids.forEach((v, k) => {
        const on = k === i; v.classList.toggle('on', on); v.setAttribute('aria-hidden', String(!on));
        if (on && v.preload === 'none') { v.preload = 'auto'; v.load() }
      });
      dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
      capT.textContent = vids[i].dataset.title; capC.textContent = vids[i].dataset.caption;
      sync();
    }
    reel.querySelectorAll('.reel-btn').forEach(b => b.addEventListener('click', () => show(i + +b.dataset.dir)));
    dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
    reel.tabIndex = 0;
    reel.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1) }
    });
    let x0 = null;
    stage.addEventListener('pointerdown', e => { x0 = e.clientX });
    stage.addEventListener('pointerup', e => {
      if (x0 === null) return; const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); else { paused = !paused; sync() }
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { inView = e.isIntersecting; sync() }), { threshold: .3 }).observe(stage);
    else inView = true;
    show(0);
  });

  /* ---------- card clips: play on hover, only on devices with a mouse ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) $$('.hover-vid').forEach(box => {
    const v = box.querySelector('video'), host = box.closest('.mini, .piece') || box;
    host.addEventListener('mouseenter', () => { box.classList.add('on'); const p = v.play(); if (p) p.catch(() => {}) });
    host.addEventListener('mouseleave', () => { box.classList.remove('on'); v.pause() });
  });

  /* ---------- YouTube trailer: load the player only after a click ---------- */
  $$('.yt[data-yt]').forEach(box => {
    const btn = box.querySelector('.yt-btn');
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + box.dataset.yt + '?autoplay=1&rel=0';
      f.title = box.dataset.title || 'YouTube video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
      btn.replaceWith(f); f.focus();
    });
  });

  /* ---------- redraw canvases on resize and theme change ---------- */
  const redraw = () => { drawHero(); drawLab() };
  addEventListener('resize', redraw);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redraw);
})();

/* wireframe figures: tap toggles on touch screens */
document.querySelectorAll('.wire').forEach(f => f.addEventListener('click', () => f.classList.toggle('on')));

/* art process viewer: <template id="proc-…"> holds the steps, any [data-proc] opens it */
(() => {
  const openers = document.querySelectorAll('[data-proc]');
  if (!openers.length) return;
  let dlg, list = [], i = 0, tpl;
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.textContent = h; return e };
  function build() {
    dlg = el('dialog', 'proc');
    const inn = el('div', 'proc-in');
    const head = el('div', 'proc-head'); const h = el('h3'); const cnt = el('span', 'proc-count'); const x = el('button', 'proc-x', '×'); x.type = 'button';
    head.append(h, cnt, x);
    const stage = el('div', 'proc-stage'); const img = el('img'); const pv = el('button', 'proc-nav proc-prev', '‹'); const nx = el('button', 'proc-nav proc-next', '›'); pv.type = nx.type = 'button';
    stage.append(img, pv, nx);
    const cap = el('p', 'proc-cap'); const foot = el('div', 'proc-foot'); const steps = el('div', 'proc-steps'); const more = el('a', 'proc-more'); more.target = '_blank'; more.rel = 'noopener';
    foot.append(steps, more); inn.append(head, stage, cap, foot); dlg.append(inn); document.body.append(dlg);
    Object.assign(dlg, { h, cnt, x, img, pv, nx, cap, steps, more });
    x.onclick = () => dlg.close(); pv.onclick = () => show(i - 1); nx.onclick = () => show(i + 1);
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close() });
    dlg.addEventListener('close', () => { if (dlg.frame) { dlg.frame.remove(); dlg.frame = null } });
    dlg.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1) });
    let sx = null;
    stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX }, { passive: true });
    stage.addEventListener('touchend', e => { if (sx == null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 40) show(i + (d < 0 ? 1 : -1)); sx = null });
  }
  function show(n) {
    if (n < 0 || n >= list.length) return; i = n; const f = list[i], im = f.querySelector('img');
    if (dlg.frame) { dlg.frame.remove(); dlg.frame = null }
    if (f.dataset.iframe) {
      const fr = el('iframe', 'proc-frame'); fr.src = f.dataset.iframe; fr.title = f.dataset.step || '';
      fr.allow = 'autoplay; fullscreen; picture-in-picture'; fr.allowFullscreen = true; fr.referrerPolicy = 'strict-origin-when-cross-origin';
      dlg.img.hidden = true; dlg.img.after(fr); dlg.frame = fr;
    } else { dlg.img.hidden = false; dlg.img.src = im.getAttribute('src'); dlg.img.alt = im.alt }
    const solo = list.length < 2; dlg.pv.hidden = dlg.nx.hidden = dlg.steps.hidden = dlg.cnt.hidden = solo;
    const label = f.dataset.step, c = f.querySelector('figcaption');
    dlg.cap.textContent = ''; const b = el('b', null, label + (c ? ' · ' : '')); dlg.cap.append(b, c ? c.textContent : '');
    dlg.cnt.textContent = (i + 1) + ' / ' + list.length;
    dlg.pv.disabled = i === 0; dlg.nx.disabled = i === list.length - 1;
    [...dlg.steps.children].forEach(s => s.setAttribute('aria-current', String(+s.dataset.i <= i && +s.dataset.last >= i)));
  }
  function open(id) {
    tpl = document.getElementById(id); if (!tpl) return; if (!dlg) build();
    list = [...tpl.content.querySelectorAll('figure')];
    const d = tpl.dataset; dlg.h.textContent = d.title || ''; dlg.x.setAttribute('aria-label', d.close || 'Close');
    dlg.pv.setAttribute('aria-label', d.prev || 'Previous'); dlg.nx.setAttribute('aria-label', d.next || 'Next');
    dlg.more.href = d.more || '#'; dlg.more.target = /^https?:/.test(d.more || '') ? '_blank' : ''; dlg.more.textContent = d.moreLabel || ''; dlg.more.hidden = !d.more;
    dlg.steps.textContent = '';
    list.forEach((f, k) => { const prev = list[k - 1]; if (prev && prev.dataset.step === f.dataset.step) { dlg.steps.lastChild.dataset.last = k; return }
      const s = el('button', null, f.dataset.step); s.type = 'button'; s.dataset.i = k; s.dataset.last = k; s.onclick = () => show(k); dlg.steps.append(s) });
    show(0);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  openers.forEach(b => b.addEventListener('click', () => open(b.dataset.proc)));
})();

/* crossfading card stacks (.cycle): next image every few seconds while on screen */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.cycle').forEach(box => {
    const imgs = box.querySelectorAll('img'); if (imgs.length < 2) return;
    let k = 0, t = null;
    const tick = () => { k = (k + 1) % imgs.length; imgs.forEach((im, j) => im.classList.toggle('on', j === k)) };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { if (!t) t = setInterval(tick, 2600) } else { clearInterval(t); t = null } }), { threshold: .3 });
    io.observe(box);
  });
})();
