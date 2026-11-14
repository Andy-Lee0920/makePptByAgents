/* ==========================================================================
   motion.js — 슬라이드 전환 · 빌드 애니메이션 (animator 소유)

   - app.js를 수정하지 않는다. .deck 안 .slide의 class 변화를 MutationObserver로
     관찰해 is-active가 붙는 순간을 입장, 떨어지는 순간을 퇴장으로 처리한다.
   - 애니메이션은 motion.css의 키프레임을 요소의 인라인 animation(fill-mode: backwards)
     으로 건다. 끝나면 theme.css 값으로 돌아가므로 최종 프레임 = 기존 레이아웃.
   - 퇴장 · 연속 넘김 · 인쇄 · 끄기(M) 시 즉시 정리: 인라인 스타일 제거, 카운트업 문자열 복원.
   - 끄기: ?motion=off 또는 localStorage motion=off. 단축키 M(KeyM)으로 토글.
   - 모션 감소(prefers-reduced-motion): 빌드 없이 슬라이드 200ms 페이드만.
   - 부록(references 타입 또는 kicker가 "부록/Appendix"로 시작하는 장과 그 뒤): 빌드 없음
     (theme.css의 기본 페이드 전환만).
   ========================================================================== */

const EASE = 'var(--motion-ease)';
const EASE_POINTS = [0.2, 0.7, 0.2, 1]; // --motion-ease와 같은 값 (카운트업 동기화)
const BUILD_BUDGET = 1500; // 한 장의 빌드 최대 시간(ms)
const STORAGE_KEY = 'motion';
const APPENDIX_KICKER = /^\s*(부록|appendix)/i;

const state = {
  deck: null,
  enabled: true,
  reduced: false,
  printing: false,
  current: null,
  currentIndex: -1,
  build: null,
};

/* ------------------------------------------------------------------ */
/* 설정                                                                */
/* ------------------------------------------------------------------ */

function readEnabled() {
  try {
    const param = new URLSearchParams(window.location.search).get('motion');
    if (param === 'off') return false;
    if (param === 'on') return true;
  } catch {
    /* 무시 */
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function saveEnabled(enabled) {
  try {
    if (enabled) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, 'off');
  } catch {
    /* 저장 불가(사파리 개인정보 모드 등) — 이번 세션만 적용 */
  }
}

/* ------------------------------------------------------------------ */
/* 이징 (CSS cubic-bezier와 같은 곡선으로 카운트업 진행률 계산)          */
/* ------------------------------------------------------------------ */

function cubicBezier([x1, y1, x2, y2]) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const err = sampleX(t) - x;
      const d = slopeX(t);
      if (Math.abs(err) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = Math.min(1, Math.max(0, t));
    for (let i = 0; i < 20 && Math.abs(sampleX(t) - x) > 1e-5; i += 1) {
      if (sampleX(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}

const easeMain = cubicBezier(EASE_POINTS);

/* ------------------------------------------------------------------ */
/* 카운트업: 표시 문자열의 접두 · 접미 · 소수점 · 쉼표 유지                  */
/* ------------------------------------------------------------------ */

// 직계 텍스트 노드 중 숫자를 가진 첫 노드 (.roc__auc의 CI span 등 하위 요소는 건드리지 않음)
function countTextNode(el) {
  return [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && /\d/.test(n.textContent)) ?? null;
}

function parseCount(text) {
  const numbers = text.match(/\d[\d,]*(?:\.\d+)?/g);
  if (!numbers || numbers.length !== 1) return null; // "28→40"처럼 숫자가 둘 이상이면 페이드만
  if (/\d{4}\s*[./-]\s*\d/.test(text)) return null; // "2026.8~" 같은 날짜
  const match = text.match(/^([\s\S]*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/);
  if (!match) return null;
  const [, prefix, raw, suffix] = match;
  const value = Number(raw.replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  if (decimals === 0 && value < 10) return null; // 0→1, 0→6처럼 몇 단계뿐인 정수는 카운트가 오히려 어색
  const grouping = raw.includes(',');
  const format = (v) =>
    v.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouping,
    });
  return { prefix, suffix, value, format };
}

/* ------------------------------------------------------------------ */
/* 빌드: 한 장의 애니메이션 묶음 (정리 가능)                               */
/* ------------------------------------------------------------------ */

class Build {
  constructor(slide) {
    this.slide = slide;
    this.touched = new Map(); // el -> Map(prop -> 원래 인라인 값)
    this.counters = []; // { node, text }
    this.frames = new Set();
    this.timers = new Set();
    this.end = 0;
    this.start = performance.now();
  }

  setStyle(el, prop, value) {
    let saved = this.touched.get(el);
    if (!saved) {
      saved = new Map();
      this.touched.set(el, saved);
    }
    if (!saved.has(prop)) saved.set(prop, el.style.getPropertyValue(prop));
    el.style.setProperty(prop, value);
  }

  /** 키프레임 name을 el에 건다. delay/dur은 ms. vars는 CSS 사용자 속성. */
  play(el, name, { delay = 0, dur = 450, ease = EASE, vars = null, ambient = false } = {}) {
    if (!el) return;
    if (vars) Object.entries(vars).forEach(([k, v]) => this.setStyle(el, k, v));
    const d = Math.max(0, Math.round(delay));
    this.setStyle(el, 'animation', `${name} ${Math.round(dur)}ms ${ease} ${d}ms 1 normal backwards`);
    if (!ambient) this.end = Math.max(this.end, d + dur);
  }

  playAll(list, name, opts) {
    list.forEach((el) => this.play(el, name, opts));
  }

  /** 0에서 최종 값까지 카운트업. 숫자로 읽을 수 없는 값은 아무것도 하지 않는다(페이드만). */
  count(el, { delay = 0, dur = 800 } = {}) {
    if (!el) return;
    const node = countTextNode(el);
    if (!node) return;
    const text = node.textContent;
    const spec = parseCount(text);
    if (!spec) return;
    this.counters.push({ node, text });
    const render = (p) => {
      node.textContent = `${spec.prefix}${spec.format(spec.value * p)}${spec.suffix}`;
    };
    render(0); // 첫 페인트 전에 0으로 (MutationObserver 콜백은 렌더 전에 실행)
    const begin = this.start + delay;
    const tick = (now) => {
      this.frames.delete(id);
      const x = (now - begin) / dur;
      if (x >= 1) {
        node.textContent = text;
        return;
      }
      render(easeMain(Math.max(0, x)));
      id = requestAnimationFrame(tick);
      this.frames.add(id);
    };
    let id = requestAnimationFrame(tick);
    this.frames.add(id);
    this.end = Math.max(this.end, delay + dur);
  }

  /** 끝난 뒤 인라인 스타일을 걷어 낸다(화면 변화 없음 — fill-mode backwards). */
  scheduleRelease(extra = 0) {
    const t = window.setTimeout(() => this.releaseStyles(), Math.max(this.end, extra) + 80);
    this.timers.add(t);
  }

  releaseStyles() {
    this.touched.forEach((saved, el) => {
      saved.forEach((value, prop) => {
        if (value) el.style.setProperty(prop, value);
        else el.style.removeProperty(prop);
      });
    });
    this.touched.clear();
  }

  /** 즉시 최종 상태로: 애니메이션 · 프레임 · 타이머 취소, 문자열 복원. */
  clear() {
    this.frames.forEach((id) => cancelAnimationFrame(id));
    this.frames.clear();
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers.clear();
    this.counters.forEach(({ node, text }) => {
      node.textContent = text;
    });
    this.counters = [];
    this.releaseStyles();
    delete this.slide.dataset.motion;
  }
}

/* ------------------------------------------------------------------ */
/* 공통 도우미                                                          */
/* ------------------------------------------------------------------ */

const $ = (root, sel) => root.querySelector(sel);
const $$ = (root, sel) => [...root.querySelectorAll(sel)];

// 캔버스(slide) 기준 좌표. offset 체인은 뷰어의 transform scale 영향을 받지 않는다.
function offsetIn(el, container) {
  let x = 0;
  let y = 0;
  let node = el;
  while (node && node !== container) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }
  if (node === container) return { x, y };
  const a = el.getBoundingClientRect();
  const b = container.getBoundingClientRect();
  const s = b.width / container.offsetWidth || 1;
  return { x: (a.left - b.left) / s, y: (a.top - b.top) / s };
}

function lineLength(line) {
  const n = (k) => Number(line.getAttribute(k)) || 0;
  return Math.hypot(n('x2') - n('x1'), n('y2') - n('y1'));
}

function pathLength(path) {
  try {
    return path.getTotalLength();
  } catch {
    return 0;
  }
}

/** 단계 표시줄 · kicker · 제목 · 부제 — 먼저 등장. 반환: 본문 시작 시각(ms) */
function header(b, s) {
  b.play($(s, '.stepbar'), 'm-fade', { dur: 300 });
  b.play($(s, '.slide__kicker'), 'm-rise', { dur: 450 });
  b.play($(s, '.slide__title'), 'm-rise', { delay: 60, dur: 450 });
  const sub = $(s, '.slide__subtitle');
  b.play(sub, 'm-rise', { delay: 140, dur: 450 });
  return sub ? 260 : 200;
}

function footer(b, s, at = 900) {
  b.play($(s, '.slide__source'), 'm-fade', { delay: at, dur: 400 });
}

/** 항목 순차 등장 (간격은 1.5초 예산 안으로 자동 축소) */
function stagger(b, list, { start, step = 100, dur = 450, name = 'm-rise', last = BUILD_BUDGET } = {}) {
  if (!list.length) return start;
  const room = Math.max(0, last - dur - start);
  const gap = list.length > 1 ? Math.min(step, room / (list.length - 1)) : 0;
  list.forEach((el, i) => b.play(el, name, { delay: start + i * gap, dur }));
  return start + (list.length - 1) * gap;
}

/* ------------------------------------------------------------------ */
/* 타입별 빌드                                                          */
/* ------------------------------------------------------------------ */

const builders = {
  /* 표지 (1, 4, 16) — 프레지식: 내부 콘텐츠 1.04 → 1 + 진행 방향으로 미세 패닝 */
  cover(b, s, ctx) {
    const pan = `${ctx.dir * 20}px`;
    const media = $(s, '.cover__media');
    if (media) {
      if (s.dataset.imageStyle === 'split') b.play(media, 'm-fade', { dur: 600 });
      else b.play(media, 'm-zoom-media', { dur: 700, vars: { '--m-pan': pan } });
    }
    const cx = s.offsetWidth / 2;
    const cy = s.offsetHeight / 2;
    const texts = [...s.children].filter(
      (el) => !el.matches('.cover__media, .slide__bg, .stepbar, .slide__credit, .slide__source'),
    );
    texts.forEach((el, i) => {
      const { x, y } = offsetIn(el, s);
      b.play(el, 'm-zoom', {
        delay: 60 + i * 100,
        dur: 650,
        vars: { '--m-pan': pan, '--m-origin': `${Math.round(cx - x)}px ${Math.round(cy - y)}px` },
      });
    });
    footer(b, s, 700);
  },

  /* band (2) — 사진 띠 페이드 + 켄번스, 수치 4개 순차 + 카운트업 */
  band(b, s) {
    const start = header(b, s);
    b.play($(s, '.band__media'), 'm-fade', { dur: 600 });
    b.play($(s, '.band__image'), 'm-kenburns', { dur: 6000, ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)', ambient: true });
    const items = $$(s, '.band__item');
    items.forEach((item, i) => {
      const delay = start + 40 + i * 110;
      b.play(item, 'm-rise', { delay, dur: 450 });
      b.count($(item, '.band__value'), { delay, dur: 750 });
    });
    $$(s, '.band__content > .slide__bullets > li, .band__content > .slide__body').forEach((el, i) =>
      b.play(el, 'm-rise', { delay: start + 40 + i * 100, dur: 450 }),
    );
    footer(b, s);
  },

  /* contrast (3) — 왼쪽 상자 → 오른쪽 상자, 오른쪽 수치 카운트업 */
  contrast(b, s) {
    header(b, s);
    const sides = $$(s, '.contrast__side');
    let t = 160;
    sides.forEach((side) => {
      b.play(side, 'm-fade', { delay: t - 60, dur: 400 });
      const parts = [
        $(side, '.contrast__label'),
        $(side, '.contrast__headline'),
        ...$$(side, '.contrast__line'),
        ...$$(side, '.contrast__stat'),
        $(side, '.contrast__media'),
      ].filter(Boolean);
      parts.forEach((el, i) => {
        const delay = t + i * 80;
        b.play(el, el.matches('.contrast__media') ? 'm-fade' : 'm-rise', { delay, dur: 450 });
        if (el.matches('.contrast__stat')) b.count($(el, '.contrast__stat-value'), { delay, dur: 650 });
      });
      t += Math.max(400, parts.length * 80);
    });
    footer(b, s, 1000);
  },

  /* iceberg (5) — 수면 위 라벨 → 수면 아래 연결선 그리기 + 점 팝 → 노드 순차 */
  iceberg(b, s) {
    const start = header(b, s);
    b.play($(s, '.iceberg__art'), 'm-fade', { delay: 80, dur: 500 });
    stagger(b, $$(s, '.iceberg__item'), { start: start + 40, step: 90, dur: 450 });

    const links = $$(s, '.iceberg__link');
    const ys = links.map((l) => Math.min(Number(l.getAttribute('y1')) || 0, Number(l.getAttribute('y2')) || 0));
    const yMin = Math.min(...ys);
    const ySpan = Math.max(1, Math.max(...ys) - yMin);
    links.forEach((line, i) => {
      const len = lineLength(line);
      if (!len) return;
      b.play(line, 'm-draw', {
        delay: 620 + ((ys[i] - yMin) / ySpan) * 300,
        dur: 380,
        vars: { '--m-len': `${len.toFixed(1)}px` },
      });
    });
    const dots = $$(s, '.iceberg__dot');
    const cys = dots.map((d) => Number(d.getAttribute('cy')) || 0);
    const cMin = Math.min(...cys);
    const cSpan = Math.max(1, Math.max(...cys) - cMin);
    dots.forEach((dot, i) => {
      b.play(dot, 'm-pop', { delay: 760 + ((cys[i] - cMin) / cSpan) * 360, dur: 260 });
    });
    stagger(b, $$(s, '.iceberg__node'), { start: 720, step: 80, dur: 420 });
    const foot = $(s, '.iceberg__footer');
    if (foot) b.play(foot, 'm-rise', { delay: 1050, dur: 420 });
    footer(b, s, 1000);
  },

  /* process (6) — 단계 왼쪽 → 오른쪽 / stairs (14) — 계단이 아래에서 차례로, 관문은 그 사이 */
  process(b, s) {
    const start = header(b, s);
    const list = $(s, '.slide__process');
    if (!list) return;
    if (s.dataset.layout === 'stairs') {
      let t = start;
      [...list.children].forEach((li) => {
        if (li.matches('.step__gate')) {
          b.play(li, 'm-wipe-x', { delay: t, dur: 320 });
          t += 120;
        } else {
          b.play(li, 'm-wipe-up', { delay: t, dur: 500 });
          b.play($(li, '.step__index'), 'm-fade', { delay: t + 180, dur: 320 });
          t += 250;
        }
      });
      footer(b, s, 1000);
      return;
    }
    stagger(b, [...list.children], { start: start + 20, step: 110, dur: 450 });
    footer(b, s);
  },

  /* data-panels (7, 8) — 패널 1 → (연결 배지) → 패널 2, 수치 카운트업, 그래프 이미지는 왼→오 닦아내기 */
  'data-panels'(b, s) {
    const start = header(b, s);
    const panels = $$(s, '.dpanel');
    panels.forEach((panel, p) => {
      const t0 = start + p * 360;
      b.play(panel, 'm-fade', { delay: t0 - 40, dur: 400 });
      const parts = [
        $(panel, '.dpanel__head'),
        ...$$(panel, '.dpanel__stat'),
        $(panel, '.dpanel__message'),
        $(panel, '.dpanel__chart-title'),
        $(panel, '.dpanel__figure'),
        $(panel, '.dpanel__fields'),
      ].filter(Boolean);
      parts.forEach((el, i) => {
        const delay = t0 + i * 65;
        if (el.matches('.dpanel__figure')) {
          b.play(el, 'm-wipe-x', { delay, dur: 600 });
        } else {
          b.play(el, 'm-rise-sm', { delay, dur: 400 });
        }
        if (el.matches('.dpanel__stat')) b.count($(el, '.dpanel__stat-value'), { delay, dur: 600 });
      });
    });
    const link = $(s, '.dpanel__link');
    if (link) {
      const delay = start + 330;
      b.play($(link, '.dpanel__link-badge'), 'm-pop', { delay, dur: 320 });
      b.count($(link, '.dpanel__link-value'), { delay, dur: 500 });
      b.play($(link, '.dpanel__link-note'), 'm-fade', { delay: delay + 120, dur: 300 });
    }
    footer(b, s, 1000);
  },

  /* chart (9) — 막대가 기준선에서 자람(강조 막대 마지막), 값은 막대 끝을 따라가며 카운트업,
     그다음 평균 기준선 · 라벨 pill · 메모 카드 */
  chart(b, s) {
    const start = header(b, s);
    const fig = $(s, '.slide__chart');
    if (!fig) return;
    const svg = $(fig, 'svg.chart');
    const kind = fig.dataset.kind || 'bar';
    b.play(fig, 'm-fade', { delay: start - 80, dur: 400 });
    b.playAll($$(fig, '.chart__axis'), 'm-fade', { delay: start, dur: 300 });
    stagger(b, $$(fig, '.chart__label'), { start: start + 40, step: 60, dur: 350, name: 'm-fade' });

    const bars = $$(fig, '.chart__bar');
    const values = $$(fig, '.chart__value');
    const order = [...bars.filter((r) => !r.classList.contains('chart__bar--highlight')),
      ...bars.filter((r) => r.classList.contains('chart__bar--highlight'))];
    const barDur = 750;
    const barStart = start + 130;
    const gap = order.length > 1 ? Math.min(130, 260 / (order.length - 1)) : 0;
    let barsEnd = barStart;
    order.forEach((bar, k) => {
      const delay = barStart + k * gap;
      barsEnd = Math.max(barsEnd, delay + barDur);
      b.play(bar, kind === 'hbar' ? 'm-grow-x' : 'm-grow-y', { delay, dur: barDur });
      const value = values[bars.indexOf(bar)];
      if (!value) return;
      const w = Number(bar.getAttribute('width')) || 0;
      const h = Number(bar.getAttribute('height')) || 0;
      const vars = kind === 'hbar' ? { '--m-dx': `${-w}px`, '--m-dy': '0px' } : { '--m-dx': '0px', '--m-dy': `${h}px` };
      b.play(value, 'm-ride', { delay, dur: barDur, vars });
      b.count(value, { delay, dur: barDur });
    });

    const lines = $$(fig, '.chart__line');
    lines.forEach((line) => {
      const len = pathLength(line);
      if (!len) return;
      b.play(line, 'm-draw', { delay: barStart, dur: 1000, vars: { '--m-len': `${len.toFixed(1)}px` } });
      barsEnd = Math.max(barsEnd, barStart + 1000);
    });
    if (lines.length) {
      const points = $$(fig, '.chart__point');
      stagger(b, points, { start: barsEnd - 150, step: 40, dur: 260, name: 'm-pop' });
      if (!bars.length) values.forEach((v) => b.play(v, 'm-fade', { delay: barsEnd - 150, dur: 300 }));
    }

    const after = Math.min(barsEnd - 120, BUILD_BUDGET - 400);
    b.playAll($$(fig, '.chart__baseline'), 'm-fade', { delay: after, dur: 300 });
    b.playAll($$(fig, '.chart__baseline-tag'), 'm-pop', { delay: after + 40, dur: 280 });
    b.play($(fig, '.chart__unit'), 'm-fade', { delay: after - 100, dur: 300 });
    b.play($(fig, '.slide__caption'), 'm-rise', { delay: after + 80, dur: 320 });
    if (svg && !bars.length && !lines.length) b.play(svg, 'm-fade', { delay: start, dur: 450 });
    footer(b, s, 900);
  },

  /* roc (10) — 보조 곡선 → 대표 곡선(마지막) 닦아내며 그리기, AUC 0.00 → 값 카운트업 */
  roc(b, s) {
    const start = header(b, s);
    const chart = $(s, '.roc__chart');
    if (chart) {
      b.playAll(
        $$(chart, '.roc__grid, .roc__frame, .roc__tick, .roc__axis, .roc__chance, .roc__chance-label'),
        'm-fade',
        { delay: start - 60, dur: 400 },
      );
      const curves = $$(chart, '.roc__curve');
      const rank = { dim: 0, alt: 1, lead: 2 };
      curves.sort((a, c) => (rank[a.dataset.style] ?? 1) - (rank[c.dataset.style] ?? 1));
      let leadAt = start + 80;
      curves.forEach((curve, i) => {
        const lead = curve.dataset.style === 'lead';
        const delay = start + 40 + i * 110;
        if (lead) leadAt = delay;
        b.play(curve, 'm-wipe-x', { delay, dur: lead ? 820 : 700, ease: 'cubic-bezier(0.45, 0.05, 0.35, 1)' });
      });
      b.play($(chart, '.roc__area'), 'm-wipe-x', { delay: leadAt, dur: 820, ease: 'cubic-bezier(0.45, 0.05, 0.35, 1)' });
      const after = leadAt + 700;
      b.playAll($$(chart, '.roc__lead'), 'm-fade', { delay: after, dur: 280 });
      b.playAll($$(chart, '.roc__marker'), 'm-pop', { delay: after, dur: 280 });
      b.playAll($$(chart, '.roc__note-heading, .roc__note'), 'm-fade', { delay: after + 60, dur: 300 });
    }
    const models = $$(s, '.roc__model');
    models.forEach((model, i) => {
      const delay = start + 40 + i * 100;
      b.play(model, 'm-rise', { delay, dur: 450 });
      b.count($(model, '.roc__auc'), { delay, dur: 850 });
    });
    stagger(b, $$(s, '.roc__takeaway'), { start: start + 560, step: 120, dur: 450 });
    footer(b, s, 1000);
  },

  /* tree (11) — 뿌리 → 가지 → 잎, 연결선은 왼쪽에서 오른쪽으로 쓸며 드러남 */
  tree(b, s) {
    const start = header(b, s);
    const tree = $(s, '.slide__tree');
    if (!tree) return;
    const width = tree.clientWidth || 1;
    const sweepAt = start + 160;
    const sweep = 900;
    b.play($(tree, '.tree__lines'), 'm-wipe-x', { delay: sweepAt, dur: sweep, ease: 'linear' });
    b.play($(tree, '.tree__root'), 'm-pop', { delay: start, dur: 420 });
    const atX = (el) => {
      const { x } = offsetIn(el, tree);
      return sweepAt + (Math.max(0, x) / width) * sweep - 70;
    };
    $$(tree, '.tree__node, .tree__leaf').forEach((el) => b.play(el, 'm-rise-sm', { delay: atX(el), dur: 380 }));
    $$(tree, '.tree__head:not([data-empty])').forEach((el) => b.play(el, 'm-rise-sm', { delay: atX(el) - 120, dur: 400 }));
    b.play($(s, '.slide__caption'), 'm-fade', { delay: 1150, dur: 320 });
    footer(b, s, 1100);
  },

  /* matrix (12) — 축 → 사분면(위험 카드는 마지막) → 결과 pill 팝 */
  matrix(b, s) {
    const start = header(b, s);
    b.playAll($$(s, '.matrix__axis'), 'm-fade', { delay: start, dur: 400 });
    b.play($(s, '.matrix__grid'), 'm-fade', { delay: start - 40, dur: 350 });
    const quads = $$(s, '.quadrant');
    const order = [...quads.filter((q) => q.dataset.tone !== 'danger'), ...quads.filter((q) => q.dataset.tone === 'danger')];
    order.forEach((q, i) => {
      const delay = start + 100 + i * 110 + (q.dataset.tone === 'danger' ? 90 : 0);
      b.play(q, 'm-rise', { delay, dur: 450 });
      $$(q, '.quadrant__items > li').forEach((li, k) => b.play(li, 'm-pop', { delay: delay + 300 + k * 60, dur: 260 }));
    });
    b.play($(s, '.slide__caption'), 'm-fade', { delay: 1150, dur: 320 });
    footer(b, s, 1050);
  },

  /* comparison (13) — 행 단위 위→아래, 권장(강조) 행은 마지막에 */
  comparison(b, s) {
    const start = header(b, s);
    const table = $(s, '.slide__table');
    if (!table) return;
    b.play($(table, 'thead'), 'm-fade', { delay: start, dur: 350 });
    const rows = $$(table, 'tbody > tr');
    const normal = rows.filter((r) => !r.classList.contains('is-highlight-row'));
    const lastAt = stagger(b, normal, { start: start + 90, step: 90, dur: 380, name: 'm-rise-sm' });
    rows
      .filter((r) => r.classList.contains('is-highlight-row'))
      .forEach((r, i) => b.play(r, 'm-rise', { delay: lastAt + 200 + i * 90, dur: 500 }));
    footer(b, s, 1000);
  },

  /* interview (15) — 사진 패널 → 인용 → 인터뷰이 → 인사이트 순차 → 시사점 */
  interview(b, s) {
    b.play($(s, '.interview__media'), 'm-fade', { dur: 600 });
    b.play($(s, '.interview__image'), 'm-kenburns', { dur: 6000, ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)', ambient: true });
    b.play($(s, '.stepbar'), 'm-fade', { dur: 300 });
    b.play($(s, '.slide__kicker'), 'm-rise', { delay: 80, dur: 450 });
    b.play($(s, '.slide__title'), 'm-rise', { delay: 140, dur: 450 });
    b.play($(s, '.interview__quote'), 'm-wipe-x', { delay: 300, dur: 600 });
    b.play($(s, '.interview__interviewee'), 'm-fade', { delay: 520, dur: 350 });
    stagger(b, $$(s, '.interview__insight'), { start: 640, step: 120, dur: 450 });
    b.play($(s, '.interview__implication'), 'm-rise', { delay: 920, dur: 450 });
    footer(b, s, 1050);
  },
};

/* 정의되지 않은 타입: 머리글 + 본문 블록 순차 (절제) */
function genericBuild(b, s) {
  const start = header(b, s);
  const items = $$(
    s,
    [
      '.slide__bullets > li',
      '.slide__stats > .stat',
      '.slide__cards > .card',
      '.slide__column',
      '.pillars__columns > .pillar',
      '.pillars__base',
      '.slide__equation > *',
      '.slide__bignumber > *',
      '.slide__quote',
      '.slide__quote-source',
      '.split__media',
      '.slide__figure',
    ].join(', '),
  );
  stagger(b, items, { start: start + 20, step: 100, dur: 450 });
  $$(s, '.stat__value, .bignumber__value, .card__value, .pillar__value').forEach((v) => {
    const host = items.find((it) => it.contains(v));
    const i = host ? items.indexOf(host) : 0;
    b.count(v, { delay: start + 20 + i * 100, dur: 750 });
  });
  footer(b, s);
}

/* ------------------------------------------------------------------ */
/* 입장 · 퇴장                                                          */
/* ------------------------------------------------------------------ */

function slidesOf(deck) {
  return [...deck.children].filter((el) => el.classList.contains('slide'));
}

function isAppendix(slides, index) {
  for (let i = 0; i <= index; i += 1) {
    const s = slides[i];
    if (!s) continue;
    if (s.dataset.type === 'references') return true;
    const kicker = s.querySelector('.slide__kicker')?.textContent ?? '';
    if (APPENDIX_KICKER.test(kicker)) return true;
  }
  return false;
}

function stopBuild() {
  if (state.build) state.build.clear();
  state.build = null;
}

function enter(slide, index, dir) {
  stopBuild();
  if (!state.enabled || state.printing || !slide) return;
  const b = new Build(slide);
  state.build = b;
  void slide.offsetWidth; // 같은 장 재입장 시 애니메이션이 다시 시작되도록 스타일 확정
  b.start = performance.now();

  if (state.reduced) {
    // 모션 감소: 빌드 없이 짧은 페이드만 (.slide에는 opacity만 — transform 불가침)
    b.play(slide, 'm-fade', { dur: 200, ease: 'ease-out' });
    b.scheduleRelease();
    return;
  }
  if (isAppendix(slidesOf(state.deck), index)) {
    state.build = null; // 부록: theme.css 기본 페이드 전환만
    return;
  }
  slide.dataset.motion = 'run';
  const build = builders[slide.dataset.type] ?? genericBuild;
  try {
    build(b, slide, { dir, index });
  } catch (error) {
    console.warn('[motion] 빌드 실패 — 최종 상태로 표시합니다.', error);
    b.clear();
    state.build = null;
    return;
  }
  if (b.end > BUILD_BUDGET + 60) console.warn(`[motion] 슬라이드 ${index + 1} 빌드 ${Math.round(b.end)}ms — 예산 ${BUILD_BUDGET}ms 초과`);
  b.scheduleRelease(6000 + 80); // 켄번스(6s)가 있으면 그 뒤에 정리
}

function sync() {
  if (!state.deck) return;
  const slides = slidesOf(state.deck);
  const active = slides.find((s) => s.classList.contains('is-active')) ?? null;
  if (active === state.current) return;
  const index = active ? slides.indexOf(active) : -1;
  const dir = state.currentIndex < 0 || index >= state.currentIndex ? 1 : -1;
  state.current = active;
  state.currentIndex = index;
  if (!active) {
    stopBuild();
    return;
  }
  enter(active, index, dir);
}

/* ------------------------------------------------------------------ */
/* 인쇄 · 토글 · 초기화                                                 */
/* ------------------------------------------------------------------ */

function onBeforePrint() {
  state.printing = true;
  stopBuild();
}

function onAfterPrint() {
  state.printing = false;
}

function isEditableTarget(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

function onKeyDown(event) {
  if (event.code !== 'KeyM' || event.repeat) return; // 한글 자판(ㅡ)에서도 동작하도록 code로 판별
  if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) return;
  state.enabled = !state.enabled;
  saveEnabled(state.enabled);
  console.info(`[motion] 애니메이션 ${state.enabled ? '켜짐' : '꺼짐'} (M 키로 전환)`);
  if (state.enabled) enter(state.current, state.currentIndex, 1);
  else stopBuild();
}

function init() {
  const deck = document.querySelector('.deck');
  if (!deck) return;
  state.deck = deck;
  state.enabled = readEnabled();

  const reducedQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  state.reduced = Boolean(reducedQuery?.matches);
  reducedQuery?.addEventListener?.('change', (e) => {
    state.reduced = e.matches;
    if (e.matches) stopBuild();
  });

  const printQuery = window.matchMedia?.('print');
  printQuery?.addEventListener?.('change', (e) => (e.matches ? onBeforePrint() : onAfterPrint()));
  window.addEventListener('beforeprint', onBeforePrint);
  window.addEventListener('afterprint', onAfterPrint);
  window.addEventListener('keydown', onKeyDown);

  // 슬라이드는 비동기로 렌더되므로 자식 추가와 class 변화를 함께 관찰한다.
  // MutationObserver 콜백은 렌더 전에 실행되어 첫 프레임부터 시작 상태가 적용된다.
  new MutationObserver(sync).observe(deck, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });
  sync(); // 이미 렌더된 뒤 로드된 경우(해시로 바로 들어온 첫 장 포함)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
