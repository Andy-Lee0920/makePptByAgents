// 슬라이드 뷰어: data/slides.json → DOM 렌더링, 16:9 스케일링, 내비게이션
// ES 모듈로 로드되므로 전역 스코프를 오염시키지 않는다.

const DATA_URL = 'data/slides.json';
const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;
const SWIPE_THRESHOLD = 50;
const THEMES = ['light', 'dark', 'accent'];
const FALLBACK_TYPE = 'bullets';

const REQUIRED_FIELDS = {
  cover: ['title'],
  section: ['title'],
  bullets: ['title', 'bullets'],
  'two-column': ['title', 'left', 'right'],
  image: ['src', 'alt'],
  stats: ['title', 'items'],
  quote: ['quote'],
  closing: ['title'],
  references: ['title', 'category', 'items'],
  'big-number': ['value', 'label'],
  process: ['title', 'steps'],
  chart: ['title', 'chart'],
  comparison: ['title', 'columns', 'rows'],
  split: ['title'],
  matrix: ['title', 'axes', 'quadrants'],
  cards: ['title', 'cards'],
  band: ['title', 'image'],
  tree: ['title', 'root', 'levels', 'branches'],
  equation: ['title', 'terms', 'result'],
  pillars: ['title', 'pillars', 'base'],
  roc: ['title', 'axes', 'curves'],
  'data-panels': ['title', 'panels'],
  iceberg: ['title', 'above', 'below'],
  interview: ['title', 'image', 'quote', 'interviewee'],
  contrast: ['title', 'left', 'right'],
};

const SUPPORTED_VERSIONS = ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '1.10', '1.11', '1.12', '1.13', '1.14', '1.15', '1.16'];

// iceberg (v1.12): 좌표는 slide-schema.md 3.22 (캔버스 1920×1080 = SVG viewBox)
const ICEBERG_ABOVE_RANGE = { min: 2, max: 4 };
const ICEBERG_BELOW_RANGE = { min: 3, max: 5 };
const ICEBERG_FLOW_RANGE = { min: 2, max: 5 };
const ICEBERG_TONES = ['default', 'accent'];
const ICEBERG_LIMITS = {
  subtitle: 60, message: 40, flowStep: 16,
  above: [['heading', 12], ['text', 26], ['example', 30]],
  below: [['heading', 20], ['text', 24]],
};
// above 개수별 실제 위치 번호(data-slot). 0 왼쪽 수면 위 · 1 몸체 위 왼쪽 · 2 큰 봉우리 위 · 3 오른쪽 수면 위
const ICEBERG_ABOVE_SLOTS = { 1: [0], 2: [0, 3], 3: [0, 2, 3], 4: [0, 1, 2, 3] };
const ICEBERG_ART = {
  viewBox: '0 0 1920 1080',
  waterY: 500,
  // 수면 위 원호(레퍼런스의 부드러운 곡선). 가운데에서 수면선(y 500)에 닿는다.
  arc: 'M0,440 Q960,560 1920,440',
  // 수면 위 면: [data-shade, 꼭짓점…]. 외곽 (470,500)→(650,445)→(900,360)→(1010,390)→(1180,290)→(1330,370)→(1440,440)→(1520,500)
  above: [
    [3, [470, 500], [650, 445], [720, 500]],
    [1, [650, 445], [900, 360], [860, 440]],
    [2, [650, 445], [860, 440], [720, 500]],
    [2, [900, 360], [1010, 390], [860, 440]],
    [3, [860, 440], [1010, 390], [1100, 420], [980, 500], [720, 500]],
    [1, [1010, 390], [1180, 290], [1100, 420]],
    [4, [1180, 290], [1330, 370], [1300, 450], [1100, 420]],
    [3, [1100, 420], [1300, 450], [1240, 500], [980, 500]],
    [5, [1330, 370], [1440, 440], [1300, 450]],
    [4, [1300, 450], [1440, 440], [1400, 500], [1240, 500]],
    [5, [1440, 440], [1520, 500], [1400, 500]],
  ],
  // 수면 아래 면. 외곽 (470,500)→(620,650)→(830,820)→(960,860)→(1130,800)→(1360,660)→(1520,500)
  below: [
    [2, [470, 500], [720, 500], [760, 600]],
    [3, [470, 500], [760, 600], [620, 650]],
    [1, [720, 500], [980, 500], [1060, 610], [760, 600]],
    [4, [620, 650], [760, 600], [900, 720], [830, 820]],
    [2, [760, 600], [1060, 610], [900, 720]],
    [3, [980, 500], [1240, 500], [1330, 580], [1060, 610]],
    [3, [1060, 610], [1150, 710], [900, 720]],
    [5, [900, 720], [1150, 710], [1130, 800], [960, 860], [830, 820]],
    [4, [1060, 610], [1330, 580], [1150, 710]],
    [5, [1330, 580], [1360, 660], [1130, 800], [1150, 710]],
    [2, [1240, 500], [1400, 500], [1330, 580]],
    [4, [1400, 500], [1520, 500], [1360, 660], [1330, 580]],
  ],
  // below 노드 중심(data-pos 순서)
  nodes: [[960, 570], [720, 650], [1240, 640], [1210, 745], [960, 790]],
  // 네트워크 장식 점(수면 아래 몸체 안)
  points: [
    [600, 545], [830, 560], [1110, 545], [1390, 560], [650, 575], [860, 705],
    [1080, 690], [1330, 620], [1040, 800], [820, 780], [1200, 560],
  ],
  // 연결선: n# = 노드(있을 때만), p# = 장식 점
  links: [
    ['n0', 'n1'], ['n0', 'n2'], ['n0', 'n3'], ['n1', 'n2'], ['n1', 'n3'], ['n1', 'n4'], ['n2', 'n3'], ['n3', 'n4'],
    ['p0', 'p1'], ['p1', 'n0'], ['p1', 'n1'], ['n0', 'p2'], ['p2', 'p10'], ['p10', 'n2'], ['p10', 'p3'],
    ['p3', 'n2'], ['p3', 'p7'], ['p7', 'n2'], ['p7', 'n3'], ['p4', 'n1'], ['p4', 'p0'], ['n1', 'p5'],
    ['p5', 'n4'], ['p5', 'p9'], ['p9', 'n4'], ['p6', 'n0'], ['p6', 'n3'], ['p6', 'p5'], ['p8', 'n4'],
    ['p8', 'n3'], ['p6', 'p8'],
  ],
  // 선 없이 흩뿌리는 작은 점
  scatter: [[530, 525], [1470, 530], [905, 835], [1280, 680], [700, 700], [1180, 520]],
  dotRadius: { s: 3, m: 6 },
  // 바다 그라데이션 정지점(색은 CSS stop-color가 지정)
  seaStops: [['top', 0], ['middle', 0.5], ['bottom', 1]],
};
const ICEBERG_FLOW_ARROW = '→';

// data-panels (v1.9): 좌우 데이터 패널 2개 + 선택적 연결 배지
const DPANEL_COUNT = 2;
const DPANEL_TONES = ['primary', 'secondary']; // 패널 순서대로 기본값
const DPANEL_STATS_RANGE = { min: 0, max: 3 };
const DPANEL_LIMITS = { statValue: 8, statLabel: 16, message: 40, chartTitle: 24, fieldsLabel: 8, fieldsText: 80 };
const DPANEL_LINK_LIMITS = { value: 6, label: 10, note: 30 };
const DPANEL_IMAGE_PATTERN = /^assets\/images\//;

// interview (v1.13): 왼쪽 사진 + 오른쪽 본문. 3.23 · 4절 · 6절
const INTERVIEW_INSIGHTS_RANGE = { min: 0, max: 2 };
const INTERVIEW_LIMITS = {
  title: 40, quote: 90, interviewee: 30, implication: 60,
  insight: [['heading', 16], ['text', 50]],
};
const INTERVIEW_IMAGE_PATTERN = /^assets\/images\//;

// contrast (v1.14): 왼쪽 '떠나는 것' vs 오른쪽 '남는 것'. 3.24 · 4절 · 6절
const CONTRAST_SIDES = ['left', 'right']; // DOM 순서 = data-side 값
const CONTRAST_MAX_LINES = 3;
const CONTRAST_MAX_STATS = 3;
const CONTRAST_HEADLINE_MAX_LINES = 2;
const CONTRAST_MAX_IMAGES = 2; // v1.16: image 배열 최대 길이
const CONTRAST_FITS = ['cover', 'contain']; // v1.16: 첫 값이 기본
const CONTRAST_LIMITS = {
  side: [['label', 10], ['headline', 16]],
  line: 30,
  stat: [['value', 8], ['label', 16]],
};

// roc (v1.8): references/roc_slide_9pg.html 좌표계 그대로
const ROC = {
  viewBox: '0 0 760 730',
  plot: { left: 110, right: 710, top: 40, bottom: 640, size: 600 },
  chanceLabel: { at: 0.8, dy: 27, angle: -45 }, // (590, 187)
  ticks: { xLabelY: 670, yLabelX: 94, yLabelDy: 6 },
  axisTitles: { x: [410, 708], y: [36, 340] },
  markerRadius: { filled: 9, hollow: 7 },
  note: { firstItem: 32, itemGap: 60, lineGap: 26, indent: 96 }, // heading 424 → 456/482, 516/542
  leader: { top: [4, -30], side: [-6, -36] }, // (354,394), (344,480)
};
const ROC_TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1];
const ROC_STYLES = ['alt', 'lead', 'dim']; // 첫 값이 기본
const ROC_DRAW_ORDER = ['dim', 'alt', 'lead'];
const ROC_MARKER_STYLES = ['filled', 'hollow'];
const ROC_CURVES_RANGE = { min: 1, max: 4 };
const ROC_TAKEAWAYS_RANGE = { min: 1, max: 3 };
const ROC_LIMITS = { title: 50, axis: 40, name: 20, desc: 30, line: 20, lines: 2, takeaway: 60 };
// 공통 필드 글자 수 한도의 타입별 예외
const COMMON_LIMIT_OVERRIDES = { roc: { kicker: 60, source: 160 }, 'data-panels': { source: 160 } };

// process 레이아웃 (v1.7): 허용값. 없으면 기본(가로 흐름)
const PROCESS_LAYOUTS = ['stairs'];

// equation (v1.7): term (op term)… = result
const EQUATION_TERMS_RANGE = { min: 2, max: 3 };
const EQUATION_DEFAULT_OP = '×';
const EQUATION_EQUALS = '=';
const EQUATION_LIMITS = { label: 12, text: 40, caption: 60, operator: 2 };

// pillars (v1.7): 기둥 2~3개 + 받침대
const PILLARS_RANGE = { min: 2, max: 3 };
const PILLAR_TONES = ['default', 'accent', 'muted'];
const PILLAR_FIELDS = ['label', 'value', 'title', 'text'];
const PILLAR_LIMITS = { label: 16, value: 8, title: 20, text: 50, caption: 60 };

// tree (v1.6): 질문 2단계 × 갈래 2개 → 결과 4개
const TREE_ARITY = 2;
const TREE_TONES = ['default', 'accent', 'muted', 'danger'];
const TREE_LEVEL_KEYS = ['0', '1'];
const TREE_HEAD_ROOT = 'root';
const TREE_HEAD_LEAF = 'leaf';
const TREE_LIMITS = { root: 12, question: 20, signal: 30, label: 10, leaf: 14, caption: 60 };
// 연결선 기하(캔버스 px). 색·굵기는 CSS(.tree__line, .tree__arrow-head)가 지정한다.
const TREE_LINE = { arrowSize: 16, arrowGap: 4 };

// 배경 사진 (v1.5): 허용 타입, overlay 허용값(첫 값이 기본값)
const BACKGROUND_TYPES = ['stats', 'big-number', 'quote', 'cards', 'process', 'bullets', 'pillars'];
const BACKGROUND_OVERLAYS = ['dark', 'light'];
const BACKGROUND_MAX_BULLETS = 4;
const BACKGROUND_ATTRS = ['hasBg', 'overlay'];

// split 이미지 비율 (v1.5): 첫 값이 기본값
const SPLIT_IMAGE_RATIOS = ['1/2', '1/3', '2/3'];
const SPLIT_WIDE_IMAGE_LIMITS = { ratio: '2/3', bullets: 2, body: 80 };

// cards (v1.5)
const CARD_TONES = ['default', 'accent', 'muted', 'danger'];
const CARDS_RANGE = { min: 2, max: 4 };
const CARD_LIMITS = {
  plain: { text: 60, bullets: 3 },
  image: { text: 40, bullets: 2 },
  label: 16,
  title: 24,
  value: 8,
  bullet: 30,
};

// band (v1.5)
const BAND_ITEMS_RANGE = { min: 2, max: 4 };
const BAND_LIMITS = { heading: 16, text: 50, value: 8, bullets: 3, bullet: 50, body: 100, titleRecommended: 32 };

// 단계 진행 표시줄 (v1.4)
const NO_STEPBAR_TYPES = ['cover', 'section', 'closing', 'quote'];
const MAX_META_STEPS = 6;
const META_STEP_MAX_LENGTH = 8;

// matrix (v1.4): DOM 순서 = 2×2 그리드 자연 배치 순서(좌→우, 위→아래)
const MATRIX_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const MATRIX_TONES = ['default', 'accent', 'muted', 'danger'];
const MATRIX_MAX_ITEMS = 4;

// two-column 컬럼 tone · comparison 셀 표시 (v1.4)
const COLUMN_TONES = ['default', 'accent', 'danger'];
const COMPARISON_MARKS = ['good', 'bad', 'warn'];
const COMPARISON_WIDE_COLUMNS = 4; // 이 열 수 이상이면 셀 글자 제한이 줄어든다
const COMPARISON_CELL_LIMIT = { normal: 32, wide: 20 };

// cover 대표 이미지 (v1.3): 허용값 목록, 첫 값이 기본값
const COVER_IMAGE_STYLES = ['full', 'split'];
const COVER_OVERLAYS = ['dark', 'light', 'none'];
const COVER_FOCUSES = ['center', 'left', 'right', 'top', 'bottom'];
const COVER_IMAGE_TITLE_RECOMMENDED = 24;
const COVER_IMAGE_ATTRS = ['hasImage', 'imageStyle', 'overlay'];

// 공통 필드 kicker를 렌더링하지 않는 타입 (quote의 source는 인용 출처이므로 공통 source에서도 제외)
const NO_KICKER_TYPES = ['cover', 'quote'];
const NO_COMMON_SOURCE_TYPES = ['quote'];
const KICKER_FALLBACK_CONTAINER = '.split__text';
const LOCAL_ASSET_PATTERN = /^assets\//;

// 4절 분량 제한 (개수 범위)
const COUNT_LIMITS = {
  process: { field: 'steps', min: 3, max: 5 },
  comparison: { field: 'columns', min: 2, max: 5 },
  matrix: { field: 'quadrants', min: 1, max: 4 },
};
const CHART_DATA_RANGE = { min: 2, max: 8 };
const COMPARISON_ROWS_RANGE = { min: 2, max: 6 };
const SPLIT_MAX_BULLETS = 4;

// 4절 분량 제한 (글자 수): [필드 경로, 최대 길이]
const TEXT_LIMITS = {
  common: [['kicker', 20], ['source', 80]],
  'big-number': [['value', 10], ['label', 40], ['context', 60]],
  chart: [['caption', 60]],
  split: [['body', 120]],
  matrix: [['caption', 60]],
  process: [['caption', 60]],
  equation: [['caption', EQUATION_LIMITS.caption]],
  pillars: [['caption', PILLAR_LIMITS.caption]],
  iceberg: [['subtitle', ICEBERG_LIMITS.subtitle], ['message', ICEBERG_LIMITS.message]],
  interview: [
    ['title', INTERVIEW_LIMITS.title], ['quote', INTERVIEW_LIMITS.quote],
    ['interviewee', INTERVIEW_LIMITS.interviewee], ['implication', INTERVIEW_LIMITS.implication],
  ],
};

// stepbar · 공통 source를 캔버스 기본 위치(첫 자식 / 마지막 자식) 대신 둘 곳 (6절 DOM 순서)
const STEPBAR_AFTER = { interview: ':scope > .interview__media' };
const SOURCE_CONTAINER = { interview: ':scope > .interview__body' };

// 차트 SVG 좌표계 (CSS가 실제 표시 크기를 결정한다)
const CHART = {
  width: 1600,
  height: 640,
  padTop: 80,      // 단위 표기 + 값 레이블 공간
  padBottom: 72,   // 카테고리 레이블 공간
  padX: 40,
  headroom: 1.15,  // 최대값 대비 상단 여유
  barRatio: 0.56,  // 슬롯 대비 막대 폭
  maxBarWidth: 180,
  valueGap: 16,
  labelGap: 44,
  pointRadius: 10,
  baselineGap: 16,        // 기준선 끝 ~ 라벨 사이 간격
  baselineCharWidth: 30,  // 기준선 라벨 폭 추정(글자당, 오른쪽 여백 확보용)
  baselineMinPad: 160,    // 기준선 라벨용 오른쪽 여백 최소/최대
  baselineMaxPad: 480,
  tagPadX: 14,            // 기준선 라벨 배경 pill: 텍스트 bbox 대비 좌우/상하 여백
  tagPadY: 8,
  tagNarrowRatio: 0.55,   // 추정치: 비전각 문자(숫자·영문·기호) 폭 = baselineCharWidth × 비율
  tagLineHeight: 36,      // 추정치: 측정 전 텍스트 높이(기하 폴백, 실제 글꼴 크기는 CSS가 결정)
};
// 가로 막대(hbar, v1.7) 기하. 좌표계는 CHART.width × CHART.height를 공유한다.
const HBAR = {
  padTop: 72,            // 기준선 라벨(선 위쪽) 공간
  padBottom: 56,         // 단위 표기 공간
  labelCharWidth: 30,    // 카테고리 라벨 폭 추정(글자당)
  labelMinWidth: 160,
  labelMaxWidth: 420,
  labelGap: 24,          // 라벨 ~ 막대 시작 사이
  valuePad: 200,         // 막대 끝 값 라벨용 오른쪽 여백
  valueGap: 16,
  headroom: 1.05,
  barRatio: 0.6,         // 행 높이 대비 막대 두께
  maxBarHeight: 96,
  baselineLabelGap: 16,  // 기준선 위쪽 끝 ~ 라벨 사이
  recommendedMax: 5,
};
const SVG_NS = 'http://www.w3.org/2000/svg';
const CHART_KINDS = ['bar', 'line', 'hbar'];
const REFERENCE_ITEM_FIELDS = ['publisher', 'title', 'url'];
const MAX_REFERENCE_ITEMS = 6;
const SAFE_URL_PROTOCOLS = ['http:', 'https:'];
const META_SEPARATOR = ' · ';

const REFERENCE_CATEGORY_LABELS = {
  article: '기사',
  official: '공식 자료',
  report: '보고서·PDF',
  paper: '논문',
  other: '기타',
  image: '이미지',
};

const state = {
  slides: [],      // 정규화된 슬라이드 데이터
  elements: [],    // .slide 요소
  steps: [],       // meta.steps (진행 표시줄 단계 이름)
  current: 0,
  printing: false,
  notesWindow: null,
};

const dom = {
  deck: document.querySelector('.deck'),
  prev: document.querySelector('.nav__button--prev'),
  next: document.querySelector('.nav__button--next'),
  progress: document.querySelector('.progress'),
  progressBar: document.querySelector('.progress__bar'),
  pageNumber: document.querySelector('.page-number'),
};

/* ------------------------------------------------------------------ */
/* DOM 헬퍼                                                            */
/* ------------------------------------------------------------------ */

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

// 줄바꿈(\n)을 <br> 요소로 변환하며 텍스트를 추가한다.
function appendLines(parent, text) {
  text.split('\n').forEach((line, i) => {
    if (i > 0) parent.appendChild(document.createElement('br'));
    if (line) parent.appendChild(document.createTextNode(line));
  });
}

// **굵게** → <strong>, \n → <br>. 그 외 모든 텍스트는 텍스트 노드로만 삽입한다.
function appendRichText(parent, value) {
  const text = value == null ? '' : String(value);
  const pattern = /\*\*(.+?)\*\*/gs;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    appendLines(parent, text.slice(last, match.index));
    const strong = document.createElement('strong');
    appendLines(strong, match[1]);
    parent.appendChild(strong);
    last = match.index + match[0].length;
  }
  appendLines(parent, text.slice(last));
  return parent;
}

function textEl(tag, className, value) {
  return appendRichText(el(tag, className), value);
}

function appendIf(parent, value, factory) {
  if (value != null && value !== '') parent.appendChild(factory(value));
}

/* ------------------------------------------------------------------ */
/* 공통 조각                                                           */
/* ------------------------------------------------------------------ */

function titleEl(value, level = 'h2') {
  return textEl(level, 'slide__title', value);
}

function subtitleEl(value) {
  return textEl('p', 'slide__subtitle', value);
}

function metaEl(value) {
  return textEl('p', 'slide__meta', value);
}

function bodyEl() {
  return el('div', 'slide__body');
}

function bulletItemEl(item) {
  const li = el('li');
  if (item && typeof item === 'object') {
    appendRichText(li, item.text);
    if (Array.isArray(item.sub) && item.sub.length) {
      const sub = el('ul', 'slide__subbullets');
      item.sub.forEach((s) => sub.appendChild(textEl('li', '', s)));
      li.appendChild(sub);
    }
  } else {
    appendRichText(li, item);
  }
  return li;
}

function bulletListEl(items) {
  const ul = el('ul', 'slide__bullets');
  (Array.isArray(items) ? items : []).forEach((item) => ul.appendChild(bulletItemEl(item)));
  return ul;
}

function columnEl(column) {
  const col = el('div', 'slide__column');
  const data = column && typeof column === 'object' ? column : { body: column };
  const tone = pickAllowed(data.tone, COLUMN_TONES);
  if (tone !== 'default') col.dataset.tone = tone;
  appendIf(col, data.heading, (v) => textEl('h3', 'slide__column-heading', v));
  if (Array.isArray(data.bullets)) col.appendChild(bulletListEl(data.bullets));
  appendIf(col, data.body, (v) => textEl('p', '', v));
  return col;
}

/* ------------------------------------------------------------------ */
/* 타입별 렌더러: (slide 데이터, .slide 요소) → 자식 추가                */
/* ------------------------------------------------------------------ */

// 허용값이 아니면 기본값(목록의 첫 값)을 쓴다.
function pickAllowed(value, allowed) {
  return allowed.includes(value) ? value : allowed[0];
}

// src가 있는 image 객체만 유효한 대표 이미지로 본다.
function coverImageData(data) {
  const image = data.image && typeof data.image === 'object' ? data.image : null;
  return image && !isMissing(image.src) ? image : null;
}

// 이미지 로드 실패 시 이미지 관련 속성을 지워 텍스트 표지로 되돌린다.
function fallbackToTextCover(root, media) {
  COVER_IMAGE_ATTRS.forEach((key) => delete root.dataset[key]);
  media.hidden = true;
}

function coverImageEl(image, slideId, onError) {
  warnIfNotLocalAsset(image.src, slideId);
  const img = el('img', 'cover__image');
  img.addEventListener('error', () => {
    console.warn(`[slides] 이미지를 불러오지 못했습니다: ${image.src} (slide: ${slideId})`);
    onError();
  });
  img.alt = image.alt == null ? '' : String(image.alt);
  img.dataset.focus = pickAllowed(image.focus, COVER_FOCUSES);
  img.decoding = 'async';
  img.loading = 'eager';
  img.setAttribute('fetchpriority', 'high');
  img.src = String(image.src);
  return img;
}

function coverMediaEl(image, data, root) {
  const media = el('div', 'cover__media');
  media.appendChild(coverImageEl(image, data.id, () => fallbackToTextCover(root, media)));
  const overlay = el('div', 'cover__overlay');
  overlay.setAttribute('aria-hidden', 'true');
  media.appendChild(overlay);
  appendIf(media, image.credit, creditEl);
  return media;
}

// cover 로고 (v1.10 객체 / v1.11 최대 2개 배열): src가 있는 항목만 표시
const COVER_LOGO_MAX = 2;

function isLogoItem(item) {
  return typeof item === 'object' && item !== null && !Array.isArray(item) && !isMissing(item.src);
}

function coverLogoData(data) {
  const logo = data.logo;
  if (Array.isArray(logo)) {
    const items = logo.slice(0, COVER_LOGO_MAX).filter(isLogoItem);
    return items.length ? items : null;
  }
  return isLogoItem(logo) ? logo : null;
}

function coverLogosEl(logo, slideId) {
  if (!Array.isArray(logo)) return coverLogoEl(logo, slideId);
  const wrap = el('div', 'cover__logos');
  wrap.dataset.count = String(logo.length);
  logo.forEach((item) => wrap.appendChild(coverLogoEl(item, slideId)));
  return wrap;
}

function coverLogoEl(logo, slideId) {
  warnIfNotLocalAsset(logo.src, slideId);
  const img = el('img', 'cover__logo');
  img.addEventListener('error', () => {
    console.warn(`[slides] 로고를 불러오지 못했습니다: ${logo.src} (slide: ${slideId})`);
    img.remove();
  });
  img.alt = logo.alt == null ? '' : String(logo.alt);
  img.decoding = 'async';
  img.src = String(logo.src);
  return img;
}

function renderCover(data, root) {
  const image = coverImageData(data);
  if (image) {
    root.dataset.hasImage = '';
    root.dataset.imageStyle = pickAllowed(data.imageStyle, COVER_IMAGE_STYLES);
    root.dataset.overlay = pickAllowed(data.overlay, COVER_OVERLAYS);
    root.appendChild(coverMediaEl(image, data, root));
  }
  appendIf(root, coverLogoData(data), (logo) => coverLogosEl(logo, data.id));
  root.appendChild(titleEl(data.title, 'h1'));
  appendIf(root, data.subtitle, subtitleEl);
  appendIf(root, data.presenter, metaEl);
}

function renderSection(data, root) {
  appendIf(root, data.number, (v) => textEl('p', 'slide__number', v));
  root.appendChild(titleEl(data.title));
  appendIf(root, data.subtitle, subtitleEl);
}

function renderBullets(data, root) {
  appendIf(root, data.title, titleEl);
  const body = bodyEl();
  if (Array.isArray(data.bullets)) body.appendChild(bulletListEl(data.bullets));
  appendIf(body, data.body, (v) => textEl('p', '', v));
  root.appendChild(body);
}

function renderTwoColumn(data, root) {
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  const columns = el('div', 'slide__columns');
  columns.appendChild(columnEl(data.left));
  columns.appendChild(columnEl(data.right));
  body.appendChild(columns);
  root.appendChild(body);
}

// 로컬 assets/ 경로가 아니면 경고만 하고 렌더링은 계속한다.
function warnIfNotLocalAsset(src, slideId) {
  const value = src == null ? '' : String(src);
  if (!LOCAL_ASSET_PATTERN.test(value) || value.includes('..')) {
    console.warn(`[slides] (${slideId}): 이미지 src는 assets/ 아래 로컬 상대 경로여야 합니다: "${value}"`);
  }
}

function imageEl(src, alt, slideId, fit) {
  warnIfNotLocalAsset(src, slideId);
  const img = el('img', 'slide__image');
  img.src = src ?? '';
  img.alt = alt ?? '';
  img.decoding = 'async';
  img.dataset.fit = fit;
  img.addEventListener('error', () => {
    console.warn(`[slides] 이미지를 불러오지 못했습니다: ${src} (slide: ${slideId})`);
  });
  return img;
}

function creditEl(value) {
  return textEl('p', 'slide__credit', value);
}

// data-focus를 갖는 사진 요소 (background · cards · band 공용). onError는 선택.
function focusImageEl(image, className, slideId, onError) {
  warnIfNotLocalAsset(image.src, slideId);
  const img = el('img', className);
  img.addEventListener('error', () => {
    console.warn(`[slides] 이미지를 불러오지 못했습니다: ${image.src} (slide: ${slideId})`);
    onError?.();
  });
  img.alt = image.alt == null ? '' : String(image.alt);
  img.dataset.focus = pickAllowed(image.focus, COVER_FOCUSES);
  img.decoding = 'async';
  img.src = String(image.src);
  return img;
}

// 컨테이너 > img + credit
function mediaEl(className, imageClass, image, slideId, onError) {
  const media = el('div', className);
  media.appendChild(focusImageEl(image, imageClass, slideId, onError));
  appendIf(media, image.credit, creditEl);
  return media;
}

// src가 있는 image 객체만 유효한 사진으로 본다.
function validImage(image) {
  return image && typeof image === 'object' && !Array.isArray(image) && !isMissing(image.src) ? image : null;
}

function renderImage(data, root) {
  appendIf(root, data.title, titleEl);
  const body = bodyEl();
  const figure = el('figure', 'slide__figure');
  figure.appendChild(imageEl(data.src, data.alt, data.id, data.fit === 'cover' ? 'cover' : 'contain'));
  appendIf(figure, data.caption, (v) => textEl('figcaption', 'slide__caption', v));
  appendIf(figure, data.credit, creditEl);
  body.appendChild(figure);
  root.appendChild(body);
}

function renderStats(data, root) {
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  const stats = el('div', 'slide__stats');
  (Array.isArray(data.items) ? data.items : []).forEach((item) => {
    const stat = el('div', 'stat');
    stat.appendChild(textEl('p', 'stat__value', item?.value));
    stat.appendChild(textEl('p', 'stat__label', item?.label));
    stats.appendChild(stat);
  });
  body.appendChild(stats);
  root.appendChild(body);
}

function renderQuote(data, root) {
  const body = bodyEl();
  body.appendChild(textEl('blockquote', 'slide__quote', data.quote));
  appendIf(body, data.source, (v) => textEl('p', 'slide__quote-source', v));
  root.appendChild(body);
}

function renderClosing(data, root) {
  root.appendChild(titleEl(data.title));
  appendIf(root, data.subtitle, subtitleEl);
  appendIf(root, data.contact, metaEl);
}

/* references 전용 조각 ------------------------------------------------ */

function categoryLabel(category) {
  return REFERENCE_CATEGORY_LABELS[category] ?? REFERENCE_CATEGORY_LABELS.other;
}

// http(s) URL만 허용한다. 그 외(javascript:, data:, 상대 경로 등)는 null.
function safeHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return SAFE_URL_PROTOCOLS.includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function referenceMetaText(item) {
  const parts = [item.publisher, item.date, item.ref];
  if (!isMissing(item.usedIn)) parts.push(`슬라이드 ${item.usedIn}`);
  return parts
    .filter((v) => !isMissing(v))
    .map((v) => String(v).trim())
    .join(META_SEPARATOR);
}

function referenceUrlEl(rawUrl, slideId) {
  const text = rawUrl == null ? '' : String(rawUrl);
  const href = safeHttpUrl(text);
  if (!href) {
    if (text) console.warn(`[slides] (${slideId}): 허용되지 않은 URL — 링크 없이 텍스트로 표시합니다: ${text}`);
    const span = el('span', 'reference__url');
    span.textContent = text;
    return span;
  }
  const a = el('a', 'reference__url');
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = text;
  return a;
}

function referenceItemEl(item, slideId) {
  const data = item && typeof item === 'object' ? item : {};
  const li = el('li', 'reference');
  const meta = referenceMetaText(data);
  if (meta) {
    const p = el('p', 'reference__meta');
    p.textContent = meta;
    li.appendChild(p);
  }
  const title = el('p', 'reference__title');
  title.textContent = data.title == null ? '' : String(data.title);
  li.appendChild(title);
  if (!isMissing(data.url)) li.appendChild(referenceUrlEl(data.url, slideId));
  return li;
}

function renderReferences(data, root) {
  root.dataset.category = REFERENCE_CATEGORY_LABELS[data.category] ? data.category : 'other';
  root.appendChild(titleEl(data.title));
  const category = el('p', 'slide__category');
  category.textContent = categoryLabel(data.category);
  root.appendChild(category);
  appendIf(root, data.subtitle, subtitleEl);
  const body = bodyEl();
  const list = el('ol', 'slide__references');
  (Array.isArray(data.items) ? data.items : []).forEach((item) => list.appendChild(referenceItemEl(item, data.id)));
  body.appendChild(list);
  root.appendChild(body);
}

/* big-number · process ------------------------------------------------ */

function renderBigNumber(data, root) {
  appendIf(root, data.title, titleEl);
  const body = bodyEl();
  const wrap = el('div', 'slide__bignumber');
  wrap.appendChild(textEl('p', 'bignumber__value', data.value));
  wrap.appendChild(textEl('p', 'bignumber__label', data.label));
  appendIf(wrap, data.context, (v) => textEl('p', 'bignumber__context', v));
  body.appendChild(wrap);
  root.appendChild(body);
}

function stepEl(step, index) {
  const data = step && typeof step === 'object' ? step : { label: step };
  const li = el('li', 'step');
  const indexEl = el('span', 'step__index');
  indexEl.textContent = String(index + 1).padStart(2, '0');
  li.appendChild(indexEl);
  li.appendChild(textEl('p', 'step__label', data.label));
  appendIf(li, data.text, (v) => textEl('p', 'step__text', v));
  return li;
}

// 관문: 해당 단계 바로 다음 형제 li. 마지막 단계의 gate는 그리지 않는다(검증에서 경고).
function stepGateEl(text) {
  const li = textEl('li', 'step__gate', text);
  li.setAttribute('aria-label', `관문: ${text.replace(/\*\*/g, '')}`);
  return li;
}

function stepGate(step) {
  return step && typeof step === 'object' && !isMissing(step.gate) ? String(step.gate) : null;
}

// layout "stairs"(v1.7): 슬라이드에 data-layout, 각 li.step에 data-level(0부터). 높이 배치는 CSS가 담당.
function processLayout(data) {
  return PROCESS_LAYOUTS.includes(data.layout) ? data.layout : null;
}

function renderProcess(data, root) {
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const layout = processLayout(data);
  root.dataset.count = String(steps.length);
  if (layout) root.dataset.layout = layout;
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  const list = el('ol', 'slide__process');
  let gates = 0;
  steps.forEach((step, i) => {
    const item = stepEl(step, i);
    if (layout) item.dataset.level = String(i);
    list.appendChild(item);
    const gate = stepGate(step);
    if (gate && i < steps.length - 1) {
      list.appendChild(stepGateEl(gate));
      gates += 1;
    }
  });
  if (gates) root.dataset.gates = String(gates);
  body.appendChild(list);
  appendIf(body, data.caption, (v) => textEl('p', 'slide__caption', v));
  root.appendChild(body);
}

/* chart (인라인 SVG) ---------------------------------------------------- */

function svgEl(tag, className, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  if (className) node.setAttribute('class', className);
  Object.entries(attrs).forEach(([key, value]) => {
    node.setAttribute(key, typeof value === 'number' ? String(Math.round(value * 10) / 10) : String(value));
  });
  return node;
}

function svgText(className, value, attrs) {
  const node = svgEl('text', className, attrs);
  node.textContent = value == null ? '' : String(value);
  return node;
}

// 숫자가 아닌 value는 경고 후 0으로 처리한다.
function normalizeChartData(data, slideId) {
  return (Array.isArray(data) ? data : []).map((raw, i) => {
    const item = raw && typeof raw === 'object' ? raw : {};
    let value = item.value;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      console.warn(`[slides] (${slideId}): chart.data[${i}].value가 숫자가 아닙니다 (${JSON.stringify(value)}) — 0으로 처리합니다.`);
      value = 0;
    }
    return {
      label: item.label == null ? '' : String(item.label),
      value,
      display: isMissing(item.display) ? formatNumber(value) : String(item.display),
      highlight: item.highlight === true,
    };
  });
}

function formatNumber(value) {
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
}

// chart.baseline → { value, label } | null (형식이 맞지 않으면 무시)
function normalizeBaseline(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.value !== 'number' || !Number.isFinite(raw.value)) return null;
  return { value: raw.value, label: raw.label == null ? '' : String(raw.label) };
}

// 플롯 영역 좌우 경계. 기준선 라벨이 있으면 오른쪽에 라벨 여백을 확보한다.
function chartPlot(baseline) {
  const left = CHART.padX;
  let right = CHART.width - CHART.padX;
  if (baseline && baseline.label) {
    const estimate = baseline.label.length * CHART.baselineCharWidth + CHART.baselineGap;
    right -= Math.min(Math.max(estimate, CHART.baselineMinPad), CHART.baselineMaxPad);
  }
  return { left, right };
}

// 0을 반드시 포함하는 값 범위 → y 좌표 변환 함수 (extra: 기준선 등 범위에 포함할 값)
function createYScale(items, extra = []) {
  const values = [...items.map((d) => d.value), ...extra];
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const top = max > 0 ? max * CHART.headroom : 0;
  const bottom = min < 0 ? min * CHART.headroom : 0;
  const range = top - bottom || 1;
  const plotTop = CHART.padTop;
  const plotHeight = CHART.height - CHART.padTop - CHART.padBottom;
  return (v) => plotTop + ((top - v) / range) * plotHeight;
}

function chartSlots(count, plot) {
  const slot = (plot.right - plot.left) / Math.max(count, 1);
  return { slot, center: (i) => plot.left + slot * (i + 0.5) };
}

function appendCategoryLabels(svg, items, center) {
  const y = CHART.height - CHART.padBottom + CHART.labelGap;
  items.forEach((d, i) => {
    svg.appendChild(svgText('chart__label', d.label, {
      x: center(i), y, 'text-anchor': 'middle', 'data-highlight': String(d.highlight),
    }));
  });
}

/* 기준선 라벨 배경 pill: <g.chart__baseline-tag> = rect.chart__baseline-tag-bg + text.chart__baseline-label
   렌더 시점에는 SVG가 문서 밖(분리 상태)이라 getBBox가 0을 돌려준다. 그래서
   (1) 생성 즉시 글자 수 기반 결정적 추정치로 rect를 그려 두고(측정이 끝내 불가해도 폭 0이 되지 않음),
   (2) 문서에 붙은 뒤·폰트 로드 후·슬라이드 활성화·인쇄 직전에 getBBox 실측값으로 덮어쓴다.
   숨은 슬라이드는 visibility:hidden이라 레이아웃이 살아 있어 실측 가능하고, display:none 등으로
   bbox가 0이면 기존 값을 유지한다. */

function isWideChar(ch) {
  return /[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-￯]/.test(ch);
}

function estimateTextWidth(text) {
  return [...text].reduce((sum, ch) => sum + CHART.baselineCharWidth * (isWideChar(ch) ? 1 : CHART.tagNarrowRatio), 0);
}

// text 속성(x, y, text-anchor, dominant-baseline)으로부터 bbox를 추정한다.
function estimateTextBox(text, attrs) {
  const width = estimateTextWidth(text);
  const height = CHART.tagLineHeight;
  const anchor = attrs['text-anchor'] || 'start';
  const shift = anchor === 'middle' ? width / 2 : anchor === 'end' ? width : 0;
  const top = attrs['dominant-baseline'] === 'middle' ? attrs.y - height / 2 : attrs.y - height * 0.8;
  return { x: attrs.x - shift, y: top, width, height };
}

function sizeTagRect(rect, box) {
  const height = box.height + CHART.tagPadY * 2;
  const attrs = {
    x: box.x - CHART.tagPadX,
    y: box.y - CHART.tagPadY,
    width: box.width + CHART.tagPadX * 2,
    height,
    rx: height / 2,
  };
  Object.entries(attrs).forEach(([key, value]) => rect.setAttribute(key, String(Math.round(value * 10) / 10)));
}

function baselineTagEl(label, attrs) {
  const group = svgEl('g', 'chart__baseline-tag');
  const bg = svgEl('rect', 'chart__baseline-tag-bg');
  const text = svgText('chart__baseline-label', label, attrs);
  sizeTagRect(bg, estimateTextBox(label, attrs));
  group.append(bg, text);
  return group;
}

function measureBaselineTag(group) {
  const bg = group.querySelector('.chart__baseline-tag-bg');
  const text = group.querySelector('.chart__baseline-label');
  if (!bg || !text || typeof text.getBBox !== 'function') return;
  let box;
  try {
    box = text.getBBox();
  } catch {
    return; // 렌더 트리에 없으면(일부 브라우저) 예외 → 추정치 유지
  }
  if (box.width > 0 && box.height > 0) sizeTagRect(bg, box);
}

function measureBaselineTagsIn(scope) {
  scope?.querySelectorAll('.chart__baseline-tag').forEach(measureBaselineTag);
}

function appendAxis(svg, y, plot) {
  svg.appendChild(svgEl('line', 'chart__axis', { x1: plot.left, x2: plot.right, y1: y, y2: y }));
}

// 기준선: 플롯 폭 전체 가로선 + 오른쪽 여백에 라벨. 막대·값 라벨 위에 오도록 마지막에 추가한다.
function appendBaseline(svg, baseline, y, plot) {
  if (!baseline) return;
  const lineY = y(baseline.value);
  svg.appendChild(svgEl('line', 'chart__baseline', { x1: plot.left, x2: plot.right, y1: lineY, y2: lineY }));
  if (!baseline.label) return;
  svg.appendChild(baselineTagEl(baseline.label, {
    x: plot.right + CHART.baselineGap, y: lineY, 'text-anchor': 'start', 'dominant-baseline': 'middle',
  }));
}

function valueLabelY(y, zero, value) {
  return value < 0 ? Math.max(y, zero) + CHART.valueGap * 2.5 : Math.min(y, zero) - CHART.valueGap;
}

function drawBars(svg, items, baseline) {
  const y = createYScale(items, baseline ? [baseline.value] : []);
  const zero = y(0);
  const plot = chartPlot(baseline);
  const { slot, center } = chartSlots(items.length, plot);
  const barWidth = Math.min(slot * CHART.barRatio, CHART.maxBarWidth);
  items.forEach((d, i) => {
    const top = Math.min(y(d.value), zero);
    const height = Math.abs(zero - y(d.value));
    const cls = d.highlight ? 'chart__bar chart__bar--highlight' : 'chart__bar';
    svg.appendChild(svgEl('rect', cls, { x: center(i) - barWidth / 2, y: top, width: barWidth, height }));
    svg.appendChild(svgText('chart__value', d.display, {
      x: center(i), y: valueLabelY(y(d.value), zero, d.value), 'text-anchor': 'middle',
    }));
  });
  appendAxis(svg, zero, plot);
  appendCategoryLabels(svg, items, center);
  appendBaseline(svg, baseline, y, plot);
}

function drawLine(svg, items, baseline) {
  const y = createYScale(items, baseline ? [baseline.value] : []);
  const plot = chartPlot(baseline);
  const { center } = chartSlots(items.length, plot);
  appendAxis(svg, y(0), plot);
  const path = items.map((d, i) => `${i === 0 ? 'M' : 'L'}${center(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(' ');
  svg.appendChild(svgEl('path', 'chart__line', { d: path }));
  items.forEach((d, i) => {
    const cls = d.highlight ? 'chart__point chart__point--highlight' : 'chart__point';
    svg.appendChild(svgEl('circle', cls, { cx: center(i), cy: y(d.value), r: CHART.pointRadius }));
    svg.appendChild(svgText('chart__value', d.display, {
      x: center(i), y: y(d.value) - CHART.pointRadius - CHART.valueGap, 'text-anchor': 'middle',
    }));
  });
  appendCategoryLabels(svg, items, center);
  appendBaseline(svg, baseline, y, plot);
}

/* hbar (v1.7): 라벨 왼쪽 · 막대 가로 · 값 라벨은 막대 끝 오른쪽 · 기준선은 세로 점선 */

function hbarLabelWidth(items) {
  const longest = Math.max(0, ...items.map((d) => d.label.length));
  const estimate = longest * HBAR.labelCharWidth;
  return Math.min(Math.max(estimate, HBAR.labelMinWidth), HBAR.labelMaxWidth);
}

// 음수 값이 있으면 막대 왼쪽 끝 값 라벨이 카테고리 라벨과 겹치지 않도록 왼쪽 여백을 더 둔다.
function hbarPlot(items) {
  const labelRight = CHART.padX + hbarLabelWidth(items);
  const negativePad = items.some((d) => d.value < 0) ? HBAR.valuePad : 0;
  return {
    labelRight,
    left: labelRight + HBAR.labelGap + negativePad,
    right: CHART.width - CHART.padX - HBAR.valuePad,
    top: HBAR.padTop,
    bottom: CHART.height - HBAR.padBottom,
  };
}

// 0과 기준선(extra)을 반드시 포함하는 값 범위 → x 좌표 변환 함수
function createXScale(items, plot, extra = []) {
  const values = [...items.map((d) => d.value), ...extra];
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const high = max > 0 ? max * HBAR.headroom : 0;
  const low = min < 0 ? min * HBAR.headroom : 0;
  const range = high - low || 1;
  return (v) => plot.left + ((v - low) / range) * (plot.right - plot.left);
}

function hbarRows(count, plot) {
  const slot = (plot.bottom - plot.top) / Math.max(count, 1);
  return { slot, middle: (i) => plot.top + slot * (i + 0.5) };
}

function hbarValueAttrs(x, zero, value, cy) {
  const negative = value < 0;
  return {
    x: negative ? Math.min(x, zero) - HBAR.valueGap : Math.max(x, zero) + HBAR.valueGap,
    y: cy,
    'text-anchor': negative ? 'end' : 'start',
    'dominant-baseline': 'middle',
  };
}

// 기준선: 플롯 높이 전체 세로 점선 + 선 위쪽 라벨. 막대·값 라벨 위에 오도록 마지막에 추가한다.
function appendHbarBaseline(svg, baseline, x, plot) {
  if (!baseline) return;
  const lineX = x(baseline.value);
  svg.appendChild(svgEl('line', 'chart__baseline', { x1: lineX, x2: lineX, y1: plot.top, y2: plot.bottom }));
  if (!baseline.label) return;
  svg.appendChild(baselineTagEl(baseline.label, {
    x: lineX, y: plot.top - HBAR.baselineLabelGap, 'text-anchor': 'middle',
  }));
}

function drawHbars(svg, items, baseline) {
  const plot = hbarPlot(items);
  const x = createXScale(items, plot, baseline ? [baseline.value] : []);
  const zero = x(0);
  const { slot, middle } = hbarRows(items.length, plot);
  const barHeight = Math.min(slot * HBAR.barRatio, HBAR.maxBarHeight);
  items.forEach((d, i) => {
    const cy = middle(i);
    const cls = d.highlight ? 'chart__bar chart__bar--highlight' : 'chart__bar';
    svg.appendChild(svgEl('rect', cls, {
      x: Math.min(x(d.value), zero), y: cy - barHeight / 2, width: Math.abs(x(d.value) - zero), height: barHeight,
    }));
    svg.appendChild(svgText('chart__value', d.display, hbarValueAttrs(x(d.value), zero, d.value, cy)));
    svg.appendChild(svgText('chart__label', d.label, {
      x: plot.labelRight, y: cy, 'text-anchor': 'end', 'dominant-baseline': 'middle', 'data-highlight': String(d.highlight),
    }));
  });
  svg.appendChild(svgEl('line', 'chart__axis', { x1: zero, x2: zero, y1: plot.top, y2: plot.bottom }));
  appendHbarBaseline(svg, baseline, x, plot);
}

const CHART_DRAWERS = { bar: drawBars, line: drawLine, hbar: drawHbars };

// 단위 표기: bar/line은 왼쪽 위, hbar는 오른쪽 아래(위쪽은 기준선 라벨 자리)
function chartUnitAttrs(kind) {
  if (kind === 'hbar') {
    return { x: CHART.width - CHART.padX, y: CHART.height - HBAR.padBottom / 2, 'text-anchor': 'end', 'dominant-baseline': 'middle' };
  }
  return { x: CHART.padX, y: CHART.padTop / 2 };
}

function chartKind(chart) {
  return CHART_KINDS.includes(chart.kind) ? chart.kind : 'bar';
}

function chartAriaLabel(title, unit, items, baseline) {
  const suffix = unit ? ` (단위: ${unit})` : '';
  const summary = items.map((d) => `${d.label} ${d.display}`).join(', ');
  const base = baseline ? `, 기준선 ${baseline.label || formatNumber(baseline.value)}(${formatNumber(baseline.value)})` : '';
  return `${title ?? '차트'}${suffix}: ${summary}${base}`;
}

function chartSvgEl(data) {
  const chart = data.chart && typeof data.chart === 'object' ? data.chart : {};
  const kind = chartKind(chart);
  const items = normalizeChartData(chart.data, data.id);
  const svg = svgEl('svg', 'chart', {
    viewBox: `0 0 ${CHART.width} ${CHART.height}`,
    preserveAspectRatio: 'xMidYMid meet',
    width: '100%',
    role: 'img',
    'aria-label': chartAriaLabel(data.title, chart.unit, items, normalizeBaseline(chart.baseline)),
  });
  svg.dataset.kind = kind;
  if (!isMissing(chart.unit)) svg.appendChild(svgText('chart__unit', `단위: ${chart.unit}`, chartUnitAttrs(kind)));
  CHART_DRAWERS[kind](svg, items, normalizeBaseline(chart.baseline));
  return svg;
}

function renderChart(data, root) {
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  const figure = el('figure', 'slide__chart');
  figure.dataset.kind = chartKind(objectOr(data.chart));
  figure.appendChild(chartSvgEl(data));
  appendIf(figure, data.caption, (v) => textEl('figcaption', 'slide__caption', v));
  body.appendChild(figure);
  root.appendChild(body);
}

/* comparison ------------------------------------------------------------ */

function highlightClass(base, index, highlight) {
  return index === highlight ? `${base} is-highlight` : base;
}

function comparisonHeadEl(columns, highlight) {
  const thead = el('thead');
  const tr = el('tr');
  tr.appendChild(el('th', 'table__corner'));
  columns.forEach((col, i) => {
    const th = textEl('th', highlightClass('table__colhead', i, highlight), col);
    th.scope = 'col';
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  return thead;
}

function comparisonCellEl(value, mark, index, highlight) {
  const td = textEl('td', highlightClass('table__cell', index, highlight), value);
  if (COMPARISON_MARKS.includes(mark)) td.dataset.mark = mark;
  return td;
}

function comparisonRowEl(row, rowIndex, columnCount, highlight, highlightRow) {
  const data = row && typeof row === 'object' ? row : {};
  const values = Array.isArray(data.values) ? data.values : [];
  const marks = Array.isArray(data.marks) ? data.marks : [];
  const tr = el('tr', rowIndex === highlightRow ? 'is-highlight-row' : '');
  const th = textEl('th', 'table__rowhead', data.label);
  th.scope = 'row';
  tr.appendChild(th);
  for (let i = 0; i < columnCount; i += 1) {
    tr.appendChild(comparisonCellEl(values[i], marks[i], i, highlight));
  }
  return tr;
}

function renderComparison(data, root) {
  const columns = Array.isArray(data.columns) ? data.columns : [];
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const highlight = Number.isInteger(data.highlight) ? data.highlight : -1;
  const highlightRow = Number.isInteger(data.highlightRow) ? data.highlightRow : -1;
  root.dataset.cols = String(columns.length);
  root.dataset.rows = String(rows.length);
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  const table = el('table', 'slide__table');
  table.appendChild(comparisonHeadEl(columns, highlight));
  const tbody = el('tbody');
  rows.forEach((row, r) => tbody.appendChild(comparisonRowEl(row, r, columns.length, highlight, highlightRow)));
  table.appendChild(tbody);
  body.appendChild(table);
  root.appendChild(body);
}

/* split ------------------------------------------------------------------ */

function splitTextEl(data) {
  const text = el('div', 'split__text');
  text.appendChild(titleEl(data.title));
  appendIf(text, data.subtitle, subtitleEl);
  const hasBullets = Array.isArray(data.bullets) && data.bullets.length > 0;
  if (hasBullets || !isMissing(data.body)) {
    const body = bodyEl();
    if (hasBullets) body.appendChild(bulletListEl(data.bullets));
    appendIf(body, data.body, (v) => textEl('p', '', v));
    text.appendChild(body);
  }
  return text;
}

function splitMediaEl(image, slideId) {
  const media = el('div', 'split__media');
  const img = imageEl(image.src, image.alt, slideId, 'cover');
  img.dataset.focus = pickAllowed(image.focus, COVER_FOCUSES);
  media.appendChild(img);
  appendIf(media, image.credit, creditEl);
  return media;
}

function renderSplit(data, root) {
  const image = data.image && typeof data.image === 'object' ? data.image : null;
  root.dataset.imageSide = data.imageSide === 'left' ? 'left' : 'right';
  root.dataset.imageRatio = pickAllowed(data.imageRatio, SPLIT_IMAGE_RATIOS);
  root.appendChild(splitTextEl(data));
  if (image) {
    root.dataset.hasImage = '';
    root.appendChild(splitMediaEl(image, data.id));
  }
}

/* matrix (2×2) ------------------------------------------------------------ */

function objectOr(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

// 축 DOM 순서: x는 왼쪽→오른쪽(low · label · high), y는 위→아래(high · label · low)
function matrixAxisEl(axis, direction) {
  const data = objectOr(axis);
  const node = el('div', `matrix__axis matrix__axis--${direction}`);
  const parts = [
    ['matrix__axis-low', data.low],
    ['matrix__axis-label', data.label],
    ['matrix__axis-high', data.high],
  ];
  if (direction === 'y') parts.reverse();
  parts.forEach(([cls, value]) => appendIf(node, value, (v) => textEl('span', cls, v)));
  return node;
}

function quadrantItemsEl(items) {
  const ul = el('ul', 'quadrant__items');
  items.forEach((item) => ul.appendChild(textEl('li', '', item)));
  return ul;
}

function quadrantEl(position, quadrant) {
  const node = el('div', 'quadrant');
  node.dataset.position = position;
  if (!quadrant) {
    // 빈 사분면도 그리드 자리를 유지한다.
    node.dataset.tone = 'default';
    node.dataset.empty = '';
    node.setAttribute('aria-hidden', 'true');
    return node;
  }
  node.dataset.tone = pickAllowed(quadrant.tone, MATRIX_TONES);
  node.appendChild(textEl('p', 'quadrant__label', quadrant.label));
  appendIf(node, quadrant.text, (v) => textEl('p', 'quadrant__text', v));
  if (Array.isArray(quadrant.items) && quadrant.items.length) node.appendChild(quadrantItemsEl(quadrant.items));
  return node;
}

// position → 사분면 데이터. 중복·잘못된 position은 첫 번째 유효 항목만 쓴다(검증에서 경고).
function quadrantsByPosition(quadrants) {
  const map = new Map();
  (Array.isArray(quadrants) ? quadrants : []).forEach((q) => {
    const data = objectOr(q);
    if (MATRIX_POSITIONS.includes(data.position) && !map.has(data.position)) map.set(data.position, data);
  });
  return map;
}

function matrixGridEl(quadrants) {
  const grid = el('div', 'matrix__grid');
  const byPosition = quadrantsByPosition(quadrants);
  MATRIX_POSITIONS.forEach((pos) => grid.appendChild(quadrantEl(pos, byPosition.get(pos))));
  return grid;
}

function renderMatrix(data, root) {
  const axes = objectOr(data.axes);
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  const matrix = el('div', 'slide__matrix');
  matrix.appendChild(matrixAxisEl(axes.y, 'y'));
  matrix.appendChild(matrixGridEl(data.quadrants));
  matrix.appendChild(matrixAxisEl(axes.x, 'x'));
  body.appendChild(matrix);
  appendIf(body, data.caption, (v) => textEl('p', 'slide__caption', v));
  root.appendChild(body);
}

/* cards ------------------------------------------------------------------- */

// 카드 DOM 순서: media → label → value → title → text → bullets
function cardEl(card, slideId) {
  const data = objectOr(card);
  const li = el('li', 'card');
  li.dataset.tone = pickAllowed(data.tone, CARD_TONES);
  const image = validImage(data.image);
  if (image) li.appendChild(mediaEl('card__media', 'card__image', image, slideId));
  appendIf(li, data.label, (v) => textEl('p', 'card__label', v));
  appendIf(li, data.value, (v) => textEl('p', 'card__value', v));
  li.appendChild(textEl('h3', 'card__title', data.title));
  appendIf(li, data.text, (v) => textEl('p', 'card__text', v));
  if (Array.isArray(data.bullets) && data.bullets.length) {
    const ul = el('ul', 'card__bullets');
    data.bullets.forEach((b) => ul.appendChild(textEl('li', '', b)));
    li.appendChild(ul);
  }
  return li;
}

// 모두 이미지 → "" / 일부만 → "mixed" / 없음 → 속성 없음
function cardsImageState(cards) {
  const withImage = cards.filter((c) => validImage(objectOr(c).image)).length;
  if (!withImage) return null;
  return withImage === cards.length ? '' : 'mixed';
}

function renderCards(data, root) {
  const cards = Array.isArray(data.cards) ? data.cards : [];
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  const list = el('ul', 'slide__cards');
  list.dataset.count = String(cards.length);
  const imageState = cardsImageState(cards);
  if (imageState != null) list.dataset.hasImage = imageState;
  cards.forEach((card) => list.appendChild(cardEl(card, data.id)));
  body.appendChild(list);
  root.appendChild(body);
}

/* band -------------------------------------------------------------------- */

function bandItemEl(item) {
  const data = objectOr(item);
  const li = el('li', 'band__item');
  appendIf(li, data.value, (v) => textEl('p', 'band__value', v));
  li.appendChild(textEl('h3', 'band__heading', data.heading));
  appendIf(li, data.text, (v) => textEl('p', 'band__text', v));
  return li;
}

function bandItemsEl(items) {
  const ul = el('ul', 'band__items');
  ul.dataset.count = String(items.length);
  items.forEach((item) => ul.appendChild(bandItemEl(item)));
  return ul;
}

function bandContentEl(data) {
  const content = el('div', 'band__content');
  content.appendChild(titleEl(data.title));
  appendIf(content, data.subtitle, subtitleEl);
  if (Array.isArray(data.items) && data.items.length) content.appendChild(bandItemsEl(data.items));
  const hasBullets = Array.isArray(data.bullets) && data.bullets.length > 0;
  if (hasBullets || !isMissing(data.body)) {
    const body = bodyEl();
    if (hasBullets) body.appendChild(bulletListEl(data.bullets));
    appendIf(body, data.body, (v) => textEl('p', '', v));
    content.appendChild(body);
  }
  return content;
}

// DOM 순서: (stepbar) → .band__media → .band__content. kicker는 .band__content 안 제목 앞.
function renderBand(data, root) {
  const image = validImage(data.image);
  if (image) root.appendChild(mediaEl('band__media', 'band__image', image, data.id));
  root.appendChild(bandContentEl(data));
}

/* tree (갈림길 나무, v1.6) -------------------------------------------------- */

// 질문 단계·갈래 데이터를 정확히 TREE_ARITY개까지만 그린다(초과분은 검증에서 경고).
function treeSlice(list) {
  return (Array.isArray(list) ? list : []).slice(0, TREE_ARITY).map(objectOr);
}

function treeHeadEl(level, levelData) {
  const head = el('div', 'tree__head');
  head.dataset.level = level;
  if (!levelData) {
    // 1열(출발점)·4열(결과)·누락된 질문도 빈 칸으로 열 정렬을 유지한다.
    head.dataset.empty = '';
    head.setAttribute('aria-hidden', 'true');
    return head;
  }
  head.appendChild(textEl('p', 'tree__question', levelData.question));
  appendIf(head, levelData.signal, (v) => textEl('p', 'tree__signal', v));
  return head;
}

// 열 머리글 줄: 1열 빈 칸 | levels[0] | levels[1] | 4열 빈 칸
function treeHeadsEl(levels) {
  const heads = el('div', 'tree__heads');
  heads.appendChild(treeHeadEl(TREE_HEAD_ROOT, null));
  TREE_LEVEL_KEYS.forEach((key, i) => heads.appendChild(treeHeadEl(key, levels[i])));
  heads.appendChild(treeHeadEl(TREE_HEAD_LEAF, null));
  return heads;
}

function treeNodeEl(depth, label, branch, child) {
  const node = el('div', 'tree__node');
  node.dataset.depth = String(depth);
  node.dataset.branch = String(branch);
  if (child != null) node.dataset.child = String(child);
  node.appendChild(textEl('span', 'tree__node-label', label));
  return node;
}

function treeLeafEl(childData, branch, child) {
  const leaf = textEl('div', 'tree__leaf', childData.leaf);
  leaf.dataset.tone = pickAllowed(childData.tone, TREE_TONES);
  leaf.dataset.branch = String(branch);
  leaf.dataset.child = String(child);
  return leaf;
}

// [{ data, branch, child }] — 갈래당 자식 최대 TREE_ARITY개
function treeChildren(branches) {
  return branches.flatMap((b, branch) => treeSlice(b.children).map((data, child) => ({ data, branch, child })));
}

// DOM 순서(열 단위): svg → heads → root → depth1 → depth2 → leaf. 행 배치는 CSS가 data-branch/child로 지정.
function treeEl(data) {
  const branches = treeSlice(data.branches);
  const children = treeChildren(branches);
  const tree = el('div', 'slide__tree');
  tree.appendChild(treeLinesEl(data.id));
  tree.appendChild(treeHeadsEl(treeSlice(data.levels)));
  tree.appendChild(textEl('div', 'tree__root', data.root));
  branches.forEach((b, i) => tree.appendChild(treeNodeEl(1, b.label, i, null)));
  children.forEach(({ data: c, branch, child }) => tree.appendChild(treeNodeEl(2, c.label, branch, child)));
  children.forEach(({ data: c, branch, child }) => tree.appendChild(treeLeafEl(c, branch, child)));
  return tree;
}

function treeLinesEl(slideId) {
  const svg = svgEl('svg', 'tree__lines', { 'aria-hidden': 'true', focusable: 'false' });
  const defs = svgEl('defs');
  const marker = svgEl('marker', 'tree__arrow', {
    id: treeArrowId(slideId),
    viewBox: `0 0 ${TREE_LINE.arrowSize} ${TREE_LINE.arrowSize}`,
    refX: TREE_LINE.arrowSize, refY: TREE_LINE.arrowSize / 2,
    markerWidth: TREE_LINE.arrowSize, markerHeight: TREE_LINE.arrowSize,
    markerUnits: 'userSpaceOnUse', orient: 'auto',
  });
  const s = TREE_LINE.arrowSize;
  marker.appendChild(svgEl('path', 'tree__arrow-head', { d: `M0 0 L${s} ${s / 2} L0 ${s} Z` }));
  defs.appendChild(marker);
  svg.appendChild(defs);
  return svg;
}

function treeArrowId(slideId) {
  return `tree-arrow-${slideId}`;
}

function renderTree(data, root) {
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  body.appendChild(treeEl(data));
  appendIf(body, data.caption, (v) => textEl('p', 'slide__caption', v));
  root.appendChild(body);
}

/* tree 연결선: 렌더 후 노드 위치를 캔버스(1920) 좌표로 측정해 그린다 ------------ */

// container 기준 좌표. offsetLeft/Top 체인은 transform scale의 영향을 받지 않는다.
function offsetWithin(node, container) {
  let x = 0;
  let y = 0;
  let current = node;
  while (current && current !== container) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent;
  }
  if (current === container) return { x, y };
  // container가 offsetParent 체인에 없으면(정적 배치) 공통 조상 기준 차이로 계산한다.
  const base = offsetWithin(container, null);
  return { x: x - base.x - container.clientLeft, y: y - base.y - container.clientTop };
}

function nodeBox(node, container) {
  const { x, y } = offsetWithin(node, container);
  return { left: x, right: x + node.offsetWidth, middle: y + node.offsetHeight / 2 };
}

function curvePath(from, to) {
  const x1 = from.right;
  const x2 = to.left;
  const mid = (x1 + x2) / 2;
  return `M${x1} ${from.middle} C${mid} ${from.middle} ${mid} ${to.middle} ${x2} ${to.middle}`;
}

function straightPath(from, to) {
  return `M${from.right} ${from.middle} L${to.left - TREE_LINE.arrowGap} ${to.middle}`;
}

function treeQuery(tree, selector, branch, child) {
  const childPart = child == null ? '' : `[data-child="${child}"]`;
  return tree.querySelector(`${selector}[data-branch="${branch}"]${childPart}`);
}

// [{ from, to, kind, depth, branch, child }] — 양 끝이 모두 있는 연결만
function treeConnections(tree) {
  const links = [];
  const add = (from, to, kind, depth, branch, child) => {
    if (from && to) links.push({ from, to, kind, depth, branch, child });
  };
  const rootNode = tree.querySelector('.tree__root');
  for (let b = 0; b < TREE_ARITY; b += 1) {
    const d1 = treeQuery(tree, '.tree__node[data-depth="1"]', b);
    add(rootNode, d1, 'curve', 0, b, null);
    for (let c = 0; c < TREE_ARITY; c += 1) {
      const d2 = treeQuery(tree, '.tree__node[data-depth="2"]', b, c);
      add(d1, d2, 'curve', 1, b, c);
      add(d2, treeQuery(tree, '.tree__leaf', b, c), 'arrow', 2, b, c);
    }
  }
  return links;
}

function treeLineEl(link, tree, arrowId) {
  const from = nodeBox(link.from, tree);
  const to = nodeBox(link.to, tree);
  const d = link.kind === 'arrow' ? straightPath(from, to) : curvePath(from, to);
  const path = svgEl('path', 'tree__line', { d });
  path.dataset.from = String(link.depth);
  path.dataset.branch = String(link.branch);
  if (link.child != null) path.dataset.child = String(link.child);
  if (link.kind === 'arrow') {
    path.dataset.kind = 'arrow';
    path.setAttribute('marker-end', `url(#${arrowId})`);
  }
  return path;
}

// 측정 불가(display:none 등으로 크기 0)면 기존 선을 유지하고 false를 돌려준다.
function drawTreeLines(tree) {
  const svg = tree.querySelector('.tree__lines');
  const width = tree.clientWidth;
  const height = tree.clientHeight;
  if (!svg || !width || !height) return false;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.querySelectorAll('.tree__line').forEach((line) => line.remove());
  const arrowId = svg.querySelector('.tree__arrow')?.id ?? '';
  treeConnections(tree).forEach((link) => svg.appendChild(treeLineEl(link, tree, arrowId)));
  return true;
}

function drawTreesIn(scope) {
  scope?.querySelectorAll('.slide__tree').forEach(drawTreeLines);
}

let treeFrame = 0;
function scheduleTreeLines() {
  cancelAnimationFrame(treeFrame);
  treeFrame = requestAnimationFrame(() => drawTreesIn(dom.deck));
}

// 폰트 로드·레이아웃 변경으로 노드 크기가 바뀌면 다시 그린다(ResizeObserver는 transform 무관).
function observeTrees() {
  const trees = dom.deck.querySelectorAll('.slide__tree');
  if (!trees.length) return;
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(scheduleTreeLines);
    trees.forEach((tree) => {
      observer.observe(tree);
      tree.querySelectorAll('.tree__root, .tree__node, .tree__leaf').forEach((n) => observer.observe(n));
    });
  }
  document.fonts?.ready.then(scheduleTreeLines);
  scheduleTreeLines();
}

/* equation (v1.7) ------------------------------------------------------- */

// label → text 순서. term과 result가 같은 하위 구조를 쓴다.
function equationPartEl(className, part) {
  const data = objectOr(part);
  const node = el('div', className);
  node.appendChild(textEl('p', 'equation__label', data.label));
  appendIf(node, data.text, (v) => textEl('p', 'equation__text', v));
  return node;
}

function equationSymbolEl(className, symbol) {
  const node = el('span', className);
  node.textContent = symbol;
  node.setAttribute('aria-hidden', 'true');
  return node;
}

// operators → 길이 = terms − 1. 부족하거나 비어 있으면 "×"로 채운다(경고는 검증에서).
function equationOperators(operators, termCount) {
  const list = Array.isArray(operators) ? operators : [];
  return Array.from({ length: Math.max(termCount - 1, 0) }, (_, i) => (
    isMissing(list[i]) ? EQUATION_DEFAULT_OP : String(list[i])
  ));
}

function equationEl(data) {
  const terms = Array.isArray(data.terms) ? data.terms : [];
  const operators = equationOperators(data.operators, terms.length);
  const wrap = el('div', 'slide__equation');
  wrap.dataset.count = String(terms.length);
  terms.forEach((term, i) => {
    if (i > 0) wrap.appendChild(equationSymbolEl('equation__op', operators[i - 1]));
    wrap.appendChild(equationPartEl('equation__term', term));
  });
  wrap.appendChild(equationSymbolEl('equation__equals', EQUATION_EQUALS));
  wrap.appendChild(equationPartEl('equation__result', data.result));
  return wrap;
}

function renderEquation(data, root) {
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  body.appendChild(equationEl(data));
  appendIf(body, data.caption, (v) => textEl('p', 'slide__caption', v));
  root.appendChild(body);
}

/* pillars (v1.7) -------------------------------------------------------- */

// 있는 필드만 label → value → title → text 순서로 넣는다. 기둥과 받침대가 같은 하위 클래스를 쓴다.
function pillarContentEl(className, part) {
  const data = objectOr(part);
  const node = el('div', className);
  node.dataset.tone = pickAllowed(data.tone, PILLAR_TONES);
  PILLAR_FIELDS.forEach((field) => {
    appendIf(node, data[field], (v) => textEl(field === 'title' ? 'h3' : 'p', `pillar__${field}`, v));
  });
  return node;
}

function renderPillars(data, root) {
  const pillars = Array.isArray(data.pillars) ? data.pillars : [];
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  const wrap = el('div', 'slide__pillars');
  const columns = el('div', 'pillars__columns');
  columns.dataset.count = String(pillars.length);
  pillars.forEach((pillar) => columns.appendChild(pillarContentEl('pillar', pillar)));
  wrap.appendChild(columns);
  wrap.appendChild(pillarContentEl('pillars__base', data.base));
  body.appendChild(wrap);
  appendIf(body, data.caption, (v) => textEl('p', 'slide__caption', v));
  root.appendChild(body);
}

/* roc (v1.8) ------------------------------------------------------------- */
// 좌표계는 references/roc_slide_9pg.html과 동일: viewBox 0 0 760 730, 플롯 x 110~710 · y 40~640.

// 데이터 (fx, ty) → SVG 좌표
function rocX(fx) {
  return ROC.plot.left + ROC.plot.size * fx;
}

function rocY(ty) {
  return ROC.plot.bottom - ROC.plot.size * ty;
}

function rocFixed(value) {
  return value.toFixed(1);
}

// [[x, y], …] 중 0~1 숫자 쌍만 남긴다(검증 단계에서 경고).
function rocPoints(points) {
  return (Array.isArray(points) ? points : []).filter(isRocPoint);
}

function isRocPoint(p) {
  return Array.isArray(p) && p.length >= 2
    && [p[0], p[1]].every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1);
}

function rocPathData(points) {
  return points.map(([fx, ty], i) => `${i ? 'L' : 'M'}${rocFixed(rocX(fx))},${rocFixed(rocY(ty))}`).join(' ');
}

function rocCurves(data) {
  return (Array.isArray(data.curves) ? data.curves : []).map((raw) => {
    const curve = objectOr(raw);
    return { ...curve, style: pickAllowed(curve.style, ROC_STYLES), points: rocPoints(curve.points) };
  });
}

// 곡선 아래 · x축 위 닫힌 면
function rocAreaEl(curve) {
  const pts = curve.points;
  const first = rocFixed(rocX(pts[0][0]));
  const last = rocFixed(rocX(pts[pts.length - 1][0]));
  const bottom = rocFixed(ROC.plot.bottom);
  const line = pts.map(([fx, ty]) => `L${rocFixed(rocX(fx))},${rocFixed(rocY(ty))}`).join(' ');
  return svgEl('path', 'roc__area', { d: `M${first},${bottom} ${line} L${last},${bottom} Z` });
}

function appendRocGrid(svg) {
  ROC_TICKS.forEach((t) => {
    svg.appendChild(svgEl('line', 'roc__grid', { x1: rocX(t), y1: ROC.plot.top, x2: rocX(t), y2: ROC.plot.bottom }));
    svg.appendChild(svgEl('line', 'roc__grid', { x1: ROC.plot.left, y1: rocY(t), x2: ROC.plot.right, y2: rocY(t) }));
  });
}

function appendRocChance(svg, chance) {
  svg.appendChild(svgEl('line', 'roc__chance', { x1: rocX(0), y1: rocY(0), x2: rocX(1), y2: rocY(1) }));
  const label = objectOr(chance).label;
  if (isMissing(label)) return;
  const { at, dy, angle } = ROC.chanceLabel;
  const x = rocFixed(rocX(at));
  const y = rocFixed(rocY(at) + dy);
  svg.appendChild(svgText('roc__chance-label', label, {
    transform: `translate(${x},${y}) rotate(${angle})`, 'text-anchor': 'middle',
  }));
}

function appendRocCurves(svg, curves) {
  [...curves]
    .sort((a, b) => ROC_DRAW_ORDER.indexOf(a.style) - ROC_DRAW_ORDER.indexOf(b.style))
    .filter((c) => c.points.length >= 2)
    .forEach((c) => {
      const path = svgEl('path', 'roc__curve', { d: rocPathData(c.points) });
      path.dataset.style = c.style;
      if (!isMissing(c.id)) path.dataset.curve = String(c.id);
      svg.appendChild(path);
    });
}

function appendRocTicks(svg) {
  const { xLabelY, yLabelX, yLabelDy } = ROC.ticks;
  ROC_TICKS.forEach((t) => {
    svg.appendChild(svgText('roc__tick', rocFixed(t), { x: rocX(t), y: xLabelY, 'text-anchor': 'middle' }));
    svg.appendChild(svgText('roc__tick', rocFixed(t), { x: yLabelX, y: rocY(t) + yLabelDy, 'text-anchor': 'end' }));
  });
}

function appendRocAxes(svg, axes) {
  const { x, y } = objectOr(axes);
  const ax = ROC.axisTitles;
  appendIf(svg, x, (v) => svgText('roc__axis', v, { x: ax.x[0], y: ax.x[1], 'text-anchor': 'middle' }));
  appendIf(svg, y, (v) => svgText('roc__axis', v, {
    transform: `translate(${ax.y[0]},${ax.y[1]}) rotate(-90)`, 'text-anchor': 'middle',
  }));
}

function rocNote(data) {
  const note = objectOr(data.note);
  const at = isRocPoint(note.at) ? note.at : null;
  const items = (Array.isArray(note.items) ? note.items : []).map(objectOr);
  return at ? { x: rocX(at[0]), y: rocY(at[1]), heading: note.heading, items } : null;
}

function rocMarkers(data) {
  return (Array.isArray(data.markers) ? data.markers : [])
    .map(objectOr)
    .filter((m) => isRocPoint(m.point))
    .map((m) => ({ x: rocX(m.point[0]), y: rocY(m.point[1]), style: pickAllowed(m.style, ROC_MARKER_STYLES) }));
}

// note item i 첫 줄 기준선 y
function rocItemY(note, i) {
  return note.y + ROC.note.firstItem + ROC.note.itemGap * i;
}

// 지시선 끝점: 첫 item은 노트 블록 위쪽, 이후 item은 블록 왼쪽(레퍼런스 좌표 재현)
function rocLeaderEnd(note, i) {
  const { top, side } = ROC.leader;
  if (i === 0) return [note.x + top[0], note.y + top[1]];
  return [note.x + side[0], rocItemY(note, i) + side[1]];
}

function appendRocLeaders(svg, markers, note) {
  if (!note) return;
  markers.slice(0, note.items.length).forEach((m, i) => {
    const [x2, y2] = rocLeaderEnd(note, i);
    svg.appendChild(svgEl('line', 'roc__lead', { x1: m.x, y1: m.y, x2, y2 }));
  });
}

function appendRocMarkers(svg, markers) {
  markers.forEach((m) => {
    const circle = svgEl('circle', 'roc__marker', { cx: m.x, cy: m.y, r: ROC.markerRadius[m.style] });
    circle.dataset.style = m.style;
    svg.appendChild(circle);
  });
}

function rocNoteFirstLine(item, x, y) {
  const text = svgEl('text', 'roc__note', { x, y });
  if (!isMissing(item.label)) {
    const label = svgEl('tspan', 'roc__note-label');
    label.textContent = String(item.label);
    text.appendChild(label);
  }
  const first = Array.isArray(item.lines) ? item.lines[0] : null;
  if (!isMissing(first)) text.appendChild(document.createTextNode(`${isMissing(item.label) ? '' : '  '}${first}`));
  return text;
}

function appendRocNote(svg, note) {
  if (!note) return;
  appendIf(svg, note.heading, (v) => svgText('roc__note-heading', v, { x: note.x, y: note.y }));
  note.items.forEach((item, i) => {
    const y = rocItemY(note, i);
    svg.appendChild(rocNoteFirstLine(item, note.x, y));
    const second = Array.isArray(item.lines) ? item.lines[1] : null;
    appendIf(svg, second, (v) => svgText('roc__note', v, { x: note.x, y: y + ROC.note.lineGap, dx: ROC.note.indent }));
  });
}

function rocDescription(curves) {
  const parts = curves.map((c) => (isMissing(c.auc) ? String(c.name ?? '') : `${c.name ?? ''} AUC ${c.auc}`));
  return parts.filter(Boolean).join(', ');
}

function rocSvgEl(data, curves) {
  const svg = svgEl('svg', 'roc', { viewBox: ROC.viewBox, role: 'img', 'aria-labelledby': `${data.id}-roc-t ${data.id}-roc-d` });
  svg.appendChild(svgTitleEl('title', 'ROC 곡선', `${data.id}-roc-t`));
  svg.appendChild(svgTitleEl('desc', rocDescription(curves), `${data.id}-roc-d`));
  const note = rocNote(data);
  const markers = rocMarkers(data);
  const lead = curves.find((c) => c.fill === true && c.points.length >= 2);
  if (lead) svg.appendChild(rocAreaEl(lead));
  appendRocGrid(svg);
  appendRocChance(svg, data.chance);
  appendRocCurves(svg, curves);
  svg.appendChild(svgEl('rect', 'roc__frame', { x: ROC.plot.left, y: ROC.plot.top, width: ROC.plot.size, height: ROC.plot.size }));
  appendRocTicks(svg);
  appendRocAxes(svg, data.axes);
  appendRocLeaders(svg, markers, note);
  appendRocMarkers(svg, markers);
  appendRocNote(svg, note);
  return svg;
}

function svgTitleEl(tag, value, id) {
  const node = svgEl(tag, '', { id });
  node.textContent = value;
  return node;
}

function rocSwatchEl() {
  const svg = svgEl('svg', 'roc__swatch', { viewBox: '0 0 64 12', width: 64, height: 12, 'aria-hidden': 'true' });
  svg.appendChild(svgEl('line', 'roc__swatch-line', { x1: 2, y1: 6, x2: 62, y2: 6 }));
  return svg;
}

function rocAucEl(curve) {
  const node = el('div', 'roc__auc');
  if (!isMissing(curve.auc)) node.appendChild(document.createTextNode(String(curve.auc)));
  appendIf(node, curve.ci, (v) => textEl('span', 'roc__ci', v));
  return node;
}

function rocModelEl(curve) {
  const li = el('li', 'roc__model');
  li.dataset.style = curve.style;
  li.appendChild(rocSwatchEl());
  const text = el('div');
  appendIf(text, curve.name, (v) => textEl('p', 'roc__name', v));
  appendIf(text, curve.desc, (v) => textEl('p', 'roc__desc', v));
  li.appendChild(text);
  if (!isMissing(curve.auc) || !isMissing(curve.ci)) li.appendChild(rocAucEl(curve));
  return li;
}

function rocAsideEl(data, curves) {
  const aside = el('div', 'roc__aside');
  const list = el('ul', 'roc__models');
  curves.forEach((c) => list.appendChild(rocModelEl(c)));
  aside.appendChild(list);
  const takeaways = Array.isArray(data.takeaways) ? data.takeaways.filter((t) => !isMissing(t)) : [];
  if (takeaways.length) {
    const wrap = el('div', 'roc__takeaways');
    takeaways.forEach((t) => wrap.appendChild(textEl('p', 'roc__takeaway', t)));
    aside.appendChild(wrap);
  }
  return aside;
}

function renderRoc(data, root) {
  const curves = rocCurves(data);
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  const wrap = el('div', 'slide__roc');
  const figure = el('figure', 'roc__chart');
  figure.appendChild(rocSvgEl(data, curves));
  wrap.appendChild(figure);
  wrap.appendChild(rocAsideEl(data, curves));
  body.appendChild(wrap);
  root.appendChild(body);
}

/* data-panels (v1.9) ----------------------------------------------------- */
// 구조: .slide__data-panels > .dpanel → (.dpanel__link) → .dpanel. 있는 필드만 생성한다.

function dpanelHeadEl(panel) {
  const head = el('div', 'dpanel__head');
  appendIf(head, panel.heading, (v) => textEl('h3', 'dpanel__heading', v));
  appendIf(head, panel.meta, (v) => textEl('span', 'dpanel__meta', v));
  return head;
}

function dpanelStatsEl(stats) {
  const list = el('ul', 'dpanel__stats');
  stats.forEach((stat) => {
    const data = objectOr(stat);
    const li = el('li', 'dpanel__stat');
    appendIf(li, data.value, (v) => textEl('span', 'dpanel__stat-value', v));
    appendIf(li, data.label, (v) => textEl('span', 'dpanel__stat-label', v));
    if (li.childNodes.length) list.appendChild(li);
  });
  list.dataset.count = String(list.children.length);
  return list;
}

function dpanelFigureEl(figure, slideId) {
  const fig = el('figure', 'dpanel__figure');
  const img = el('img', 'dpanel__image');
  img.addEventListener('error', () => {
    console.warn(`[slides] 이미지를 불러오지 못했습니다: ${figure.src} (slide: ${slideId})`);
  });
  img.alt = figure.alt == null ? '' : String(figure.alt);
  img.decoding = 'async';
  img.src = String(figure.src);
  fig.appendChild(img);
  return fig;
}

function dpanelFieldsEl(fields) {
  const p = el('p', 'dpanel__fields');
  appendIf(p, fields.label, (v) => textEl('span', 'dpanel__fields-label', v));
  if (!isMissing(fields.text)) appendRichText(p, fields.text);
  return p;
}

function dpanelEl(panel, index, slideId) {
  const data = objectOr(panel);
  const node = el('div', 'dpanel');
  node.dataset.tone = DPANEL_TONES.includes(data.tone) ? data.tone : DPANEL_TONES[index % DPANEL_TONES.length];
  node.appendChild(dpanelHeadEl(data));
  const stats = Array.isArray(data.stats) ? data.stats : [];
  if (stats.length) node.appendChild(dpanelStatsEl(stats));
  appendIf(node, data.message, (v) => textEl('p', 'dpanel__message', v));
  appendIf(node, data.chartTitle, (v) => textEl('p', 'dpanel__chart-title', v));
  const figure = validImage(data.figure);
  if (figure) node.appendChild(dpanelFigureEl(figure, slideId));
  const fields = objectOr(data.fields);
  if (!isMissing(fields.label) || !isMissing(fields.text)) node.appendChild(dpanelFieldsEl(fields));
  return node;
}

function dpanelLinkEl(link) {
  const node = el('div', 'dpanel__link');
  const badge = el('div', 'dpanel__link-badge');
  appendIf(badge, link.value, (v) => textEl('span', 'dpanel__link-value', v));
  appendIf(badge, link.label, (v) => textEl('span', 'dpanel__link-label', v));
  node.appendChild(badge);
  appendIf(node, link.note, (v) => textEl('p', 'dpanel__link-note', v));
  return node;
}

function dpanelLink(data) {
  const link = objectOr(data.link);
  return ['value', 'label', 'note'].some((k) => !isMissing(link[k])) ? link : null;
}

function renderDataPanels(data, root) {
  const panels = (Array.isArray(data.panels) ? data.panels : []).slice(0, DPANEL_COUNT);
  const link = dpanelLink(data);
  root.appendChild(titleEl(data.title));
  const body = bodyEl();
  const wrap = el('div', 'slide__data-panels');
  if (link) wrap.dataset.hasLink = '';
  panels.forEach((panel, i) => {
    if (i === 1 && link) wrap.appendChild(dpanelLinkEl(link));
    wrap.appendChild(dpanelEl(panel, i, data.id));
  });
  body.appendChild(wrap);
  root.appendChild(body);
}

/* iceberg (v1.12) -------------------------------------------------------- */
// DOM: title → subtitle → .slide__iceberg(svg → ul.iceberg__above → ul.iceberg__below) → .iceberg__footer.
// SVG는 캔버스 전체 좌표(1920×1080) 장식층. 색·음영은 클래스/data 속성으로 CSS가 지정한다.

function icebergList(list, max) {
  return (Array.isArray(list) ? list : []).slice(0, max).map(objectOr);
}

function icebergPoints(vertices) {
  return vertices.map(([x, y]) => `${x},${y}`).join(' ');
}

function icebergSeaGradientEl(gradientId) {
  const gradient = svgEl('linearGradient', 'iceberg__gradient', {
    id: gradientId, gradientUnits: 'userSpaceOnUse',
    x1: 0, y1: ICEBERG_ART.waterY, x2: 0, y2: SLIDE_HEIGHT,
  });
  gradient.dataset.gradient = 'sea';
  ICEBERG_ART.seaStops.forEach(([name, offset]) => {
    const stop = svgEl('stop', 'iceberg__stop', { offset });
    stop.dataset.stop = name;
    gradient.appendChild(stop);
  });
  return gradient;
}

// 바다 면 + 수면 원호 + 수면선. 바다 rect는 fill에 그라데이션 참조(url)만 둔다 — 색 값이 아님.
function appendIcebergSea(svg, slideId) {
  const gradientId = `${String(slideId).replace(/[^\w-]/g, '_')}--iceberg-sea`;
  const defs = svgEl('defs');
  defs.appendChild(icebergSeaGradientEl(gradientId));
  svg.appendChild(defs);
  const y = ICEBERG_ART.waterY;
  svg.appendChild(svgEl('rect', 'iceberg__sea', {
    x: 0, y, width: SLIDE_WIDTH, height: SLIDE_HEIGHT - y, fill: `url(#${gradientId})`,
  }));
  const arc = svgEl('path', 'iceberg__waterline', { d: ICEBERG_ART.arc });
  arc.dataset.kind = 'arc';
  svg.appendChild(arc);
}

function appendIcebergFacets(svg, part) {
  ICEBERG_ART[part].forEach(([shade, ...vertices]) => {
    const facet = svgEl('polygon', 'iceberg__facet', { points: icebergPoints(vertices) });
    facet.dataset.part = part;
    facet.dataset.shade = String(shade);
    svg.appendChild(facet);
  });
}

function appendIcebergWaterline(svg) {
  const y = ICEBERG_ART.waterY;
  const line = svgEl('path', 'iceberg__waterline', { d: `M0,${y} L${SLIDE_WIDTH},${y}` });
  line.dataset.kind = 'line';
  svg.appendChild(line);
}

// n# = 실제 있는 노드만, p# = 장식 점
function icebergAnchors(nodeCount) {
  const anchors = new Map();
  ICEBERG_ART.nodes.slice(0, nodeCount).forEach((pt, i) => anchors.set(`n${i}`, pt));
  ICEBERG_ART.points.forEach((pt, i) => anchors.set(`p${i}`, pt));
  return anchors;
}

function icebergDotEl([cx, cy], size) {
  const dot = svgEl('circle', 'iceberg__dot', { cx, cy, r: ICEBERG_ART.dotRadius[size] });
  dot.dataset.size = size;
  return dot;
}

function appendIcebergNetwork(svg, nodeCount) {
  const anchors = icebergAnchors(nodeCount);
  ICEBERG_ART.links
    .filter(([a, b]) => anchors.has(a) && anchors.has(b))
    .forEach(([a, b]) => {
      const [x1, y1] = anchors.get(a);
      const [x2, y2] = anchors.get(b);
      svg.appendChild(svgEl('line', 'iceberg__link', { x1, y1, x2, y2 }));
    });
  ICEBERG_ART.scatter.forEach((pt) => svg.appendChild(icebergDotEl(pt, 's')));
  ICEBERG_ART.points.forEach((pt) => svg.appendChild(icebergDotEl(pt, 's')));
  ICEBERG_ART.nodes.slice(0, nodeCount).forEach((pt) => svg.appendChild(icebergDotEl(pt, 'm')));
}

// 그리는 순서(뒤→앞): 바다 → 원호 → 수면 아래 면 → 수면 위 면 → 수면선 → 네트워크
function icebergArtEl(slideId, nodeCount) {
  const svg = svgEl('svg', 'iceberg__art', {
    viewBox: ICEBERG_ART.viewBox, 'aria-hidden': 'true', focusable: 'false',
  });
  appendIcebergSea(svg, slideId);
  appendIcebergFacets(svg, 'below');
  appendIcebergFacets(svg, 'above');
  appendIcebergWaterline(svg);
  appendIcebergNetwork(svg, nodeCount);
  return svg;
}

function icebergAboveEl(items) {
  const slots = ICEBERG_ABOVE_SLOTS[items.length] ?? [];
  const list = el('ul', 'iceberg__above');
  items.forEach((item, i) => {
    const li = el('li', 'iceberg__item');
    li.dataset.pos = String(i);
    li.dataset.slot = String(slots[i] ?? i);
    li.dataset.tone = pickAllowed(item.tone, ICEBERG_TONES);
    appendIf(li, item.heading, (v) => textEl('h3', 'iceberg__heading', v));
    appendIf(li, item.text, (v) => textEl('p', 'iceberg__text', v));
    appendIf(li, item.example, (v) => textEl('p', 'iceberg__example', v));
    list.appendChild(li);
  });
  return list;
}

function icebergBelowEl(items) {
  const list = el('ul', 'iceberg__below');
  items.forEach((item, i) => {
    const li = el('li', 'iceberg__node');
    li.dataset.pos = String(i);
    appendIf(li, item.heading, (v) => textEl('h3', 'iceberg__node-heading', v));
    appendIf(li, item.text, (v) => textEl('p', 'iceberg__node-text', v));
    list.appendChild(li);
  });
  return list;
}

function icebergFlowEl(steps) {
  const p = el('p', 'iceberg__flow');
  steps.forEach((step, i) => {
    if (i > 0) {
      const arrow = el('span', 'iceberg__flow-arrow');
      arrow.textContent = ICEBERG_FLOW_ARROW;
      p.appendChild(arrow);
    }
    p.appendChild(textEl('span', 'iceberg__flow-step', step));
  });
  return p;
}

function icebergFlowSteps(flow) {
  return (Array.isArray(flow) ? flow : [])
    .slice(0, ICEBERG_FLOW_RANGE.max)
    .filter((s) => (typeof s === 'string' || typeof s === 'number') && !isMissing(s))
    .map(String);
}

function icebergFooterEl(data) {
  const steps = icebergFlowSteps(data.flow);
  if (!steps.length && isMissing(data.message)) return null;
  const footer = el('div', 'iceberg__footer');
  if (steps.length) footer.appendChild(icebergFlowEl(steps));
  appendIf(footer, data.message, (v) => textEl('p', 'iceberg__message', v));
  return footer;
}

function renderIceberg(data, root) {
  const above = icebergList(data.above, ICEBERG_ABOVE_RANGE.max);
  const below = icebergList(data.below, ICEBERG_BELOW_RANGE.max);
  root.appendChild(titleEl(data.title));
  appendIf(root, data.subtitle, subtitleEl);
  const wrap = el('div', 'slide__iceberg');
  wrap.dataset.aboveCount = String(above.length);
  wrap.dataset.belowCount = String(below.length);
  wrap.appendChild(icebergArtEl(data.id, below.length));
  wrap.appendChild(icebergAboveEl(above));
  wrap.appendChild(icebergBelowEl(below));
  root.appendChild(wrap);
  const footer = icebergFooterEl(data);
  if (footer) root.appendChild(footer);
}

/* interview (v1.13) ------------------------------------------------------- */
// DOM: .interview__media(img · credit) → (stepbar) → .interview__body(kicker → title → quote →
// interviewee → insights → implication → source). stepbar·kicker·source는 공통 삽입 단계가 배치한다.

function interviewInsights(list) {
  return (Array.isArray(list) ? list : []).slice(0, INTERVIEW_INSIGHTS_RANGE.max).map(objectOr);
}

function interviewInsightEl(item) {
  const li = el('li', 'interview__insight');
  li.appendChild(textEl('h3', 'interview__insight-heading', item.heading));
  appendIf(li, item.text, (v) => textEl('p', 'interview__insight-text', v));
  return li;
}

function interviewInsightsEl(items) {
  const ul = el('ul', 'interview__insights');
  ul.dataset.count = String(items.length);
  items.forEach((item) => ul.appendChild(interviewInsightEl(item)));
  return ul;
}

function interviewBodyEl(data) {
  const body = el('div', 'interview__body');
  body.appendChild(titleEl(data.title));
  body.appendChild(textEl('blockquote', 'interview__quote', data.quote));
  appendIf(body, data.interviewee, (v) => textEl('p', 'interview__interviewee', v));
  const insights = interviewInsights(data.insights);
  if (insights.length) body.appendChild(interviewInsightsEl(insights));
  appendIf(body, data.implication, (v) => textEl('p', 'interview__implication', v));
  return body;
}

function renderInterview(data, root) {
  const image = validImage(data.image);
  if (image) root.appendChild(mediaEl('interview__media', 'interview__image', image, data.id));
  root.appendChild(interviewBodyEl(data));
}

/* contrast (v1.14) ------------------------------------------------------- */
// DOM: (stepbar) → (kicker) → h2.slide__title → .slide__contrast(.contrast__side[left] → [right]) → (source).
// 각 side: label → headline → lines → stats → (v1.15) .contrast__media[data-count=1|2] > img.contrast__image[data-focus][data-fit] ×1~2 (v1.16). stepbar·kicker·source는 공통 삽입 단계가 배치한다.

function contrastList(list, max) {
  return (Array.isArray(list) ? list : []).slice(0, max);
}

function contrastLinesEl(lines) {
  const ul = el('ul', 'contrast__lines');
  lines.forEach((line) => appendIf(ul, line, (v) => textEl('li', 'contrast__line', v)));
  return ul;
}

function contrastStatEl(stat) {
  const data = objectOr(stat);
  const li = el('li', 'contrast__stat');
  appendIf(li, data.value, (v) => textEl('span', 'contrast__stat-value', v));
  appendIf(li, data.label, (v) => textEl('span', 'contrast__stat-label', v));
  return li;
}

function contrastStatsEl(stats) {
  const ul = el('ul', 'contrast__stats');
  stats.map(contrastStatEl).forEach((li) => { if (li.childNodes.length) ul.appendChild(li); });
  ul.dataset.count = String(ul.children.length);
  return ul;
}

function contrastSideEl(side, name, slideId) {
  const data = objectOr(side);
  const div = el('div', 'contrast__side');
  div.dataset.side = name;
  appendIf(div, data.label, (v) => textEl('p', 'contrast__label', v));
  appendIf(div, data.headline, (v) => textEl('p', 'contrast__headline', v));
  const lines = contrastList(data.lines, CONTRAST_MAX_LINES);
  if (lines.length) {
    const ul = contrastLinesEl(lines);
    if (ul.children.length) div.appendChild(ul);
  }
  const stats = contrastList(data.stats, CONTRAST_MAX_STATS);
  if (stats.length) {
    const ul = contrastStatsEl(stats);
    if (ul.children.length) div.appendChild(ul);
  }
  appendContrastImage(div, data.image, slideId);
  return div;
}

// v1.16: side.image(객체 1개 또는 배열)를 유효한 사진 목록(최대 2개)으로 정규화한다.
function contrastImages(image) {
  const list = Array.isArray(image) ? image.slice(0, CONTRAST_MAX_IMAGES) : [image];
  return list.map(validImage).filter(Boolean);
}

function contrastImageEl(image, slideId) {
  const img = focusImageEl(image, 'contrast__image', slideId);
  img.dataset.fit = pickAllowed(image.fit, CONTRAST_FITS);
  return img;
}

// v1.15/v1.16: 유효한 사진이 있으면 side 맨 끝에 .contrast__media[data-count] > img.contrast__image(순서대로)를 붙인다.
function appendContrastImage(div, image, slideId) {
  const images = contrastImages(image);
  if (!images.length) return;
  const media = el('div', 'contrast__media');
  media.dataset.count = String(images.length);
  images.forEach((item) => media.appendChild(contrastImageEl(item, slideId)));
  div.appendChild(media);
  div.dataset.hasImage = '';
}

function renderContrast(data, root) {
  root.appendChild(titleEl(data.title));
  const wrap = el('div', 'slide__contrast');
  CONTRAST_SIDES.forEach((name) => wrap.appendChild(contrastSideEl(data[name], name, data.id)));
  root.appendChild(wrap);
}

const RENDERERS = {
  cover: renderCover,
  section: renderSection,
  bullets: renderBullets,
  'two-column': renderTwoColumn,
  image: renderImage,
  stats: renderStats,
  quote: renderQuote,
  closing: renderClosing,
  references: renderReferences,
  'big-number': renderBigNumber,
  process: renderProcess,
  chart: renderChart,
  comparison: renderComparison,
  split: renderSplit,
  matrix: renderMatrix,
  cards: renderCards,
  band: renderBand,
  tree: renderTree,
  equation: renderEquation,
  pillars: renderPillars,
  roc: renderRoc,
  'data-panels': renderDataPanels,
  iceberg: renderIceberg,
  interview: renderInterview,
  contrast: renderContrast,
};

/* 공통 필드 (kicker · source · step) -------------------------------------- */

function hasStepbar(data, steps) {
  return !NO_STEPBAR_TYPES.includes(data.renderType)
    && Number.isInteger(data.step) && data.step >= 0
    && steps.length > 0;
}

function stepbarItemEl(label, index, current) {
  const position = index + 1;
  const li = el('li', 'stepbar__item');
  if (current > 0 && position < current) li.classList.add('is-done');
  if (position === current) {
    li.classList.add('is-current');
    li.setAttribute('aria-current', 'step');
  }
  const num = el('span', 'stepbar__index');
  num.textContent = String(position);
  li.appendChild(num);
  li.appendChild(textEl('span', 'stepbar__label', label));
  return li;
}

// 진행 표시줄은 캔버스 첫 자식으로 둔다(위치는 designer가 안전 영역 상단에 지정).
function insertStepbar(data, root, steps) {
  if (!hasStepbar(data, steps)) return;
  // 범위를 넘는 step은 강조 없이(0과 동일) 그린다.
  const current = data.step <= steps.length ? data.step : 0;
  root.dataset.step = String(current);
  const ol = el('ol', 'stepbar');
  ol.setAttribute('aria-label', '진행 단계');
  steps.forEach((label, i) => ol.appendChild(stepbarItemEl(label, i, current)));
  const anchor = STEPBAR_AFTER[data.renderType] && root.querySelector(STEPBAR_AFTER[data.renderType]);
  if (anchor) anchor.after(ol);
  else root.prepend(ol);
}

// kicker는 첫 .slide__title 바로 앞에 둔다. 제목이 없으면 split__text 또는 슬라이드 맨 앞.
function insertKicker(data, root) {
  if (NO_KICKER_TYPES.includes(data.renderType) || isMissing(data.kicker)) return;
  const kicker = textEl('p', 'slide__kicker', data.kicker);
  const title = root.querySelector('.slide__title');
  if (title) {
    title.before(kicker);
    return;
  }
  const container = root.querySelector(KICKER_FALLBACK_CONTAINER) ?? root;
  container.prepend(kicker);
}

// 배경 사진 로드 실패 시 배경 관련 속성을 지워 일반 슬라이드로 되돌린다.
function fallbackToPlainSlide(root, bg) {
  BACKGROUND_ATTRS.forEach((key) => delete root.dataset[key]);
  bg.hidden = true;
}

function backgroundEl(image, slideId, root) {
  const bg = el('div', 'slide__bg');
  bg.appendChild(focusImageEl(image, 'slide__bg-image', slideId, () => fallbackToPlainSlide(root, bg)));
  const overlay = el('div', 'slide__bg-overlay');
  overlay.setAttribute('aria-hidden', 'true');
  bg.appendChild(overlay);
  appendIf(bg, image.credit, creditEl);
  return bg;
}

// .slide__bg는 진행 표시줄보다 앞인 캔버스 첫 자식. bgImage는 normalizeSlide에서 허용 타입만 남긴다.
function insertBackground(data, root) {
  const image = data.bgImage;
  if (!image) return;
  root.dataset.hasBg = '';
  root.dataset.overlay = pickAllowed(image.overlay, BACKGROUND_OVERLAYS);
  root.prepend(backgroundEl(image, data.id, root));
}

function appendSource(data, root) {
  if (NO_COMMON_SOURCE_TYPES.includes(data.renderType) || isMissing(data.source)) return;
  const selector = SOURCE_CONTAINER[data.renderType];
  const container = (selector && root.querySelector(selector)) ?? root;
  container.appendChild(textEl('p', 'slide__source', data.source));
}

/* ------------------------------------------------------------------ */
/* 검증 · 정규화                                                       */
/* ------------------------------------------------------------------ */

function isMissing(value) {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0);
}

function validateDeck(data) {
  if (!data || typeof data !== 'object') throw new Error('slides.json 최상위 값이 객체가 아닙니다.');
  if (!Array.isArray(data.slides) || data.slides.length === 0) {
    throw new Error('slides 배열이 없거나 비어 있습니다.');
  }
  if (isMissing(data.version)) console.warn('[slides] version 필드가 없습니다.');
  else if (!SUPPORTED_VERSIONS.includes(String(data.version))) {
    console.warn(`[slides] 지원하지 않는 스키마 version "${data.version}" (지원: ${SUPPORTED_VERSIONS.join(', ')})`);
  }
  if (isMissing(data.meta?.title)) console.warn('[slides] meta.title 필드가 없습니다.');
  if (data.meta?.aspectRatio !== '16:9') console.warn('[slides] meta.aspectRatio는 "16:9"여야 합니다.');
}

function validateReferences(slide, label) {
  if (!isMissing(slide.category) && !REFERENCE_CATEGORY_LABELS[slide.category]) {
    console.warn(`[slides] ${label}: 알 수 없는 category "${slide.category}" — 기타로 표시합니다.`);
  }
  if (slide.items != null && !Array.isArray(slide.items)) {
    console.warn(`[slides] ${label}: items는 배열이어야 합니다.`);
    return;
  }
  const items = slide.items ?? [];
  if (items.length > MAX_REFERENCE_ITEMS) {
    console.warn(`[slides] ${label}: items ${items.length}개 — 슬라이드당 최대 ${MAX_REFERENCE_ITEMS}개입니다. 슬라이드를 분할하세요.`);
  }
  items.forEach((item, i) => {
    const data = item && typeof item === 'object' ? item : {};
    REFERENCE_ITEM_FIELDS
      .filter((field) => isMissing(data[field]))
      .forEach((field) => console.warn(`[slides] ${label}: items[${i}] 필수 필드 "${field}" 누락`));
  });
}

function warnRange(label, name, count, { min, max }) {
  if (count < min || count > max) {
    console.warn(`[slides] ${label}: ${name} ${count}개 — ${min}~${max}개여야 합니다.`);
  }
}

function warnTextLimits(slide, label, limits = []) {
  limits.forEach(([field, max]) => {
    const value = slide[field];
    if (typeof value === 'string' && value.length > max) {
      console.warn(`[slides] ${label}: ${field} ${value.length}자 — ${max}자 이내여야 합니다.`);
    }
  });
}

function warnArrayField(slide, label, field) {
  if (slide[field] != null && !Array.isArray(slide[field])) {
    console.warn(`[slides] ${label}: ${field}는 배열이어야 합니다.`);
    return false;
  }
  return Array.isArray(slide[field]);
}

function validateProcess(slide, label) {
  (Array.isArray(slide.steps) ? slide.steps : []).forEach((step, i) => {
    const data = step && typeof step === 'object' ? step : {};
    if (isMissing(data.label)) console.warn(`[slides] ${label}: steps[${i}] 필수 필드 "label" 누락`);
    warnTextLimits(data, `${label} steps[${i}]`, [['label', 12], ['text', 40], ['gate', 20]]);
    if (!isMissing(data.gate) && i === slide.steps.length - 1) {
      console.warn(`[slides] ${label}: steps[${i}].gate — 마지막 단계에는 gate를 쓰지 않습니다. 표시하지 않습니다.`);
    }
  });
  if (slide.layout != null && !PROCESS_LAYOUTS.includes(slide.layout)) {
    console.warn(`[slides] ${label}: layout ${JSON.stringify(slide.layout)} — ${PROCESS_LAYOUTS.join(' | ')}만 허용합니다. 기본 배치로 표시합니다.`);
  }
}

function validateEquationPart(part, name) {
  const data = objectOr(part);
  if (isMissing(data.label)) console.warn(`[slides] ${name}: 필수 필드 "label" 누락`);
  warnTextLimits(data, name, [['label', EQUATION_LIMITS.label], ['text', EQUATION_LIMITS.text]]);
}

function validateEquationOperators(slide, label, termCount) {
  if (slide.operators == null) return;
  const ops = Array.isArray(slide.operators) ? slide.operators : [];
  const expected = Math.max(termCount - 1, 0);
  if (!Array.isArray(slide.operators) || ops.length !== expected) {
    console.warn(`[slides] ${label}: operators 길이 ${ops.length} ≠ terms−1(${expected}) — 부족한 자리는 "${EQUATION_DEFAULT_OP}"로 채우고 남는 값은 무시합니다.`);
  }
  ops.forEach((op, i) => {
    const text = op == null ? '' : String(op);
    if (!text || text.length > EQUATION_LIMITS.operator) {
      console.warn(`[slides] ${label}: operators[${i}] ${JSON.stringify(op)} — 1~${EQUATION_LIMITS.operator}자여야 합니다.`);
    }
  });
}

function validateEquation(slide, label) {
  const terms = warnArrayField(slide, label, 'terms') ? slide.terms : [];
  if (terms.length) warnRange(label, 'terms', terms.length, EQUATION_TERMS_RANGE);
  terms.forEach((term, i) => validateEquationPart(term, `${label} terms[${i}]`));
  if (slide.result != null) validateEquationPart(slide.result, `${label} result`);
  validateEquationOperators(slide, label, terms.length);
}

function validatePillarPart(part, name) {
  const data = objectOr(part);
  if (isMissing(data.value) && isMissing(data.title)) console.warn(`[slides] ${name}: "value" 또는 "title" 중 하나는 필수입니다.`);
  warnTextLimits(data, name, PILLAR_FIELDS.map((field) => [field, PILLAR_LIMITS[field]]));
  warnAllowed(name, 'tone', data.tone, PILLAR_TONES);
}

function validatePillars(slide, label) {
  const pillars = warnArrayField(slide, label, 'pillars') ? slide.pillars : [];
  if (pillars.length) warnRange(label, 'pillars', pillars.length, PILLARS_RANGE);
  pillars.forEach((pillar, i) => validatePillarPart(pillar, `${label} pillars[${i}]`));
  if (slide.base != null) validatePillarPart(slide.base, `${label} base`);
}

function validateRocPoints(points, name) {
  if (!Array.isArray(points)) {
    console.warn(`[slides] ${name}: 필수 필드 "points" 누락 또는 배열 아님 — 곡선을 그리지 않습니다.`);
    return;
  }
  const bad = points.filter((p) => !isRocPoint(p)).length;
  if (bad) console.warn(`[slides] ${name}: points 중 ${bad}개가 [x, y](0~1 숫자) 형식이 아닙니다 — 제외하고 그립니다.`);
  if (points.length - bad < 2) console.warn(`[slides] ${name}: 유효한 points가 2개 미만 — 곡선을 그리지 않습니다.`);
}

function validateRocCurve(curve, i, label) {
  const data = objectOr(curve);
  const name = `${label} curves[${i}]`;
  if (isMissing(data.name)) console.warn(`[slides] ${name}: 필수 필드 "name" 누락`);
  validateRocPoints(data.points, name);
  warnAllowed(name, 'style', data.style, ROC_STYLES);
  warnTextLimits(data, name, [['name', ROC_LIMITS.name], ['desc', ROC_LIMITS.desc]]);
  if (data.auc != null && typeof data.auc !== 'string') console.warn(`[slides] ${name}: auc는 문자열이어야 합니다 (예: "0.78").`);
}

function validateRocCurves(slide, label) {
  const curves = warnArrayField(slide, label, 'curves') ? slide.curves : [];
  if (curves.length) warnRange(label, 'curves', curves.length, ROC_CURVES_RANGE);
  curves.forEach((c, i) => validateRocCurve(c, i, label));
  const fills = curves.filter((c) => objectOr(c).fill === true).length;
  if (fills > 1) console.warn(`[slides] ${label}: fill 곡선 ${fills}개 — 하나만 권장합니다. 첫 번째만 면을 그립니다.`);
  return curves.map((c) => objectOr(c).id).filter((id) => !isMissing(id));
}

function validateRocMarkers(slide, label, curveIds) {
  if (!warnArrayField(slide, label, 'markers')) return 0;
  slide.markers.forEach((raw, i) => {
    const m = objectOr(raw);
    const name = `${label} markers[${i}]`;
    if (!isRocPoint(m.point)) console.warn(`[slides] ${name}: point는 [x, y](0~1 숫자)여야 합니다 — 표시하지 않습니다.`);
    if (!isMissing(m.curve) && !curveIds.includes(m.curve)) console.warn(`[slides] ${name}: curve "${m.curve}"와 같은 id의 곡선이 없습니다.`);
    warnAllowed(name, 'style', m.style, ROC_MARKER_STYLES);
  });
  return slide.markers.length;
}

function validateRocNote(note, label) {
  if (note == null) return 0;
  const data = objectOr(note);
  if (!isRocPoint(data.at)) console.warn(`[slides] ${label}: note.at은 [x, y](0~1 숫자)여야 합니다 — 노트와 지시선을 그리지 않습니다.`);
  const items = Array.isArray(data.items) ? data.items : [];
  items.forEach((raw, i) => {
    const lines = Array.isArray(objectOr(raw).lines) ? objectOr(raw).lines : [];
    warnStringList(lines, `${label} note.items[${i}]`, 'lines', ROC_LIMITS.lines, ROC_LIMITS.line);
  });
  return items.length;
}

function validateRoc(slide, label) {
  warnTextLimits(slide, label, [['title', ROC_LIMITS.title]]);
  const axes = objectOr(slide.axes);
  ['x', 'y'].forEach((key) => {
    if (isMissing(axes[key])) console.warn(`[slides] ${label}: 필수 필드 "axes.${key}" 누락`);
  });
  warnTextLimits(axes, `${label} axes`, [['x', ROC_LIMITS.axis], ['y', ROC_LIMITS.axis]]);
  const curveIds = validateRocCurves(slide, label);
  const markerCount = validateRocMarkers(slide, label, curveIds);
  const itemCount = validateRocNote(slide.note, label);
  if (slide.note != null && markerCount !== itemCount) {
    console.warn(`[slides] ${label}: markers ${markerCount}개 ≠ note.items ${itemCount}개 — 짝이 맞는 앞쪽만 지시선으로 잇습니다.`);
  }
  if (warnArrayField(slide, label, 'takeaways')) {
    warnRange(label, 'takeaways', slide.takeaways.length, ROC_TAKEAWAYS_RANGE);
    warnStringList(slide.takeaways, label, 'takeaways', ROC_TAKEAWAYS_RANGE.max, ROC_LIMITS.takeaway);
  }
}

function validateTwoColumn(slide, label) {
  ['left', 'right'].forEach((side) => {
    const column = slide[side];
    if (column && typeof column === 'object') warnAllowed(label, `${side}.tone`, column.tone, COLUMN_TONES);
  });
}

function validateMatrixAxes(axes, label) {
  ['x', 'y'].forEach((key) => {
    const axis = objectOr(axes[key]);
    if (isMissing(axis.label)) console.warn(`[slides] ${label}: 필수 필드 "axes.${key}.label" 누락`);
    warnTextLimits(axis, `${label} axes.${key}`, [['label', 12], ['low', 12], ['high', 12]]);
  });
}

function validateQuadrant(q, i, label, seen) {
  const data = objectOr(q);
  const name = `${label} quadrants[${i}]`;
  if (!MATRIX_POSITIONS.includes(data.position)) {
    console.warn(`[slides] ${name}: position ${JSON.stringify(data.position)} — ${MATRIX_POSITIONS.join(' | ')} 중 하나여야 합니다. 표시하지 않습니다.`);
  } else if (seen.has(data.position)) {
    console.warn(`[slides] ${name}: position "${data.position}" 중복 — 첫 번째 사분면만 표시합니다.`);
  }
  seen.add(data.position);
  if (isMissing(data.label)) console.warn(`[slides] ${name}: 필수 필드 "label" 누락`);
  warnTextLimits(data, name, [['label', 16], ['text', 50]]);
  warnAllowed(name, 'tone', data.tone, MATRIX_TONES);
  if (data.items == null) return;
  if (!Array.isArray(data.items)) {
    console.warn(`[slides] ${name}: items는 배열이어야 합니다.`);
    return;
  }
  if (data.items.length > MATRIX_MAX_ITEMS) console.warn(`[slides] ${name}: items ${data.items.length}개 — 최대 ${MATRIX_MAX_ITEMS}개입니다.`);
  data.items.forEach((item, j) => {
    if (typeof item === 'string' && item.length > 16) console.warn(`[slides] ${name}: items[${j}] ${item.length}자 — 16자 이내여야 합니다.`);
  });
}

function validateMatrix(slide, label) {
  validateMatrixAxes(objectOr(slide.axes), label);
  const seen = new Set();
  (Array.isArray(slide.quadrants) ? slide.quadrants : []).forEach((q, i) => validateQuadrant(q, i, label, seen));
}

function validateChart(slide, label) {
  const chart = slide.chart;
  if (!chart || typeof chart !== 'object') return;
  if (!CHART_KINDS.includes(chart.kind)) {
    console.warn(`[slides] ${label}: chart.kind "${chart.kind}" — ${CHART_KINDS.map((k) => `"${k}"`).join(' | ')}이어야 합니다. bar로 표시합니다.`);
  }
  if (!Array.isArray(chart.data)) {
    console.warn(`[slides] ${label}: 필수 필드 "chart.data"(배열) 누락`);
    return;
  }
  warnRange(label, 'chart.data', chart.data.length, CHART_DATA_RANGE);
  if (chart.kind === 'hbar' && chart.data.length > HBAR.recommendedMax) {
    console.warn(`[slides] ${label}: hbar chart.data ${chart.data.length}개 — ${HBAR.recommendedMax}개 이하를 권장합니다.`);
  }
  chart.data.forEach((item, i) => {
    const data = item && typeof item === 'object' ? item : {};
    if (isMissing(data.label)) console.warn(`[slides] ${label}: chart.data[${i}] 필수 필드 "label" 누락`);
    warnTextLimits(data, `${label} chart.data[${i}]`, [['label', 10]]);
  });
  validateBaseline(chart.baseline, label);
}

function validateBaseline(baseline, label) {
  if (baseline === undefined) return;
  if (!baseline || typeof baseline !== 'object') {
    console.warn(`[slides] ${label}: chart.baseline은 { value, label } 객체여야 합니다 — 무시합니다.`);
    return;
  }
  if (typeof baseline.value !== 'number' || !Number.isFinite(baseline.value)) {
    console.warn(`[slides] ${label}: chart.baseline.value가 숫자가 아닙니다 (${JSON.stringify(baseline.value)}) — 기준선을 그리지 않습니다.`);
  }
  if (isMissing(baseline.label)) console.warn(`[slides] ${label}: chart.baseline 필수 필드 "label" 누락`);
  else warnTextLimits(baseline, `${label} chart.baseline`, [['label', 16]]);
}

function validateComparison(slide, label) {
  const columns = Array.isArray(slide.columns) ? slide.columns : [];
  columns.forEach((col, i) => {
    if (typeof col === 'string' && col.length > 20) console.warn(`[slides] ${label}: columns[${i}] ${col.length}자 — 20자 이내여야 합니다.`);
  });
  if (!warnArrayField(slide, label, 'rows')) return;
  warnRange(label, 'rows', slide.rows.length, COMPARISON_ROWS_RANGE);
  const cellLimit = columns.length >= COMPARISON_WIDE_COLUMNS ? COMPARISON_CELL_LIMIT.wide : COMPARISON_CELL_LIMIT.normal;
  slide.rows.forEach((row, i) => {
    const data = row && typeof row === 'object' ? row : {};
    if (isMissing(data.label)) console.warn(`[slides] ${label}: rows[${i}] 필수 필드 "label" 누락`);
    warnTextLimits(data, `${label} rows[${i}]`, [['label', 10]]);
    const values = Array.isArray(data.values) ? data.values : [];
    if (values.length !== columns.length) {
      console.warn(`[slides] ${label}: rows[${i}].values 길이 ${values.length} ≠ columns 수 ${columns.length}`);
    }
    values.forEach((v, j) => {
      if (typeof v === 'string' && v.length > cellLimit) console.warn(`[slides] ${label}: rows[${i}].values[${j}] ${v.length}자 — 열 ${columns.length}개일 때 ${cellLimit}자 이내여야 합니다.`);
    });
    validateComparisonMarks(data, values.length, `${label} rows[${i}]`);
  });
  warnIndex(label, 'highlight', slide.highlight, columns.length);
  warnIndex(label, 'highlightRow', slide.highlightRow, slide.rows.length);
}

function warnIndex(label, name, value, length) {
  if (value != null && !(Number.isInteger(value) && value >= 0 && value < length)) {
    console.warn(`[slides] ${label}: ${name} ${JSON.stringify(value)} — 0~${length - 1} 범위의 정수여야 합니다.`);
  }
}

function validateComparisonMarks(row, valueCount, label) {
  if (row.marks == null) return;
  if (!Array.isArray(row.marks)) {
    console.warn(`[slides] ${label}: marks는 배열이어야 합니다.`);
    return;
  }
  if (row.marks.length !== valueCount) console.warn(`[slides] ${label}: marks 길이 ${row.marks.length} ≠ values 길이 ${valueCount}`);
  row.marks.forEach((mark, j) => {
    if (mark != null && !COMPARISON_MARKS.includes(mark)) {
      console.warn(`[slides] ${label}: marks[${j}] ${JSON.stringify(mark)} — null | ${COMPARISON_MARKS.map((m) => `"${m}"`).join(' | ')} 중 하나여야 합니다. 표시하지 않습니다.`);
    }
  });
}

function validateSplit(slide, label) {
  const hasBullets = Array.isArray(slide.bullets) && slide.bullets.length > 0;
  const hasImage = slide.image && typeof slide.image === 'object';
  if (!hasBullets && isMissing(slide.body) && !hasImage) {
    console.warn(`[slides] ${label}: bullets | body | image 중 하나 이상이 필요합니다.`);
  }
  if (hasBullets) {
    if (slide.bullets.length > SPLIT_MAX_BULLETS) console.warn(`[slides] ${label}: bullets ${slide.bullets.length}개 — 최대 ${SPLIT_MAX_BULLETS}개입니다.`);
    slide.bullets.forEach((b, i) => {
      const text = typeof b === 'string' ? b : b?.text;
      if (typeof text === 'string' && text.length > 50) console.warn(`[slides] ${label}: bullets[${i}] ${text.length}자 — 50자 이내여야 합니다.`);
    });
  }
  if (hasImage) {
    ['src', 'alt']
      .filter((field) => isMissing(slide.image[field]))
      .forEach((field) => console.warn(`[slides] ${label}: 필수 필드 "image.${field}" 누락`));
    warnAllowed(label, 'image.focus', slide.image.focus, COVER_FOCUSES);
  }
  if (slide.imageSide != null && !['left', 'right'].includes(slide.imageSide)) {
    console.warn(`[slides] ${label}: imageSide "${slide.imageSide}" — "left" | "right"이어야 합니다. right로 표시합니다.`);
  }
  validateSplitRatio(slide, label, hasBullets);
}

function validateSplitRatio(slide, label, hasBullets) {
  warnAllowed(label, 'imageRatio', slide.imageRatio, SPLIT_IMAGE_RATIOS);
  if (slide.imageRatio !== SPLIT_WIDE_IMAGE_LIMITS.ratio) return;
  const { ratio, bullets, body } = SPLIT_WIDE_IMAGE_LIMITS;
  if (hasBullets && slide.bullets.length > bullets) {
    console.warn(`[slides] ${label}: imageRatio "${ratio}"이면 bullets 최대 ${bullets}개입니다 (현재 ${slide.bullets.length}개).`);
  }
  if (typeof slide.body === 'string' && slide.body.length > body) {
    console.warn(`[slides] ${label}: imageRatio "${ratio}"이면 body ${body}자 이내여야 합니다 (현재 ${slide.body.length}자).`);
  }
}

// 사진 객체 공통 검증 (cards · band · background). 유효하면 true.
function validateImageObject(image, label, name) {
  if (typeof image !== 'object' || image === null || Array.isArray(image)) {
    console.warn(`[slides] ${label}: ${name}은(는) 객체여야 합니다 — 사진 없이 표시합니다.`);
    return false;
  }
  if (isMissing(image.src)) {
    console.warn(`[slides] ${label}: 필수 필드 "${name}.src" 누락 — 사진 없이 표시합니다.`);
    return false;
  }
  if (isMissing(image.alt)) console.warn(`[slides] ${label}: 필수 필드 "${name}.alt" 누락 — 빈 alt로 표시합니다.`);
  warnAllowed(label, `${name}.focus`, image.focus, COVER_FOCUSES);
  return true;
}

function warnStringList(list, label, name, maxCount, maxLength) {
  if (list.length > maxCount) console.warn(`[slides] ${label}: ${name} ${list.length}개 — 최대 ${maxCount}개입니다.`);
  list.forEach((item, i) => {
    const text = typeof item === 'string' ? item : item?.text;
    if (typeof text === 'string' && text.length > maxLength) {
      console.warn(`[slides] ${label}: ${name}[${i}] ${text.length}자 — ${maxLength}자 이내여야 합니다.`);
    }
  });
}

function validateCard(card, i, label) {
  const data = objectOr(card);
  const name = `${label} cards[${i}]`;
  if (isMissing(data.title)) console.warn(`[slides] ${name}: 필수 필드 "title" 누락`);
  const hasImage = data.image != null && validateImageObject(data.image, name, 'image');
  const limits = hasImage ? CARD_LIMITS.image : CARD_LIMITS.plain;
  warnTextLimits(data, name, [['label', CARD_LIMITS.label], ['title', CARD_LIMITS.title], ['value', CARD_LIMITS.value], ['text', limits.text]]);
  warnAllowed(name, 'tone', data.tone, CARD_TONES);
  if (!isMissing(data.text) && !isMissing(data.bullets)) {
    console.warn(`[slides] ${name}: text와 bullets는 둘 중 하나만 씁니다 — 둘 다 표시합니다.`);
  }
  if (warnArrayField(data, name, 'bullets')) warnStringList(data.bullets, name, 'bullets', limits.bullets, CARD_LIMITS.bullet);
  return hasImage;
}

function validateCards(slide, label) {
  if (!warnArrayField(slide, label, 'cards')) return;
  warnRange(label, 'cards', slide.cards.length, CARDS_RANGE);
  const withImage = slide.cards.map((card, i) => validateCard(card, i, label)).filter(Boolean).length;
  if (withImage > 0 && withImage < slide.cards.length) {
    console.warn(`[slides] ${label}: 카드 ${slide.cards.length}개 중 ${withImage}개만 이미지가 있습니다 — 모두 있거나 모두 없게 써야 높이가 맞습니다.`);
  }
}

function validateBandItems(slide, label) {
  if (!warnArrayField(slide, label, 'items')) return;
  warnRange(label, 'items', slide.items.length, BAND_ITEMS_RANGE);
  slide.items.forEach((item, i) => {
    const data = objectOr(item);
    const name = `${label} items[${i}]`;
    if (isMissing(data.heading)) console.warn(`[slides] ${name}: 필수 필드 "heading" 누락`);
    warnTextLimits(data, name, [['heading', BAND_LIMITS.heading], ['text', BAND_LIMITS.text], ['value', BAND_LIMITS.value]]);
  });
}

function validateBand(slide, label) {
  if (slide.image != null) validateImageObject(slide.image, label, 'image');
  if (isMissing(slide.items) && isMissing(slide.bullets) && isMissing(slide.body)) {
    console.warn(`[slides] ${label}: items | bullets | body 중 하나가 필요합니다.`);
  }
  validateBandItems(slide, label);
  if (warnArrayField(slide, label, 'bullets')) warnStringList(slide.bullets, label, 'bullets', BAND_LIMITS.bullets, BAND_LIMITS.bullet);
  warnTextLimits(slide, label, [['body', BAND_LIMITS.body]]);
  if (typeof slide.title === 'string' && slide.title.length > BAND_LIMITS.titleRecommended) {
    console.info(`[slides] ${label}: band의 title ${slide.title.length}자 — 1줄(${BAND_LIMITS.titleRecommended}자) 이내를 권장합니다.`);
  }
}

// 허용 타입 + 유효한 사진이면 배경 데이터를 돌려준다. 그 외는 경고 후 null(무시).
function normalizeBackground(slide, label) {
  if (slide.background == null) return null;
  if (!BACKGROUND_TYPES.includes(slide.type)) {
    console.warn(`[slides] ${label}: ${slide.type} 타입은 background를 쓸 수 없습니다(허용: ${BACKGROUND_TYPES.join(', ')}) — 무시합니다.`);
    return null;
  }
  if (!validateImageObject(slide.background, label, 'background')) return null;
  warnAllowed(label, 'background.overlay', slide.background.overlay, BACKGROUND_OVERLAYS);
  if (Array.isArray(slide.bullets) && slide.bullets.length > BACKGROUND_MAX_BULLETS) {
    console.warn(`[slides] ${label}: background 사용 시 bullets 최대 ${BACKGROUND_MAX_BULLETS}개입니다 (현재 ${slide.bullets.length}개).`);
  }
  return slide.background;
}

function warnAllowed(label, name, value, allowed) {
  if (value != null && !allowed.includes(value)) {
    console.warn(`[slides] ${label}: ${name} ${JSON.stringify(value)} — ${allowed.map((v) => `"${v}"`).join(' | ')} 중 하나여야 합니다. "${allowed[0]}"로 표시합니다.`);
  }
}

function validateCoverLogo(slide, label) {
  if (slide.logo == null) return;
  const { logo } = slide;
  if (Array.isArray(logo)) {
    if (logo.length > COVER_LOGO_MAX) {
      console.warn(`[slides] ${label}: logo 배열은 최대 ${COVER_LOGO_MAX}개입니다(현재 ${logo.length}개) — 앞 ${COVER_LOGO_MAX}개만 표시합니다.`);
    }
    logo.slice(0, COVER_LOGO_MAX).forEach((item, i) => validateLogoItem(item, `${label}: logo[${i}]`));
    return;
  }
  if (typeof logo !== 'object') {
    console.warn(`[slides] ${label}: logo는 객체 또는 배열이어야 합니다 — 로고 없이 표시합니다.`);
    return;
  }
  validateLogoItem(logo, `${label}: logo`);
}

function validateLogoItem(item, prefix) {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    console.warn(`[slides] ${prefix}는 객체여야 합니다 — 해당 로고 없이 표시합니다.`);
    return;
  }
  if (isMissing(item.src)) console.warn(`[slides] ${prefix}: 필수 필드 "src" 누락 — 해당 로고 없이 표시합니다.`);
  if (isMissing(item.alt)) console.warn(`[slides] ${prefix}: 필수 필드 "alt" 누락 — 빈 alt로 표시합니다.`);
}

function validateCover(slide, label) {
  validateCoverLogo(slide, label);
  if (slide.image == null) return;
  if (typeof slide.image !== 'object' || Array.isArray(slide.image)) {
    console.warn(`[slides] ${label}: image는 객체여야 합니다 — 이미지 없이 표시합니다.`);
    return;
  }
  const { src, alt, focus } = slide.image;
  if (isMissing(src)) console.warn(`[slides] ${label}: 필수 필드 "image.src" 누락 — 이미지 없이 표시합니다.`);
  if (isMissing(alt)) console.warn(`[slides] ${label}: 필수 필드 "image.alt" 누락 — 빈 alt로 표시합니다.`);
  warnAllowed(label, 'image.focus', focus, COVER_FOCUSES);
  warnAllowed(label, 'imageStyle', slide.imageStyle, COVER_IMAGE_STYLES);
  warnAllowed(label, 'overlay', slide.overlay, COVER_OVERLAYS);
  if (typeof slide.title === 'string' && slide.title.length > COVER_IMAGE_TITLE_RECOMMENDED) {
    console.info(`[slides] ${label}: 이미지가 있는 cover의 title ${slide.title.length}자 — ${COVER_IMAGE_TITLE_RECOMMENDED}자 이내를 권장합니다.`);
  }
}

// 정확히 TREE_ARITY개여야 하는 배열. 배열이 아니면 null, 개수가 다르면 경고 후 그대로 돌려준다.
function treeExactList(list, label, name) {
  if (!Array.isArray(list)) {
    if (list != null) console.warn(`[slides] ${label}: ${name}는 배열이어야 합니다.`);
    return null;
  }
  if (list.length !== TREE_ARITY) {
    const action = list.length > TREE_ARITY ? `앞의 ${TREE_ARITY}개만 표시합니다` : '있는 만큼만 표시합니다';
    console.warn(`[slides] ${label}: ${name} ${list.length}개 — 정확히 ${TREE_ARITY}개여야 합니다. ${action}.`);
  }
  return list;
}

function validateTreeLevels(slide, label) {
  treeExactList(slide.levels, label, 'levels')?.forEach((level, i) => {
    const data = objectOr(level);
    const name = `${label} levels[${i}]`;
    if (isMissing(data.question)) console.warn(`[slides] ${name}: 필수 필드 "question" 누락`);
    warnTextLimits(data, name, [['question', TREE_LIMITS.question], ['signal', TREE_LIMITS.signal]]);
  });
}

function validateTreeChild(child, name) {
  const data = objectOr(child);
  ['label', 'leaf']
    .filter((field) => isMissing(data[field]))
    .forEach((field) => console.warn(`[slides] ${name}: 필수 필드 "${field}" 누락`));
  warnTextLimits(data, name, [['label', TREE_LIMITS.label], ['leaf', TREE_LIMITS.leaf]]);
  warnAllowed(name, 'tone', data.tone, TREE_TONES);
}

function validateTreeBranches(slide, label) {
  treeExactList(slide.branches, label, 'branches')?.forEach((branch, i) => {
    const data = objectOr(branch);
    const name = `${label} branches[${i}]`;
    if (isMissing(data.label)) console.warn(`[slides] ${name}: 필수 필드 "label" 누락`);
    warnTextLimits(data, name, [['label', TREE_LIMITS.label]]);
    const children = treeExactList(data.children, name, 'children');
    if (!children) console.warn(`[slides] ${name}: 필수 필드 "children" 누락`);
    children?.forEach((child, j) => validateTreeChild(child, `${name} children[${j}]`));
  });
}

function validateTree(slide, label) {
  warnTextLimits(slide, label, [['root', TREE_LIMITS.root], ['caption', TREE_LIMITS.caption]]);
  validateTreeLevels(slide, label);
  validateTreeBranches(slide, label);
  // background는 normalizeBackground가 허용 타입 검사로 경고·무시한다.
  if (slide.image != null) console.warn(`[slides] ${label}: tree 타입은 image를 쓰지 않습니다 — 무시합니다.`);
}

/* data-panels (v1.9) 검증 */

// figure.src는 assets/images/ 아래 로컬 상대 경로만 허용 (경고 후 렌더링은 계속)
function validateDpanelFigure(figure, name) {
  if (figure == null) return;
  if (!validateImageObject(figure, name, 'figure')) return;
  const src = String(figure.src);
  if (!DPANEL_IMAGE_PATTERN.test(src) || src.includes('..')) {
    console.warn(`[slides] ${name}: figure.src는 assets/images/ 아래 로컬 상대 경로여야 합니다: "${src}"`);
  }
}

function validateDpanelStats(stats, name) {
  if (stats == null) return;
  if (!Array.isArray(stats)) {
    console.warn(`[slides] ${name}: stats는 배열이어야 합니다.`);
    return;
  }
  warnRange(name, 'stats', stats.length, DPANEL_STATS_RANGE);
  stats.forEach((stat, i) => {
    warnTextLimits(objectOr(stat), `${name} stats[${i}]`, [['value', DPANEL_LIMITS.statValue], ['label', DPANEL_LIMITS.statLabel]]);
  });
}

function validateDpanel(panel, i, label) {
  const data = objectOr(panel);
  const name = `${label} panels[${i}]`;
  if (isMissing(data.heading)) console.warn(`[slides] ${name}: 필수 필드 "heading" 누락`);
  if (data.tone != null && !DPANEL_TONES.includes(data.tone)) {
    console.warn(`[slides] ${name}: tone ${JSON.stringify(data.tone)} — "primary" | "secondary" 중 하나여야 합니다. 순서 기본값으로 표시합니다.`);
  }
  validateDpanelStats(data.stats, name);
  warnTextLimits(data, name, [['message', DPANEL_LIMITS.message], ['chartTitle', DPANEL_LIMITS.chartTitle]]);
  validateDpanelFigure(data.figure, name);
  warnTextLimits(objectOr(data.fields), `${name} fields`, [['label', DPANEL_LIMITS.fieldsLabel], ['text', DPANEL_LIMITS.fieldsText]]);
}

function validateDpanelLink(link, label) {
  if (link == null) return;
  const data = objectOr(link);
  const name = `${label} link`;
  warnTextLimits(data, name, [['value', DPANEL_LINK_LIMITS.value], ['label', DPANEL_LINK_LIMITS.label]]);
  // note의 \n은 글자 수에서 제외한다.
  const note = typeof data.note === 'string' ? data.note.replace(/\n/g, '') : '';
  if (note.length > DPANEL_LINK_LIMITS.note) {
    console.warn(`[slides] ${name}: note ${note.length}자 — ${DPANEL_LINK_LIMITS.note}자 이내여야 합니다.`);
  }
}

function validateDataPanels(slide, label) {
  const panels = warnArrayField(slide, label, 'panels') ? slide.panels : [];
  if (panels.length && panels.length !== DPANEL_COUNT) {
    console.warn(`[slides] ${label}: panels ${panels.length}개 — 정확히 ${DPANEL_COUNT}개여야 합니다.${panels.length > DPANEL_COUNT ? ' 앞 2개만 표시합니다.' : ''}`);
  }
  panels.forEach((panel, i) => validateDpanel(panel, i, label));
  validateDpanelLink(slide.link, label);
}

/* iceberg (v1.12) 검증 */

// 배열 필드의 개수·항목 필수 heading·글자 수를 검사한다.
function validateIcebergItems(slide, label, field, range, limits) {
  if (!warnArrayField(slide, label, field)) return;
  const list = slide[field];
  warnRange(label, field, list.length, range);
  if (list.length > range.max) console.warn(`[slides] ${label}: ${field}는 앞의 ${range.max}개만 표시합니다.`);
  list.forEach((item, i) => {
    const data = objectOr(item);
    const name = `${label} ${field}[${i}]`;
    if (isMissing(data.heading)) console.warn(`[slides] ${name}: 필수 필드 "heading" 누락`);
    warnTextLimits(data, name, limits);
    if (field === 'above') warnAllowed(name, 'tone', data.tone, ICEBERG_TONES);
  });
}

function validateIcebergFlow(slide, label) {
  if (slide.flow == null || !warnArrayField(slide, label, 'flow')) return;
  warnRange(label, 'flow', slide.flow.length, ICEBERG_FLOW_RANGE);
  slide.flow.forEach((step, i) => {
    if (typeof step !== 'string') console.warn(`[slides] ${label}: flow[${i}]는 문자열이어야 합니다.`);
    else if (step.length > ICEBERG_LIMITS.flowStep) {
      console.warn(`[slides] ${label}: flow[${i}] ${step.length}자 — ${ICEBERG_LIMITS.flowStep}자 이내여야 합니다.`);
    }
  });
}

function validateIceberg(slide, label) {
  validateIcebergItems(slide, label, 'above', ICEBERG_ABOVE_RANGE, ICEBERG_LIMITS.above);
  validateIcebergItems(slide, label, 'below', ICEBERG_BELOW_RANGE, ICEBERG_LIMITS.below);
  validateIcebergFlow(slide, label);
  // background는 normalizeBackground가 허용 타입 검사로 경고·무시한다.
  if (slide.image != null) console.warn(`[slides] ${label}: iceberg 타입은 image를 쓰지 않습니다 — 무시합니다.`);
}

/* interview (v1.13) 검증 */

function validateInterviewImage(slide, label) {
  if (slide.image == null || !validateImageObject(slide.image, label, 'image')) return;
  const src = String(slide.image.src);
  if (!INTERVIEW_IMAGE_PATTERN.test(src) || src.includes('..')) {
    console.warn(`[slides] ${label}: image.src는 assets/images/ 아래 로컬 상대 경로여야 합니다: "${src}"`);
  }
}

function validateInterviewInsights(slide, label) {
  if (slide.insights == null || !warnArrayField(slide, label, 'insights')) return;
  const { max } = INTERVIEW_INSIGHTS_RANGE;
  warnRange(label, 'insights', slide.insights.length, INTERVIEW_INSIGHTS_RANGE);
  if (slide.insights.length > max) console.warn(`[slides] ${label}: insights는 앞의 ${max}개만 표시합니다.`);
  slide.insights.forEach((item, i) => {
    const data = objectOr(item);
    const name = `${label} insights[${i}]`;
    if (isMissing(data.heading)) console.warn(`[slides] ${name}: 필수 필드 "heading" 누락`);
    warnTextLimits(data, name, INTERVIEW_LIMITS.insight);
  });
}

function validateInterview(slide, label) {
  validateInterviewImage(slide, label);
  validateInterviewInsights(slide, label);
  // background는 normalizeBackground가 허용 타입 검사로 경고·무시한다.
}

/* contrast (v1.14) 검증 */

function validateContrastHeadline(headline, name) {
  if (typeof headline !== 'string') return;
  const lineCount = headline.split('\n').length;
  if (lineCount > CONTRAST_HEADLINE_MAX_LINES) {
    console.warn(`[slides] ${name}: headline ${lineCount}줄 — ${CONTRAST_HEADLINE_MAX_LINES}줄 이내여야 합니다.`);
  }
}

function validateContrastStats(side, name) {
  if (side.stats == null || !warnArrayField(side, name, 'stats')) return;
  if (side.stats.length > CONTRAST_MAX_STATS) {
    console.warn(`[slides] ${name}: stats ${side.stats.length}개 — 최대 ${CONTRAST_MAX_STATS}개입니다. 앞의 ${CONTRAST_MAX_STATS}개만 표시합니다.`);
  }
  side.stats.forEach((stat, i) => {
    const data = objectOr(stat);
    const statName = `${name} stats[${i}]`;
    ['value', 'label'].filter((f) => isMissing(data[f]))
      .forEach((f) => console.warn(`[slides] ${statName}: 필수 필드 "${f}" 누락`));
    warnTextLimits(data, statName, CONTRAST_LIMITS.stat);
  });
}

function validateContrastLines(side, name) {
  if (side.lines == null || !warnArrayField(side, name, 'lines')) return;
  warnStringList(side.lines, name, 'lines', CONTRAST_MAX_LINES, CONTRAST_LIMITS.line);
  if (side.lines.length > CONTRAST_MAX_LINES) console.warn(`[slides] ${name}: lines는 앞의 ${CONTRAST_MAX_LINES}개만 표시합니다.`);
}

function validateContrastSide(side, label, key) {
  const name = `${label} ${key}`;
  if (side == null) return; // 누락은 REQUIRED_FIELDS가 경고한다.
  if (typeof side !== 'object' || Array.isArray(side)) {
    console.warn(`[slides] ${name}: 객체여야 합니다.`);
    return;
  }
  if (isMissing(side.headline)) console.warn(`[slides] ${name}: 필수 필드 "headline" 누락`);
  // headline 글자 수는 줄바꿈·** 표시를 뺀 실제 표시 글자로 센다.
  const visible = typeof side.headline === 'string' ? { ...side, headline: side.headline.replace(/\*\*|\n/g, '') } : side;
  warnTextLimits(visible, name, CONTRAST_LIMITS.side);
  validateContrastHeadline(side.headline, name);
  validateContrastLines(side, name);
  validateContrastStats(side, name);
  validateContrastImage(side, name);
}

// v1.15: side.image — assets/images/ 로컬 경로, alt 필수 (경고 후 렌더링은 계속)
// v1.16: 객체 1개 또는 최대 2개 배열. 각 항목 fit은 "cover" | "contain".
function validateContrastImage(side, name) {
  if (side.image == null) return;
  if (!Array.isArray(side.image)) {
    validateContrastImageItem(side.image, name, 'image');
    return;
  }
  if (side.image.length > CONTRAST_MAX_IMAGES) {
    console.warn(`[slides] ${name}: image ${side.image.length}개 — 최대 ${CONTRAST_MAX_IMAGES}개입니다. 앞의 ${CONTRAST_MAX_IMAGES}개만 표시합니다.`);
  }
  if (!side.image.length) console.warn(`[slides] ${name}: image 배열이 비어 있습니다 — 사진 없이 표시합니다.`);
  side.image.forEach((item, i) => validateContrastImageItem(item, name, `image[${i}]`));
}

function validateContrastImageItem(image, name, field) {
  if (!validateImageObject(image, name, field)) return;
  const src = String(image.src);
  if (!INTERVIEW_IMAGE_PATTERN.test(src) || src.includes('..')) {
    console.warn(`[slides] ${name}: ${field}.src는 assets/images/ 아래 로컬 상대 경로여야 합니다: "${src}"`);
  }
  warnAllowed(name, `${field}.fit`, image.fit, CONTRAST_FITS);
}

// 양쪽 사진은 모두 넣거나 모두 뺀다 (3.24 v1.15). v1.16 배열도 유효 항목이 1개 이상이면 '사진 있음'.
function warnContrastImagePair(slide, label) {
  const withImage = CONTRAST_SIDES.filter((key) => contrastImages(objectOr(slide[key]).image).length > 0);
  if (withImage.length === 1) {
    console.warn(`[slides] ${label}: contrast 사진이 ${withImage[0]} 쪽에만 있습니다 — 양쪽 모두 넣거나 모두 빼야 합니다.`);
  }
}

function validateContrast(slide, label) {
  CONTRAST_SIDES.forEach((key) => validateContrastSide(slide[key], label, key));
  warnContrastImagePair(slide, label);
  // background는 normalizeBackground가 허용 타입 검사로 경고·무시한다.
  if (slide.image != null) console.warn(`[slides] ${label}: contrast 타입은 image를 쓰지 않습니다 — 무시합니다.`);
}

const TYPE_VALIDATORS = {
  contrast: validateContrast,
  interview: validateInterview,
  iceberg: validateIceberg,
  tree: validateTree,
  cover: validateCover,
  references: validateReferences,
  process: validateProcess,
  chart: validateChart,
  comparison: validateComparison,
  split: validateSplit,
  'two-column': validateTwoColumn,
  matrix: validateMatrix,
  cards: validateCards,
  band: validateBand,
  equation: validateEquation,
  pillars: validatePillars,
  roc: validateRoc,
  'data-panels': validateDataPanels,
};

// meta.steps → 문자열 배열 (검증 경고 포함)
function normalizeMetaSteps(meta) {
  const raw = meta?.steps;
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    console.warn('[slides] meta.steps는 문자열 배열이어야 합니다 — 진행 표시줄을 그리지 않습니다.');
    return [];
  }
  if (raw.length > MAX_META_STEPS) console.warn(`[slides] meta.steps ${raw.length}개 — 최대 ${MAX_META_STEPS}개입니다.`);
  return raw.map((s, i) => {
    const text = s == null ? '' : String(s);
    if (text.length > META_STEP_MAX_LENGTH) console.warn(`[slides] meta.steps[${i}] ${text.length}자 — ${META_STEP_MAX_LENGTH}자 이내여야 합니다.`);
    return text;
  });
}

function validateStep(slide, label, steps) {
  if (slide.step == null) return;
  if (!Number.isInteger(slide.step) || slide.step < 0) {
    console.warn(`[slides] ${label}: step ${JSON.stringify(slide.step)} — 0 이상의 정수여야 합니다. 진행 표시줄을 그리지 않습니다.`);
    return;
  }
  if (NO_STEPBAR_TYPES.includes(slide.type)) {
    console.warn(`[slides] ${label}: ${slide.type} 타입은 진행 표시줄(step)을 표시하지 않습니다.`);
    return;
  }
  if (!steps.length) {
    console.warn(`[slides] ${label}: step을 쓰려면 meta.steps가 필요합니다 — 진행 표시줄을 그리지 않습니다.`);
  } else if (slide.step > steps.length) {
    console.warn(`[slides] ${label}: step ${slide.step} — meta.steps(${steps.length}개) 범위를 넘습니다. 강조 없이 표시합니다.`);
  }
}

function commonTextLimits(type) {
  const overrides = COMMON_LIMIT_OVERRIDES[type] ?? {};
  return TEXT_LIMITS.common.map(([field, max]) => [field, overrides[field] ?? max]);
}

function validateTypeFields(slide, label) {
  REQUIRED_FIELDS[slide.type]
    .filter((field) => isMissing(slide[field]))
    .forEach((field) => console.warn(`[slides] ${label}: 필수 필드 "${field}" 누락`));
  const count = COUNT_LIMITS[slide.type];
  if (count && warnArrayField(slide, label, count.field)) warnRange(label, count.field, slide[count.field].length, count);
  warnTextLimits(slide, label, TEXT_LIMITS[slide.type]);
  TYPE_VALIDATORS[slide.type]?.(slide, label);
}

function uniqueId(raw, index, used) {
  let id = typeof raw === 'string' && raw.trim() ? raw.trim() : `slide-${index + 1}`;
  if (used.has(id)) {
    console.warn(`[slides] 중복된 id "${id}" (슬라이드 ${index + 1}) — 접미사를 붙입니다.`);
    let n = 2;
    while (used.has(`${id}-${n}`)) n += 1;
    id = `${id}-${n}`;
  }
  used.add(id);
  return id;
}

function normalizeSlide(raw, index, used, steps = []) {
  const slide = raw && typeof raw === 'object' ? { ...raw } : {};
  const label = `슬라이드 ${index + 1}`;
  if (isMissing(slide.id)) console.warn(`[slides] ${label}: id 필드가 없습니다.`);
  slide.id = uniqueId(slide.id, index, used);

  slide.renderType = slide.type;
  if (!RENDERERS[slide.type]) {
    console.warn(`[slides] ${label} (${slide.id}): 알 수 없는 type "${slide.type}" — bullets로 폴백합니다.`);
    slide.renderType = FALLBACK_TYPE;
  } else {
    validateTypeFields(slide, `${label} (${slide.id})`);
  }
  if (!isMissing(slide.kicker) && NO_KICKER_TYPES.includes(slide.type)) {
    console.warn(`[slides] ${label} (${slide.id}): ${slide.type} 타입은 kicker를 표시하지 않습니다.`);
  }
  if (slide.type !== 'quote') warnTextLimits(slide, `${label} (${slide.id})`, commonTextLimits(slide.type));
  validateStep(slide, `${label} (${slide.id})`, steps);
  slide.bgImage = normalizeBackground(slide, `${label} (${slide.id})`);

  if (slide.theme != null && !THEMES.includes(slide.theme)) {
    console.warn(`[slides] ${label} (${slide.id}): 알 수 없는 theme "${slide.theme}" — light 사용`);
  }
  slide.theme = THEMES.includes(slide.theme) ? slide.theme : 'light';
  return slide;
}

/* ------------------------------------------------------------------ */
/* 덱 생성                                                             */
/* ------------------------------------------------------------------ */

function createSlideElement(data, index, total) {
  const type = data.renderType;
  const section = el('section', `slide slide--${type}`);
  section.id = data.id;
  section.dataset.type = type;
  section.dataset.theme = data.theme;
  section.setAttribute('aria-roledescription', '슬라이드');
  section.setAttribute('aria-label', `${index + 1} / ${total}`);
  RENDERERS[type](data, section);
  insertKicker(data, section);
  insertStepbar(data, section, state.steps);
  insertBackground(data, section);
  appendSource(data, section);
  return section;
}

function buildDeck(slides) {
  const fragment = document.createDocumentFragment();
  state.elements = slides.map((s, i) => {
    const node = createSlideElement(s, i, slides.length);
    fragment.appendChild(node);
    return node;
  });
  dom.deck.replaceChildren(fragment);
}

function showError(error) {
  console.error('[slides] 로드 실패:', error);
  const section = el('section', 'slide slide--bullets is-active');
  section.dataset.type = 'error';
  section.dataset.theme = 'light';
  section.setAttribute('role', 'alert');
  section.appendChild(textEl('h2', 'slide__title', '슬라이드를 불러오지 못했습니다'));
  const body = bodyEl();
  body.appendChild(textEl('p', '', `원인: ${error?.message ?? String(error)}`));
  body.appendChild(textEl('p', '', `데이터 경로: ${DATA_URL}\n로컬에서는 정적 서버(npx serve . 또는 python -m http.server 8000)로 열어야 합니다.`));
  section.appendChild(body);
  dom.deck.replaceChildren(section);
  state.elements = [section];
  state.slides = [];
  applyScale();
}

/* ------------------------------------------------------------------ */
/* 16:9 스케일링                                                       */
/* ------------------------------------------------------------------ */

// 구조: 모든 .slide는 .deck(뷰포트 전체) 좌상단(0,0)에 absolute로 겹쳐 있고,
// JS가 각 .slide에 인라인 transform(translate + scale, origin 0 0)을 걸어 중앙 정렬한다.
function applyScale() {
  const scale = Math.min(window.innerWidth / SLIDE_WIDTH, window.innerHeight / SLIDE_HEIGHT);
  const x = (window.innerWidth - SLIDE_WIDTH * scale) / 2;
  const y = (window.innerHeight - SLIDE_HEIGHT * scale) / 2;
  const transform = `translate(${x}px, ${y}px) scale(${scale})`;
  state.elements.forEach((node) => {
    node.style.transformOrigin = '0 0';
    node.style.transform = transform;
  });
}

function clearScale() {
  state.elements.forEach((node) => {
    node.style.transform = '';
    node.style.transformOrigin = '';
  });
}

let scaleFrame = 0;
function scheduleScale() {
  if (state.printing) return;
  cancelAnimationFrame(scaleFrame);
  scaleFrame = requestAnimationFrame(applyScale);
}

/* ------------------------------------------------------------------ */
/* 내비게이션 · 상태 표시                                              */
/* ------------------------------------------------------------------ */

function clampIndex(index) {
  return Math.max(0, Math.min(state.elements.length - 1, index));
}

function indexFromHash() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (!hash) return 0;
  if (/^\d+$/.test(hash)) return clampIndex(Number(hash) - 1);
  const byId = state.slides.findIndex((s) => s.id === hash);
  return byId >= 0 ? byId : 0;
}

function syncHash() {
  const hash = `#${state.current + 1}`;
  if (window.location.hash !== hash) history.replaceState(null, '', hash);
}

function updateIndicators() {
  const total = state.elements.length;
  const current = state.current + 1;
  const percent = total ? (current / total) * 100 : 0;
  dom.progressBar.style.width = `${percent}%`;
  dom.progress.setAttribute('aria-valuenow', String(Math.round(percent)));
  dom.pageNumber.textContent = `${current} / ${total}`;
  dom.prev.disabled = state.current <= 0;
  dom.next.disabled = state.current >= total - 1;
}

function goTo(index) {
  if (!state.slides.length) return;
  state.current = clampIndex(index);
  state.elements.forEach((node, i) => {
    const active = i === state.current;
    node.classList.toggle('is-active', active);
    node.setAttribute('aria-hidden', String(!active));
    node.inert = !active; // 숨은 슬라이드의 링크로 Tab 포커스가 가지 않도록
  });
  updateIndicators();
  syncHash();
  updateNotesWindow();
  drawTreesIn(state.elements[state.current]); // 숨김 중 측정하지 못한 선을 활성화 시 다시 그린다
  measureBaselineTagsIn(state.elements[state.current]); // 기준선 라벨 pill 실측(숨김 중 0이었으면 여기서 보정)
}

const next = () => goTo(state.current + 1);
const prev = () => goTo(state.current - 1);

function isEditableTarget(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

const KEY_ACTIONS = {
  ArrowRight: next,
  ArrowDown: next,
  PageDown: next,
  ArrowLeft: prev,
  ArrowUp: prev,
  PageUp: prev,
  Home: () => goTo(0),
  End: () => goTo(state.elements.length - 1),
};

function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) return;
  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault();
    event.shiftKey ? prev() : next();
    return;
  }
  if (event.key === 'n' || event.key === 'N') {
    showNotes();
    return;
  }
  const action = KEY_ACTIONS[event.key];
  if (action) {
    event.preventDefault();
    action();
  }
}

function onDeckClick(event) {
  if (event.target.closest('a, button, input, textarea, select')) return;
  if (window.getSelection()?.toString()) return;
  event.clientX < window.innerWidth / 3 ? prev() : next();
}

const touch = { x: 0, y: 0, active: false };

function onTouchStart(event) {
  if (event.touches.length !== 1) {
    touch.active = false;
    return;
  }
  touch.x = event.touches[0].clientX;
  touch.y = event.touches[0].clientY;
  touch.active = true;
}

function onTouchEnd(event) {
  if (!touch.active) return;
  touch.active = false;
  const t = event.changedTouches[0];
  const dx = t.clientX - touch.x;
  const dy = t.clientY - touch.y;
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
  dx < 0 ? next() : prev();
}

/* ------------------------------------------------------------------ */
/* 발표자 노트 (N 키)                                                  */
/* ------------------------------------------------------------------ */

function currentNotesText() {
  const slide = state.slides[state.current];
  if (!slide) return '';
  const head = `[${state.current + 1} / ${state.slides.length}] ${slide.title ?? slide.id}`;
  return `${head}\n\n${slide.notes || '(노트 없음)'}`;
}

function updateNotesWindow() {
  const win = state.notesWindow;
  if (!win || win.closed) return;
  win.document.body.textContent = '';
  const pre = win.document.createElement('pre');
  pre.style.whiteSpace = 'pre-wrap';
  pre.textContent = currentNotesText();
  win.document.body.appendChild(pre);
}

function showNotes() {
  if (!state.slides.length) return;
  console.info(`[발표자 노트]\n${currentNotesText()}`);
  if (!state.notesWindow || state.notesWindow.closed) {
    state.notesWindow = window.open('', 'speaker-notes', 'width=640,height=480');
    if (!state.notesWindow) return; // 팝업 차단 시 콘솔 출력만 유지
    state.notesWindow.document.title = '발표자 노트';
  }
  updateNotesWindow();
  state.notesWindow.focus();
}

/* ------------------------------------------------------------------ */
/* 인쇄                                                                */
/* ------------------------------------------------------------------ */

function onBeforePrint() {
  state.printing = true;
  clearScale();
  drawTreesIn(dom.deck); // 인쇄 레이아웃 기준으로 모든 tree 선을 다시 그린다
  measureBaselineTagsIn(dom.deck);
}

function onAfterPrint() {
  state.printing = false;
  applyScale();
  drawTreesIn(dom.deck);
}

/* ------------------------------------------------------------------ */
/* 초기화                                                              */
/* ------------------------------------------------------------------ */

async function loadDeck() {
  const response = await fetch(DATA_URL, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`JSON 파싱 오류: ${error.message}`);
  }
}

function bindEvents() {
  window.addEventListener('resize', scheduleScale);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('hashchange', () => goTo(indexFromHash()));
  window.addEventListener('beforeprint', onBeforePrint);
  window.addEventListener('afterprint', onAfterPrint);
  dom.prev.addEventListener('click', prev);
  dom.next.addEventListener('click', next);
  dom.deck.addEventListener('click', onDeckClick);
  dom.deck.addEventListener('touchstart', onTouchStart, { passive: true });
  dom.deck.addEventListener('touchend', onTouchEnd, { passive: true });
}

async function init() {
  bindEvents();
  try {
    const data = await loadDeck();
    validateDeck(data);
    if (data.meta?.title) document.title = data.meta.title;
    if (data.meta?.language) document.documentElement.lang = data.meta.language;
    const used = new Set();
    state.steps = normalizeMetaSteps(data.meta);
    state.slides = data.slides.map((s, i) => normalizeSlide(s, i, used, state.steps));
    buildDeck(state.slides);
    applyScale();
    goTo(indexFromHash());
    observeTrees();
    measureBaselineTagsIn(dom.deck);
    document.fonts?.ready.then(() => measureBaselineTagsIn(dom.deck)); // 웹폰트 적용 후 폭 재측정
  } catch (error) {
    showError(error);
  }
}

init();
