---
name: slide-schema
description: data/slides.json 작성 규격 표준. 슬라이드 데이터를 작성·검증하거나, 이를 렌더링/스타일링할 때 반드시 참조한다.
---

# Slide Schema 표준 (v1.5)

> v1.6 추가(하위 호환, `version`은 "1.5" 유지 가능): `chart.baseline` 기준선 선택 필드와 `.chart__baseline`·`.chart__baseline-label` 클래스(3.12, 6절). 메인 세션 승인(사용자 요청: 9장 '찍기 50점 기준선'). 새 타입 `tree`(갈림길 나무, 3.18) — 사용자 승인(10장 새 포맷).
> v1.16 추가(하위 호환): `contrast` 각 쪽 `image`에 최대 2개 배열·`fit` 허용(3.24) — 사용자 승인(3장 로고 2개).
> v1.15 추가(하위 호환): `contrast` 각 쪽에 선택 필드 `image`(3.24) — 사용자 승인(3장 사진 2장).
> v1.14 추가(하위 호환): 새 타입 `contrast`(3.24) — 사용자 승인(3장 레퍼런스 references/3pg_slide_concept.png).
> v1.13 추가(하위 호환): 새 타입 `interview`(3.23) — 사용자 승인(현직자 인터뷰 장, references/16pg_slide_shadow_interview.png).
> v1.12 추가(하위 호환): 새 타입 `iceberg`(3.22) — 사용자 승인(5장 레퍼런스 references/5pg_slide_concept.png).
> v1.9 추가(하위 호환): 새 타입 `data-panels`(3.21) — 사용자 승인(6·7장 사이 데이터 설명 장 2개).
> v1.8 추가(하위 호환): 새 타입 `roc`(3.20) — 사용자 승인(9장 레퍼런스 references/roc_slide_9pg.html).
> v1.7 추가(하위 호환): `chart.kind: "hbar"`, `process.layout: "stairs"`, 새 타입 `equation`·`pillars`(3.19) — 사용자 승인(1:1:1 반복 구조 대체).

> v1.5 변경: `split`에 `imageRatio` 추가(3.14), 공통 필드 `background`(배경 사진) 추가(2절), 새 타입 `cards`(3.16)·`band`(3.17) 추가. v1.0~v1.4 데이터는 그대로 호환된다.

> v1.4 변경: 공통 필드 `step`(5단계 진행 표시줄) 추가, 최상위 `meta.steps` 추가, 새 타입 `matrix`(2×2) 추가(3.15), `comparison` 한도 확대(열 최대 5·행 최대 6)와 셀 표시(`marks`) 추가, `two-column` 컬럼 `tone` 추가, `process` 단계 `gate` 추가. v1.0~v1.3 데이터는 그대로 호환된다.

> v1.3 변경: `cover`에 대표 이미지(`image`, `imageStyle`, `overlay`) 추가(3.1). v1.0~v1.2 데이터는 그대로 호환된다(이미지 없는 cover도 유효).

> v1.2 변경: 시각 레이아웃 5종(`big-number`, `process`, `chart`, `comparison`, `split`) 추가(3.10~3.14), 공통 필드 `kicker`·`source` 추가, `image`에 `credit` 추가, `references.category`에 `image` 추가. v1.0·v1.1 데이터는 그대로 호환된다.

> v1.1 변경: 참고 자료용 `references` 타입 추가(3.9), 관련 분량 제한·CSS 클래스 추가. v1.0 데이터는 그대로 호환된다.

`data/slides.json`의 구조를 정의하는 **에이전트 간 계약 문서**다.
- planner는 이 규격대로 데이터를 작성한다.
- developer는 이 규격의 모든 `type`을 렌더링한다.
- designer는 "CSS 클래스 계약"에 정의된 클래스를 스타일링한다.

이 문서의 변경은 사용자 승인 후에만 가능하며, 변경 시 `version`을 올린다.

## 1. 최상위 구조

```json
{
  "version": "1.5",
  "meta": {
    "title": "발표 제목",
    "author": "발표자",
    "date": "2026-11-01",
    "language": "ko",
    "aspectRatio": "16:9",
    "steps": ["핵심 이슈", "동인과 가정", "시나리오", "평가", "신호"]
  },
  "slides": [ /* Slide 객체 배열 */ ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `version` | string | ✅ | 스키마 버전. 현재 `"1.16"` (`"1.0"`~`"1.15"`도 허용) |
| `meta.title` | string | ✅ | 발표 제목 (브라우저 `<title>`에도 사용) |
| `meta.author` | string | ⬜ | 발표자 |
| `meta.date` | string | ⬜ | `YYYY-MM-DD` |
| `meta.language` | string | ⬜ | 기본 `"ko"` |
| `meta.aspectRatio` | string | ✅ | 항상 `"16:9"` (변경 금지) |
| `meta.steps` | string[] | ⬜ | 진행 표시줄 단계 이름(최대 6개, 각 8자 이내). `step`을 쓰는 슬라이드가 있으면 필수 |
| `slides` | Slide[] | ✅ | 1개 이상 |

## 2. Slide 공통 필드

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | string | ✅ | 고유 식별자. kebab-case (`intro`, `market-size`). 중복 금지 |
| `type` | string | ✅ | 아래 3절의 레이아웃 타입 중 하나 |
| `title` | string | 타입별 | 슬라이드 제목 |
| `notes` | string | ⬜ | 발표자 노트 (화면에 표시되지 않음) |
| `theme` | `"light"` \| `"dark"` \| `"accent"` | ⬜ | 슬라이드별 배경 변형. 기본 `"light"` |
| `kicker` | string | ⬜ | 제목 위 작은 머리글(섹션명 등). 예: `"02 · 제안"`. cover·quote 제외 모든 타입 |
| `step` | integer | ⬜ | `meta.steps` 기준 현재 단계(1부터). 지정하면 캔버스 상단 안전 영역 안에 단계 진행 표시줄(`.stepbar`)을 그리고 해당 단계를 강조한다. `0`이면 표시줄을 그리되 강조 없음(개요용). 생략하면 표시줄 없음. cover·section·closing·quote 제외 |
| `background` | object | ⬜ | 배경 사진. `{ "src", "alt", "credit", "focus", "overlay": "dark"(기본) \| "light" }`. 캔버스 전체를 사진이 채우고(안전 영역 예외) 위에 가독성 막을 깐 뒤 콘텐츠를 올린다. `dark`면 밝은 글자. **허용 타입: `stats`, `big-number`, `quote`, `cards`, `process`, `bullets`, `pillars`(v1.7, 사용자 승인 — 18장 레퍼런스 디자인)**. `split`·`band`·`cover`·`image`처럼 자체 이미지가 있는 타입과 표(`comparison`)·`matrix`·`chart`에는 쓰지 않는다 |
| `source` | string | ⬜ | 하단 출처 각주 한 줄. 예: `"출처: 식약처(2026.1), CJ올리브영(2026.1)"`. 상세 URL은 Appendix에 둔다 |

## 3. 레이아웃 타입

### 3.1 `cover` — 표지
```json
{ "id": "cover", "type": "cover", "title": "발표 제목", "subtitle": "부제", "presenter": "홍길동 · 2026.11",
  "image": { "src": "assets/images/cover-hero.jpg", "alt": "이미지 설명", "credit": "Photo: Jane Doe / Unsplash", "focus": "right" },
  "imageStyle": "full", "overlay": "dark" }
```
필수: `title` / 선택: `subtitle`, `presenter`, `image`, `imageStyle`, `overlay`, `logo`(v1.10 — `{ "src": "assets/images/…", "alt": "…" }` 또는 최대 2개 배열 `[ {CI}, {BI} ]`(v1.11), 표지 왼쪽 위 안전 영역 안 작은 로고. 클래스 `.cover__logo`(img). 배열이면 `.cover__logos`(div, `data-count`) 안에 순서대로 `img.cover__logo`를 두고 사이 구분선은 CSS로. 브랜드 공식 로고는 사용자 승인 하에 searcher가 공식 출처에서 받은 파일만)

| 필드 | 값 | 설명 |
|---|---|---|
| `image.src` / `image.alt` | string | 대표 이미지. `assets/images/` 로컬 파일만. `alt` 필수 |
| `image.credit` | string | 저작자·라이선스 표기. 표지 하단 구석에 작게 표시 |
| `image.focus` | `"center"`(기본) \| `"left"` \| `"right"` \| `"top"` \| `"bottom"` | 잘릴 때 남길 피사체 위치 (`object-position`) |
| `imageStyle` | `"full"`(기본) \| `"split"` | `full`: 이미지가 캔버스 전체를 채우는 풀블리드 배경, 텍스트는 그 위에. `split`: 캔버스 오른쪽 약 55%를 이미지가 가장자리까지 채우고 왼쪽에 텍스트 |
| `overlay` | `"dark"`(기본) \| `"light"` \| `"none"` | `full`일 때 텍스트 가독성을 위한 그라데이션 막. `dark`면 밝은 글자, `light`면 어두운 글자. `none`은 이미지 자체에 텍스트용 여백·명암이 충분할 때만 |

- 이미지가 있는 cover는 안전 영역 예외로 이미지가 캔버스 가장자리까지 채운다. 텍스트는 안전 영역(80px) 안에 둔다.
- 분량: 이미지가 있는 cover의 `title`은 **24자 이내 권장**(최대 40자), `subtitle` 40자 이내 권장.

### 3.2 `section` — 챕터 구분
```json
{ "id": "part-1", "type": "section", "number": "01", "title": "문제 정의" }
```
필수: `title` / 선택: `number`, `subtitle`

### 3.3 `bullets` — 제목 + 글머리표
```json
{
  "id": "why", "type": "bullets", "title": "왜 지금인가",
  "bullets": [
    "시장 규모가 3년간 2배 성장",
    { "text": "경쟁사 대비 강점", "sub": ["속도", "비용"] }
  ]
}
```
필수: `title`, `bullets` / 항목은 string 또는 `{ "text": string, "sub": string[] }`

### 3.4 `two-column` — 2단 비교
```json
{
  "id": "compare", "type": "two-column", "title": "Before / After",
  "left":  { "heading": "Before", "bullets": ["수작업", "3일 소요"] },
  "right": { "heading": "After",  "bullets": ["자동화", "10분 소요"] }
}
```
필수: `title`, `left`, `right` / 각 컬럼은 `heading`(선택) + `bullets` 또는 `body`, 선택 `tone`(`"default"` | `"accent"` | `"danger"` — 카드 테두리·머리글 색. `danger`는 빨간 테두리)

### 3.5 `image` — 이미지 중심
```json
{ "id": "screenshot", "type": "image", "title": "대시보드", "src": "assets/dashboard.png", "alt": "대시보드 화면", "caption": "실시간 지표" }
```
필수: `src`, `alt` / 선택: `title`, `caption`, `fit`(`"contain"` 기본 | `"cover"`), `credit`(사진 저작자·라이선스 표기, 예: `"Photo: Jane Doe / Unsplash"`)

> 이미지 규칙: `src`는 `assets/images/` 아래 로컬 파일만 쓴다(외부 URL 직접 연결 금지). 이미지는 searcher가 라이선스를 확인해 내려받으며, 저작자·라이선스는 슬라이드의 `credit`으로 표시한다(Appendix의 `image` 유형은 라이선스상 별도 표기가 필요한 경우에만 사용).

### 3.6 `stats` — 핵심 수치
```json
{
  "id": "kpi", "type": "stats", "title": "성과 지표",
  "items": [
    { "value": "98%", "label": "고객 만족도" },
    { "value": "3.2x", "label": "처리 속도" }
  ]
}
```
필수: `title`, `items`(2~4개) / 각 항목 `value`, `label` 필수

### 3.7 `quote` — 인용
```json
{ "id": "voice", "type": "quote", "quote": "이건 게임 체인저다.", "source": "베타 사용자 A" }
```
필수: `quote` / 선택: `source`

### 3.8 `closing` — 마무리
```json
{ "id": "end", "type": "closing", "title": "감사합니다", "contact": "team@example.com" }
```
필수: `title` / 선택: `subtitle`, `contact`

### 3.9 `references` — 참고 자료 (Appendix)
발표에 사용한 출처를 **자료 유형별로** 나열한다. 한 슬라이드에는 한 가지 유형만 담고, 항목이 많으면 같은 유형으로 슬라이드를 나눈다(제목에 `(1/2)` 등 표기).
```json
{
  "id": "appendix-articles", "type": "references",
  "title": "Appendix · 참고 자료",
  "category": "article",
  "items": [
    {
      "ref": "F1",
      "publisher": "CJ뉴스룸",
      "title": "올리브영 외국인 매출 1조원 돌파, 작년보다 3개월 빨라져",
      "date": "2026-08-31",
      "url": "https://cjnews.cj.net/?p=79498",
      "usedIn": "3, 7"
    }
  ]
}
```
필수: `title`, `category`, `items` / 선택: `subtitle`

`category` 값과 화면 표기:

| 값 | 화면 표기 | 해당 자료 |
|---|---|---|
| `article` | 기사 | 언론 보도 기사 |
| `official` | 공식 자료 | 기업 보도자료·뉴스룸, IR·공시, 정부·공공기관 발표 |
| `report` | 보고서·PDF | 리서치 리포트, 통계 보고서, PDF 문서 |
| `paper` | 논문 | 학술 논문, 학회 발표 |
| `other` | 기타 | 위에 해당하지 않는 자료 |
| `image` | 이미지 | 슬라이드에 사용한 사진·일러스트 (항목 `title`에 내용과 라이선스를 함께 적는다. 예: `"화장품 매장 진열대 사진 — Unsplash License"`) |

`items` 각 항목:

| 필드 | 필수 | 설명 |
|---|---|---|
| `publisher` | ✅ | 매체·기관·저자 |
| `title` | ✅ | 기사·문서·논문 제목 (원문 제목) |
| `url` | ✅ | 원문 링크 (`http(s)://`로 시작) |
| `date` | ⬜ | 발행일 `YYYY-MM-DD` 또는 `YYYY-MM` |
| `ref` | ⬜ | `data/research.md`의 사실 ID (예: `"F1"`, `"F1, F2"`) |
| `usedIn` | ⬜ | 이 자료를 근거로 쓴 슬라이드 번호 (예: `"3, 7"`) |

### 3.10 `big-number` — 단일 핵심 수치
화면을 지배하는 숫자 하나와 그 의미. 추이·비교 맥락을 함께 준다.
```json
{ "id": "growth", "type": "big-number", "kicker": "재료 ④", "title": "100억 브랜드가 5년 만에 3배",
  "value": "116개", "label": "올리브영 연 매출 100억 원+ 브랜드 (2025)",
  "context": "2020년 36개 → 2024년 100개 → 2025년 116개", "source": "출처: CJ올리브영(2026.1)" }
```
필수: `value`, `label` / 선택: `title`, `context`

### 3.11 `process` — 단계 흐름
```json
{ "id": "platform", "type": "process", "title": "데이터를 AI로 분석해 서비스로 판다",
  "steps": [
    { "label": "입력", "text": "외국인 구매·회원 구매·매장 테스트 데이터" },
    { "label": "분석", "text": "AI가 될 제품과 통할 나라를 예측" },
    { "label": "판매", "text": "분석 결과를 구독형 서비스로 제공" },
    { "label": "고객", "text": "작은 K-뷰티 브랜드, 해외 유통사" }
  ] }
```
선택(v1.6): `caption`(60자, 단계 아래 한 줄 `.slide__caption`). 필수: `title`, `steps`(3~5개) / 각 단계 `label` 필수, `text` 선택, `gate` 선택(string — 이 단계 **다음**으로 넘어가기 전 관문 조건. 단계 사이에 마름모로 표시. 마지막 단계에는 쓰지 않는다)

### 3.12 `chart` — 막대/선 그래프
라이브러리 없이 developer가 인라인 SVG로 렌더링한다. 값은 숫자(number)로 쓴다.
```json
{ "id": "market", "type": "chart", "title": "K-뷰티 수출, 미국이 처음 1위",
  "chart": {
    "kind": "bar", "unit": "억 달러",
    "data": [
      { "label": "미국", "value": 22, "highlight": true },
      { "label": "중국", "value": 20 },
      { "label": "일본", "value": 11 }
    ]
  },
  "caption": "2025년 국가별 화장품 수출액", "source": "출처: 식약처(2026.1)" }
```
필수: `title`, `chart.kind`(`"bar"` | `"line"`), `chart.data`(2~8개, 각 `label` string·`value` number) / 선택: `chart.unit`, `data[].highlight`(boolean, 강조색), `data[].display`(화면 표기 문자열, 예: `"22억"`), `caption`, `chart.baseline`(v1.6 — 기준선. `{ "value": number, "label": string }`. 같은 값 축 위치에 차트 폭 전체를 가로지르는 점선을 긋고 오른쪽 끝에 `label`(16자 이내, 예: `"찍기 50점"`)을 표시한다)

### 3.13 `comparison` — 기준별 비교표
```json
{ "id": "two-ideas", "type": "comparison", "title": "누구에게 팔까: 두 가지 아이디어",
  "columns": ["A. 작은 한국 화장품 회사", "B. 해외 유통회사"],
  "rows": [
    { "label": "파는 것", "values": ["나라별 성공 가능성·현지화 조언", "한국에서 뜨는 제품·브랜드 정보"] },
    { "label": "수익", "values": ["월 이용료 + 성과 수수료", "정보 이용료"] }
  ],
  "highlight": 0 }
```
필수: `title`, `columns`(2~5개), `rows`(2~6개, 각 `label` + `values` 배열 길이 = columns 수) / 선택: `highlight`(강조할 열 인덱스, 0부터), `highlightRow`(강조할 행 인덱스, 0부터), `rows[].marks`(values와 같은 길이 배열, 각 값 `null` | `"good"` | `"bad"` | `"warn"` — 셀 단위 색 표시)
- 평점 기호(◎ ○ △ ×)는 일반 텍스트로 쓴다.

### 3.14 `split` — 좌우 분할 (헤드라인 + 내용/이미지)
한쪽에 큰 헤드라인과 본문, 다른 쪽에 이미지(또는 본문)를 둔다.
```json
{ "id": "idea-b", "type": "split", "kicker": "아이디어 B", "title": "세포라 큐레이션을 유료 정보 서비스로",
  "bullets": ["**지금**: 미국 세포라 약 580개 매장에서 큐레이션 존 운영", "**확장**: 트렌드 정보를 유료로 제공"],
  "image": { "src": "assets/images/store-shelf.jpg", "alt": "화장품 매장 진열대", "credit": "Photo: Jane Doe / Unsplash" },
  "imageSide": "right" }
```
필수: `title` + (`bullets` | `body` | `image` 중 하나 이상) / 선택: `subtitle`, `image.credit`, `imageSide`(`"right"` 기본 | `"left"`), `imageRatio`(`"1/2"` 기본 | `"1/3"` | `"2/3"` — 캔버스 폭 중 이미지가 차지하는 비율. `2/3`이면 텍스트 칸이 좁으므로 bullets 최대 2개·body 80자)
- `image`가 있으면 이미지가 캔버스 한쪽 절반을 가장자리까지 꽉 채우고(cover, 안전 영역 예외), 반대쪽에 제목과 본문이 온다. `image`가 없으면 왼쪽 제목 / 오른쪽 본문 배치.

### 3.15 `matrix` — 2×2 매트릭스
두 축으로 나눈 네 사분면. 영향력×불확실성 분석, 시나리오 매트릭스에 쓴다.
```json
{ "id": "scenarios", "type": "matrix", "step": 3, "title": "유통 주도권과 데이터 차별성이 네 가지 미래를 가른다",
  "axes": {
    "x": { "label": "데이터 차별성", "low": "유지", "high": "흔해짐" },
    "y": { "label": "유통 주도권", "low": "현지 유통사 주도", "high": "브랜드 직진출 주도" }
  },
  "quadrants": [
    { "position": "top-left", "label": "① 내비게이터", "text": "A가 성장", "tone": "accent" },
    { "position": "top-right", "label": "③ 모두가 분석가", "text": "정보 판매 어려움" },
    { "position": "bottom-left", "label": "② 거래소", "text": "B가 성장" },
    { "position": "bottom-right", "label": "④ 세포라의 하청", "text": "납품 창구로 전락", "tone": "danger" }
  ],
  "caption": "성장률만 다른 변형이 아니라 근본적으로 다른 미래" }
```
필수: `title`, `axes.x.label`, `axes.y.label`, `quadrants`(1~4개, 각 `position` + `label`) / 선택: `axes.*.low`·`axes.*.high`(축 양 끝 라벨. x는 왼쪽=low·오른쪽=high, y는 아래=low·위=high), `quadrants[].text`, `quadrants[].items`(string[], 사분면 안에 점·칩으로 나열), `quadrants[].tone`(`"default"` | `"accent"` | `"muted"` | `"danger"`), `caption`
- `position`: `"top-left"` | `"top-right"` | `"bottom-left"` | `"bottom-right"`. 중복 금지.

### 3.16 `cards` — 카드 2~4개
표 대신 쓰는 병렬 비교·목록. 카드마다 사진·톤을 줄 수 있다.
```json
{ "id": "futures-a", "type": "cards", "step": 3, "title": "①과 ②는 올리브영 데이터가 힘을 갖는 미래다",
  "cards": [
    { "label": "① 내비게이터", "title": "브랜드가 길을 묻는다", "bullets": ["주도: 브랜드 직진출", "역할: 검증된 데이터로 길 안내", "결과: A 성장"],
      "image": { "src": "assets/images/x.jpg", "alt": "…", "credit": "Photo: … / Unsplash", "focus": "center" }, "tone": "accent" },
    { "label": "② 거래소", "title": "유통사가 발굴을 맡긴다", "bullets": ["…"] }
  ] }
```
필수: `title`, `cards`(2~4개, 각 `title` 필수) / 선택: `cards[].label`(카드 위 머리글), `cards[].text`(본문 문장) 또는 `cards[].bullets`(최대 3개), `cards[].value`(큰 숫자·기호, 8자), `cards[].image`(카드 상단 사진, `assets/images/` 로컬, `alt` 필수, `credit`·`focus` 선택), `cards[].tone`(`"default"` | `"accent"` | `"muted"` | `"danger"`)
- 한 슬라이드의 카드는 모두 이미지가 있거나 모두 없게 쓴다(높이 정렬).

### 3.17 `band` — 사진 띠 + 내용
캔버스 위쪽을 가로 사진 띠가 가장자리까지 채우고(안전 영역 예외), 아래에 제목과 내용이 온다.
```json
{ "id": "roadmap", "type": "band", "title": "시범 운영으로 신호를 쌓고, 신호에 따라 다음 단계를 연다",
  "image": { "src": "assets/images/roadmap-stone-stairs.jpg", "alt": "…", "credit": "Photo: … / Unsplash", "focus": "center" },
  "items": [ { "heading": "01 시범", "text": "입점 브랜드 대상 시범 운영" }, { "heading": "02 유료화", "text": "…" }, { "heading": "03 확장", "text": "…" } ] }
```
필수: `title`, `image`, (`items` | `bullets` | `body` 중 하나) / 선택: `kicker`, `subtitle`, `items[].value`(큰 숫자, 8자)
- `items`: 2~4개, 각 `heading` 필수, `text` 선택. 가로로 나란히 놓인다.
- 사진 띠 높이는 캔버스의 약 40%(designer가 정함). `step`을 쓰면 진행 표시줄은 띠 위에 올라간다(designer가 가독성 처리).

### 3.19 v1.7 추가 — 1:1:1 대체 포맷 (사용자 승인)

#### (a) `chart.kind: "hbar"` — 가로 막대
`bar`와 같은 데이터(`data`, `unit`, `highlight`, `display`, `baseline`, `caption`)를 가로 막대로 그린다. 라벨은 왼쪽, 값은 막대 끝. `baseline`은 세로 점선(라벨은 선 위쪽). 데이터 2~5개 권장. 클래스는 bar와 같고 `.slide__chart[data-kind="hbar"]`로 구분.

#### (b) `process.layout: "stairs"` — 올라가는 계단
`process`의 선택 필드. 단계가 왼쪽 아래 → 오른쪽 위로 한 칸씩 높아지는 계단. `gate`는 계단 사이 문턱에 표시. 데이터·분량은 process와 동일(3~4단계 권장). 슬라이드에 `data-layout="stairs"`, 각 `li.step`에 `data-level="0|1|2…"`.

#### (c) `equation` — 수식형
```json
{ "id": "revenue-formula", "type": "equation", "title": "…",
  "terms": [ { "label": "몇 곳에 파나", "text": "A 대상 브랜드 수 · B 대상 유통사 수" },
             { "label": "한 곳당 얼마", "text": "A 브랜드당 이용료 · B 유통사당 계약 금액" } ],
  "operators": ["×"],
  "result": { "label": "연 매출", "text": "1~3년차, 미래별" },
  "caption": "…", "source": "…" }
```
필수: `title`, `terms`(2~3개, 각 `label` 필수·`text` 선택), `result`(`label` 필수·`text` 선택) / 선택: `operators`(길이 = terms−1, 기본 모두 `"×"`; 각 1~2자), `caption`, `kicker`, `step`, `source`. 결과 앞에는 항상 `=`.
분량: `label` 12자 / `text` 40자 / `caption` 60자.

#### (d) `pillars` — 받침대 + 기둥
```json
{ "id": "beyond-money", "type": "pillars", "title": "…",
  "pillars": [ { "label": "A: 국내 브랜드용", "value": "결속력", "title": "브랜드와의 연결 유지", "text": "…", "tone": "accent" },
               { "label": "B: 해외 유통사용", "value": "협상력", "title": "정보 우위", "text": "…" } ],
  "base": { "label": "A·B 공통", "value": "수익", "title": "매장 밖 새 수익원", "text": "A: 이용료·성과 수수료 · B: 정보 이용료·큐레이션 수수료" } }
```
필수: `title`, `pillars`(2~3개, 각 `value` 또는 `title` 필수), `base`(`value` 또는 `title` 필수) / 선택: 각 `label`·`text`·`tone`(`default`|`accent`|`muted`), `caption`, `kicker`, `step`, `source`. 기둥이 위, 받침대가 아래 전체 폭.
분량: `label` 16자 / `value` 8자 / `title` 20자 / `text` 50자.

### 3.21 `data-panels` — 두 데이터 패널 (v1.9, 사용자 승인: references/1_data_overview_slide_6_7.html, 2_data_detail_slide_6_7.html)
두 데이터 출처를 좌우 패널로 나란히 보여 준다. 패널마다 제목·기준 시점·핵심 숫자·한 줄 메시지·차트 제목·차트 그림(SVG 파일)·수집 항목. 선택적으로 두 패널 사이에 연결 원(공통 키).
```json
{ "id": "data-overview", "type": "data-panels", "step": 2, "kicker": "분석 데이터", "title": "…",
  "panels": [
    { "tone": "primary", "heading": "올리브영 어워즈", "meta": "2021–2025년, 5개년",
      "stats": [ { "value": "735", "label": "수상 기록 (정제 후)" }, … ],
      "message": "…(선택)", "chartTitle": "연도별 수상 건수와 순위 구성",
      "figure": { "src": "assets/images/data-awards-by-year.svg", "alt": "…" },
      "fields": { "label": "수집 항목", "text": "연도, 카테고리, …" } },
    { "tone": "secondary", "heading": "Amazon K-뷰티 상위 상품", … } ],
  "link": { "value": "35", "label": "공통 브랜드", "note": "브랜드명\n한글 매핑으로 조인" },
  "source": "… (data-panels는 160자까지)" }
```
필수: `title`, `panels`(정확히 2개, 각 `heading` 필수) / 선택: 패널의 `tone`(`"primary"`=덱 초록 | `"secondary"`=슬레이트, 기본 순서대로), `meta`, `stats`(0~3개, `value` 8자·`label` 16자), `message`(40자), `chartTitle`(24자), `figure`(`src`는 `assets/images/` 로컬 SVG/PNG, `alt` 필수), `fields`(`label` 8자, `text` 80자); `link`(있으면 두 패널 사이 가운데 열에 원형 배지: `value` 6자, `label` 10자, `note` 30자, `\n` 줄바꿈 허용); `kicker`, `step`, `source`(160자).
- 차트는 그림 파일로 넣는다(범례 포함). 그림은 searcher가 `assets/images/`에 만들고 출처 데이터는 사용자 제공 자료.

### 3.20 `roc` — ROC 곡선 비교 (v1.8, 사용자 승인: references/roc_slide_9pg.html 재현)
왼쪽 정사각형 ROC 차트(인라인 SVG) + 오른쪽 모델 목록(선 견본·이름·설명·큰 AUC·신뢰구간) + 핵심 해석 문단. 좌표는 모두 0~1 데이터 값(x = FPR, y = TPR).
```json
{ "id": "skincare-roc", "type": "roc", "step": 2, "kicker": "…", "title": "…",
  "axes": { "x": "위양성률 (FPR): Amazon에 없는데 있다고 예측한 비율", "y": "진양성률 (TPR): Amazon 진입 브랜드를 찾아낸 비율" },
  "chance": { "label": "무작위 예측 (AUC 0.50)" },
  "curves": [
    { "id": "skincare", "name": "스킨케어 부문 수상 횟수", "desc": "변수 하나, 커트라인만 조정", "auc": "0.78", "ci": "95% CI 0.70–0.85", "style": "lead", "fill": true, "points": [[0,0],[0,0.0287], …, [1,1]] },
    { "id": "logistic", "name": "로지스틱 회귀", "desc": "…", "auc": "0.77", "ci": "…", "style": "alt", "points": [...] },
    { "id": "all", "name": "전체 부문 수상 횟수", "desc": "…", "auc": "0.61", "style": "dim", "points": [...] } ],
  "markers": [ { "curve": "skincare", "point": [0.3774, 0.8571], "style": "filled" }, { "curve": "skincare", "point": [0.1415, 0.4857], "style": "hollow" } ],
  "note": { "at": [0.4, 0.36], "heading": "커트라인을 바꾸면",
            "items": [ { "label": "1회 이상", "lines": ["진입 35개 중 30개 포착", "미진입 212개 중 80개 오탐"] },
                       { "label": "2회 이상", "lines": ["…", "…"] } ] },
  "takeaways": ["…", "…"],
  "source": "대상: … (roc는 160자까지)" }
```
필수: `title`, `axes.x`, `axes.y`, `curves`(1~4개, 각 `name`·`points`(2개 이상, 0~1) 필수) / 선택: `chance.label`, `curves[].id`·`desc`·`auc`(문자열)·`ci`·`style`(`"lead"` | `"alt"` | `"dim"`, 기본 `alt`)·`fill`(true면 곡선 아래 옅은 면, lead 하나만 권장), `markers[]`(`curve`, `point`, `style`: `"filled"`|`"hollow"`), `note`(`at`: 노트 블록 왼쪽 위 데이터 좌표, `heading`, `items[]`: `label` + `lines` 최대 2개), `takeaways`(1~3개, 첫 문장이 핵심·크게), `kicker`, `step`, `source`
- `markers[i]`는 `note.items[i]`와 지시선으로 연결한다.
- 그리기 순서: 면(fill) → 격자 → 무작위 대각선·라벨 → 곡선(dim → alt → lead) → 테두리 → 눈금 → 축 제목 → 지시선 → 표시점 → 노트.
분량: `title` 50자 / `kicker` 60자 / `axes` 각 40자 / `curves[].name` 20자·`desc` 30자 / `note.items[].lines` 각 20자 / `takeaways` 각 60자 / `source` 160자.

### 3.18 `tree` — 갈림길 나무 (v1.6)
출발점 하나가 질문 두 개를 거치며 2 → 4 갈래로 나뉘어 결과 4개에 도착하는 왼쪽→오른쪽 의사결정 나무. 두 질문의 조합이 네 가지 미래가 되는 장면에 쓴다(다음 장 `matrix`로 이어짐).
```json
{ "id": "two-questions", "type": "tree", "step": 3, "kicker": "두 질문, 네 갈래", "title": "미래를 가를 두 가지 질문",
  "root": "오늘의 올리브영",
  "levels": [
    { "question": "해외 판매를 누가 쥘까?", "signal": "징후: 얼타 K-뷰티 8개 입점(2025.7)" },
    { "question": "올리브영 Data는 계속 특별할까?", "signal": "징후: 미래 맞히기 61점(9장)" }
  ],
  "branches": [
    { "label": "브랜드가 직접", "children": [
      { "label": "계속 특별", "leaf": "길잡이 올리브영", "tone": "accent" },
      { "label": "흔해짐", "leaf": "AI가 다 해 주는 세상" } ] },
    { "label": "현지 유통사", "children": [
      { "label": "계속 특별", "leaf": "중개인 올리브영", "tone": "accent" },
      { "label": "흔해짐", "leaf": "납품업체로 밀린 올리브영", "tone": "danger" } ] }
  ],
  "caption": "두 답의 조합 = 다음 장의 네 가지 미래", "source": "출처: …" }
```
필수: `title`, `root`, `levels`(정확히 2개, 각 `question` 필수·`signal` 선택), `branches`(정확히 2개, 각 `label` + `children` 정확히 2개, 각 child `label`·`leaf` 필수) / 선택: `children[].tone`(`"default"` | `"accent"` | `"muted"` | `"danger"`), `caption`, `kicker`, `step`, `source`
- 배치: 4열(출발점 | 첫 번째 질문의 답 2개 | 두 번째 질문의 답 4개 | 결과 4개). `levels[0]`은 2열 위, `levels[1]`은 3열 위에 열 머리글(질문 + 징후)로 표시. 갈래는 선(연결선)으로 잇는다.
- 사진·`background` 사용 금지.

### 3.24 `contrast` — 떠나는 것 vs 남는 것 (v1.14, 사용자 승인: references/3pg_slide_concept.png)
좌우 대비 장. 왼쪽(종이 바탕, x 80~880)에 '떠나는 것', 오른쪽에 캔버스 오른쪽·아래 가장자리까지 꽉 찬 짙은 초록 블록(x 960~1920, 제목 아래 y≈260~1080, 안전 영역 예외)에 '남는 것'. 양쪽 모두 작은 라벨 → 세리프 대형 헤드라인(2줄) → 보조 내용 순서. 왼쪽 헤드라인은 차분한 회색 톤, 오른쪽은 흰색(강조 단어는 밝은 초록).
```json
{ "id": "what-remains", "type": "contrast", "step": 1, "kicker": "…", "title": "그러나, 올리브영에게 남은 것은?",
  "left":  { "label": "떠나는 것", "headline": "브랜드는
떠나도", "lines": ["해외 유통사로 직접 입점", "예: 얼타에 K-뷰티 8개 브랜드 (2025.7)"] },
  "right": { "label": "남는 것", "headline": "**Data**는
남는다",
             "stats": [ { "value": "1,700만+", "label": "내국인 온라인 회원" }, { "value": "6주", "label": "중소 브랜드 매장 테스트" } ] },
  "source": "출처: …" }
```
필수: `title`, `left`·`right`(각 `headline` 필수) / 선택: `kicker`, `step`, `source`, 각 쪽 `label`, `lines`(최대 3개), `stats`(최대 3개, 각 `value`·`label`)
- 오른쪽 `headline`의 `**굵게**`는 밝은 강조색(예: 연초록), 왼쪽은 강조색. `
` 줄바꿈 허용.
- `background` 사용 금지. `source`는 박스 아래 표준 각주 위치.
- v1.15: 각 쪽에 선택 필드 `image` `{ "src", "alt", "focus" }`(`assets/images/` 로컬, `alt` 필수). 박스 하단 약 30~35% 영역에 놓이며, 양쪽 사진은 같은 크기·비율로 맞춘다(designer). 한쪽에만 넣지 말고 양쪽 모두 넣거나 모두 뺀다.
- v1.16: `image`는 객체 1개 또는 최대 2개 배열도 허용. 배열이면 같은 미디어 영역 안에 위·아래로 같은 높이로 쌓는다(로고 등). 각 항목에 선택 필드 `fit`: `"cover"`(기본, 사진) | `"contain"`(로고 — 잘리지 않게 전체 표시).

### 3.23 `interview` — 현직자 인터뷰 (v1.13, 사용자 승인: references/16pg_slide_shadow_interview.png)
에디토리얼 커버 스타일. 왼쪽 약 40%(캔버스 0~768px)에 사진이 위·아래·왼쪽 가장자리까지 꽉 차고(안전 영역 예외), 오른쪽 약 60%에 머리글 → 제목 → 인용문(가장 강조) → 출처(인터뷰 대상) → 인사이트 2개(가로 2열) → 사업적 시사점(하단) 순서로 놓인다. 인물 얼굴 사진은 쓰지 않고 그림자·실루엣이 흐린 사진만 쓴다.
```json
{ "id": "interview", "type": "interview", "step": 4, "kicker": "현직자 인터뷰", "title": "…",
  "image": { "src": "assets/images/photos/interview-shadow.png", "alt": "…", "focus": "center" },
  "quote": "…", "interviewee": "K-뷰티 브랜드 해외사업 담당자 (익명)",
  "insights": [ { "heading": "…", "text": "…" }, { "heading": "…", "text": "…" } ],
  "implication": "…", "source": "…" }
```
필수: `title`, `image`(`src`·`alt`), `quote`, `interviewee` / 선택: `kicker`, `step`, `insights`(0~2개, 각 `heading` 필수·`text` 선택), `implication`, `source`, `image.credit`·`focus`
- `quote`·`implication`의 `**굵게**`는 강조색. 인용 부호(“ ”)는 CSS/마크업이 붙이므로 데이터에 넣지 않는다.
- `background` 사용 금지. (v1.12, 사용자 승인: references/5pg_slide_concept.png)
수면 위에 "눈에 보이는 사업"(2~4개)을, 수면 아래에 그 사업이 쌓아 주는 "보이지 않는 가치"(3~5개, 네트워크처럼 연결)를 놓는 빙산 다이어그램. 맨 아래에 흐름 한 줄과 결론 문장.
```json
{ "id": "how-a-then-b", "type": "iceberg", "step": 1, "kicker": "…", "title": "작은 것부터 시작해서, **Signal**을 찾다",
  "subtitle": "눈에 보이는 사업에서 시작해, …",
  "above": [
    { "heading": "해외 진출 지원", "text": "국내 브랜드의 해외 진출 길잡이", "example": "예시: Amazon 미국에서 통할 제품 리포트", "tone": "accent" },
    { "heading": "데이터 축적", "text": "Data와 실적 쌓기", "example": "신호가 맞으면 다음 단계로 확장" },
    { "heading": "시장 정보 제공", "text": "…", "example": "…" },
    { "heading": "글로벌 브랜드 연결", "text": "…" } ],
  "below": [
    { "heading": "DATA", "text": "해외 진출 데이터" },
    { "heading": "PERFORMANCE", "text": "브랜드별 실적 및 성과" },
    { "heading": "MARKET INTELLIGENCE", "text": "…" },
    { "heading": "OPPORTUNITIES" },
    { "heading": "GLOBAL NETWORK", "text": "…" } ],
  "flow": ["Data", "Insight", "Opportunity", "Global Network"],
  "message": "**작은 사업**이 **더 큰 사업적 가치**를 만듭니다." }
```
필수: `title`, `above`(2~4개, 각 `heading` 필수), `below`(3~5개, 각 `heading` 필수) / 선택: `kicker`, `step`, `subtitle`, `above[].text`·`example`·`tone`(`"default"` | `"accent"`), `below[].text`, `flow`(2~5개 문자열), `message`, `source`
- `title`·`subtitle`·`message`의 `**굵게**`는 강조색으로 표시한다(designer).
- 사진·`background` 사용 금지. 빙산·수면·네트워크 점과 선은 developer가 인라인 SVG로 그리고(인라인 색 금지, 클래스만), 색·음영은 designer가 지정한다.
- **배치 기준 좌표(캔버스 1920×1080, developer SVG와 designer 라벨 배치의 공통 기준)**
  - 제목 영역: 왼쪽 위 안전 영역(x 80~900, y 80~300).
  - 수면선: y = 500, 캔버스 좌우 가장자리까지(안전 영역 예외). 수면 아래(y 500~1080)는 바다 면.
  - 수면 위 빙산: 밑변 x 470~1520(y 500), 큰 봉우리 (1180, 290), 작은 봉우리 (900, 360). 여러 면(facet)으로 나뉜 각진 형태.
  - 수면 아래 빙산: (470,500) → (620,650) → (830,820) → (960,860) → (1130,800) → (1360,660) → (1520,500). 바닥 꼭짓점 y ≤ 860.
  - `above` 라벨 위치(`data-pos` = 배열 순서, 개수별): 4개 → 0: 빙산 왼쪽 수면 위(중심 x≈500, y 330~480) · 1: 빙산 몸체 위 왼쪽(중심 x≈880, y 380~490) · 2: 큰 봉우리 위(중심 x≈1180, y 110~270) · 3: 빙산 오른쪽 수면 위(중심 x≈1640, y 330~480). 3개면 0·2·3 위치, 2개면 0·3 위치를 쓴다(`data-slot`에 실제 위치 번호).
  - `below` 노드 중심(`data-pos` = 배열 순서): 0 (960, 570) · 1 (720, 650) · 2 (1240, 640) · 3 (1210, 745) · 4 (960, 790). 3개면 0·1·2, 4개면 0~3 위치. 노드 사이를 가는 선으로 잇고 장식용 작은 점을 흩뿌린다.
  - 하단: `flow` y≈900~945, `message` y≈955~1000 (가운데 정렬, 안전 영역 하단 1000 이내). `source`가 있으면 `message`와 겹치지 않게 designer가 조정.

## 4. 분량 제한 (16:9 넘침 방지)

| 항목 | 제한 |
|---|---|
| `title` | 40자 이내 |
| `subtitle` | 60자 이내 |
| `bullets` 항목 수 | 최대 6개 (하위 `sub`는 항목당 최대 3개) |
| bullet 1개 길이 | 60자 이내 |
| `two-column` 각 컬럼 bullets | 최대 5개 |
| `stats.items` | 2~4개, `value`는 8자 이내 |
| `quote` | 120자 이내 |
| `references.items` | 슬라이드당 최대 6개 |
| `kicker` | 20자 이내 |
| `source` | 80자 이내 |
| `big-number` | `value` 10자 / `label` 40자 / `context` 60자 |
| `process.steps` | 3~5개 / `label` 12자 / `text` 40자 |
| `chart.data` | 2~8개 / `label` 10자 / `caption` 60자 |
| `comparison` | 열 2~5개(열 제목 20자) / 행 2~6개(행 라벨 10자). 셀: 열 2~3개면 32자, 4~5개면 20자 |
| `matrix` | 사분면 `label` 16자 / `text` 50자 / `items` 최대 4개·각 16자 / 축 라벨 12자 / `caption` 60자 |
| `process.steps[].gate` | 20자 |
| `meta.steps` | 최대 6개, 각 8자 |
| `cards` | 카드 2~4개 / `label` 16자 / `title` 24자 / `text` 60자 / `bullets` 최대 3개·각 30자 / 이미지 있는 카드는 `text` 40자·`bullets` 2개 |
| `band` | `items` 2~4개 / `heading` 16자 / `text` 50자 / `bullets` 최대 3개·각 50자 / `body` 100자 / `title` 1줄 권장(32자) |
| `background` 사용 시 | 해당 타입 분량 제한 그대로, 단 `bullets`는 최대 4개 |
| `split` | `bullets` 최대 4개·각 50자 / `body` 120자 |
| `contrast` | `label` 10자 / `headline` 16자(`
` 포함 2줄) / `lines` 최대 3개·각 30자 / `stats` 최대 3개: `value` 8자, `label` 16자 |
| `interview` | `title` 40자 / `quote` 90자 / `interviewee` 30자 / `insights` 최대 2개: `heading` 16자, `text` 50자 / `implication` 60자 |
| `iceberg` | `subtitle` 60자(2줄) / `above` 2~4개: `heading` 12자, `text` 26자, `example` 30자 / `below` 3~5개: `heading` 20자(영문 대문자 권장), `text` 24자 / `flow` 2~5개·각 16자 / `message` 40자 |
| `tree` | `root` 12자 / `levels[].question` 20자 / `levels[].signal` 30자 / 갈래 `label` 10자 / `leaf` 14자 / `caption` 60자 |
| `references` 항목 `title` | 70자 이내 (넘으면 원문 제목을 줄이고 끝에 `…`) |
| `references` 항목 `url` | 길이 제한 없음 (화면에서는 한 줄로 말줄임 처리) |

제한을 넘기면 슬라이드를 분할한다.

## 5. 텍스트 규칙

- 일반 텍스트만 사용한다. HTML 태그 금지 (developer는 `textContent`로 삽입).
- 강조는 `**굵게**` 마크업만 허용 (developer가 `<strong>`으로 변환).
- 줄바꿈이 꼭 필요하면 `\n` 사용.
- 이미지 경로는 프로젝트 루트 기준 상대 경로 (`assets/...`).

## 6. CSS 클래스 계약 (developer ↔ designer)

developer는 아래 구조로 마크업을 생성하고, designer는 이 클래스들을 스타일링한다.

| 클래스 | 용도 |
|---|---|
| `.deck` | 전체 뷰포트 컨테이너 (레터박스 영역) |
| `.slide` | 1920×1080 캔버스. `data-type`, `data-theme` 속성 부여 |
| `.slide.is-active` | 현재 표시 중인 슬라이드 |
| `.slide--{type}` | 레이아웃 타입별 변형 (`.slide--cover`, `.slide--bullets` …) |
| `.slide__title` / `.slide__subtitle` | 제목 / 부제 |
| `.slide__body` | 본문 영역 |
| `.slide__bullets`, `.slide__bullets li`, `.slide__subbullets` | 글머리표 |
| `.slide__columns`, `.slide__column`, `.slide__column-heading` | 2단 레이아웃 |
| `.slide__figure`, `.slide__image`, `.slide__caption` | 이미지 |
| `.slide__stats`, `.stat`, `.stat__value`, `.stat__label` | 수치 |
| `.slide__quote`, `.slide__quote-source` | 인용 |
| `.slide__number` | 섹션 번호 |
| `.slide__meta` | 발표자/연락처 등 보조 정보 |
| `.slide__references`, `.reference`, `.reference__meta`, `.reference__title`, `.reference__url` | 참고 자료 목록 (`ol` > `li.reference`). `.reference__url`은 `<a target="_blank" rel="noopener">` |
| `.slide__category` | 참고 자료 유형 표시 (기사 / 공식 자료 / 보고서·PDF / 논문 / 기타). 슬라이드에 `data-category` 속성도 부여 |
| `.slide__kicker` | 제목 위 머리글 (`kicker`) |
| `.slide__source` | 하단 출처 각주 (`source`). 안전 영역 하단 안쪽에 위치 |
| `.slide__credit` | 이미지 저작자·라이선스 표기 (`image`·`split`·`cover`) |
| `.cover__media`, `.cover__image`, `.cover__overlay` | cover 대표 이미지 영역·이미지·가독성 막. 슬라이드에 `data-has-image`, `data-image-style="full|split"`, `data-overlay="dark|light|none"` 속성. 이미지에 `data-focus` 속성. DOM 순서는 `.cover__media`(이미지·막·credit) → 텍스트(title·subtitle·meta) |
| `.slide__bignumber`, `.bignumber__value`, `.bignumber__label`, `.bignumber__context` | big-number |
| `.slide__process`(`ol`), `.step`, `.step__index`, `.step__label`, `.step__text` | process. `.step__index`는 01, 02… 번호 |
| `.chart__baseline`(`line`), `.chart__baseline-label`(`text`), `.chart__baseline-tag`(`g`) > `.chart__baseline-tag-bg`(`rect`, v1.12) | chart 기준선(v1.6, `chart.baseline`). v1.12: 라벨은 `g.chart__baseline-tag` 안에 배경 `rect`(텍스트 크기에 맞춤) → `text` 순서. `text.chart__label`에 `data-highlight="true|false"`. 막대·값 라벨보다 위에 그린다. 색·점선은 designer가 지정 |
| `.slide__chart`(`figure`), `.chart`(`svg`), `.chart__axis`, `.chart__bar`, `.chart__bar--highlight`, `.chart__line`, `.chart__point`, `.chart__point--highlight`, `.chart__value`, `.chart__label`, `.chart__unit`, `.slide__caption` | chart. SVG 요소에 색·폰트를 인라인으로 지정하지 않고 클래스만 부여한다(색은 designer가 `fill`/`stroke`로 지정) |
| `.slide__table`(`table`), `.table__corner`, `.table__colhead`, `.table__rowhead`, `.table__cell`, `.is-highlight` | comparison. 강조 열의 `th`·`td`에 `.is-highlight` |
| `.split__text`, `.split__media` | split 좌우 영역. 슬라이드에 `data-image-side="left|right"`, 이미지가 있으면 `data-has-image` 속성 |
| `.stepbar`(`ol`), `.stepbar__item`, `.stepbar__item.is-current`, `.stepbar__item.is-done`, `.stepbar__index`, `.stepbar__label` | 단계 진행 표시줄 (`step` 지정 시 캔버스 내부 상단). 슬라이드에 `data-step` 속성 |
| `.slide__matrix`, `.matrix__axis`, `.matrix__axis--x`, `.matrix__axis--y`, `.matrix__axis-label`, `.matrix__axis-low`, `.matrix__axis-high`, `.matrix__grid`, `.quadrant`, `.quadrant__label`, `.quadrant__text`, `.quadrant__items`, `.slide__caption` | matrix. `.quadrant`에 `data-position`, `data-tone` 속성 |
| `.table__cell[data-mark="good|bad|warn"]`, `tr.is-highlight-row` | comparison 셀 표시·행 강조 |
| `.slide__column[data-tone="accent|danger"]` | two-column 컬럼 톤 |
| `.step__gate` | process 관문(마름모 + 조건 텍스트). 해당 `li.step` 다음 형제 `li.step__gate`로 둔다 |
| `.slide[data-has-bg]`, `.slide__bg`, `.slide__bg-image`, `.slide__bg-overlay` | background. `.slide__bg`는 `.slide`의 첫 자식(진행 표시줄보다 앞), 안에 `img.slide__bg-image`(`data-focus`)·`.slide__bg-overlay`·`.slide__credit`. 슬라이드에 `data-overlay="dark|light"` |
| `.slide--split[data-image-ratio="1/3|1/2|2/3"]` | split 이미지 비율 |
| `.slide__cards`(`ul`), `.card`, `.card__media`, `.card__image`, `.card__label`, `.card__title`, `.card__value`, `.card__text`, `.card__bullets`, `.slide__credit` | cards. `.slide__cards`에 `data-count`, `data-has-image`. `.card`에 `data-tone`. 카드 사진 credit은 `.card__media` 안 `.slide__credit` |
| `.band__media`, `.band__image`, `.band__content`, `.band__items`(`ul`), `.band__item`, `.band__heading`, `.band__value`, `.band__text` | band. `.band__media`(이미지·credit) → `.band__content`(kicker·title·subtitle·items/bullets/body) 순서. `.band__items`에 `data-count` |
| `.slide__tree`, `.tree__heads`, `.tree__head`(`data-level="0|1|leaf"`), `.tree__question`, `.tree__signal`, `.tree__root`, `.tree__node`(`data-depth="1|2"`), `.tree__node-label`, `.tree__leaf`(`data-tone`), `.tree__lines`(`svg`), `.tree__line` | tree(v1.6). `.tree__heads`는 열 머리글 줄(2·3열 질문+징후, 4열 결과 머리글). 본체는 4열 그리드: `.tree__root` → depth 1 노드 2개 → depth 2 노드 4개 → `.tree__leaf` 4개. 연결선은 `.tree__lines` SVG 안 `path.tree__line`(인라인 색 금지, 노드 위치를 측정해 그림). 각 노드·leaf에 `data-branch="0|1"`, depth 2·leaf에 `data-child="0|1"`. 머리글 1·4열은 `.tree__head[data-level="root"|"leaf"][data-empty]` 빈 칸. 선에 `data-from="0|1|2"`(출발 깊이), 마지막 단계는 `data-kind="arrow"` + `marker.tree__arrow` > `path.tree__arrow-head`. 모든 노드는 `.slide__tree`의 직계 자식(평평한 구조, 행 배치는 CSS가 data 속성으로) |
| `.slide__chart[data-kind="hbar"]` | 가로 막대 chart(v1.7). 하위 요소 클래스는 bar와 동일. 모든 chart figure에 `data-kind="bar|line|hbar"` 부여. `.slide__equation[data-count]`(항 수), `.pillars__base[data-tone]`도 부여 |
| `.slide--process[data-layout="stairs"]`, `li.step[data-level]` | 계단형 process(v1.7) |
| `.slide__equation`, `.equation__term`, `.equation__op`, `.equation__equals`, `.equation__result`, `.equation__label`, `.equation__text` | equation(v1.7). 순서: term → op → term (→ op → term) → equals → result. `.equation__result`가 주인공 |
| `.slide__pillars`, `.pillars__columns`(`data-count`), `.pillar`(`data-tone`), `.pillars__base`, `.pillar__label`, `.pillar__value`, `.pillar__title`, `.pillar__text` | pillars(v1.7). `.pillars__columns` 안에 `.pillar` 2~3개, 그 아래 `.pillars__base`(전체 폭). base 내부도 `.pillar__label/value/title/text` 클래스를 재사용 |
| `.slide__roc`, `.roc__chart`(`figure`), `svg.roc`, `.roc__area`, `.roc__grid`, `.roc__frame`, `.roc__chance`, `.roc__chance-label`, `.roc__curve[data-style="lead|alt|dim"]`, `.roc__tick`, `.roc__axis`, `.roc__lead`, `.roc__marker[data-style="filled|hollow"]`, `.roc__note-heading`, `.roc__note`, `.roc__note-label`, `.roc__aside`, `.roc__models`(`ul`), `.roc__model[data-style]`, `.roc__swatch`(`svg`) > `.roc__swatch-line`, `.roc__name`, `.roc__desc`, `.roc__auc`, `.roc__ci`, `.roc__takeaways`, `.roc__takeaway` | roc(v1.8). 2열: 왼쪽 `.roc__chart`, 오른쪽 `.roc__aside`(models → takeaways). 인라인 색 금지 |
| `.slide__data-panels`(`data-has-link`), `.dpanel`(`data-tone="primary|secondary"`), `.dpanel__head`, `.dpanel__heading`, `.dpanel__meta`, `.dpanel__stats`(`data-count`), `.dpanel__stat`, `.dpanel__stat-value`, `.dpanel__stat-label`, `.dpanel__message`, `.dpanel__chart-title`, `.dpanel__figure`, `.dpanel__image`, `.dpanel__fields`, `.dpanel__fields-label`, `.dpanel__link`, `.dpanel__link-badge`, `.dpanel__link-value`, `.dpanel__link-label`, `.dpanel__link-note` | data-panels(v1.9). 순서: 패널1 → (link) → 패널2. 패널 내부: head(heading·meta) → stats → message → chart-title → figure(img.dpanel__image) → fields |
| `.slide__iceberg`(`data-above-count`, `data-below-count`), `svg.iceberg__art`, `.iceberg__sea`, `.iceberg__waterline`, `.iceberg__facet`(`data-part="above|below"`, `data-shade="1~5"`), `.iceberg__link`(`line`), `.iceberg__dot`(`circle`, `data-size="s|m"`), `.iceberg__above`(`ul`), `.iceberg__item`(`data-pos`, `data-slot`, `data-tone`), `.iceberg__heading`, `.iceberg__text`, `.iceberg__example`, `.iceberg__below`(`ul`), `.iceberg__node`(`data-pos`), `.iceberg__node-heading`, `.iceberg__node-text`, `.iceberg__footer`, `.iceberg__flow`(`p`) > `.iceberg__flow-step` + `.iceberg__flow-arrow`, `.iceberg__message` | iceberg(v1.12). DOM: stepbar → kicker → title → subtitle → `.slide__iceberg`(svg → above → below) → `.iceberg__footer`(flow → message) → source. `svg.iceberg__art`는 viewBox `0 0 1920 1080`, 캔버스 전체(0,0)에 깔리는 장식층(`aria-hidden`). 그라데이션이 필요하면 `<defs>` 안 `stop.iceberg__stop`에 `data-stop` 속성만 두고 색은 CSS `stop-color`로. 라벨·노드는 3.22 좌표에 맞춰 designer가 absolute 배치 |
| `.slide__contrast`, `.contrast__side`(`data-side="left|right"`), `.contrast__label`, `.contrast__headline`, `.contrast__lines`(`ul`), `.contrast__line`, `.contrast__stats`(`ul`, `data-count`), `.contrast__stat`, `.contrast__stat-value`, `.contrast__stat-label` | contrast(v1.14). DOM: stepbar → kicker → title → `.slide__contrast`(`.contrast__side[data-side=left]` → `.contrast__side[data-side=right]`; 각 side: label → headline → lines → stats → (v1.15) `.contrast__media` > `img.contrast__image[data-focus]`; 사진이 있으면 side에 `data-has-image`. v1.16: 배열이면 `.contrast__media[data-count="2"]` 안에 `img.contrast__image`가 순서대로 2개, 각 img에 `data-fit="cover|contain"`) → source. 인라인 색 금지 |
| `.interview__media`, `.interview__image`(`data-focus`), `.slide__credit`, `.interview__body`, `.interview__quote`(`blockquote`), `.interview__interviewee`, `.interview__insights`(`ul`, `data-count`), `.interview__insight`, `.interview__insight-heading`, `.interview__insight-text`, `.interview__implication` | interview(v1.13). DOM: `.interview__media`(img·credit) → stepbar → `.interview__body`(kicker → title → quote → interviewee → insights → implication → source). 인라인 색 금지 |
| `.progress`, `.page-number` | 진행 표시줄 / 페이지 번호 |
| `.progress__bar` | 진행 표시줄 내부 채움 막대 (JS가 `width`를 % 로 설정) |
| `.nav`, `.nav__button`, `.nav__button--prev`, `.nav__button--next` | 하단 화살표 내비게이션 (`<button>`, 캔버스 밖 `.deck` 위에 고정). 첫/마지막 슬라이드에서 `disabled` 속성 부여 |

> 내비게이션·진행 표시 요소는 `.slide` 캔버스 밖(뷰포트 기준)에 위치하며, 인쇄 시 숨긴다.

### 필수 CSS 변수 (designer가 `:root`에 정의)
`--slide-width: 1920px`, `--slide-height: 1080px`, `--safe-area: 80px`,
`--color-bg`, `--color-text`, `--color-accent`, `--color-muted`,
`--font-heading`, `--font-body`, `--fs-title`, `--fs-subtitle`, `--fs-body`

## 7. 검증 체크리스트

- [ ] 유효한 JSON이며 `version`, `meta.title`, `meta.aspectRatio: "16:9"`, `slides`가 존재
- [ ] 모든 슬라이드에 고유한 `id`와 정의된 `type`이 있음
- [ ] 타입별 필수 필드 누락 없음
- [ ] 4절 분량 제한 준수
- [ ] HTML 태그 미포함
