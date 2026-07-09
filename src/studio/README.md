# APT DATA 카드 스튜디오 — 카드뉴스 생성 시스템

손으로 HTML을 짜서 매번 재발하던 버그(막대 폭 무시·오버플로우·숫자 조작·brand 드리프트)를,
**검증된 데이터 + 테스트된 템플릿 + 자동 가드레일**로 구조적으로 차단하는 시스템.

## 파이프라인
```
CSV(국토부 실거래)  ──emit_data.py──▶  data.json (숫자 단일 소스)
globals.css        ──tokens.mjs────▶  브랜드 토큰 (색 단일 소스)
                                        │
cards.json (스펙) ──build.mjs──▶ 해석 → 검증(validate) → HTML(templates) → PNG
                                        │  FAIL 하나라도 있으면 exit 1 (fail-closed)
```

## 명령
```bash
npm run 카드:데이터     # CSV → src/studio/data.json 재계산 (숫자 갱신 시)
npm run 카드:빌드       # cards.json → 참고자료/마케팅/카드_out/*.png
node src/studio/build.mjs src/studio/cards.bad.json   # 가드레일 fail-closed 시연
```

## 가드레일 ↔ 우리가 겪은 버그 (커버리지)
| 버그(실제 발생) | 방지 방식 | 규칙 |
|---|---|---|
| 막대가 값과 무관(인라인 span 폭 무시) | 막대 폭을 **값에서 계산**하는 파라메트릭 템플릿 → 구조적 불가 | (템플릿) |
| 2B 카드 오버플로우(콘텐츠가 잘림) | 렌더 후 **높이 측정**(콘텐츠가 출처 바 침범 시 차단) | `OVERFLOW` |
| C4 "정릉풍림이 싼 건 …때문"(prose 조작) | 인과/설명 서술 검출 → 사람 검수(`reviewedClaims`) 없으면 차단 | `PROSE_CLAIM` |
| "6억=3곳"(손으로 쓴 카운트, 실제로 4곳) | 산문의 정밀수치·카운트 금지 → `{{데이터키}}` 바인딩 강제 | `RAW_FIGURE` |
| @hanji.zip·토스레드 잔존(brand 드리프트) | 워터마크·출처·색을 **data.meta·globals.css 단일 소스**에서만 | `BRAND` |
| 정책·세율 카드가 사실확인 없이 발행 | 정책 카드는 `[발행 전 확인]` 배지 강제 | `POLICY` |

## 카드 추가법 (cards.json에 스펙 한 개)
숫자는 **직접 쓰지 않고 데이터 키를 참조**한다. 예:
```jsonc
// hero: 지배 숫자 1개
{ "id":"F5_최저가", "template":"hero", "type":"data",
  "eyebrow":"...", "kicker":"...(일반 서술)",
  "valueRef":"cheapest24.0.median", "unit":"억",
  "headlineTpl":"서울에도 3억대 방3<br/>있다?",          // 일반 서술(엔티티 인과 금지)
  "subTpl":"단지 중위값 · {{cheapest24.0.gu}} {{cheapest24.0.name}}" }  // 숫자·이름은 {{키}}

// ranking: 데이터 막대(폭=값 비례, 자동)
{ "id":"B1", "template":"ranking", "type":"data",
  "source":"gu24", "topN":4, "bottomN":4, "highlightMin":true, "headlineTpl":"..." }

// concept/policy: 개념·제도(정책은 verifyBeforePublish 필수)
{ "id":"H1", "template":"concept", "type":"policy", "verifyBeforePublish":true,
  "headlineTpl":"...", "paras":["...","..."] }
```
- **캡션**: 스펙에 `captionTpl`(+`cta`, `hashtags`)을 넣으면 빌드 시 `<out>/캡션.md`로 함께 방출된다.
  캡션 숫자도 카드와 동일하게 `{{데이터키}}` 바인딩 강제(가드레일 통과 필수) — 카드/캡션 숫자가 어긋날 수 없다.
  피드·릴스 쌍이면 피드 스펙에만 붙인다(캡션 공용). **새 카드를 만들 때는 캡션도 반드시 함께 스펙에 넣는다.**
- 엔티티(단지·구)별 **인과/이유 서술이 꼭 필요하면** `"reviewedClaims": true`(사람이 사실확인했다는 서명)를 명시해야 통과.
- 데이터에 없는 숫자(정책·세율·월상환액)는 `type:"policy"` + `verifyBeforePublish:true` → `[발행 전 확인]` 배지.

## 파일
- `emit_data.py` — CSV 계산 → `data.json` (숫자 단일 소스)
- `tokens.mjs` — `globals.css`에서 브랜드색 파생 (복제 금지)
- `templates.mjs` — 순수 `model→HTML`(hero·ranking·concept). **DB/next 의존 없음 → /studio React로 이식 가능**
- `validate.mjs` — 가드레일 6종
- `build.mjs` — 해석·검증·렌더·측정 오케스트레이터
- `cards.json` / `cards.bad.json` — 카드 스펙 / fail-closed 데모

## /studio 이식(다음)
`templates.mjs`는 순수 함수라 그대로 React 컴포넌트로 옮기고, `data.json` 대신 **DB(drizzle) 실시간 쿼리**를
주입하면 앱 내 `/studio` 라우트가 된다. 가드레일(`validate.mjs`)은 그대로 재사용.
