# 멀티에이전트 발표자료 개발 프로젝트

HTML/CSS/JS 기반 웹 슬라이드 발표자료를 **리서치 · 기획 · 디자인 · 개발 · 모션** 다섯 에이전트가 역할을 나눠 제작한다.

## 1. 프로젝트 구조

```
.
├── CLAUDE.md                     # 프로젝트 공통 지침 (이 파일)
├── index.html                    # 슬라이드 뷰어 진입점        ← developer
├── data/
│   ├── research.md               # 리서치 결과 (출처 포함)      ← searcher
│   └── slides.json               # 슬라이드 콘텐츠 데이터       ← planner
├── assets/images/                # 라이선스 확인된 이미지      ← searcher
├── src/
│   ├── theme.css                 # 디자인 토큰 · 레이아웃 스타일 ← designer
│   ├── app.js                    # 렌더링 · 내비게이션 로직     ← developer
│   ├── motion.css                # 전환 · 빌드 애니메이션 스타일 ← animator
│   └── motion.js                 # 애니메이션 실행 로직         ← animator
└── .claude/
    ├── skills/slide-schema.md    # slides.json 작성 규격 (단일 진실 공급원)
    └── agents/
        ├── searcher.md
        ├── planner.md
        ├── designer.md
        ├── developer.md
        └── animator.md
```

## 2. 역할 분리 규칙 (가장 중요)

| 에이전트 | 수정 가능 파일 | 읽기만 가능 |
|---|---|---|
| `searcher` | `data/research.md`, `assets/images/**` | 그 외 전부 |
| `planner` | `data/slides.json` | 그 외 전부 |
| `designer` | `src/theme.css` | 그 외 전부 |
| `developer` | `index.html`, `src/app.js` | 그 외 전부 |
| `animator` | `src/motion.css`, `src/motion.js` | 그 외 전부 |

- 각 에이전트는 **자기 소유 파일만** 수정한다. 다른 파일에 변경이 필요하면 직접 고치지 말고, 결과 보고에 `요청 사항: <대상 에이전트> — <필요한 변경>` 형태로 남긴다.
- `.claude/skills/slide-schema.md`는 에이전트 간 **계약(contract)** 이다. 에이전트는 이 파일을 임의로 수정하지 않으며, 스키마 변경은 사용자(또는 메인 세션)의 승인 후에만 반영한다.
- 메인 세션(오케스트레이터)은 작업을 쪼개 적절한 에이전트에 위임하고, 결과를 통합·검증한다. 메인 세션이 직접 소유 파일을 수정하는 것은 사용자가 명시적으로 요청했을 때만 한다.

### 협업 인터페이스
- **searcher → planner**: 근거 데이터는 `data/research.md`로 전달한다. 모든 사실에 출처 URL·기준 시점·신뢰도를 붙이고, 찾지 못한 것은 "확인 실패"로 남긴다. planner가 추가 조사가 필요하면 `요청 사항: searcher — <조사할 내용>`으로 남긴다.
- **planner → developer**: 슬라이드 데이터는 반드시 `slide-schema.md`의 `type`과 필드만 사용한다. 새 레이아웃이 필요하면 developer/designer에게 요청한다.
- **developer → designer**: 마크업에 사용하는 클래스명은 `slide-schema.md`의 "CSS 클래스 계약" 절을 따른다. 새 클래스가 필요하면 designer에게 요청한다.
- **designer**: 계약된 클래스와 CSS 변수만 스타일링하며, 마크업 구조 변경이 필요하면 developer에게 요청한다.
- **animator**: 계약된 클래스를 선택자로만 쓰고 `.slide`의 `transform`(뷰어 스케일링)은 건드리지 않는다. 로드 태그·마크업이 필요하면 developer에게, 색·레이아웃 변경은 designer에게 요청한다.

### 권장 작업 순서
1. `searcher` — 주제에 필요한 수치·사실을 인터넷에서 확인해 `data/research.md` 작성 (사용자 제공 수치 검증 포함)
2. `planner` — `data/research.md`와 사용자 입력을 바탕으로 `data/slides.json` 작성
3. `designer` — planner가 고른 type 배치를 검토(표 수, 이미지 레이아웃 반복, 시각 리듬)하고 필요하면 planner에 재배치 요청
4. `developer` — 스키마의 모든 `type`을 렌더링하도록 `index.html`, `src/app.js` 구현
5. `designer` — `src/theme.css`로 시각 스타일 완성
5-1. `animator` — `src/motion.css`, `src/motion.js`로 슬라이드 전환·그래프 빌드 애니메이션 추가 (최종 상태는 theme.css 레이아웃과 동일, 인쇄 시 애니메이션 해제)
6. 메인 세션 — 브라우저로 열어 전체 슬라이드 검수(캡처를 planner·designer에게도 전달), 필요 시 해당 에이전트에 재위임

## 3. 16:9 비율 유지 규칙

- 슬라이드 기준 해상도는 **1920 × 1080 px (16:9)** 로 고정한다.
- 슬라이드는 고정 크기 캔버스(`.slide`, 1920×1080)로 그리고, 화면 크기에 맞춰 `transform: scale()`로 **균등 축소/확대**한다. 남는 영역은 레터박스(검정/배경색)로 처리한다.
- 폰트·여백 등을 `vw`, `vh`, `%` 기반으로 바꿔 비율을 흉내 내지 않는다. 캔버스 내부는 px(또는 CSS 변수) 단위로 작성한다.
- 콘텐츠는 캔버스 밖으로 넘치면 안 된다(`overflow: hidden`). 넘침이 발생하면:
  - planner: 텍스트 분량을 줄이거나 슬라이드를 나눈다.
  - designer: 해당 레이아웃의 타이포 스케일/여백을 조정한다.
- 안전 영역(safe area): 상하좌우 **최소 80px** 여백 안에 핵심 콘텐츠를 배치한다.
- 인쇄/PDF 출력 시에도 한 페이지 = 한 슬라이드(16:9)가 되도록 `@page { size: 1920px 1080px; }`를 유지한다.

## 4. 공통 기술 규칙

- 빌드 도구 없이 **순수 HTML/CSS/Vanilla JS**로 동작해야 한다. 외부 라이브러리는 꼭 필요할 때만 CDN으로, 버전을 고정해서 사용한다.
- `fetch('data/slides.json')`을 사용하므로 로컬 확인은 정적 서버로 연다: `npx serve .` 또는 `python -m http.server 8000`.
- 문자 인코딩은 UTF-8, 기본 언어는 한국어(`<html lang="ko">`).
- 들여쓰기 2칸, JSON은 주석 없이 유효한 JSON으로 작성한다.
- 키보드 내비게이션(←/→, Space, Home/End)과 URL 해시(`#3`)로 슬라이드 이동을 지원한다.

## 5. 완료 기준 (Definition of Done)

- [ ] `data/slides.json`이 `slide-schema.md` 규격을 통과한다.
- [ ] 슬라이드의 모든 수치가 사용자 제공 자료 또는 `data/research.md`의 출처 있는 사실에 근거한다.
- [ ] 덱 맨 끝에 자료 유형별(기사 / 공식 자료 / 보고서·PDF / 논문) `references` Appendix 슬라이드가 있고, 본문 수치·사실의 출처가 모두 포함되어 있다.
- [ ] 모든 슬라이드가 1920×1080 캔버스 안에서 넘침 없이 표시된다.
- [ ] 브라우저 창 크기를 바꿔도 16:9 비율이 유지된다.
- [ ] 각 에이전트가 자기 소유 파일 외에는 변경하지 않았다.
