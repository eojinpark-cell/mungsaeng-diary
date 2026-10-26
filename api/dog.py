"""멍생일기 AI 엔드포인트 (Vercel Serverless Function, Python)

POST /api/dog
  mode = "talk"   : 강아지에게 말 걸기 → 강아지의 답장
  mode = "letter" : 무지개다리를 건넌 뒤 하늘나라에서 온 편지

API 키는 코드에 넣지 않고 Vercel 환경 변수 GEMINI_API_KEY 로 읽는다.
"""
from http.server import BaseHTTPRequestHandler
import json
import os

import requests

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
TIMEOUT_SEC = 20
MAX_MESSAGE = 200

STAGE_VOICE = {
    "baby": "태어난 지 얼마 안 된 아기 강아지. 문장이 짧고 서툴며 '멍!', '낑낑' 같은 소리를 섞는다.",
    "teen": "호기심 많고 장난꾸러기인 어린 강아지. 신나고 들뜬 말투.",
    "adult": "보호자를 든든하게 아끼는 어른 강아지. 다정하고 의젓한 말투.",
    "senior": "나이 든 노견. 느긋하고 따뜻하며, 함께한 시간을 고마워하는 말투.",
    "heaven": "무지개다리를 건너 하늘나라에 간 강아지. 평온하고 다정한 말투.",
}


def clip(value, limit):
    return str(value or "").strip()[:limit]


def build_prompt(data):
    name = clip(data.get("name"), 20) or "강아지"
    stage = data.get("stage") if data.get("stage") in STAGE_VOICE else "adult"
    age = clip(data.get("age"), 20)
    stats = data.get("stats") or {}
    stat_text = ", ".join(
        f"{k} {int(stats.get(k, 50))}" for k in ["배부름", "행복", "건강", "청결"] if k in stats
    )
    base = (
        f"너는 웹 게임 '멍생일기' 속 강아지 '{name}'이야. 나이: {age}. "
        f"성격과 말투: {STAGE_VOICE[stage]} "
        "항상 한국어 반말로, 강아지 입장에서 말해. 사람 이름이나 실제 사람을 지어내지 마. "
        "보호자를 '보호자'라고 불러. 의학적 조언이나 위험한 내용은 말하지 마."
    )
    if data.get("mode") == "letter":
        memories = [clip(m, 60) for m in (data.get("memories") or [])][:12]
        fav = clip(data.get("favorite"), 20)
        return base + (
            " 너는 방금 무지개다리를 건너 하늘나라에 도착했어. 보호자에게 편지를 써 줘. "
            f"함께한 추억: {' / '.join(memories) or '산책하고 같이 놀았던 날들'}. "
            f"가장 좋아했던 일: {fav or '산책'}. "
            "슬프기만 한 편지가 아니라 고마움과 '나는 여기서 잘 지내' 하는 따뜻함을 담아. "
            f"6문장 이내, 마지막 줄은 '- {name} 올림' 형식으로 끝내."
        )
    message = clip(data.get("message"), MAX_MESSAGE)
    return base + (
        f" 지금 상태: {stat_text or '보통'}. 상태가 낮은 항목이 있으면 귀엽게 티를 내. "
        f"보호자가 말했어: \"{message}\" "
        "여기에 강아지로서 2~3문장으로 대답해. 이모지는 1개까지만."
    )


def call_gemini(prompt):
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        return 500, {"error": "server_key_missing", "message": "서버에 AI 키가 설정되지 않았어요. 관리자에게 알려 주세요."}
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.9, "maxOutputTokens": 600},
    }
    try:
        res = requests.post(
            GEMINI_URL.format(model=model),
            headers={"Content-Type": "application/json", "x-goog-api-key": key},
            json=body,
            timeout=TIMEOUT_SEC,
        )
    except requests.Timeout:
        return 504, {"error": "timeout", "message": "강아지가 대답을 너무 오래 고민하고 있어요. 잠시 후 다시 말 걸어 주세요."}
    except requests.RequestException:
        return 502, {"error": "network", "message": "AI 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요."}

    if res.status_code == 429:
        return 429, {"error": "quota", "message": "오늘 강아지가 말을 너무 많이 했어요. 조금 쉬었다가 다시 시도해 주세요."}
    if res.status_code >= 400:
        return 502, {"error": "upstream", "message": f"AI 서버 오류가 났어요(코드 {res.status_code}). 잠시 후 다시 시도해 주세요."}
    try:
        data = res.json()
        text = "".join(p.get("text", "") for p in data["candidates"][0]["content"]["parts"]).strip()
    except (ValueError, KeyError, IndexError, TypeError):
        text = ""
    if not text:
        return 502, {"error": "empty", "message": "강아지가 대답을 못 했어요. 다른 말로 다시 걸어 주세요."}
    return 200, {"reply": text}


class handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
            data = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self._send(400, {"error": "bad_json", "message": "요청 형식이 올바르지 않아요."})

        mode = data.get("mode")
        if mode not in ("talk", "letter"):
            return self._send(400, {"error": "bad_mode", "message": "알 수 없는 요청이에요."})
        if mode == "talk" and not clip(data.get("message"), MAX_MESSAGE):
            return self._send(400, {"error": "empty_input", "message": "강아지에게 할 말을 입력해 주세요."})
        if not clip(data.get("name"), 20):
            return self._send(400, {"error": "no_name", "message": "강아지 이름이 없어요. 먼저 입양해 주세요."})

        status, payload = call_gemini(build_prompt(data))
        return self._send(status, payload)

    def do_GET(self):
        self._send(405, {"error": "method", "message": "POST로 요청해 주세요."})
