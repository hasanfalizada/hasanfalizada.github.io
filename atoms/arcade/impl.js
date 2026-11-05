// +++===+++ 2026-11-05 Asia/Baku — Hasan Alizada — Arcade atom: five architecture-themed mini games for the empty blog page
// (Monolith Breaker, Load Balancer, Circuit Breaker, Merge to Platform, Uptime Runner). Canvas only, no libraries, no network.
// Usage: new Arcade().mount(containerElement). Colors come from CSS custom properties on .arcade (assets/css/main.css).
// Games run only while the arcade is on screen and the tab is visible; they start on click / space, never by themselves.
// Best scores per game are kept in localStorage (key arcade-best-<id>), every access wrapped in try/catch.

class Arcade {
    /**
     * Builds the arcade UI (tabs, canvas, description) inside the container and starts the render loop
     * @param {HTMLElement} root
     * @returns {{success: boolean, error: string|null}}
     */
    mount(root) {
        try {
            mountArcade(root);
            console.debug('[Arcade] mounted');
            return {success: true, error: null};
        } catch (e) {
            console.error('[Arcade] mount failed:', e.message);
            return {success: false, error: e.message};
        }
    }
}

function mountArcade(root) {
  var W = 640, H = 360;
  root.classList.add('arcade');
  root.innerHTML =
    '<div class="arcade__tabs" role="tablist"></div>' +
    '<div class="arcade__stage"><canvas tabindex="0" aria-label="Game"></canvas></div>' +
    '<p class="arcade__about"></p><p class="arcade__keys"></p>';
  var tabs = root.querySelector('.arcade__tabs'), aboutEl = root.querySelector('.arcade__about'), keysEl = root.querySelector('.arcade__keys');
  var cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  var C = {};
  function readColors() {
    var s = getComputedStyle(root);
    ['bg', 'fg', 'muted', 'line', 'stage'].forEach(function (k) { C[k] = s.getPropertyValue('--arcade-' + k).trim(); });
  }
  function resize() {
    var r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    if (!r.width) return;
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.width * H / W * d);
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
  }
  window.addEventListener('resize', resize);
  var FONT = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
  function text(s, x, y, size, color, align, bold) {
    ctx.font = (bold ? '700 ' : '400 ') + size + 'px ' + FONT;
    ctx.fillStyle = color || C.fg; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }
  function box(x, y, w, h, fill, stroke, dash) {
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
    if (stroke) { ctx.setLineDash(dash || []); ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1); ctx.setLineDash([]); }
  }
  function line(x1, y1, x2, y2, color, dash) {
    ctx.setLineDash(dash || []); ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function getBest(id) { try { return +localStorage.getItem('arcade-best-' + id) || 0; } catch (e) { return 0; } }
  function setBest(id, v) { try { localStorage.setItem('arcade-best-' + id, String(v)); } catch (e) {} }

  var inp = {px: null, keys: {}};

  // ===================== 1. Monolith Breaker =====================
  var breaker = {
    id: 'breaker', title: 'Monolith Breaker',
    about: '<b>Breakout with a story.</b> Smash the monolith into services. Linked modules come out together, the way real dependencies do. Each cleared monolith comes back bigger and faster.',
    keys: 'mouse / finger / ← → to move · click or space to start',
    names: ['auth', 'users', 'cards', 'ledger', 'fx', 'limits', 'kyc', 'notify', 'cashback', 'stmt', 'tax', 'loans', 'fees', 'risk', 'report', 'search', 'audit', 'cache', 'billing', 'orders'],
    reset: function () { this.px = W / 2; this.pw = 92; this.level = 1; this.score = 0; this.lives = 3; this.timers = []; this.build(); this.serve(); },
    build: function () {
      var cols = 8, rows = 4 + Math.min(this.level, 3), bw = 70, bh = 20, gap = 4;
      var ox = (W - cols * (bw + gap) + gap) / 2, oy = 52;
      this.bricks = [];
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        this.bricks.push({x: ox + c * (bw + gap), y: oy + r * (bh + gap), w: bw, h: bh, alive: true, link: null,
          name: this.names[(r * 7 + c * 3 + this.level * 5) % this.names.length]});
      }
      var self = this;
      this.bricks.forEach(function (b, i) { if (i % cols < cols - 1 && Math.random() < .25) b.link = i + 1; });
      this.top = oy;
    },
    serve: function () {
      this.bx = this.px; this.by = H - 46; this.held = true;
      this.speed = 250 + this.level * 30;
    },
    launch: function () { if (!this.held) return; this.held = false; var a = -Math.PI / 2 + rnd(-.5, .5); this.vx = Math.cos(a) * this.speed; this.vy = Math.sin(a) * this.speed; },
    kill: function (i) {
      var b = this.bricks[i]; if (!b || !b.alive) return;
      b.alive = false; this.score++;
      if (b.link !== null) { var self = this, j = b.link; this.timers.push({t: .12, fn: function () { self.kill(j); }}); }
    },
    down: function () { this.launch(); },
    key: function (k) { if (k === ' ' || k === 'ArrowUp') this.launch(); },
    update: function (dt, sh) {
      if (inp.px !== null) this.px = inp.px;
      if (inp.keys.ArrowLeft) this.px -= 460 * dt;
      if (inp.keys.ArrowRight) this.px += 460 * dt;
      this.px = Math.max(this.pw / 2, Math.min(W - this.pw / 2, this.px));
      var self = this;
      this.timers = this.timers.filter(function (t) { t.t -= dt; if (t.t <= 0) { t.fn(); return false; } return true; });
      if (this.held) { this.bx = this.px; this.by = H - 46; return; }
      var r = 5;
      this.bx += this.vx * dt; this.by += this.vy * dt;
      if (this.bx < r) { this.bx = r; this.vx = Math.abs(this.vx); }
      if (this.bx > W - r) { this.bx = W - r; this.vx = -Math.abs(this.vx); }
      if (this.by < 30 + r) { this.by = 30 + r; this.vy = Math.abs(this.vy); }
      var py = H - 34;
      if (this.vy > 0 && this.by + r >= py && this.by < py + 8 && Math.abs(this.bx - this.px) < this.pw / 2 + r) {
        var off = (this.bx - this.px) / (this.pw / 2), sp = Math.hypot(this.vx, this.vy) * 1.01;
        var a = -Math.PI / 2 + off * 1.05;
        this.vx = Math.cos(a) * sp; this.vy = Math.sin(a) * sp; this.by = py - r;
      }
      if (this.by > H + 10) { this.lives--; if (this.lives <= 0) return sh.over(this.score); this.serve(); }
      for (var i = 0; i < this.bricks.length; i++) {
        var b = this.bricks[i]; if (!b.alive) continue;
        var cx = Math.max(b.x, Math.min(this.bx, b.x + b.w)), cy = Math.max(b.y, Math.min(this.by, b.y + b.h));
        if ((this.bx - cx) * (this.bx - cx) + (this.by - cy) * (this.by - cy) <= r * r) {
          var ox = Math.min(this.bx - b.x, b.x + b.w - this.bx), oy = Math.min(this.by - b.y, b.y + b.h - this.by);
          if (ox < oy) this.vx = -this.vx; else this.vy = -this.vy;
          this.kill(i); break;
        }
      }
      if (this.bricks.every(function (b) { return !b.alive; }) && !this.timers.length) { this.level++; this.build(); this.serve(); }
    },
    draw: function () {
      var self = this;
      text('MONOLITH v' + this.level, 14, 16, 12, C.muted);
      text('services extracted: ' + this.score, W / 2, 16, 12, C.fg, 'center', true);
      text('rollbacks ' + '●'.repeat(this.lives) + '○'.repeat(Math.max(0, 3 - this.lives)), W - 14, 16, 12, C.muted, 'right');
      this.bricks.forEach(function (b) {
        if (!b.alive) return;
        if (b.link !== null && self.bricks[b.link].alive) line(b.x + b.w - 6, b.y + b.h / 2, b.x + b.w + 10, b.y + b.h / 2, C.fg);
        box(b.x, b.y, b.w, b.h, C.bg, C.fg);
        text(b.name, b.x + b.w / 2, b.y + b.h / 2 + 1, 10, C.fg, 'center');
      });
      box(this.px - this.pw / 2, H - 34, this.pw, 7, C.fg);
      ctx.fillStyle = C.fg; ctx.beginPath(); ctx.arc(this.bx, this.by, 5, 0, Math.PI * 2); ctx.fill();
      if (this.held) text('click / space to launch', W / 2, H - 70, 11, C.muted, 'center');
    }
  };

  // ===================== 2. Load Balancer =====================
  var lb = {
    id: 'balancer', title: 'Load Balancer',
    about: '<b>Spread the traffic.</b> Requests leave the balancer into the server under it. Overloaded servers go down and drop requests. Every 40 served requests the cluster scales out. Five drops breach the SLA.',
    keys: 'mouse / finger / ← → to move the balancer · click or space to start',
    reset: function () { this.n = 3; this.servers = []; for (var i = 0; i < this.n; i++) this.servers.push({load: 0, down: 0}); this.rx = W / 2; this.lane = 1; this.reqs = []; this.t = 0; this.spawn = 0; this.served = 0; this.dropped = 0; this.score = 0; this.nextScale = 40; },
    laneX: function (i) { return W / this.n * (i + .5); },
    key: function (k) { if (k === 'ArrowLeft') this.lane = Math.max(0, this.lane - 1); if (k === 'ArrowRight') this.lane = Math.min(this.n - 1, this.lane + 1); this.kb = true; },
    down: function () {},
    update: function (dt, sh) {
      this.t += dt;
      if (inp.px !== null && !this.kb) this.lane = Math.max(0, Math.min(this.n - 1, Math.floor(inp.px / (W / this.n))));
      var tx = this.laneX(this.lane); this.rx += (tx - this.rx) * Math.min(1, dt * 14);
      this.spawn -= dt;
      if (this.spawn <= 0) {
        this.spawn = Math.max(.22, .85 - this.t * .012);
        var size = pick([1, 1, 2, 2, 3]);
        this.reqs.push({x: this.rx, y: 62, lane: Math.max(0, Math.min(this.n - 1, Math.floor(this.rx / (W / this.n)))), size: size});
      }
      var self = this, sy = H - 78;
      this.servers.forEach(function (s) { s.load = Math.max(0, s.load - 24 * dt); if (s.down > 0) s.down -= dt; });
      this.reqs = this.reqs.filter(function (r) {
        r.y += 190 * dt;
        if (r.y < sy) return true;
        var s = self.servers[r.lane];
        if (s.down > 0) { self.dropped++; return false; }
        s.load += r.size * 13;
        if (s.load > 100) { s.down = 2.4; s.load = 0; self.dropped++; } else { self.served++; }
        return false;
      });
      this.score = this.served;
      if (this.served >= this.nextScale && this.n < 6) { this.n++; this.servers.push({load: 0, down: 0}); this.nextScale += 40;
        this.reqs.forEach(function (r) { r.lane = Math.min(r.lane, self.n - 1); }); }
      if (this.dropped >= 5) sh.over(this.served);
    },
    draw: function () {
      var self = this, sy = H - 78;
      var up = this.served + this.dropped ? (this.served / (this.served + this.dropped) * 100) : 100;
      text('served: ' + this.served, 14, 16, 12, C.fg, 'left', true);
      text('uptime ' + up.toFixed(2) + '%', W / 2, 16, 12, C.fg, 'center');
      text('drops ' + '■'.repeat(this.dropped) + '□'.repeat(Math.max(0, 5 - this.dropped)), W - 14, 16, 12, C.muted, 'right');
      for (var i = 1; i < this.n; i++) line(W / this.n * i, 60, W / this.n * i, H - 20, C.line, [3, 5]);
      box(this.rx - 34, 34, 68, 24, C.fg); text('LB', this.rx, 46, 12, C.bg, 'center', true);
      this.reqs.forEach(function (r) { var s = 4 + r.size * 3; box(r.x - s / 2, r.y - s / 2, s, s, C.fg); });
      this.servers.forEach(function (s, i) {
        var w = Math.min(110, W / self.n - 20), x = self.laneX(i) - w / 2;
        if (s.down > 0) { box(x, sy, w, 52, C.fg); text('DOWN', x + w / 2, sy + 26, 12, C.bg, 'center', true); return; }
        box(x, sy, w, 52, C.bg, C.fg);
        text('srv-' + (i + 1), x + w / 2, sy + 15, 11, C.fg, 'center');
        box(x + 8, sy + 30, w - 16, 10, null, C.fg);
        box(x + 9, sy + 31, (w - 18) * Math.min(1, s.load / 100), 8, s.load > 75 ? C.fg : C.muted);
      });
    }
  };

  // ===================== 3. Circuit Breaker =====================
  var cb = {
    id: 'circuit', title: 'Circuit Breaker',
    about: '<b>Stop the cascade.</b> Failures start deep in the system and spread to their callers when the timer runs out. Click a failing service to open its breaker; it recovers a moment later. You have three breakers. If the gateway falls, it is an outage.',
    keys: 'click / tap a failing service · click or space to start',
    cols: [['gateway'], ['orders', 'payments', 'users'], ['ledger', 'cards', 'auth', 'notify'], ['db', 'cache', 'queue', 'psp']],
    deps: {gateway: ['orders', 'payments', 'users'], orders: ['ledger', 'notify'], payments: ['ledger', 'cards'], users: ['auth', 'notify'],
      ledger: ['db', 'queue'], cards: ['db', 'psp'], auth: ['cache', 'db'], notify: ['queue']},
    reset: function () {
      var self = this; this.nodes = {}; this.t = 0; this.next = 1.2; this.score = 0;
      this.cols.forEach(function (col, ci) {
        col.forEach(function (n, ri) {
          var x = 70 + ci * 166, y = 70 + (H - 110) / col.length * (ri + .5);
          self.nodes[n] = {name: n, x: x, y: y, w: 92, h: 30, st: 'ok', tm: 0};
        });
      });
    },
    callers: function (n) { var out = []; for (var k in this.deps) if (this.deps[k].indexOf(n) >= 0) out.push(k); return out; },
    openCount: function () { var c = 0; for (var k in this.nodes) if (this.nodes[k].st === 'open') c++; return c; },
    down: function (x, y) {
      for (var k in this.nodes) {
        var n = this.nodes[k];
        if (n.st === 'failing' && Math.abs(x - n.x) < n.w / 2 + 6 && Math.abs(y - n.y) < n.h / 2 + 6 && this.openCount() < 3) { n.st = 'open'; n.tm = 2.6; return; }
      }
    },
    key: function () {},
    update: function (dt, sh) {
      var self = this; this.t += dt; this.score = Math.floor(this.t * 10) / 10;
      this.next -= dt;
      if (this.next <= 0) {
        this.next = Math.max(.7, 2.3 - this.t * .03);
        var deep = this.cols[2].concat(this.cols[3]).filter(function (n) { return self.nodes[n].st === 'ok'; });
        if (deep.length) { var n = this.nodes[pick(deep)]; n.st = 'failing'; n.tm = Math.max(1.6, 3.2 - this.t * .02); }
      }
      for (var k in this.nodes) {
        var n = this.nodes[k];
        if (n.st === 'open') { n.tm -= dt; if (n.tm <= 0) n.st = 'ok'; }
        if (n.st === 'failing') {
          n.tm -= dt;
          if (n.tm <= 0) {
            if (n.name === 'gateway') return sh.over(this.score);
            this.callers(n.name).forEach(function (c) { var m = self.nodes[c]; if (m.st === 'ok') { m.st = 'failing'; m.tm = Math.max(1.6, 3.2 - self.t * .02); } });
            n.st = 'ok';
          }
        }
      }
    },
    draw: function () {
      var self = this;
      text('uptime ' + this.score.toFixed(1) + 's', 14, 16, 12, C.fg, 'left', true);
      text('breakers ' + '◼'.repeat(this.openCount()) + '◻'.repeat(3 - this.openCount()), W - 14, 16, 12, C.muted, 'right');
      for (var a in this.deps) this.deps[a].forEach(function (b) {
        var A = self.nodes[a], B = self.nodes[b];
        line(A.x + A.w / 2, A.y, B.x - B.w / 2, B.y, B.st === 'failing' ? C.fg : C.line, B.st === 'open' ? [2, 4] : null);
      });
      for (var k in this.nodes) {
        var n = this.nodes[k], x = n.x - n.w / 2, y = n.y - n.h / 2;
        if (n.st === 'failing') {
          box(x, y, n.w, n.h, C.fg); text(n.name + ' !', n.x, n.y, 11, C.bg, 'center', true);
          box(x, y + n.h + 3, n.w * Math.max(0, n.tm / 3.2), 3, C.fg);
        } else if (n.st === 'open') {
          box(x, y, n.w, n.h, C.bg, C.fg, [3, 3]); text('open', n.x, n.y, 11, C.muted, 'center');
        } else {
          box(x, y, n.w, n.h, C.bg, C.fg); text(n.name, n.x, n.y, 11, C.fg, 'center', n.name === 'gateway');
        }
      }
    }
  };

  // ===================== 4. Merge to Platform =====================
  var merge = {
    id: 'merge', title: 'Merge to Platform',
    about: '<b>From a function to an ecosystem.</b> Slide the board; equal pieces merge into the next level: fn → class → module → service → domain → platform → ecosystem. The game ends when nothing can move.',
    keys: 'arrows / WASD / swipe · click or space to start',
    L: ['fn', 'class', 'module', 'service', 'domain', 'platform', 'ecosystem'],
    reset: function () { this.g = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; this.score = 0; this.best = 0; this.pop = {}; this.add(); this.add(); },
    add: function () { var e = []; this.g.forEach(function (v, i) { if (!v) e.push(i); }); if (!e.length) return; this.g[pick(e)] = Math.random() < .9 ? 1 : 2; },
    move: function (dir, sh) {
      var self = this, moved = false, pop = {};
      for (var a = 0; a < 4; a++) {
        var idx = [];
        for (var b = 0; b < 4; b++) {
          if (dir === 'L') idx.push(a * 4 + b); if (dir === 'R') idx.push(a * 4 + 3 - b);
          if (dir === 'U') idx.push(b * 4 + a); if (dir === 'D') idx.push((3 - b) * 4 + a);
        }
        var vals = idx.map(function (i) { return self.g[i]; }).filter(Boolean), out = [];
        for (var i = 0; i < vals.length; i++) {
          if (vals[i] === vals[i + 1] && vals[i] < self.L.length) { out.push(vals[i] + 1); self.score += Math.pow(2, vals[i] + 1); pop[idx[out.length - 1]] = .18; i++; }
          else out.push(vals[i]);
        }
        idx.forEach(function (gi, j) { var v = out[j] || 0; if (self.g[gi] !== v) moved = true; self.g[gi] = v; });
      }
      if (moved) { this.add(); this.pop = pop; }
      if (!this.canMove()) sh.over(this.score);
    },
    canMove: function () {
      for (var i = 0; i < 16; i++) {
        if (!this.g[i]) return true;
        if (i % 4 < 3 && this.g[i] === this.g[i + 1]) return true;
        if (i < 12 && this.g[i] === this.g[i + 4]) return true;
      }
      return false;
    },
    key: function (k, sh) {
      var m = {ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D', a: 'L', d: 'R', w: 'U', s: 'D'}[k];
      if (m) this.move(m, sh);
    },
    down: function (x, y) { this.sx = x; this.sy = y; },
    up: function (x, y, sh) {
      if (this.sx === undefined) return;
      var dx = x - this.sx, dy = y - this.sy; this.sx = undefined;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      this.move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'), sh);
    },
    update: function (dt) { for (var k in this.pop) { this.pop[k] -= dt; if (this.pop[k] <= 0) delete this.pop[k]; } },
    draw: function () {
      var cs = 70, gap = 6, ox = 60, oy = (H - (cs * 4 + gap * 3)) / 2 + 8, self = this;
      text('score: ' + this.score, 14, 16, 12, C.fg, 'left', true);
      for (var i = 0; i < 16; i++) {
        var x = ox + (i % 4) * (cs + gap), y = oy + Math.floor(i / 4) * (cs + gap), v = this.g[i];
        if (!v) { box(x, y, cs, cs, null, C.line); continue; }
        var big = this.pop[i] ? 3 : 0, dark = v >= 4;
        box(x - big, y - big, cs + big * 2, cs + big * 2, dark ? C.fg : C.bg, C.fg);
        text(this.L[v - 1], x + cs / 2, y + cs / 2, v >= 6 ? 9 : 11, dark ? C.bg : C.fg, 'center', v >= 3);
      }
      var lx = 390; text('level chain', lx, oy + 6, 11, C.muted);
      this.L.forEach(function (n, i) {
        var have = self.g.indexOf(i + 1) >= 0;
        text((have ? '■ ' : '□ ') + n, lx, oy + 34 + i * 26, 13, have ? C.fg : C.muted, 'left', have);
      });
    }
  };

  // ===================== 5. Uptime Runner =====================
  var runner = {
    id: 'runner', title: 'Uptime Runner',
    about: '<b>Keep the request alive.</b> A data packet runs along the bus and jumps over bugs, timeouts and 503s. The longer it survives, the faster the traffic.',
    keys: 'space / ↑ / click / tap to jump',
    reset: function () { this.y = 0; this.vy = 0; this.obs = []; this.t = 0; this.dist = 0; this.next = 1; this.score = 0; this.dash = 0; },
    jump: function () { if (this.y === 0) this.vy = 560; },
    key: function (k) { if (k === ' ' || k === 'ArrowUp' || k === 'w') this.jump(); },
    down: function () { this.jump(); },
    update: function (dt, sh) {
      this.t += dt; var sp = 300 + this.t * 7; this.dist += sp * dt; this.score = Math.floor(this.t * 10) / 10; this.dash = (this.dash + sp * dt) % 24;
      this.vy -= 1650 * dt; this.y = Math.max(0, this.y + this.vy * dt); if (this.y === 0 && this.vy < 0) this.vy = 0;
      this.next -= dt;
      if (this.next <= 0) {
        var lab = pick(['bug', '503', 'NPE', 'timeout', 'OOM', 'deadlock']);
        var w = lab.length * 8 + 16, h = pick([20, 26, 34]);
        this.obs.push({x: W + 10, w: w, h: h, lab: lab});
        this.next = rnd(.75, 1.6) * Math.max(.55, 1 - this.t * .008);
      }
      var gy = H - 70, px = 80, pw = 46, ph = 22, py = gy - ph - this.y, self = this;
      this.obs = this.obs.filter(function (o) { o.x -= sp * dt; return o.x + o.w > -10; });
      for (var i = 0; i < this.obs.length; i++) {
        var o = this.obs[i];
        if (px + pw - 4 > o.x && px + 4 < o.x + o.w && py + ph > gy - o.h + 2) return sh.over(this.score);
      }
    },
    draw: function () {
      var gy = H - 70, px = 80, pw = 46, ph = 22, py = gy - ph - this.y;
      text('uptime ' + this.score.toFixed(1) + 's', 14, 16, 12, C.fg, 'left', true);
      line(0, gy + .5, W, gy + .5, C.fg);
      for (var x = -this.dash; x < W; x += 24) line(x, gy + 8, x + 10, gy + 8, C.line);
      text('message bus', W - 14, gy + 22, 10, C.muted, 'right');
      box(px, py, pw, ph, C.fg); text('0100', px + pw / 2, py + ph / 2 + 1, 11, C.bg, 'center', true);
      this.obs.forEach(function (o) { box(o.x, gy - o.h, o.w, o.h, C.bg, C.fg); text(o.lab, o.x + o.w / 2, gy - o.h / 2, 10, C.fg, 'center'); });
    }
  };

  // ===================== shell =====================
  var games = [breaker, lb, cb, merge, runner];
  var cur = null, state = 'ready', last = 0, lastScore = 0, running = false, onScreen = true;
  var sh = {
    over: function (score) {
      state = 'over'; lastScore = score;
      if (score > getBest(cur.id)) setBest(cur.id, score);
    }
  };
  var buttons = {};
  games.forEach(function (g) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = g.title;
    b.addEventListener('click', function () { select(g); });
    tabs.appendChild(b); buttons[g.id] = b;
  });
  function select(g) {
    cur = g; state = 'ready'; g.reset();
    games.forEach(function (x) { buttons[x.id].setAttribute('aria-selected', String(x === g)); });
    aboutEl.innerHTML = g.about;
    keysEl.textContent = g.keys;
  }
  function start() { cur.reset(); state = 'play'; inp.keys = {}; cur.kb = false; }
  function toCanvas(e) { var r = cv.getBoundingClientRect(); return {x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H}; }
  cv.addEventListener('pointermove', function (e) { var p = toCanvas(e); inp.px = p.x; if (cur) cur.kb = false; });
  cv.addEventListener('pointerleave', function () { inp.px = null; });
  cv.addEventListener('pointerdown', function (e) {
    cv.focus(); var p = toCanvas(e);
    if (e.pointerType !== 'mouse') inp.px = p.x;
    if (state !== 'play') { start(); if (cur.down && cur !== runner) cur.down(p.x, p.y, sh); return; }
    if (cur.down) cur.down(p.x, p.y, sh);
  });
  cv.addEventListener('pointerup', function (e) { var p = toCanvas(e); if (state === 'play' && cur.up) cur.up(p.x, p.y, sh); });
  var GAME_KEYS = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  cv.addEventListener('keydown', function (e) {
    if (GAME_KEYS.indexOf(e.key) >= 0) e.preventDefault();
    if (state !== 'play') { if (e.key === ' ' || e.key === 'Enter') start(); return; }
    inp.keys[e.key] = true;
    if (!e.repeat || e.key.indexOf('Arrow') !== 0 || cur === breaker) cur.key(e.key, sh);
  });
  cv.addEventListener('keyup', function (e) { inp.keys[e.key] = false; });

  function overlay() {
    ctx.fillStyle = C.stage; ctx.globalAlpha = .9; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    text(cur.title, W / 2, H / 2 - 40, 26, C.fg, 'center', true);
    if (state === 'over') {
      text('score ' + lastScore + '   ·   best ' + getBest(cur.id), W / 2, H / 2, 14, C.fg, 'center');
      text('click or press space to retry', W / 2, H / 2 + 32, 12, C.muted, 'center');
    } else {
      text('click or press space to start', W / 2, H / 2 + 4, 13, C.muted, 'center');
      var b = getBest(cur.id); if (b) text('best ' + b, W / 2, H / 2 + 30, 12, C.muted, 'center');
    }
  }

  function frame(ts) {
    running = false;
    if (!onScreen || document.hidden) return; // paused: resumed by the observer / visibilitychange
    var dt = Math.min(.033, (ts - last) / 1000 || 0); last = ts;
    readColors();
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.stage; ctx.fillRect(0, 0, W, H);
    if (state === 'play') cur.update(dt, sh);
    cur.draw();
    if (state !== 'play') overlay();
    loop();
  }
  function loop() { if (!running) { running = true; requestAnimationFrame(frame); } }

  readColors(); resize();
  select(games[0]);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) { resize(); last = performance.now(); loop(); }
    }).observe(cv);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { last = performance.now(); loop(); } });
  loop();
}

// Export: browser global, or module for Node
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Arcade;
} else {
    window.Arcade = Arcade;
}
