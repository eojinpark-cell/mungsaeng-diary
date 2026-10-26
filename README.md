# 멍생일기 🐶🌈

아기 강아지부터 무지개다리를 건너 하늘나라에 가기까지, 한 강아지의 일생을 함께하는 웹 게임입니다.
밥을 주고 산책을 시키면 강아지가 자라고, 말을 걸면 AI가 강아지의 나이와 기분에 맞춰 대답합니다.
일생을 마치면 AI가 함께한 추억을 바탕으로 **하늘나라에서 온 편지**를 써 줍니다.

- 배포 URL: https://(배포 후 Vercel 주소 입력).vercel.app
- 서비스 기획서: [docs/서비스기획서.md](docs/서비스기획서.md)

## 주요 기능

| 페이지 | 내용 |
|---|---|
| 처음으로 (`index.html`) | 서비스 소개, 강아지 생애 단계 안내 |
| 키우기 (`game.html`) | 입양(이름·털 색) → 돌보기 5종 → 성장 → 무지개다리 엔딩, **AI 말 걸기**, **AI 하늘나라 편지** |
| 추억 앨범 (`album.html`) | 지금 강아지의 추억 타임라인, 하늘나라 강아지들과 편지 보관 |
| 도움말 (`help.html`) | 자주 묻는 질문, 기록 초기화 |

- 생애 단계: 아기(~1살) → 꼬마(~3살) → 어른(~8살) → 노견 → 하늘나라. 단계마다 하늘 색과 강아지 모습이 바뀝니다.
- 기록은 브라우저 `localStorage`에 저장됩니다(회원가입 없음).
- 반응형: 데스크톱 / 태블릿(900px 이하) / 모바일(640px 이하, 햄버거 메뉴).

## 기술 스택

- 프론트엔드: HTML, CSS, JavaScript (바닐라, 프레임워크 없음)
- 백엔드: Vercel Serverless Functions (Python) — `api/dog.py`
- AI: Google Gemini API (`generateContent`, 기본 모델 `gemini-2.5-flash`)
- 배포: GitHub + Vercel

## 폴더 구조

```
├── index.html / game.html / album.html / help.html
├── css/style.css
├── js/common.js   # 저장, 생애 단계, 강아지 SVG
├── js/game.js     # 키우기 로직, AI 호출(fetch)
├── js/album.js    # 추억 앨범
├── api/dog.py     # 서버리스 함수: Gemini 호출
├── images/favicon.svg
├── docs/서비스기획서.md, docs/screenshots/
├── requirements.txt
└── .env.example
```

## AI 기능 동작 흐름

1. 사용자가 말 걸기 입력 → `js/game.js`가 `fetch('/api/dog', {method:'POST'})`로 이름·나이 단계·상태·메시지를 보냄
2. `api/dog.py`가 입력을 검사하고, 단계별 말투 규칙을 붙여 프롬프트를 만든 뒤 Gemini API 호출
3. 응답 텍스트를 JSON으로 돌려주고, 화면 대화 목록에 표시

### 실패 처리

| 상황 | 처리 |
|---|---|
| 빈 입력 | 화면에서 "강아지에게 할 말을 먼저 적어 주세요." 안내, 서버도 400으로 재확인 |
| API 오류 (4xx/5xx) | 서버가 502/429로 변환해 안내 문구 반환 → 화면에 빨간 안내 표시 |
| 지연·타임아웃 | 8초 지나면 "조금 오래 걸리고 있어요" 표시, 25초에 요청 중단 후 안내. 서버도 20초 타임아웃 |
| 키 미설정 | 500 + "서버에 AI 키가 설정되지 않았어요" |
| 과다 호출 | 요청 후 2초간 버튼 비활성화 |

## 환경 변수

API 키는 코드에 넣지 않고 Vercel 환경 변수로만 관리합니다.

| 이름 | 필수 | 설명 |
|---|---|---|
| `GEMINI_API_KEY` | 필수 | Google AI Studio에서 발급한 키 |
| `GEMINI_MODEL` | 선택 | 기본값 `gemini-2.5-flash`. 모델명이 바뀌면 여기만 수정 |

설정 위치: Vercel 프로젝트 → Settings → Environment Variables. 키를 바꾼 뒤에는 **Redeploy** 해야 반영됩니다.
로컬에서는 `.env.example`을 복사해 `.env`로 만들고 키를 넣습니다(`.env`는 `.gitignore`로 커밋 제외).

키가 노출됐다고 의심되면 Google AI Studio에서 즉시 키를 삭제하고 새로 발급한 뒤 Vercel 환경 변수를 교체합니다.

## 실행 / 배포 방법

### 배포 (Vercel)
1. 이 저장소를 GitHub에 올린다.
2. vercel.com에서 GitHub로 로그인 → **Add New → Project** → 이 저장소 **Import**
3. Framework Preset은 **Other** 그대로, Environment Variables에 `GEMINI_API_KEY` 추가 → **Deploy**
4. 이후 GitHub에 커밋하면 자동으로 재배포된다.

### 로컬 실행 (선택)
```bash
npm i -g vercel
vercel dev        # http://localhost:3000
```

## AI 코딩 도구 사용

- Claude(Anthropic)로 기획, 화면 구성, 코드 작성, 테스트를 진행했습니다. 대화 기록은 `docs/screenshots/`에 있습니다.
- 개발 중 발견하고 고친 오류 예시
  - CSS의 `display: grid`가 HTML `hidden` 속성을 덮어써 엔딩 후에도 돌보기 버튼이 보이던 문제 → `[hidden]{display:none!important}` 추가
  - 받침 있는 이름(예: "봄")에 "봄가"처럼 조사가 틀리던 문제 → 받침을 판별하는 `josa()` 함수 추가
