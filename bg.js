/*
 * トップ (最初の画面) の背景アニメーション。
 * 右側の空きに、各アプリのモチーフ (apps.js の motif) を、そのアプリの色 (color.bg) のベタで 1 つずつ出す。
 * 数秒ごとに次のアプリへ形がとろけるように変わり、色は左下から円で流れ込む
 * (下の舞台の「色が広がる」演出と同じ語彙)。
 */
(() => {
  "use strict";
  const canvas = document.getElementById("topo");
  if (!canvas) return;
  const APPS = (window.APPS || []).filter((a) => a.color);
  if (!APPS.length) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");

  /* ---------- 形: 距離関数 (SDF)。y は上向き、だいたい半径 1 に収まる大きさ ---------- */
  const len = Math.hypot;
  const circle = (x, y, cx, cy, r) => len(x - cx, y - cy) - r;
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const box = (x, y, cx, cy, hx, hy) => { const qx = Math.abs(x - cx) - hx, qy = Math.abs(y - cy) - hy; return len(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0); };
  const MOTIFS = {
    circle: (x, y) => circle(x, y, 0, 0, 1),
    // 木: 丸い茂みと幹
    tree: (x, y) => {
      let d = circle(x, y, 0, 0.35, 0.68);
      d = smin(d, circle(x, y, -0.55, 0.0, 0.5), 0.25);
      d = smin(d, circle(x, y, 0.55, 0.0, 0.5), 0.25);
      d = smin(d, circle(x, y, 0, -0.1, 0.55), 0.25);
      return smin(d, box(x, y, 0, -0.8, 0.12, 0.4), 0.12);
    },
    // 三日月
    moon: (x, y) => Math.max(circle(x, y, 0, 0, 1), -circle(x, y, 0.5, 0.32, 0.82)),
    // 山 (頂が平たい富士の形)
    mountain: (x, y) => {
      const yy = y + 0.1;
      const he = 0.62, r1 = 1.15, r2 = 0.22; // 下の半幅, 上の半幅
      const px = Math.abs(x);
      const k1x = r2, k1y = he, k2x = r2 - r1, k2y = 2 * he;
      const cax = px - Math.min(px, yy < 0 ? r1 : r2), cay = Math.abs(yy) - he;
      const t = Math.min(1, Math.max(0, ((k1x - px) * k2x + (k1y - yy) * k2y) / (k2x * k2x + k2y * k2y)));
      const cbx = px - k1x + k2x * t, cby = yy - k1y + k2y * t;
      const s = cbx < 0 && cay < 0 ? -1 : 1;
      return s * Math.sqrt(Math.min(cax * cax + cay * cay, cbx * cbx + cby * cby)) - 0.04;
    },
    // レコード盤 (真ん中に穴)
    record: (x, y) => Math.abs(len(x, y) - 0.6) - 0.4,
    // 肉球
    paw: (x, y) => {
      const pad = len(x / 1.15, (y + 0.38) / 0.9) * 0.9 - 0.5;
      let toes = circle(x, y, -0.78, 0.22, 0.24);
      toes = Math.min(toes, circle(x, y, -0.3, 0.62, 0.26));
      toes = Math.min(toes, circle(x, y, 0.3, 0.62, 0.26));
      toes = Math.min(toes, circle(x, y, 0.78, 0.22, 0.24));
      return Math.min(pad, toes);
    },
  };

  // 大きく見えすぎる形を縮める
  const scaled = (f, s) => (x, y) => f(x / s, y / s) * s;
  MOTIFS.tree = scaled(MOTIFS.tree, 0.78);
  MOTIFS.mountain = scaled(MOTIFS.mountain, 0.85);

  /* ---------- 形を格子の距離場にしておく (重心を中心へ寄せる) ---------- */
  const G = 448, D = 1.5; // 格子の数, 格子が覆う範囲 (-D..D)
  const field = (f) => {
    const out = new Float32Array(G * G);
    let sx = 0, sy = 0, c = 0;
    for (let j = 0; j < G; j += 4) for (let i = 0; i < G; i += 4) {
      const x = (i / G) * 2 * D - D, y = D - (j / G) * 2 * D;
      if (f(x, y) < 0) { sx += x; sy += y; c++; }
    }
    const ox = c ? sx / c : 0, oy = c ? sy / c : 0;
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      out[j * G + i] = f((i / G) * 2 * D - D + ox, D - (j / G) * 2 * D + oy);
    }
    return out;
  };
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const items = APPS.map((a) => ({ f: field(MOTIFS[a.motif] || MOTIFS.circle), rgb: hex(a.color.bg) }));

  const off = document.createElement("canvas");
  off.width = off.height = G;
  const og = off.getContext("2d");
  const img = og.createImageData(G, G);
  const px = img.data;
  const AA = (G / (2 * D)) * 0.9; // 距離 → 格子 1 マス
  // a → b へ m だけ寄せた形を、色 ca / cb (左下から半径 flood の円の中だけ cb) で塗る
  const paint = (a, b, m, ca, cb, flood) => {
    const fx = G * 0.2, fy = G * 0.8, f2 = flood * flood;
    for (let j = 0, p = 0; j < G; j++) {
      for (let i = 0; i < G; i++, p++) {
        const d = a[p] + (b[p] - a[p]) * m;
        const al = Math.min(1, Math.max(0, 0.5 - d * AA));
        const q = p * 4;
        if (al <= 0) { px[q + 3] = 0; continue; }
        const dx = i - fx, dy = j - fy;
        const c = dx * dx + dy * dy < f2 ? cb : ca;
        px[q] = c[0]; px[q + 1] = c[1]; px[q + 2] = c[2]; px[q + 3] = al * 255;
      }
    }
    og.putImageData(img, 0, 0);
  };

  /* ---------- 時間 ---------- */
  let W = 0, H = 0;
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  // スマホは空きが「Apps & Games」の右しかないので、そこに小さく置く
  const lead = document.querySelector(".intro-lead");
  const place = () => {
    if (W >= 760 || !lead) return { cx: W * 0.77, cy: H * 0.55, S: Math.min(H * 0.3, W * 0.17) };
    const r = lead.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    return { cx: W * 0.8, cy: r.top - c.top + r.height / 2, S: W * 0.06 };
  };

  const clamp = (v) => Math.min(1, Math.max(0, v));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeBack = (t) => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const HOLD = 2800, TRANS = 1100, CYCLE = HOLD + TRANS;
  let painted = "";

  const draw = (t) => {
    const n = Math.floor(t / CYCLE), ph = t % CYCLE;
    const k = clamp((ph - HOLD) / TRANS); // 0 = 止まっている, 1 = 次へ移り終わった
    const A = items[n % items.length], B = items[(n + 1) % items.length];
    const key = k > 0 ? `${n}:${k}` : `${n}`;
    if (key !== painted) { // 止まっている間は描き直さない
      paint(A.f, B.f, k > 0 ? easeBack(k) : 0, A.rgb, B.rgb, k > 0 ? easeInOut(k) * G * 1.1 : 0);
      painted = key;
    }
    const { cx, cy, S } = place();
    const size = S * 2 * D * (1 + Math.sin(k * Math.PI) * 0.08); // 移る途中で少しふくらむ
    const tilt = Math.sin(t * 0.0009) * 0.06 + Math.sin(k * Math.PI) * 0.12;
    const bob = Math.sin(t * 0.0013) * S * 0.04;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.rotate(tilt);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(off, -size / 2, -size / 2, size, size);
    ctx.restore();
  };

  resize();
  addEventListener("resize", () => { resize(); if (reduced) draw(0); });
  if (reduced) { draw(0); return; }
  const t0 = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (scrollY > H || document.hidden) return; // 見えている間だけ
    draw(Math.max(0, now - t0));
  };
  requestAnimationFrame(loop);
})();
