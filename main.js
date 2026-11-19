(() => {
  "use strict";

  const SECTIONS = window.SECTIONS || [];
  const APPS = window.APPS || [];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const range = (v, a, b) => clamp((v - a) / (b - a));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const external = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2h8v8M12 2 2 12" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  const icon = (a, alt = "") => `<img class="icon ${a.iconShape === "free" ? "free" : "ios"}" src="${esc(a.icon)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  const isFile = (v) => /\.(mp4|webm|mov)(\?|$)/i.test(v || "");
  const meta = (a) => {
    const items = [a.store, a.genre, a.year && `${a.year} 年から`].filter(Boolean);
    return items.length ? `<ul class="meta">${items.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : "";
  };
  const cta = (a) => `<a class="cta" href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.store || "ストア")}で見る${external}</a>`;

  // スクショの横並び。タップで拡大
  const shots = (a) => (a.shots && a.shots.length
    ? `<ul class="shots${a.mediaShape === "wide" || a.platform !== "ios" ? " wide" : ""}" aria-label="${esc(a.name)} の画面">${a.shots.map((s, i) =>
      `<li><button type="button" data-shot="${esc(s)}" aria-label="${esc(a.name)} の画面 ${i + 1} を拡大"><img src="${esc(s)}" alt="" loading="lazy" decoding="async"></button></li>`).join("")}</ul>`
    : "");

  /* ---------- signature ---------- */
  const SIGN = window.SIGNATURE;
  const drawSign = (svg) => {
    if (!svg || !SIGN) return;
    svg.setAttribute("viewBox", SIGN.viewBox);
    svg.innerHTML = `<g transform="${SIGN.transform}"><path class="glyphs" pathLength="1" vector-effect="non-scaling-stroke" d="${SIGN.d}"/></g>`;
  };
  const barMark = document.getElementById("barMark");
  const footSign = document.getElementById("footSign");
  drawSign(footSign);
  new IntersectionObserver((ens, ob) => {
    if (ens.some((e) => e.isIntersecting)) { footSign.classList.add("is-drawn"); ob.disconnect(); }
  }, { threshold: 0.6 }).observe(footSign);

  /* ---------- wordmark ---------- */
  const mark = document.getElementById("wordmark");
  let zi = 0;
  const chars = [...mark.textContent].map((ch, i) => {
    const z = ch === "z";
    return `<span class="ch${z ? " z" : ""}" style="--i:${i};--j:${z ? zi++ : 0}" aria-hidden="true"><span>${z ? `<span>${esc(ch)}</span>` : esc(ch)}</span></span>`;
  });
  mark.innerHTML = chars.join("");
  const letters = [...mark.querySelectorAll(".ch")];
  const W_BASE = 380, W_MAX = 900;
  const weight = letters.map(() => W_BASE);
  const goal = letters.map(() => W_BASE);
  let pointer = null;
  let waveAt = performance.now() + 1100; // 登場のあと太さの波を走らせ、その後も数秒おきに繰り返す
  requestAnimationFrame(() => requestAnimationFrame(() => mark.classList.add("is-in")));

  if (!reduced) {
    mark.addEventListener("pointerdown", () => (waveAt = performance.now()));
    addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
    document.addEventListener("pointerleave", () => (pointer = null));
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (now - waveAt > 7000) waveAt = now;
      const wave = (now - waveAt) / 1100; // 0→1 で左から右へ
      const waving = wave > -0.2 && wave < 1.4;
      const settled = weight.every((w, i) => Math.abs(w - goal[i]) < 0.5);
      // 名前が画面外、または動きが無いときは何もしない
      if (scrollY > vh * 0.45 || (!pointer && !waving && settled)) return;
      const rects = pointer ? letters.map((l) => l.getBoundingClientRect()) : null;
      letters.forEach((l, i) => {
        let g = W_BASE;
        if (rects) { // カーソルに近い文字ほど太く
          const r = rects[i];
          const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
          g = W_BASE + (W_MAX - W_BASE) * Math.max(0, 1 - d / Math.max(r.height * 1.3, 160));
        }
        if (waving) {
          const k = Math.max(0, 1 - Math.abs(wave * (letters.length + 2) - 1 - i) / 1.6);
          g = Math.max(g, W_BASE + (W_MAX - W_BASE) * k);
        }
        goal[i] = g;
        weight[i] += (goal[i] - weight[i]) * 0.14;
        l.style.fontWeight = Math.round(weight[i]);
      });
    };
    requestAnimationFrame(tick);
  }

  const groups = SECTIONS.map((s) => ({ ...s, apps: APPS.filter((a) => a.platform === s.id) })).filter((g) => g.apps.length);

  /* ---------- intro ---------- */
  const shelf = document.getElementById("shelf");
  APPS.forEach((a, i) => {
    const r = ((i * 37) % 11) - 5;
    shelf.append(el(`<li style="--i:${i}"><a href="#app-${i}" style="--r:${r}deg" aria-label="${esc(a.name)}">${icon(a)}</a></li>`));
  });
  document.getElementById("index").innerHTML = groups
    .map((g) => `<a href="#${esc(g.id)}">${esc(g.label)}<small>${g.apps.length}</small></a>`)
    .join("");
  document.getElementById("nav").innerHTML = groups.map((g) => `<a href="#${esc(g.id)}">${esc(g.label)}</a>`).join("");

  /* ---------- platforms ---------- */
  const root = document.getElementById("platforms");
  const stages = [];

  groups.forEach((g) => {
    const sec = el(`
      <section class="platform" id="${esc(g.id)}" aria-label="${esc(g.title)}">
        <div class="stage-wrap">
          <div class="stage">
            <p class="word" aria-hidden="true">${esc(g.label)}</p>
            <div class="flood">
              <p class="word" aria-hidden="true">${esc(g.label)}</p>
              <p class="sweep" aria-hidden="true"></p>
              <div class="hero-copy"></div>
            </div>
            <div class="hero-icon"></div>
            ${g.apps.length > 1 ? `<div class="cast" aria-hidden="true"><ol>${g.apps.map((a) => `<li>${icon(a)}</li>`).join("")}</ol></div>` : ""}
          </div>
        </div>
        <div class="list">
          <div class="list-head"><h2>${esc(g.title)}</h2><span>${g.apps.length} 本</span></div>
        </div>
      </section>`);
    root.append(sec);

    const list = sec.querySelector(".list");
    g.apps.forEach((a) => {
      const n = APPS.indexOf(a);
      let media = "";
      const shape = (a.mediaShape || (isFile(a.video) ? "tall" : "wide")) === "wide" ? " wide" : "";
      if (isFile(a.video)) {
        media = `<figure class="media${shape}"><video src="${esc(a.video)}" ${a.poster ? `poster="${esc(a.poster)}"` : ""} muted loop playsinline preload="none" aria-label="${esc(a.name)} の動画"></video><figcaption>タップで一時停止</figcaption></figure>`;
      } else if (a.video) {
        media = `<figure class="media${shape}">${a.poster ? `<img class="shot" src="${esc(a.poster)}" alt="" loading="lazy">` : ""}<figcaption><a href="${esc(a.video)}" target="_blank" rel="noopener">動画を見る</a></figcaption></figure>`;
      } else if (a.poster) {
        media = `<figure class="media${shape}"><img class="shot" src="${esc(a.poster)}" alt="${esc(a.name)} の画面" loading="lazy"></figure>`;
      }
      list.append(el(`
        <article class="row" id="app-${n}">
          <a class="row-icon" href="${esc(a.url)}" target="_blank" rel="noopener" tabindex="-1">${icon(a, a.name)}</a>
          <div>
            <h3><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.name)}</a></h3>
            ${a.sub ? `<p class="hero-sub">${esc(a.sub)}</p>` : ""}
            <p class="hero-desc">${esc(a.desc)}</p>
            ${meta(a)}
            <div class="row-links">${cta(a)}${a.support ? `<a class="support" href="${esc(a.support)}" target="_blank" rel="noopener">サポート</a>` : ""}</div>
            ${shots(a)}
          </div>
          ${media}
        </article>`));
    });

    const st = {
      g,
      sec,
      wrap: sec.querySelector(".stage-wrap"),
      flood: sec.querySelector(".flood"),
      words: sec.querySelectorAll(".word"),
      sweep: sec.querySelector(".sweep"),
      iconBox: sec.querySelector(".hero-icon"),
      copy: sec.querySelector(".hero-copy"),
      cast: sec.querySelectorAll(".cast li"),
      idx: 0,
      seen: false,
      armed: false,
    };
    stages.push(st);
    setHero(st, (Math.random() * g.apps.length) | 0);
  });

  function setHero(st, i) {
    const a = st.g.apps[i];
    st.idx = i;
    const c = a.color || {};
    st.flood.style.setProperty("--bg", c.bg || "#15181c");
    st.flood.style.setProperty("--fg", c.ink || "#ffffff");
    st.flood.style.setProperty("--pop", c.pop || c.ink || "#ffffff");
    st.sweep.textContent = a.latin || a.name;
    st.iconBox.innerHTML = icon(a, "");
    st.copy.innerHTML = `
      <h3>${esc(a.name)}</h3>
      ${a.sub ? `<p class="hero-sub">${esc(a.sub)}</p>` : ""}
      <p class="hero-desc">${esc(a.desc)}</p>
      ${meta(a)}
      ${cta(a)}`;
    st.cast.forEach((li, k) => li.classList.toggle("is-on", k === i));
  }

  /* ---------- scroll choreography ---------- */
  let vw = innerWidth, vh = innerHeight;
  const bar = document.querySelector(".bar");

  function frame() {
    for (const st of stages) {
      const r = st.wrap.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < vh;

      // 画面から完全に外れたら次の出番を予約し、戻ってきたときに主役を入れ替える
      if (!visible) { st.armed = st.seen && st.g.apps.length > 1; continue; }
      st.seen = true;
      if (st.armed) {
        st.armed = false;
        // 入るたびに主役をランダムに選ぶ (直前と同じアプリは避ける)
        const n = st.g.apps.length;
        setHero(st, (st.idx + 1 + ((Math.random() * (n - 1)) | 0)) % n);
      }

      // p: ステージが画面に固定されている間 0→1。入ってくる途中は負
      const p = reduced ? 0.7 : -r.top / Math.max(1, r.height - vh);

      const f = easeInOut(range(p, -0.28, 0.2));
      st.flood.style.clipPath = reduced ? "none" : `circle(${(f * 150).toFixed(2)}% at 78% 50%)`;

      const wx = (0.35 - range(p, -0.6, 1.05) * 1.1) * vw;
      st.words.forEach((w) => (w.style.transform = `translate3d(${wx.toFixed(1)}px,0,0)`));

      const e = easeOut(range(p, 0.02, 0.36));
      const ix = (1 - e) * vw * 1.05;
      const rot = (1 - e) * 38;
      const sc = 1 + (1 - e) * 0.55;
      const lift = Math.sin(range(p, 0.36, 1) * Math.PI) * -10;
      st.iconBox.style.transform = `translate3d(${ix.toFixed(1)}px,${lift.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;

      const s = range(p, 0.04, 0.66);
      const sw = st.sweep.offsetWidth;
      const sx = vw - s * (vw + sw);
      st.sweep.style.transform = `translate3d(${sx.toFixed(1)}px,-55%,0)`;
      st.sweep.style.visibility = s <= 0 || s >= 1 ? "hidden" : "visible";

      const o = reduced ? 1 : range(p, 0.5, 0.66);
      st.copy.style.opacity = o.toFixed(3);
      st.copy.style.translate = `0 ${((1 - o) * 24).toFixed(1)}px`;
      st.copy.style.pointerEvents = o > 0.5 ? "auto" : "none";
    }

    // ヘッダーの色: 色の付いたステージが上端を覆っている間はその文字色に
    let barColor = "";
    for (const st of stages) {
      const r = st.wrap.getBoundingClientRect();
      if (r.top <= 40 && r.bottom > 40 && (reduced || -r.top / Math.max(1, r.height - vh) > 0.12)) barColor = st.flood.style.getPropertyValue("--fg");
    }
    bar.style.color = barColor;

    // 大きな名前をスクロールに合わせて縮め、左上のサインに吸い込ませる
    if (!reduced) {
      const t = easeInOut(clamp(scrollY / (vh * 0.42)));
      const target = barMark.getBoundingClientRect();
      const base = mark.offsetTop; // 文書上の位置 (transform の影響を受けない)
      const sx = mark.offsetLeft;
      const h = mark.offsetHeight;
      const s = 1 + (target.height / h - 1) * t;
      const x = (target.left - sx) * t;
      const y = (target.top - base) * t + scrollY;
      mark.style.transform = t > 0 ? `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})` : "";
      mark.style.opacity = (1 - range(t, 0.86, 1)).toFixed(3);
      bar.classList.toggle("is-signed", t >= 0.9);
    } else {
      bar.classList.toggle("is-signed", scrollY > vh * 0.5);
    }

    bar.classList.toggle("is-plain", !barColor && scrollY > vh * 0.4);

    // ヘッダーの現在地
    const mid = vh * 0.5;
    document.querySelectorAll(".bar-nav a").forEach((a) => {
      const s = document.getElementById(a.getAttribute("href").slice(1));
      const r = s.getBoundingClientRect();
      a.classList.toggle("is-on", r.top < mid && r.bottom > mid);
    });
  }

  let ticking = false;
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; frame(); }); } };
  addEventListener("scroll", request, { passive: true });
  addEventListener("resize", () => { vw = innerWidth; vh = innerHeight; request(); });
  frame();
  document.fonts && document.fonts.ready.then(request);

  /* ---------- スクショの拡大 ---------- */
  const lb = document.getElementById("lightbox");
  if (lb) {
    const img = lb.querySelector("img");
    let list = [], at = 0;
    const show = (k) => { at = (k + list.length) % list.length; img.src = list[at]; };
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-shot]");
      if (!b) return;
      list = [...b.closest(".shots").querySelectorAll("[data-shot]")].map((x) => x.dataset.shot);
      lb.classList.toggle("wide", b.closest(".shots").classList.contains("wide"));
      show(list.indexOf(b.dataset.shot));
      lb.showModal();
    });
    lb.querySelector(".lb-prev").addEventListener("click", () => show(at - 1));
    lb.querySelector(".lb-next").addEventListener("click", () => show(at + 1));
    lb.querySelector(".lb-close").addEventListener("click", () => lb.close());
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(at - 1);
      if (e.key === "ArrowRight") show(at + 1);
    });
  }

  /* ---------- videos: 見えている間だけ再生 ---------- */
  const vids = document.querySelectorAll(".media video");
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const v = en.target;
      if (en.isIntersecting && !v.dataset.paused && !reduced) v.play().catch(() => {});
      else v.pause();
    }
  }, { threshold: 0.4 });
  vids.forEach((v) => {
    io.observe(v);
    v.addEventListener("click", () => {
      if (v.paused) { delete v.dataset.paused; v.play().catch(() => {}); }
      else { v.dataset.paused = "1"; v.pause(); }
    });
  });
})();
