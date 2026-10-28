"""멍생일기 AI 엔드포인트 (Vercel Serverless Function, Python)

POST /api/dog  (mode 별 기능)
  talk   : 강아지에게 말 걸기                          → {"reply": "..."}
  diary  : 성장 단계가 바뀔 때 강아지 시점 성장 일기     → {"reply": "..."}
  event  : 상황 + 선택지 2개가 있는 랜덤 이벤트          → {"event": {...}}
  letter : 무지개다리를 건넌 뒤 하늘나라 편지             → {"reply": "..."}

API 키는 코드에 넣지 않고 Vercel 환경 변수 GEMINI_API_KEY 로 읽는다.
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import re

import requests

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
TIMEOUT_SEC = 25
MAX_MESSAGE = 200
STAT_KEYS = ["배부름", "행복", "건강", "청결"]

STAGE_VOICE = {
    "baby": "태어난 지 얼마 안 된 아기 강아지. 문장이 짧고 서툴며 '앙!', '낑낑' 같은 소리를 섞는다.",
    "teen": "호기심 많고 장난꾸러기인 어린 강아지. 신나고 들뜬 말투.",
    "adult": "보호자를 든든하게 아끼는 어른 강아지. 다정하고 의젓한 말투.",
    "senior": "나이 든 노견. 느긋하고 따뜻하며, 함께한 시간을 고마워하는 말투.",
    "heaven": "무지개다리를 건너 하늘나라에 간 강아지. 평온하고 다정한 말투.",
}


def clip(value, limit):
    return str(value or "").strip()[:limit]


def persona(d):
    name = clip(d.get("name"), 20) or "강아지"
    stage = d.get("stage") if d.get("stage") in STAGE_VOICE else "adult"
    return (
        f"너는 웹 게임 '멍생일기' 속 강아지 '{name}'이야. 나이: {clip(d.get('age'), 20)}. "
        f"말투: {STAGE_VOICE[stage]} "
        "항상 한국어 반말로, 강아지 입장에서 말해. 보호자를 '보호자'라고 불러. "
        "사람 이름을 지어내거나 의학적 조언, 위험한 내용은 말하지 마."
    ), name


def stats_text(d):
    s = d.get("stats") or {}
    return ", ".join(f"{k} {int(s.get(k, 50))}" for k in STAT_KEYS if k in s) or "보통"


def memories_text(d, n):
    mem = [clip(m, 60) for m in (d.get("memories") or [])][:n]
    return " / ".join(mem) or "아직 특별한 기억은 없음"


def build(d):
    """(프롬프트, JSON 응답 여부, 최대 토큰)"""
    mode = d.get("mode")
    base, name = persona(d)
    if mode == "talk":
        topic = clip(d.get("topic"), 10)
        return base + (
            f" 지금 상태: {stats_text(d)}. 수치가 30 미만인 항목이 있으면 귀엽게 티를 내. "
            f"보호자가 말했어: \"{clip(d.get('message'), MAX_MESSAGE)}\" "
            + (f"(오늘의 대화 주제는 '{topic}'이야. 보호자가 이 주제를 꺼내면 신나게 반응해.) " if topic else "") +
            "강아지로서 2문장 이내로 짧게 대답해. 이모지는 1개까지만. 가끔은 보호자에게 귀여운 질문을 되물어도 좋아. "
            "그리고 보호자의 말이 얼마나 다정했는지 0~3으로 매겨(칭찬·관심·애정 표현이면 높게, 무관심하거나 거친 말이면 0). "
            '반드시 JSON만: {"reply":"","emotion":"happy|joy|love|surprised|sad|sleepy 중 하나","warmth":0}'
        ), True, 300
    if mode == "diary":
        return base + (
            f" 오늘 너는 '{clip(d.get('age'), 20)}'이 되어 새로운 시기에 들어섰어. 최근 추억: {memories_text(d, 6)}. "
            "오늘의 성장 일기를 강아지 시점으로 3문장으로 써. 몸과 마음이 어떻게 달라졌는지 귀엽게."
        ), False, 260
    if mode == "event":
        return base + (
            f" 지금 상태: {stats_text(d)}. 최근 추억: {memories_text(d, 4)}. "
            "이 강아지에게 일어날 법한 일상 사건 하나를 만들어. 위험하거나 슬픈 사건(사고, 병, 실종)은 제외. "
            "보호자가 고를 선택지 2개, 각 선택의 결과 1문장, 상태 변화(-15~15 정수, 배부름/행복/건강/청결 중 1~2개)를 정해. "
            '반드시 JSON만: {"title":"8자 이내","situation":"2문장","choices":['
            '{"label":"15자 이내","result":"1문장","effects":{"행복":10}},'
            '{"label":"15자 이내","result":"1문장","effects":{"청결":-5}}]}'
        ), True, 450
    if mode == "letter":
        fav = clip(d.get("favorite"), 20) or "산책"
        ending = clip(d.get("ending"), 20) or "무지개다리"
        tone = ("조금 외롭고 아쉬웠던 마음도 솔직하게 말하되, 원망하지 말고 그래도 사랑했다고 전해. "
                if d.get("endingId") == "rain" else "")
        return base + (
            f" 너는 방금 '{ending}'를 건너 하늘나라에 도착했어. 보호자에게 편지를 써 줘. " + tone +
            f"함께한 추억: {memories_text(d, 12)}. 가장 좋아했던 일: {fav}. "
            "슬프기만 하지 않게, 고마움과 '나는 여기서 잘 지내'라는 따뜻함을 담아. "
            f"6문장 이내, 문장마다 줄을 바꾸고, 마지막 줄은 '- {name} 올림'."
        ), False, 500
    return None, False, 0


def gemini(prompt, want_json, max_tokens):
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        return 500, {"error": "server_key_missing", "message": "서버에 AI 키가 설정되지 않았어요. 관리자에게 알려 주세요."}
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    gen = {"temperature": 0.9, "maxOutputTokens": max_tokens}
    if want_json:
        gen["responseMimeType"] = "application/json"
    # 응답 속도: 생각(thinking)을 최소로. 모델이 이 설정을 모르면 설정을 빼고 한 번 더 시도한다.
    level = os.environ.get("GEMINI_THINKING", "minimal")
    if level != "off":
        gen["thinkingConfig"] = {"thinkingLevel": level}
    body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": gen}
    headers = {"Content-Type": "application/json", "x-goog-api-key": key}
    try:
        res = requests.post(GEMINI_URL.format(model=model), headers=headers, json=body, timeout=TIMEOUT_SEC)
        if res.status_code == 400 and "thinking" in res.text.lower():
            gen.pop("thinkingConfig", None)
            if model.startswith("gemini-2.5"):
                gen["thinkingConfig"] = {"thinkingBudget": 0}
            res = requests.post(GEMINI_URL.format(model=model), headers=headers, json=body, timeout=TIMEOUT_SEC)
    except requests.Timeout:
        return 504, {"error": "timeout", "message": "강아지가 대답을 너무 오래 고민하고 있어요. 잠시 후 다시 말 걸어 주세요."}
    except requests.RequestException:
        return 502, {"error": "network", "message": "AI 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요."}

    if res.status_code == 429:
        return 429, {"error": "quota", "message": "오늘 강아지가 말을 너무 많이 했어요. 조금 쉬었다가 다시 시도해 주세요."}
    if res.status_code >= 400:
        return 502, {"error": "upstream", "message": f"AI 서버 오류가 났어요(코드 {res.status_code}). 잠시 후 다시 시도해 주세요."}
    try:
        parts = res.json()["candidates"][0]["content"]["parts"]
        text = "".join(p.get("text", "") for p in parts if not p.get("thought")).strip()
    except (ValueError, KeyError, IndexError, TypeError):
        text = ""
    if not text:
        return 502, {"error": "empty", "message": "강아지가 대답을 못 했어요. 다시 시도해 주세요."}
    return 200, text


def parse_json(text):
    try:
        return json.loads(text)
    except ValueError:
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            try:
                return json.loads(m.group(0))
            except ValueError:
                return None
    return None


def clean_event(ev):
    if not isinstance(ev, dict) or not isinstance(ev.get("choices"), list) or len(ev["choices"]) < 2:
        return None
    out = {"title": clip(ev.get("title"), 20) or "작은 사건", "situation": clip(ev.get("situation"), 200), "choices": []}
    for c in ev["choices"][:2]:
        if not isinstance(c, dict):
            return None
        fx = {}
        for k, v in (c.get("effects") or {}).items():
            if k in STAT_KEYS and isinstance(v, (int, float)):
                fx[k] = max(-15, min(15, int(v)))
        out["choices"].append({"label": clip(c.get("label"), 30) or "선택", "result": clip(c.get("result"), 120), "effects": fx})
    return out if out["situation"] else None


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
            d = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self._send(400, {"error": "bad_json", "message": "요청 형식이 올바르지 않아요."})

        mode = d.get("mode")
        if mode not in ("talk", "diary", "event", "letter"):
            return self._send(400, {"error": "bad_mode", "message": "알 수 없는 요청이에요."})
        if mode == "talk" and not clip(d.get("message"), MAX_MESSAGE):
            return self._send(400, {"error": "empty_input", "message": "강아지에게 할 말을 입력해 주세요."})
        if not clip(d.get("name"), 20):
            return self._send(400, {"error": "no_name", "message": "강아지 이름이 없어요. 먼저 입양해 주세요."})

        prompt, want_json, max_tokens = build(d)
        status, result = gemini(prompt, want_json, max_tokens)
        if status != 200:
            return self._send(status, result)

        if mode == "event":
            ev = clean_event(parse_json(result))
            if not ev:
                return self._send(502, {"error": "bad_output", "message": "이벤트를 만들지 못했어요."})
            return self._send(200, {"event": ev})
        if mode == "talk":
            data = parse_json(result)
            if not isinstance(data, dict) or not clip(data.get("reply"), 300):
                data = {"reply": result if not result.strip().startswith("{") else "멍! 다시 말해 줄래?", "emotion": "happy", "warmth": 1}
            try:
                warmth = max(0, min(3, int(data.get("warmth", 1))))
            except (TypeError, ValueError):
                warmth = 1
            emo = data.get("emotion") if data.get("emotion") in ("happy", "joy", "love", "surprised", "sad", "sleepy") else "happy"
            return self._send(200, {"reply": clip(data.get("reply"), 300), "emotion": emo, "warmth": warmth})
        return self._send(200, {"reply": result})

    def do_GET(self):
        self._send(405, {"error": "method", "message": "POST로 요청해 주세요."})
