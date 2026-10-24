# Calculate Everything 기술 SEO 감사

## 범위·결론

- 저장소: `ji-minseo/calculate-everything`, 기준 `335d6aeb268d7c6768914aa4b68722c20e28dbac`.
- 비교 저장소: `ji-minseo/everytinytool`, main `43a00c7`, 기존 SEO 수정 브랜치 커밋 `37cfa42`도 읽기 전용 비교.
- 공개 HTML 20개(영문/한국어 각각 홈 1개 + 계산기 9개), `404.html`, JS/CSS, robots, sitemap, 배포 및 커밋 이력을 검사.
- **소스와 로컬 Chromium에서 공개 페이지의 색인을 불가능하게 하는 결함은 확인되지 않았다.** 운영 응답·Google 렌더링·선택 canonical은 미검증이다.
- 확인된 코드 결함은 **한국어 계산기 9종의 계산식 렌더링 누락**이다. 홈페이지 FAQ의 “결과 아래 계산식 표시” 안내와 실제 실행 결과가 달랐다. 이는 콘텐츠/기능 정합성 문제이며 색인 차단이나 검색 노출 감소의 원인이라는 증거는 없다.
- 정상 URL 삭제·noindex 추가·canonical 변경·콘텐츠 개편·배포·병합은 하지 않았다.

## 프로젝트·배포

프레임워크, SSR, 빌드 단계, 백엔드가 없는 HTML/CSS/vanilla JavaScript 정적 사이트다. `.github/workflows/pages.yml`은 main push 또는 수동 실행 때 저장소 루트를 Pages artifact로 올린다. `.nojekyll`이 존재한다. PR 브랜치 push는 이 배포 트리거에 해당하지 않는다. 저장소에 CNAME 파일은 없지만 사용자 지정 도메인은 Pages 설정에서도 관리할 수 있으므로 이를 결함으로 판정하지 않는다. 실제 Pages 사용자 지정 도메인, HTTPS 강제, DNS/CDN 설정과 배포 성공 SHA는 별도 확인이 필요하다.

## 발견 및 수정

`assets/tools-ko.js`의 `show()`가 `id + '계산식'`을 조회했지만 한국어 HTML의 모든 계산식 영역은 `id + 'Formula'`였다. 계산 결과는 정상 출력되어 예외 없이 계산식만 사라졌다.

- `show()`의 DOM 대상 접미사를 `Formula`로 수정했다. 계산 로직·디자인·기존 텍스트는 유지했다.
- `ko/*-calculator/index.html` 9개의 JS 쿼리 버전을 `20261024-formula-target`으로 바꿔 기존 URL 캐시와 구별했다. 캐시 무효화가 운영에서 완료됐다는 의미는 아니다.
- `tests/ko-formulas.test.js`: 실제 HTML의 ID·입력 기본값으로 스크립트를 초기화하고 9종의 계산 결과/계산식 및 유효하지 않은 입력 후 이전 계산식 제거를 검증한다. 수정 전 10개 실패, 수정 후 10개 통과.
- `tests/seo_test.py`: 사이트맵과 canonical의 정확한 대응, 고유 title/description·H1, robots/meta, 언어 상호 참조, 로컬 링크/자원 존재, 언어별 홈에서 정적 링크 도달, FAQ JSON-LD와 본문 일치를 검사한다.
- `.github/workflows/seo.yml`: PR/main의 관련 변경에 Python 검사, 두 언어 JS 구문 검사, 전체 Node 테스트를 실행한다. 운영 접속과 브라우저 검사는 이 CI에 포함하지 않았다.

## 기술 SEO 검사 결과

| 항목 | 확인한 근거 | 판정 |
| --- | --- | --- |
| robots.txt | `User-agent: *`, `Allow: /`, 올바른 sitemap 절대 URL; Googlebot 대상 20 URL 로컬 파싱 허용 | 소스 정상 |
| sitemap.xml | 20개 URL, 중복/누락 없음; 각 실제 HTML의 self-canonical과 일치 | 소스 정상 |
| canonical | 20개 모두 정확히 하나, HTTPS·calculate 호스트·슬래시 경로; ko는 ko로 자체 참조 | 소스 정상 |
| noindex·리다이렉트 | 공개 HTML에 noindex/none, meta refresh 없음; 앱 JS에 위치 이동 코드 없음 | 소스 정상, 서버 헤더/redirect 미검증 |
| 초기 HTML | 20개 모두 title·description·H1·본문·탐색 a[href] 제공 | JS가 SEO 본문을 생성해야 하는 SPA 구조 아님 |
| JS 렌더링 | 21 HTML에서 JS on/off의 title·description·H1·canonical·robots meta·JSON-LD 동일, pageerror 0 | 로컬 정상 |
| 내부 링크 | 사이트 내 정적 링크와 CSS/JS/favicon 경로 모두 존재; 언어별 홈에서 10개씩 도달 | 소스 정상 |
| 언어 | en/ko/x-default의 상호 참조 일치, html lang 일치 | 소스 정상 |
| 구조화 데이터 | 영문/한국어 홈, 영문 time/ratio의 FAQPage 총 4개; 질문/답변이 본문과 일치, JSON 구문 정상 | 소스 정상 |
| 나머지 도구의 schema 부재 | 예: Tip에는 FAQ 본문이 있으나 FAQPage 없음 | 색인 필수 요소 아님, 불필요한 추가 안 함 |
| 오류 페이지 | 404.html 존재, sitemap 제외, 복귀 링크 있음 | 운영의 실제 404 상태/soft 404는 미검증 |

FAQ의 접힌 details 내용은 HTML에 존재한다. FAQPage가 유효해도 이 사이트의 Google FAQ 리치 결과 노출 적격성을 보장하지 않는다. JS는 계산기 탭을 숨기고 보조 탐색/메인 사이트 안내 링크를 추가하지만 주요 탐색·본문·메타를 삭제하지 않는다. 계산기 페이지 정적 링크 13~15개 → JS 후 26~28개이며, 홈은 23개로 유지된다. ko 언어 전환의 가시적 링크는 없지만 sitemap과 hreflang에 존재하므로 크롤러 발견 불가능/고아 페이지로 판정하지 않았다. 사용자용 언어 선택 UI는 별도 제안 사항이다.

## 페이지별 확인

모든 행은 canonical=sitemap=self, H1 1개, 고유 title/description, en/ko 상호 hreflang 검사를 통과했다. 경로는 도메인 `https://calculate.everytinytool.com` 기준이다.

| 영문 / 한국어 경로 | 영문 title | 한국어 title | 검색 의도·구조화 데이터 |
| --- | --- | --- | --- |
| `/`, `/ko/` | Calculate Everything — Fast Free Calculators | 무료 온라인 계산기 모음 \| Calculate Everything | 도구 탐색, 양쪽 FAQPage |
| `/percentage-calculator/`, `/ko/percentage-calculator/` | Percentage Calculator | 퍼센트 계산기 \| Calculate Everything | 백분율·증감률 |
| `/age-calculator/`, `/ko/age-calculator/` | Age Calculator | 나이 계산기 \| Calculate Everything | 생일 기반 나이·나이 기준 |
| `/discount-calculator/`, `/ko/discount-calculator/` | Discount Calculator | 할인 계산기 \| Calculate Everything | 순차 할인·쿠폰 |
| `/date-calculator/`, `/ko/date-calculator/` | Date Calculator | 날짜 계산기 \| Calculate Everything | 날짜 차이·영업일 |
| `/average-calculator/`, `/ko/average-calculator/` | Average Calculator | 평균 계산기 \| Calculate Everything | 통계·표준편차 |
| `/tip-calculator/`, `/ko/tip-calculator/` | Tip Calculator — Calculate Tips & Split Bills Free | 팁·더치페이 계산기 \| Calculate Everything | 팁·인원별 분담 |
| `/time-calculator/`, `/ko/time-calculator/` | Time Calculator — Hours Between Times, Add & Subtract | 시간 계산기 \| Calculate Everything | 시각 차이·근무시간, 영문 FAQPage |
| `/ratio-calculator/`, `/ko/ratio-calculator/` | Ratio Calculator — Simplify Ratios & Solve Proportions | 비율 계산기 \| Calculate Everything | 비율 약분·비례식, 영문 FAQPage |
| `/vat-calculator/`, `/ko/vat-calculator/` | VAT Calculator | 부가세 계산기 \| Calculate Everything | 세전/세후·부가세 |

## 유사 콘텐츠·검색 의도

같은 언어 내 title/description의 완전 중복은 없다. 템플릿의 탐색·네트워크 카드·“값을 입력하고 계산” 설명이 반복되지만 폼과 주요 기능은 서로 다르다. Percentage/Ratio, Age/Date, Date/Time은 일부 의도가 겹치나 각각 백분율/비례식, 나이/날짜간격, 달력/시각으로 기능이 구별된다. 다른 언어의 번역 페이지는 self-canonical과 hreflang으로 구별되므로 일괄 중복으로 통합하지 않았다.

일부 도구의 How it works는 짧고 메타 설명을 반복하며, 영문 Tip/Ratio에 비해 한국어 설명·예시는 적다. 이는 콘텐츠 품질 개선 후보이지 크롤링 불가나 Google 중복 판정을 확인한 것은 아니다. 대규모 개편은 하지 않고, 필요하면 주제별 검산 예시/경계 조건/사용 기준을 별도 보강할 것을 제안한다. 실제 검색 의도 경쟁 여부는 GSC 쿼리별 URL 분포로 검증해야 한다. 다른 3개 서브사이트의 코드/콘텐츠 전수 비교는 이번 범위에서 수행하지 못했다.

## 10월 15일 전후 이력과 공통 원인 비교

- 이 저장소 최신 main은 10월 14일 `335d6ae`. 10월 15~18일 커밋은 없다. 저장소 커밋 시각은 실제 배포/관리자 설정 변경 시각을 증명하지 않는다.
- 10월 14일 `b3be50c` Tip 설명/예시, `1b0c8a1` Ratio 설명, `3d02e5a` Tip 프리셋, `e8cea7d` undefined `$$` 수정, `1c73402` JS/CSS 버전 갱신, `f54b523`·`335d6ae` 회귀 테스트/CI가 추가됐다. 현재 팁 테스트는 통과하며 해당 변경에 robots/canonical/sitemap/Pages 배포 설정 수정은 없다.
- 한국어 계산식 오류는 10월 1일 `f54dfc1`에서 들어왔고 10월 15일 발생을 설명하지 않는다. 과거 영어 팁 프리셋 오류 역시 현재 코드에서 재현되지 않으며 전체 호스트 공통 원인으로 볼 근거가 없다.
- 메인 저장소의 10월 14일 `1225962`는 배경 제거 도구 홈 링크 변경이다. 양쪽 사이트의 이 시기 코드에서 동시 색인 차단 설정 변경을 확인하지 못했다.
- 메인 기존 SEO 수정 `37cfa42`의 4건은 metadata-inspector/metadata-cleaner sitemap 누락 2건, PDF/background-removal JSON-LD URL 정렬 2건이다. Calculate에서는 sitemap 누락도 cross-domain canonical/JSON-LD URL 불일치도 재현되지 않는다.
- 메인과 Calculate는 GitHub Pages 배포 워크플로, 정적 HTML, 개방 robots, 외부 광고 스크립트 사용이 공통이다. 광고는 async이고 로컬에서 차단해도 본문/메타/계산기 JS가 정상 동작했다. 광고의 실제 가용성·동의 UI·운영 영향을 이 결과만으로 배제하지는 않는다.
- 공통 DNS/CDN/WAF/보안 챌린지, robots/X-Robots-Tag, 캐시 오염, Googlebot 응답 차이 등은 운영 검증이 필요한 **가설**이다. 코드에 증거가 없으므로 공통 근본 원인으로 확정하지 않는다.

## 운영 접근 한계와 다음 확인

환경 정책은 허용 목록 방식이다. 5개 운영 호스트 HTTPS HEAD가 모두 프록시 `CONNECT tunnel failed, response 403`으로 종료됐다. Calculate의 robots GET과 HTTP 루트 GET도 프록시에서 거부됐다. HTTPS 요청은 origin 서버까지 도달하지 않았으므로 이를 사이트 403/Googlebot 차단으로 기록해서는 안 된다. 로컬 Python 정적 서버 응답은 Pages/CDN의 응답을 대신하지 않는다.

접근 가능한 환경에서 다음을 GET으로 확인한다.

1. 20개 공개 URL, `/robots.txt`, `/sitemap.xml`, CSS/JS, 없는 경로의 실제 HTTP 상태·Content-Type·X-Robots-Tag·본문. 오류 경로는 실제 404이며 정상 페이지로 200 fallback하지 않는지 확인한다.
2. HTTP→HTTPS, www→대표 호스트, 슬래시 없음/있음, `index.html`, 추적 쿼리의 redirect chain과 최종 canonical. 필요 없는 URL 정규화 수정을 추측으로 추가하지 않는다.
3. Pages custom domain·HTTPS enforcement·실 배포 SHA·배포 이력, DNS 및 CDN/WAF 변경 이력을 10월 15일 전후로 비교한다. 최신 코드가 배포된 상태인지 먼저 구별한다.
4. 보안 challenge·로그인 페이지·빈 HTML·soft 404가 200으로 캐시되는지, 지역/UA별 응답 차이가 있는지 확인한다. 가짜 Googlebot UA 테스트만으로 실제 Googlebot 접근을 증명하지 않는다.
5. 변경을 검토·병합·배포한 뒤 새 JS URL을 확인하고, 한국어 계산기 9종 결과 아래 계산식과 잘못된 입력 후 이전 계산식 제거를 다시 확인한다.

## Google Search Console 사용자 확인

- 도메인 속성에서 호스트별 URL 접두사로 분리하고, 이전 색인 후 제외/최초 미색인/색인 유지·노출 감소를 구분한다.
- 영문/한국어 홈, Tip/Ratio, 미색인 대표 URL의 URL 검사에서 마지막 크롤링, 가져오기 성공, 크롤링/색인 허용, 사용자 선언 canonical, Google 선택 canonical, 정확한 제외 사유를 기록한다.
- 실제 URL 테스트의 렌더링 HTML/스크린샷/페이지 리소스 실패를 확인한다. 로컬 Chromium 검사는 Google 렌더링 결과를 대신하지 않는다.
- 제출된 호스트별 sitemap의 가져오기 성공/최근 읽기/발견 URL 수, 페이지 색인 보고서의 서버 오류·리디렉션·soft 404·중복·크롤링됨/발견됨-현재 색인 안 됨의 추이를 확인한다.
- 크롤링 통계의 호스트 상태와 10월 15일 전후 응답 코드/요청량/응답 시간, 보안 문제/직접 조치를 확인한다. 노출 급감만으로 색인 실패라고 판단하지 않는다.
- 실적에서 페이지+쿼리를 함께 필터링해 Percentage/Ratio 등 동일 쿼리의 URL 분산을 확인한다. 같은 길이의 완료된 기간, 동일 국가/기기/검색 유형을 비교한다.
- 이후 접근 장애가 해결되고 변경이 배포되면 필요한 대표 URL에만 색인 재요청한다. 요청은 색인/순위/노출을 보장하지 않는다.

## 검증 기록

- Node 24.19.0 및 CI와 같은 Node 22.23.4: `node --test tests/*.test.js` (기존 Tip 6 + 신규 10), 두 언어 JS 구문 검사.
- Python: `python -B -m unittest discover -s tests -p '*_test.py' -v` (7개).
- 로컬 Playwright + 시스템 Chromium: 21개 HTML의 JS on/off 비교, 한국어 계산기 9종 실제 클릭·계산식 전후 비교. 외부 HTTP 리소스(광고)는 의도적으로 차단했다. API/DB/서버 계산 경계는 없는 사이트다.
- 브라우저에서 9종 모두 수정 전 계산식 빈 문자열, 수정 후 계산식 표시·계산값 유지. 테스트의 age는 생년월일 `2000-01-01`을 입력하고 date는 해당 탭을 실제 선택했다.
- Git diff 공백 검사 통과. GitHub 원격 CI 실행 결과는 PR 체크에서 별도로 확인한다.
