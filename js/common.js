// 멍생일기 공통 모듈: 저장, 생애 단계, 강아지 그림(단계별 체형 + 표정)
const STORE_KEY = "mungsaeng-v1";

const STAGES = [
  { id: "baby", label: "아기 강아지", until: 12 },
  { id: "teen", label: "꼬마 강아지", until: 36 },
  { id: "adult", label: "어른 강아지", until: 96 },
  { id: "senior", label: "노견", until: Infinity },
];

const FUR = {
  cream: { body: "#f3d9a8", ear: "#d9a96a", belly: "#fff6e6", label: "크림" },
  choco: { body: "#a8724d", ear: "#6f4329", belly: "#e9cdb4", label: "초코" },
  snow: { body: "#fbfaf7", ear: "#e2d9cb", belly: "#ffffff", label: "눈송이" },
};

function blankDogFields(d) {
  d.counts = Object.assign({ feed: 0, walk: 0, play: 0, bath: 0, nap: 0, pet: 0, bark: 0 }, d.counts || {});
  d.tricks = d.tricks || { sit: 0, paw: 0, down: 0 };
  d.diaries = d.diaries || [];
  d.talks = d.talks || [];
  d.memories = d.memories || [];
  d.actionsSinceEvent = d.actionsSinceEvent || 0;
  return d;
}

function loadState() {
  let s = { dog: null, stars: [], sound: { on: true, volume: 0.6 }, coins: 20, owned: { house: [], outfit: [], hat: [], toy: [] }, equipped: { house: null, outfit: null, hat: null, toy: null } };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) s = Object.assign(s, JSON.parse(raw));
  } catch (e) { /* 저장소를 못 읽어도 새로 시작 */ }
  if (s.dog) {
    blankDogFields(s.dog);
    if (!s.dog.look) s.dog.look = { fur: s.dog.fur || "cream", face: "floppy" };
  }
  if (typeof s.coins !== "number") s.coins = 20;
  s.endings = s.endings || [];
  s.place = s.place || "yard";
  s.badges = s.badges || [];
  s.owned = Object.assign({ house: [], outfit: [], hat: [], toy: [] }, s.owned || {});
  s.equipped = Object.assign({ house: null, outfit: null, hat: null, toy: null }, s.equipped || {});
  s.sound = s.sound || { on: true, volume: 0.6 };
  return s;
}

function saveState(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 저장 실패해도 게임은 계속 */ }
}

function stageOf(dog) {
  if (!dog) return null;
  if (dog.inHeaven) return { id: "heaven", label: "하늘나라 강아지" };
  return STAGES.find((s) => dog.months < s.until);
}

function ageText(months) {
  if (months < 12) return `${months}개월`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y}살 ${m}개월` : `${y}살`;
}

// 받침에 따라 조사 고르기: josa("보리","이가") → "보리가", josa("봄","이가") → "봄이"
function josa(word, pair) {
  const w = String(word);
  const ch = w.charCodeAt(w.length - 1);
  const hasBatchim = ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 !== 0;
  const [withB, withoutB] = { 이가: ["이", "가"], 은는: ["은", "는"], 과와: ["과", "와"], 아야: ["아", "야"], 이야: ["이야", "야"], 을를: ["을", "를"] }[pair];
  return w + (hasBatchim ? withB : withoutB);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const FACES = {
  floppy: { label: "축 처진 귀", desc: "비글처럼 긴 귀와 하얀 이마 줄" },
  pointy: { label: "쫑긋 귀", desc: "시바처럼 선 귀와 하얀 볼" },
  fluffy: { label: "몽실 털", desc: "비숑처럼 동글동글 솜털" },
  patch: { label: "얼룩 눈", desc: "한쪽 눈에 얼룩 무늬" },
};

const SHOP = {
  house: [
    { id: "wood", name: "나무 개집", price: 40 },
    { id: "mushroom", name: "버섯 집", price: 70 },
    { id: "redroof", name: "빨간 지붕 집", price: 80 },
    { id: "igloo", name: "이글루", price: 100 },
    { id: "tent", name: "줄무늬 텐트", price: 120 },
    { id: "cloud", name: "구름 집", price: 170 },
    { id: "castle", name: "강아지 성", price: 220 },
  ],
  outfit: [
    { id: "bowtie", name: "나비넥타이", price: 25 },
    { id: "raincoat", name: "노란 우비", price: 50 },
    { id: "hoodie", name: "분홍 후드티", price: 60 },
    { id: "sweater", name: "줄무늬 스웨터", price: 70 },
    { id: "overall", name: "청 멜빵", price: 80 },
    { id: "bee", name: "꿀벌 옷", price: 95 },
    { id: "cape", name: "영웅 망토", price: 110 },
  ],
  hat: [
    { id: "flower", name: "꽃 머리띠", price: 30 },
    { id: "beanie", name: "털모자", price: 35 },
    { id: "strawhat", name: "밀짚모자", price: 40 },
    { id: "party", name: "생일 고깔", price: 45 },
    { id: "headphones", name: "헤드폰", price: 55 },
    { id: "shades", name: "선글라스", price: 60 },
    { id: "crown", name: "왕관", price: 150 },
  ],
  toy: [
    { id: "ball", name: "테니스공", price: 15 },
    { id: "bone", name: "뼈다귀 장난감", price: 20 },
    { id: "duck", name: "삑삑 오리", price: 25 },
    { id: "teddy", name: "곰돌이 인형", price: 45 },
  ],
};

function toySvg(id) {
  switch (id) {
    case "ball": return `<svg viewBox="0 0 60 60"><circle cx="30" cy="34" r="18" fill="#c7e85a" stroke="#9cbf35" stroke-width="2"/><path d="M14 28 q16 10 32 0 M14 40 q16 -10 32 0" stroke="#fff" stroke-width="3" fill="none"/></svg>`;
    case "bone": return `<svg viewBox="0 0 80 60"><g fill="#fff" stroke="#d9cbb5" stroke-width="2"><rect x="18" y="30" width="44" height="12" rx="6"/><circle cx="16" cy="30" r="8"/><circle cx="16" cy="42" r="8"/><circle cx="64" cy="30" r="8"/><circle cx="64" cy="42" r="8"/></g></svg>`;
    case "duck": return `<svg viewBox="0 0 60 60"><ellipse cx="28" cy="42" rx="18" ry="12" fill="#ffd84d"/><circle cx="38" cy="26" r="11" fill="#ffd84d"/><path d="M47 26 l10 3 l-10 4 z" fill="#ff9a3c"/><circle cx="40" cy="23" r="2" fill="#333"/></svg>`;
    case "teddy": return `<svg viewBox="0 0 60 70"><circle cx="18" cy="14" r="7" fill="#b9825a"/><circle cx="42" cy="14" r="7" fill="#b9825a"/><circle cx="30" cy="24" r="15" fill="#c9926a"/><ellipse cx="30" cy="52" rx="17" ry="15" fill="#c9926a"/><ellipse cx="30" cy="28" rx="6" ry="4.5" fill="#f1d9c0"/><circle cx="24" cy="21" r="2" fill="#333"/><circle cx="36" cy="21" r="2" fill="#333"/><circle cx="30" cy="27" r="1.8" fill="#333"/><path d="M22 40 q8 6 16 0" stroke="#e0525f" stroke-width="4" fill="none"/></svg>`;
    default: return "";
  }
}


function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))));
  return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
}


// ---------- 강아지 그림 ----------
// 앞모습(front)과 옆모습(side) 두 가지. 단계마다 머리·몸 비율이 다르다.
const BODY = {
  baby:   { hx: 58, hy: 51, headY: 102, brx: 44, bry: 37, bodyY: 176, legW: 21, eye: 11.5, snR: 16 },
  teen:   { hx: 55, hy: 49, headY: 94,  brx: 50, bry: 42, bodyY: 170, legW: 22, eye: 10,   snR: 18 },
  adult:  { hx: 51, hy: 46, headY: 86,  brx: 57, bry: 49, bodyY: 164, legW: 23, eye: 8.8,  snR: 20 },
  senior: { hx: 51, hy: 46, headY: 91,  brx: 59, bry: 48, bodyY: 168, legW: 24, eye: 8.8,  snR: 20 },
};
BODY.heaven = BODY.senior;
const GROUND = 218;
const INK = "#2b1d14";

const ENDINGS = [
  { id: "golden", icon: "🌟", name: "황금 무지개다리", desc: "모든 걸 챙겨 준 최고의 단짝만 건너는 길", sky: ["#ffc95c", "#fff1c9"] },
  { id: "flower", icon: "🌸", name: "꽃길 무지개다리", desc: "매일 놀고 쓰다듬어 준 행복한 강아지의 길", sky: ["#ffafc9", "#fff0f6"] },
  { id: "cloud", icon: "☁️", name: "구름 산책길", desc: "함께 걸은 산책길이 구름이 되어 이어진 길", sky: ["#7cc4ff", "#eef8ff"] },
  { id: "star", icon: "✨", name: "별빛 무지개다리", desc: "조용히 곁을 지킨 강아지가 별이 되어 건너는 길", sky: ["#2c2c63", "#7b6bb8"] },
  { id: "rain", icon: "🌦️", name: "보슬비 무지개다리", desc: "조금 외로웠지만, 비 갠 뒤 무지개를 건너며 보호자를 기다려요", sky: ["#6f7c9c", "#c9d2e4"] },
];

let __gid = 0;

// 눈: 크고 촉촉한 눈, 반사광 2개
function eyeSvg(expr, x, y, r, g, idx = 0) {
  const arc = (dy, up) => `<path d="M${x - r} ${y + dy} q${r} ${up ? -r * 1.25 : r * 1.05} ${2 * r} 0" stroke="${INK}" stroke-width="${Math.max(2.6, r * 0.32)}" fill="none" stroke-linecap="round"/>`;
  const dot = (k = 1, look = 0) =>
    `<ellipse cx="${x}" cy="${y + look}" rx="${r * 0.86 * k}" ry="${r * k}" fill="url(#ey${g})"/>` +
    `<circle cx="${x + r * 0.32 * k}" cy="${y + look - r * 0.38 * k}" r="${r * 0.34 * k}" fill="#fff"/>` +
    `<circle cx="${x - r * 0.3 * k}" cy="${y + look + r * 0.38 * k}" r="${r * 0.15 * k}" fill="#fff" opacity=".9"/>` +
    `<circle cx="${x + r * 0.05 * k}" cy="${y + look - r * 0.62 * k}" r="${r * 0.1 * k}" fill="#fff" opacity=".8"/>`;
  switch (expr) {
    case "joy": return arc(2, true);
    case "eat": case "sleep": return arc(-1, false);
    case "love": return `<path transform="translate(${x} ${y})" d="M0 ${r * 0.85} l${-r} ${-r} a${r * 0.52} ${r * 0.52} 0 0 1 ${r} ${-r * 0.7} a${r * 0.52} ${r * 0.52} 0 0 1 ${r} ${r * 0.7} z" fill="#ff5c86"/>`;
    case "surprised": return dot(1.25);
    case "hungry": return dot(1.08, -2);
    case "sleepy": return dot(0.95, 1) + `<path d="M${x - r * 1.15} ${y - r * 0.35} q${r * 1.15} ${r * 0.45} ${r * 2.3} 0 v${-r * 1.1} h${-r * 2.3} z" fill="url(#hd${g})"/><path d="M${x - r * 1.05} ${y - r * 0.3} q${r * 1.05} ${r * 0.4} ${r * 2.1} 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    case "sad": return dot(1.05, 1) + `<path d="M${x + r * 0.2} ${y + r * 1.2} q${-r * 0.45} ${r * 1.1} 0 ${r * 1.5} q${r * 0.45} ${-r * 0.4} 0 ${-r * 1.5}" fill="#8fd0ff"/>`;
    case "cry": return dot(1.08, 1) + `<path d="M${x - r * 0.5} ${y + r * 0.9} q${-r * 0.2} ${r * 1.6} ${r * 0.3} ${r * 2.4} q${r * 0.5} ${-r * 0.8} ${r * 0.3} ${-r * 2.4} z" fill="#8fd0ff" opacity=".9"/>`;
    case "wink": case "proud": return idx === 1 || expr === "proud" ? arc(2, true) : dot();
    case "shy": return `<path d="M${x + (idx ? 1 : -1) * r * 0.8} ${y - r * 0.6} L${x - (idx ? 1 : -1) * r * 0.6} ${y} L${x + (idx ? 1 : -1) * r * 0.8} ${y + r * 0.6}" stroke="${INK}" stroke-width="${Math.max(2.6, r * 0.3)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "star": return dot(1.12) + `<path transform="translate(${x} ${y}) scale(${r / 10})" d="M0 -7 L2 -2 L7 -2 L3 1.5 L4.5 7 L0 3.8 L-4.5 7 L-3 1.5 L-7 -2 L-2 -2 z" fill="#fff6a8"/>`;
    case "dizzy": return `<path d="M${x} ${y} m${-r * 0.2} 0 a${r * 0.2} ${r * 0.2} 0 1 1 ${r * 0.4} 0 a${r * 0.45} ${r * 0.45} 0 1 1 ${-r * 0.9} 0 a${r * 0.7} ${r * 0.7} 0 1 1 ${r * 1.4} 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    case "look": return `<ellipse cx="${x}" cy="${y}" rx="${r * 0.9}" ry="${r * 1.02}" fill="#fff" opacity=".95"/><ellipse cx="${x + r * 0.35}" cy="${y + r * 0.05}" rx="${r * 0.62}" ry="${r * 0.78}" fill="url(#ey${g})"/><circle cx="${x + r * 0.5}" cy="${y - r * 0.3}" r="${r * 0.22}" fill="#fff"/>`;
    default: return dot();
  }
}

function mouthSvg(expr, cx, y, s) {
  const k = s / 18;
  const line = (d, w = 2.8) => `<path d="${d}" stroke="${INK}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  switch (expr) {
    case "joy": case "love":
      return `<path d="M${cx - 9 * k} ${y} q${9 * k} ${13 * k} ${18 * k} 0 z" fill="#8a3b44"/><path d="M${cx - 4.5 * k} ${y + 4 * k} q${4.5 * k} ${9 * k} ${9 * k} 0" fill="#ff8fa6"/>`;
    case "bark":
      return `<ellipse cx="${cx}" cy="${y + 6 * k}" rx="${8 * k}" ry="${9 * k}" fill="#8a3b44"/><ellipse cx="${cx}" cy="${y + 10.5 * k}" rx="${4.5 * k}" ry="${3.5 * k}" fill="#ff8fa6"/>`;
    case "sad": return line(`M${cx - 7 * k} ${y + 6 * k} q${7 * k} ${-6 * k} ${14 * k} 0`);
    case "surprised": case "hungry":
      return `<ellipse cx="${cx}" cy="${y + 5 * k}" rx="${4.5 * k}" ry="${5.5 * k}" fill="#8a3b44"/>` +
        (expr === "hungry" ? `<path d="M${cx + 6 * k} ${y + 4 * k} q${3 * k} ${9 * k} 0 ${12 * k} q${-3 * k} ${-4 * k} 0 ${-12 * k}" fill="#bfe7ff"/>` : "");
    case "sleepy": case "sleep": return line(`M${cx - 4 * k} ${y + 3 * k} q${4 * k} ${3 * k} ${8 * k} 0`);
    case "eat": return line(`M${cx - 9 * k} ${y} q${4.5 * k} ${5.5 * k} ${9 * k} 0 q${4.5 * k} ${5.5 * k} ${9 * k} 0`);
    case "blep": case "look": return line(`M${cx - 8 * k} ${y} q${4 * k} ${5 * k} ${8 * k} 0 q${4 * k} ${5 * k} ${8 * k} 0`) + `<path d="M${cx + 0.5 * k} ${y + 3 * k} q${1 * k} ${10 * k} ${5 * k} ${9 * k} q${3 * k} ${-1 * k} ${1 * k} ${-9 * k} z" fill="#ff8fa6" stroke="#e86d89" stroke-width="1"/>`;
    case "pout": return line(`M${cx - 4 * k} ${y + 2 * k} q${3 * k} ${-3 * k} ${4 * k} ${1.5 * k} q${1 * k} ${-4.5 * k} ${4 * k} ${-1.5 * k}`, 2.4);
    case "wink": case "star": case "proud": return `<path d="M${cx - 9 * k} ${y} q${9 * k} ${13 * k} ${18 * k} 0 z" fill="#8a3b44"/><path d="M${cx - 4.5 * k} ${y + 4 * k} q${4.5 * k} ${9 * k} ${9 * k} 0" fill="#ff8fa6"/>`;
    case "shy": return line(`M${cx - 6 * k} ${y + 1 * k} q${3 * k} ${3.5 * k} ${6 * k} 0 q${3 * k} ${3.5 * k} ${6 * k} 0`, 2.4);
    case "dizzy": return line(`M${cx - 8 * k} ${y + 4 * k} q${2 * k} ${-4 * k} ${4 * k} 0 q${2 * k} ${4 * k} ${4 * k} 0 q${2 * k} ${-4 * k} ${4 * k} 0 q${2 * k} ${4 * k} ${4 * k} 0`, 2.2);
    case "cry": return `<path d="M${cx - 8 * k} ${y + 7 * k} q${8 * k} ${-10 * k} ${16 * k} 0 q${-8 * k} ${3 * k} ${-16 * k} 0 z" fill="#8a3b44"/>`;
    default: return line(`M${cx - 9 * k} ${y} q${4.5 * k} ${5.5 * k} ${9 * k} 0 q${4.5 * k} ${5.5 * k} ${9 * k} 0`) + `<path d="M${cx - 2.6 * k} ${y + 3 * k} q${2.6 * k} ${7 * k} ${5.2 * k} 0" fill="#ff8fa6"/>`;
  }
}


// 옷: 몸 모양에 맞게 잘라서(clip) 입힌다
// 옷: 몸 모양(clip)을 따라 입히고, 밑단은 둥글게, 옷 자체에도 음영을 넣는다
const GARMENT = {
  raincoat: { base: "#ffd43b", trim: "#eeb400", line: "#d49b00" },
  sweater: { base: "#ffffff", trim: "#d94757", line: "#e26b78" },
  vest: { base: "#8fa7d9", trim: "#6f88bf", line: "#ffffff" },
  cape: { base: "#d93a4a", trim: "#a82735", line: "#a82735" },
  hoodie: { base: "#ffb3c8", trim: "#f28aa8", line: "#e86d91" },
  bee: { base: "#ffd43b", trim: "#2f2a26", line: "#2f2a26" },
  overall: { base: "#5b8bd6", trim: "#3f6fbe", line: "#ffd34d" },
  angel: { base: "rgba(255,255,255,.5)", trim: "rgba(255,255,255,.7)", line: "rgba(255,255,255,0)" },
};
function outfitBody(id, x, y, w, h, g, side) {
  const c = GARMENT[id];
  if (!c) return "";
  const hem = side
    ? `M${x} ${y} H${x + w} V${y + h * 0.82} C${x + w * 0.8} ${y + h * 0.98}, ${x + w * 0.25} ${y + h * 0.98}, ${x} ${y + h * 0.8} z`
    : `M${x} ${y} H${x + w} V${y + h * 0.78} C${x + w * 0.75} ${y + h * 1.02}, ${x + w * 0.25} ${y + h * 1.02}, ${x} ${y + h * 0.78} z`;
  const hemLine = side
    ? `M${x} ${y + h * 0.8} C${x + w * 0.25} ${y + h * 0.98}, ${x + w * 0.8} ${y + h * 0.98}, ${x + w} ${y + h * 0.82}`
    : `M${x} ${y + h * 0.78} C${x + w * 0.25} ${y + h * 1.02}, ${x + w * 0.75} ${y + h * 1.02}, ${x + w} ${y + h * 0.78}`;
  let deco = "";
  if (id === "sweater") deco = `<clipPath id="gc${g}"><path d="${hem}"/></clipPath><g clip-path="url(#gc${g})">${Array.from({ length: 9 }, (_, i) => `<rect x="${x}" y="${y + 8 + i * 13}" width="${w}" height="6" fill="#ef5f6e"/>`).join("")}</g>`;
  if (id === "vest") deco = `<clipPath id="gc${g}"><path d="${hem}"/></clipPath><g clip-path="url(#gc${g})">${Array.from({ length: 8 }, (_, i) => `<path d="M${x} ${y + 10 + i * 11} h${w}" stroke="#fff" stroke-width="2" stroke-dasharray="4 5" opacity=".6"/>`).join("")}</g>`;
  if (id === "bee") deco = Array.from({ length: 6 }, (_, i) => `<rect x="${x0 - 20}" y="${top + 14 + i * 22}" width="${w + 40}" height="10" fill="#2f2a26"/>`).join("");
  if (id === "hoodie") deco = side
    ? `<path d="M${chestX - 30} ${top + (hemY - top) * 0.55} h40 v${(hemY - top) * 0.3} h-40 z" fill="#f28aa8" opacity=".8"/>`
    : `<path d="M${chestX - 18} ${top + (hemY - top) * 0.5} h36 l6 ${(hemY - top) * 0.35} h-48 z" fill="#f28aa8" opacity=".85"/><path d="M${chestX - 7} ${top + 6} v18 M${chestX + 7} ${top + 6} v18" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`;
  if (id === "overall") deco = side
    ? `<path d="M${chestX - 10} ${top - 10} L${chestX - 30} ${top + (hemY - top) * 0.4}" stroke="#3f6fbe" stroke-width="7"/><circle cx="${chestX - 28}" cy="${top + (hemY - top) * 0.4}" r="3.5" fill="#ffd34d"/>`
    : `<path d="M${chestX - 18} ${top - 10} V${top + (hemY - top) * 0.45} M${chestX + 18} ${top - 10} V${top + (hemY - top) * 0.45}" stroke="#3f6fbe" stroke-width="7"/><circle cx="${chestX - 18}" cy="${top + (hemY - top) * 0.45}" r="3.5" fill="#ffd34d"/><circle cx="${chestX + 18}" cy="${top + (hemY - top) * 0.45}" r="3.5" fill="#ffd34d"/><rect x="${chestX - 12}" y="${top + (hemY - top) * 0.55}" width="24" height="16" rx="3" fill="#3f6fbe"/>`;
  if (id === "raincoat") deco = side
    ? `<path d="M${x + w * 0.72} ${y} V${y + h * 0.9}" stroke="${c.line}" stroke-width="2"/><circle cx="${x + w * 0.76}" cy="${y + h * 0.35}" r="2.6" fill="${c.line}"/><circle cx="${x + w * 0.76}" cy="${y + h * 0.6}" r="2.6" fill="${c.line}"/>`
    : `<path d="M${x + w / 2} ${y} V${y + h * 0.98}" stroke="${c.line}" stroke-width="2"/><circle cx="${x + w / 2 + 7}" cy="${y + h * 0.3}" r="3" fill="${c.line}"/><circle cx="${x + w / 2 + 7}" cy="${y + h * 0.55}" r="3" fill="${c.line}"/>`;
  return `<defs><linearGradient id="gs${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>
    <path d="${hemLine}" stroke="rgba(60,40,20,.35)" stroke-width="5" fill="none" filter="url(#sf2${g})" transform="translate(0 3)"/>
    <path d="${hem}" fill="${c.base}"/>${deco}
    <path d="${hemLine}" stroke="${c.trim}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="${hem}" fill="url(#gs${g})"/>`;
}
// 몸통 실루엣을 그대로 따라가는 옷 (몸보다 살짝 크게, 밑단은 둥글게)
function garmentFit(id, torsoD, x0, x1, top, hemY, g, side, chestX, collarX) {
  const c = GARMENT[id];
  if (!c) return "";
  const w = x1 - x0, dip = side ? 9 : 14;
  const hemD = side
    ? `M${x0 - 40} ${hemY - 8} C${x0 + w * 0.3} ${hemY + dip}, ${x0 + w * 0.7} ${hemY + dip}, ${x1 + 40} ${hemY - 14}`
    : `M${x0 - 40} ${hemY} C${x0 + w * 0.25} ${hemY + dip}, ${x0 + w * 0.75} ${hemY + dip}, ${x1 + 40} ${hemY}`;
  const region = collarX
    ? `M${x0 - 40} ${hemY - 8} C${x0 + w * 0.3} ${hemY + dip}, ${x0 + w * 0.6} ${hemY + dip}, ${collarX + 6} ${hemY - 4} Q${collarX + 22} ${(hemY + top) / 2} ${collarX - 12} ${top - 10} V${top - 90} H${x0 - 40} z`
    : `${hemD} V${top - 90} H${x0 - 40} z`;
  const collar = collarX ? `<path d="M${collarX + 6} ${hemY - 4} Q${collarX + 22} ${(hemY + top) / 2} ${collarX - 12} ${top - 10}" stroke="${c.trim}" stroke-width="5" fill="none" stroke-linecap="round" clip-path="url(#gt${g})"/>` : "";
  let deco = "";
  if (id === "sweater") deco = Array.from({ length: 12 }, (_, i) => `<rect x="${x0 - 20}" y="${top + 4 + i * 12}" width="${w + 40}" height="6" fill="#ef5f6e"/>`).join("");
  if (id === "vest") deco = Array.from({ length: 10 }, (_, i) => `<path d="M${x0 - 20} ${top + 8 + i * 10} h${w + 40}" stroke="#fff" stroke-width="2" stroke-dasharray="4 5" opacity=".6"/>`).join("");
  if (id === "bee") deco = Array.from({ length: 6 }, (_, i) => `<rect x="${x0 - 20}" y="${top + 14 + i * 22}" width="${w + 40}" height="10" fill="#2f2a26"/>`).join("");
  if (id === "hoodie") deco = side
    ? `<path d="M${chestX - 30} ${top + (hemY - top) * 0.55} h40 v${(hemY - top) * 0.3} h-40 z" fill="#f28aa8" opacity=".8"/>`
    : `<path d="M${chestX - 18} ${top + (hemY - top) * 0.5} h36 l6 ${(hemY - top) * 0.35} h-48 z" fill="#f28aa8" opacity=".85"/><path d="M${chestX - 7} ${top + 6} v18 M${chestX + 7} ${top + 6} v18" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`;
  if (id === "overall") deco = side
    ? `<path d="M${chestX - 10} ${top - 10} L${chestX - 30} ${top + (hemY - top) * 0.4}" stroke="#3f6fbe" stroke-width="7"/><circle cx="${chestX - 28}" cy="${top + (hemY - top) * 0.4}" r="3.5" fill="#ffd34d"/>`
    : `<path d="M${chestX - 18} ${top - 10} V${top + (hemY - top) * 0.45} M${chestX + 18} ${top - 10} V${top + (hemY - top) * 0.45}" stroke="#3f6fbe" stroke-width="7"/><circle cx="${chestX - 18}" cy="${top + (hemY - top) * 0.45}" r="3.5" fill="#ffd34d"/><circle cx="${chestX + 18}" cy="${top + (hemY - top) * 0.45}" r="3.5" fill="#ffd34d"/><rect x="${chestX - 12}" y="${top + (hemY - top) * 0.55}" width="24" height="16" rx="3" fill="#3f6fbe"/>`;
  if (id === "raincoat") deco = `<path d="M${chestX} ${top - 20} V${hemY + dip}" stroke="${c.line}" stroke-width="2.2"/>` + [0.38, 0.62].map((t) => `<circle cx="${chestX + (side ? -6 : 7)}" cy="${top + (hemY - top) * t}" r="2.8" fill="${c.line}"/>`).join("");
  return `<defs>
      <clipPath id="gh${g}"><path d="${region}"/></clipPath>
      <clipPath id="gt${g}"><path d="${torsoD}"/></clipPath>
      <linearGradient id="gs${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
    </defs>
    <g clip-path="url(#gh${g})">
      <path d="${torsoD}" fill="${c.trim}" stroke="${c.trim}" stroke-width="11" stroke-linejoin="round"/>
      <path d="${torsoD}" fill="${c.base}" stroke="${c.base}" stroke-width="8" stroke-linejoin="round"/>
      <g clip-path="url(#gt${g})">${deco}</g>
      <path d="${torsoD}" fill="url(#gs${g})"/>
    </g>
    <g clip-path="url(#gt${g})"><path d="${hemD}" stroke="rgba(60,40,20,.3)" stroke-width="6" fill="none" filter="url(#sf2${g})" transform="translate(0 4)"/></g>
    <g clip-path="url(#gt${g})"><path d="${hemD}" stroke="${c.trim}" stroke-width="5" fill="none" stroke-linecap="round" clip-path="url(#gh${g})"/></g>${collar}`;
}

// 앞다리 소매
function sleeve(id, x, top, bottom, w) {
  const c = GARMENT[id];
  if (!c) return "";
  return `<path d="M${x - w / 2} ${top} h${w} v${bottom - top - w * 0.2} q0 ${w * 0.25} ${-w * 0.2} ${w * 0.25} h${-w * 0.6} q${-w * 0.2} 0 ${-w * 0.2} ${-w * 0.25} z" fill="${c.base}"/><path d="M${x - w / 2 + 2} ${bottom - 2} h${w - 4}" stroke="${c.trim}" stroke-width="4.5" stroke-linecap="round"/>`;
}
function sleeves(id, xs, top, bottom, w) {
  const c = GARMENT[id];
  if (!c) return "";
  return xs.map((x) => `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${bottom - top}" rx="${w / 2.4}" fill="${c.base}"/><path d="M${x - w / 2 + 1} ${bottom - 3} h${w - 2}" stroke="${c.trim}" stroke-width="5" stroke-linecap="round"/>`).join("");
}

function hatAt(id, x, top, w, eyeX, eyeY, eyeR, side) {
  switch (id) {
    case "flower": return [-2, -1, 0, 1, 2].map((i) => {
      const fx = x + i * w * 0.2, fy = top + Math.abs(i) * 5 + 4;
      const col = ["#ff9aa8", "#fff08a", "#c4b3ff", "#9fd8ff", "#ffb08a"][i + 2];
      return `<g transform="translate(${fx} ${fy})">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(Math.cos(a * Math.PI / 180) * 5.5).toFixed(1)}" cy="${(Math.sin(a * Math.PI / 180) * 5.5).toFixed(1)}" r="4.6" fill="${col}"/>`).join("")}<circle r="3.2" fill="#ffd34d"/></g>`;
    }).join("");
    case "party": return `<path d="M${x - 17} ${top + 8} L${x + 3} ${top - 40} L${x + 20} ${top + 6} z" fill="#7fb7e8" stroke="#5a96cf" stroke-width="1.5"/><circle cx="${x - 1}" cy="${top - 10}" r="3" fill="#fff"/><circle cx="${x + 8}" cy="${top}" r="3" fill="#ffe48f"/><circle cx="${x + 3}" cy="${top - 42}" r="6.5" fill="#ff9aa8"/>`;
    case "strawhat": return `<ellipse cx="${x}" cy="${top + 6}" rx="${w * 0.95}" ry="${w * 0.2}" fill="#f2d28b" stroke="#d9b45e" stroke-width="2"/><path d="M${x - w * 0.5} ${top + 4} Q${x - w * 0.48} ${top - w * 0.42} ${x} ${top - w * 0.44} Q${x + w * 0.48} ${top - w * 0.42} ${x + w * 0.5} ${top + 4} z" fill="#f5dc9e" stroke="#d9b45e" stroke-width="2"/><path d="M${x - w * 0.5} ${top - 4} Q${x} ${top + 2} ${x + w * 0.5} ${top - 4}" stroke="#e0525f" stroke-width="6" fill="none"/>`;
    case "beanie": return `<path d="M${x - w * 0.62} ${top + 10} Q${x - w * 0.6} ${top - w * 0.55} ${x} ${top - w * 0.58} Q${x + w * 0.6} ${top - w * 0.55} ${x + w * 0.62} ${top + 10} z" fill="#7fb7e8"/><rect x="${x - w * 0.66}" y="${top + 2}" width="${w * 1.32}" height="12" rx="6" fill="#5a96cf"/><circle cx="${x}" cy="${top - w * 0.6}" r="8" fill="#fff"/>`;
    case "headphones": return side
      ? `<path d="M${x - w * 0.55} ${top + 14} Q${x - w * 0.1} ${top - w * 0.35} ${x + w * 0.4} ${top + 4}" stroke="#2f3b52" stroke-width="6" fill="none"/><rect x="${x - w * 0.72}" y="${top + 12}" width="16" height="24" rx="7" fill="#ff7aa8"/>`
      : `<path d="M${x - w * 0.9} ${top + w * 0.7} Q${x} ${top - w * 0.5} ${x + w * 0.9} ${top + w * 0.7}" stroke="#2f3b52" stroke-width="6" fill="none"/><rect x="${x - w * 1.02}" y="${top + w * 0.62}" width="16" height="26" rx="7" fill="#ff7aa8"/><rect x="${x + w * 1.02 - 16}" y="${top + w * 0.62}" width="16" height="26" rx="7" fill="#ff7aa8"/>`;
    case "crown": return `<path d="M${x - 24} ${top + 8} l0 -24 l12 13 l12 -21 l12 21 l12 -13 l0 24 z" fill="#ffd34d" stroke="#d9a400" stroke-width="2" stroke-linejoin="round"/><circle cx="${x}" cy="${top - 4}" r="3.8" fill="#e0525f"/>`;
    case "shades": return side
      ? `<rect x="${eyeX - eyeR * 1.4}" y="${eyeY - eyeR * 1.1}" width="${eyeR * 2.8}" height="${eyeR * 2}" rx="${eyeR * 0.8}" fill="#22283a"/>`
      : eyeX.map((ex) => `<rect x="${ex - eyeR * 1.5}" y="${eyeY - eyeR * 1.1}" width="${eyeR * 3}" height="${eyeR * 2.1}" rx="${eyeR * 0.8}" fill="#22283a"/><path d="M${ex - eyeR} ${eyeY - eyeR * 0.5} l${eyeR * 0.6} -2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`).join("") +
        `<path d="M${eyeX[0] + eyeR * 1.5} ${eyeY - 3} H${eyeX[1] - eyeR * 1.5}" stroke="#22283a" stroke-width="3.5"/>`;
    default: return "";
  }
}

function defsSvg(g, fur, face) {
  const line = shade(fur.ear, -0.35);
  const fluffy = face === "fluffy";
  return `<defs>
    <filter id="fur${g}" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence type="fractalNoise" baseFrequency="${fluffy ? 0.32 : 0.75}" numOctaves="2" seed="${fluffy ? 7 : 3}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${fluffy ? 9 : 4}" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feMorphology in="d" operator="dilate" radius="1.1" result="dil"/>
      <feFlood flood-color="${line}" flood-opacity=".5"/>
      <feComposite in2="dil" operator="in" result="ol"/>
      <feMerge><feMergeNode in="ol"/><feMergeNode in="d"/></feMerge>
    </filter>
    <filter id="sf${g}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="sf2${g}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <radialGradient id="ey${g}" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#6a4c3a"/><stop offset=".55" stop-color="#2b1d14"/><stop offset="1" stop-color="#140c08"/></radialGradient>
    <radialGradient id="ns${g}" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#5a4438"/><stop offset="1" stop-color="#1b120d"/></radialGradient>
    <linearGradient id="tb${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe9f5"/></linearGradient>
  </defs>`;
}

function lookOf(look) {
  if (typeof look === "string") look = { fur: look, face: "floppy" };
  look = look || {};
  return { fur: FUR[look.fur] || FUR.cream, face: FACES[look.face] ? look.face : "floppy" };
}

// 털 질감 짧은 선
function furStrokes(pts, col) {
  return pts.map(([x, y, a]) => `<path d="M${x} ${y} q${3 * Math.cos(a)} ${3 * Math.sin(a) - 4} ${7 * Math.cos(a)} ${7 * Math.sin(a)}" stroke="${col}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".55"/>`).join("");
}

function noseSvg(x, y, w, g) {
  return `<path d="M${x - w / 2} ${y - w * 0.18} C${x - w / 2} ${y - w * 0.55}, ${x + w / 2} ${y - w * 0.55}, ${x + w / 2} ${y - w * 0.18} C${x + w * 0.42} ${y + w * 0.25}, ${x + w * 0.12} ${y + w * 0.42}, ${x} ${y + w * 0.44} C${x - w * 0.12} ${y + w * 0.42}, ${x - w * 0.42} ${y + w * 0.25}, ${x - w / 2} ${y - w * 0.18} z" fill="url(#ns${g})"/>` +
    `<ellipse cx="${x - w * 0.14}" cy="${y - w * 0.2}" rx="${w * 0.17}" ry="${w * 0.09}" fill="#fff" opacity=".7"/>`;
}

// ---------- 앞모습 ----------
function dogFront(st, look, expr, opts) {
  const { fur, face } = lookOf(look);
  const b = BODY[st];
  const heaven = st === "heaven", senior = st === "senior" || heaven;
  const g = ++__gid, cx = 120, hx = b.hx, hy = b.hy, H = b.headY;
  const base = fur.body, earCol = fur.ear, belly = senior && fur !== FUR.snow ? shade(fur.belly, -0.02) : fur.belly;
  const dark = shade(base, -0.3), light = shade(base, 0.5);
  const earDown = expr === "sad" || expr === "sleepy" ? 12 : 0;
  const eyeY = H + hy * 0.1, ex = hx * 0.4, eR = b.eye * 1.18;
  const snY = H + hy * 0.46;
  const tub = opts.prop === "tub";
  const back = opts.view === "back", tv = opts.view === "three" ? 1 : 0;
  const shiftE = tv * hx * 0.27, snX = cx + tv * hx * 0.44;
  const eL = cx - ex + shiftE + tv * ex * 0.3, eRx = cx + ex + shiftE;
  const footY = GROUND - 6;
  const by = b.bodyY, bx = b.brx, bry = b.bry;

  // 몸통(앉은 자세): 목에서 엉덩이까지 한 덩어리
  const torso = `M${cx - bx * 0.42} ${by - bry * 0.95}
    C${cx - bx * 0.95} ${by - bry * 0.5}, ${cx - bx * 1.12} ${by + bry * 0.55}, ${cx - bx * 0.95} ${footY - 2}
    L${cx + bx * 0.95} ${footY - 2}
    C${cx + bx * 1.12} ${by + bry * 0.55}, ${cx + bx * 0.95} ${by - bry * 0.5}, ${cx + bx * 0.42} ${by - bry * 0.95} z`;
  const legPath = (x) => { const w = b.legW, y0 = by - bry * 0.15, h = footY - y0; return `M${x - w * 0.56} ${y0} C${x - w * 0.62} ${y0 + h * 0.5}, ${x - w * 0.46} ${footY - 14}, ${x - w * 0.52} ${footY - 5} C${x - w * 0.66} ${footY + 5}, ${x + w * 0.66} ${footY + 5}, ${x + w * 0.52} ${footY - 5} C${x + w * 0.46} ${footY - 14}, ${x + w * 0.62} ${y0 + h * 0.5}, ${x + w * 0.56} ${y0} z`; };
  const haunch = (d) => `<ellipse cx="${cx + d * bx * 0.74}" cy="${by + bry * 0.45}" rx="${bx * 0.46}" ry="${bry * 0.52}"/><ellipse cx="${cx + d * bx * 0.86}" cy="${footY - 2}" rx="${b.legW * 0.75}" ry="${b.legW * 0.4}"/>`;
  // 머리: 볼이 통통한 모양
  const head = `<ellipse cx="${cx}" cy="${H - hy * 0.05}" rx="${hx * 0.92}" ry="${hy * 0.95}"/>
    <ellipse cx="${cx - hx * 0.5 + tv * hx * 0.1}" cy="${H + hy * 0.32}" rx="${hx * (0.55 - tv * 0.12)}" ry="${hy * 0.5}"/>
    <ellipse cx="${cx + hx * 0.5 + tv * hx * 0.05}" cy="${H + hy * 0.32}" rx="${hx * 0.55}" ry="${hy * 0.5}"/>
    ${back ? "" : `<ellipse cx="${snX}" cy="${snY}" rx="${b.snR * (1.0 + tv * 0.15)}" ry="${b.snR * 0.72}"/>`}`;
  const tx = cx + bx * 0.8, ty = by + bry * 0.1;
  const tailPath = face === "pointy"
    ? `<circle cx="${tx + 14}" cy="${ty - 20}" r="${st === "baby" ? 11 : 14}"/><circle cx="${tx + 14}" cy="${ty - 20}" r="${st === "baby" ? 4 : 5}" fill="${belly}"/>`
    : face === "fluffy" ? `<circle cx="${tx + 14}" cy="${ty - 26}" r="${st === "baby" ? 13 : 16}"/>`
      : `<path d="M${tx - 6} ${ty + 6} C${tx + 16} ${ty + 4}, ${tx + 28} ${ty - 22}, ${tx + 18} ${ty - 46} C${tx + 12} ${ty - 30}, ${tx + 4} ${ty - 14}, ${tx - 8} ${ty - 6} z"/>`;

  // 귀
  let ears = "";
  if (face === "pointy") {
    const eh = hy * (st === "baby" ? 0.66 : 0.82), ew = hx * 0.55;
    ears = [-1, 1].map((d) => {
      const ex0 = cx + d * hx * 0.5 + tv * hx * (d < 0 ? 0.14 : 0.08), ey0 = H - hy * 0.6;
      return `<g transform="rotate(${d * (12 + earDown)} ${ex0} ${ey0})"><path d="M${ex0 - ew / 2} ${ey0 + 8} C${ex0 - ew * 0.3} ${ey0 - eh * 0.6}, ${ex0 + d * 2} ${ey0 - eh * 1.1}, ${ex0 + d * 3} ${ey0 - eh * 1.05} C${ex0 + ew * 0.3} ${ey0 - eh * 0.6}, ${ex0 + ew / 2} ${ey0 - 2}, ${ex0 + ew / 2} ${ey0 + 8} z" fill="${earCol}"/>${back ? "" : `<path d="M${ex0 - ew / 4} ${ey0 + 3} C${ex0 - ew * 0.15} ${ey0 - eh * 0.45}, ${ex0 + d * 2} ${ey0 - eh * 0.75}, ${ex0 + d * 2} ${ey0 - eh * 0.72} C${ex0 + ew * 0.15} ${ey0 - eh * 0.45}, ${ex0 + ew / 4} ${ey0}, ${ex0 + ew / 4} ${ey0 + 3} z" fill="#f2a9b9" opacity=".9"/>`}</g>`;
    }).join("");
  } else if (face !== "fluffy") {
    const len = face === "floppy" ? 1.25 : 1.0;
    ears = [-1, 1].map((d) => {
      const ax = cx + d * hx * 0.72 + (tv && d < 0 ? hx * 0.12 : 0) + tv * hx * 0.06, ay = H - hy * 0.62;
      return `<path transform="rotate(${d * -(4 + earDown)} ${ax} ${ay})" d="M${ax - d * 6} ${ay - 4} C${ax + d * hx * 0.38} ${ay - 12}, ${ax + d * hx * 0.62} ${ay + hy * 0.4 * len}, ${ax + d * hx * 0.5} ${ay + hy * 1.05 * len} C${ax + d * hx * 0.42} ${ay + hy * 1.28 * len}, ${ax + d * hx * 0.05} ${ay + hy * 1.25 * len}, ${ax - d * hx * 0.02} ${ay + hy * 0.95 * len} C${ax - d * hx * 0.1} ${ay + hy * 0.5}, ${ax - d * hx * 0.15} ${ay + hy * 0.1}, ${ax - d * 6} ${ay - 4} z" fill="${earCol}"/>`;
    }).join("");
  }

  // 밝은 무늬 — 부드러운 경계
  const bodyPatches = (back ? "" : `<ellipse cx="${cx}" cy="${by - bry * 0.05}" rx="${bx * 0.42}" ry="${bry * 0.75}" fill="${belly}"/>`) +

    (face === "patch" && !opts.outfit ? `<ellipse cx="${cx - bx * 0.55}" cy="${by + 8}" rx="${bry * 0.32}" ry="${bry * 0.28}" fill="${shade(earCol, -0.08)}"/>` : "");
  let headPatches = back ? "" : `<ellipse cx="${snX}" cy="${snY + 1}" rx="${b.snR * 0.95}" ry="${b.snR * 0.68}" fill="${senior ? "#f1eee9" : belly}"/>`;
  if (face === "floppy" && !back) headPatches += `<path d="M${cx - 6} ${H - hy * 0.92} C${cx - 3} ${H - hy * 0.98}, ${cx + 3} ${H - hy * 0.98}, ${cx + 6} ${H - hy * 0.92} L${cx + 13} ${snY - b.snR * 0.4} H${cx - 13} z" fill="${belly}"/>`;
  if (face === "pointy" && !back) headPatches += `<ellipse cx="${cx - hx * 0.42}" cy="${H + hy * 0.42}" rx="${hx * 0.4}" ry="${hy * 0.34}" fill="${belly}"/><ellipse cx="${cx + hx * 0.42}" cy="${H + hy * 0.42}" rx="${hx * 0.4}" ry="${hy * 0.34}" fill="${belly}"/><ellipse cx="${cx - ex}" cy="${eyeY - b.eye * 1.9}" rx="${b.eye * 0.62}" ry="${b.eye * 0.4}" fill="${belly}"/><ellipse cx="${cx + ex}" cy="${eyeY - b.eye * 1.9}" rx="${b.eye * 0.62}" ry="${b.eye * 0.4}" fill="${belly}"/>`;
  if (face === "patch" && !back) headPatches += `<ellipse cx="${eRx + 2}" cy="${eyeY - 1}" rx="${b.eye * 2.1}" ry="${b.eye * 1.9}" fill="${shade(earCol, -0.1)}"/>`;
  const headFluff = face === "fluffy" ? [-1, -0.6, -0.2, 0.2, 0.6, 1].map((t) => `<circle cx="${cx + Math.sin(t) * hx * 0.9}" cy="${H - Math.cos(t) * hy * 0.85}" r="${hx * 0.32}"/>`).join("") + `<circle cx="${cx - hx * 0.95}" cy="${H + hy * 0.2}" r="${hx * 0.38}"/><circle cx="${cx + hx * 0.95}" cy="${H + hy * 0.2}" r="${hx * 0.38}"/>` : "";
  const bodyFluff = face === "fluffy" ? `<circle cx="${cx - bx * 0.7}" cy="${by - bry * 0.2}" r="${bx * 0.3}"/><circle cx="${cx + bx * 0.7}" cy="${by - bry * 0.2}" r="${bx * 0.3}"/>` : "";

  // 음영(입체감): 머리 아래 목 그림자, 다리 사이, 몸 아래쪽 / 머리 윗부분 하이라이트
  const shading = `<ellipse cx="${cx}" cy="${H + hy * 1.0}" rx="${hx * 0.8}" ry="${hy * 0.28}" fill="${dark}" opacity=".45"/>
    <ellipse cx="${cx}" cy="${footY - 4}" rx="${bx * 0.9}" ry="${bry * 0.3}" fill="${dark}" opacity=".35"/>
    <ellipse cx="${cx}" cy="${by + bry * 0.4}" rx="6" ry="${bry * 0.6}" fill="${dark}" opacity=".3"/>
    <ellipse cx="${cx - bx * 0.95}" cy="${by + bry * 0.4}" rx="${bx * 0.25}" ry="${bry * 0.8}" fill="${dark}" opacity=".3"/>
    <ellipse cx="${cx + bx * 0.95}" cy="${by + bry * 0.4}" rx="${bx * 0.25}" ry="${bry * 0.8}" fill="${dark}" opacity=".3"/>
    <ellipse cx="${cx - bx * 0.3}" cy="${by - bry * 0.4}" rx="${bx * 0.35}" ry="${bry * 0.3}" fill="${light}" opacity=".35"/>`;
  const mass = `${torso.replace(/\s+/g, " ")}`;

  // 옷
  const clip = `<clipPath id="cb${g}"><path d="${mass}"/></clipPath><clipPath id="cm${g}"><path d="${mass}"/>${haunch(-1)}${haunch(1)}<path d="${legPath(cx - 17)}"/><path d="${legPath(cx + 17)}"/></clipPath>`;
  let wear = "", wearBehind = "", neck = "";
  if (tub) opts = Object.assign({}, opts, { outfit: null });
  if (opts.outfit === "bee") wearBehind = `<g fill="rgba(220,240,255,.85)" stroke="#a9c8e8" stroke-width="2"><ellipse cx="${cx - bx * 0.95}" cy="${by - bry * 0.9}" rx="${bx * 0.45}" ry="${bry * 0.32}" transform="rotate(-25 ${cx - bx * 0.95} ${by - bry * 0.9})"/><ellipse cx="${cx + bx * 0.95}" cy="${by - bry * 0.9}" rx="${bx * 0.45}" ry="${bry * 0.32}" transform="rotate(25 ${cx + bx * 0.95} ${by - bry * 0.9})"/></g>`;
  if (opts.outfit === "cape") wearBehind = `<path d="M${cx - bx * 0.55} ${by - bry * 0.92} C${cx - bx * 1.25} ${by - bry * 0.4}, ${cx - bx * 1.45} ${by + bry * 0.5}, ${cx - bx * 1.3} ${GROUND - 4} Q${cx - bx * 1.05} ${GROUND - 14} ${cx - bx * 0.8} ${GROUND - 4} H${cx + bx * 0.8} Q${cx + bx * 1.05} ${GROUND - 14} ${cx + bx * 1.3} ${GROUND - 4} C${cx + bx * 1.45} ${by + bry * 0.5}, ${cx + bx * 1.25} ${by - bry * 0.4}, ${cx + bx * 0.55} ${by - bry * 0.92} z" fill="#d93a4a"/><path d="M${cx - bx * 1.2} ${by} C${cx - bx * 1.32} ${by + bry * 0.6}, ${cx - bx * 1.3} ${by + bry}, ${cx - bx * 1.25} ${GROUND - 8}" stroke="#a82735" stroke-width="3" fill="none" opacity=".6"/><path d="M${cx + bx * 1.2} ${by} C${cx + bx * 1.32} ${by + bry * 0.6}, ${cx + bx * 1.3} ${by + bry}, ${cx + bx * 1.25} ${GROUND - 8}" stroke="#a82735" stroke-width="3" fill="none" opacity=".6"/>`;
  const garmentId = opts.outfit && opts.outfit !== "bowtie" && opts.outfit !== "cape" ? opts.outfit : (!opts.outfit && senior ? (heaven ? "angel" : "vest") : null);
  if (garmentId) wear = garmentFit(garmentId, mass, cx - bx * 1.1, cx + bx * 1.1, by - bry * 1.0, by + bry * 0.18, g, false, cx);
  const sl = (x) => garmentId && !tub ? sleeve(garmentId, x, by - bry * 0.12, by + bry * 0.62, b.legW * 1.22) : "";
  if (opts.outfit === "bowtie") neck = `<path d="M${cx} ${by - bry * 0.8} l-16 -9 q-3 9 0 18 z M${cx} ${by - bry * 0.8} l16 -9 q3 9 0 18 z" fill="#2f3b52"/><circle cx="${cx}" cy="${by - bry * 0.8}" r="5" fill="#e0525f"/>`;
  else if (opts.outfit === "cape") neck = `<path d="M${cx - bx * 0.75} ${by - bry * 0.8} Q${cx - bx * 0.55} ${by - bry * 0.3} ${cx - bx * 0.95} ${by + bry * 0.1} L${cx - bx * 1.1} ${by - bry * 0.4} Q${cx - bx * 1.0} ${by - bry * 0.85} ${cx - bx * 0.5} ${by - bry * 0.95} z M${cx + bx * 0.75} ${by - bry * 0.8} Q${cx + bx * 0.55} ${by - bry * 0.3} ${cx + bx * 0.95} ${by + bry * 0.1} L${cx + bx * 1.1} ${by - bry * 0.4} Q${cx + bx * 1.0} ${by - bry * 0.85} ${cx + bx * 0.5} ${by - bry * 0.95} z" fill="#e04b5a"/><path d="M${cx - 26} ${by - bry * 0.88} Q${cx} ${by - bry * 0.58} ${cx + 26} ${by - bry * 0.88}" stroke="#d93a4a" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="${cx}" cy="${by - bry * 0.72}" r="6" fill="#ffd34d" stroke="#d9a400" stroke-width="1.5"/>`;
  else if (!opts.outfit && st === "teen") neck = `<path d="M${cx - 30} ${by - bry * 0.92} Q${cx} ${by - bry * 0.72} ${cx + 30} ${by - bry * 0.92} L${cx} ${by - bry * 0.18} z" fill="#5aa9e6"/><circle cx="${cx - 9}" cy="${by - bry * 0.7}" r="2.6" fill="#fff"/><circle cx="${cx + 9}" cy="${by - bry * 0.7}" r="2.6" fill="#fff"/><circle cx="${cx}" cy="${by - bry * 0.44}" r="2.4" fill="#fff"/>`;
  else if (!opts.outfit && st === "adult") neck = `<path d="M${cx - 30} ${by - bry * 0.9} Q${cx} ${by - bry * 0.66} ${cx + 30} ${by - bry * 0.9}" stroke="#e0525f" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="${cx}" cy="${by - bry * 0.6}" r="6.5" fill="#ffd34d" stroke="#d9a400" stroke-width="2"/>`;

  const dirt = opts.dirty ? `<g fill="#8c6a45" opacity=".6" filter="url(#sf2${g})"><circle cx="${cx - 28}" cy="${by + 10}" r="8"/><circle cx="${cx + 24}" cy="${by - 6}" r="6"/><circle cx="${cx + 14}" cy="${H - hy * 0.5}" r="6"/><circle cx="${cx - 18}" cy="${by + 26}" r="5"/></g>` : "";
  const brows = senior
    ? `<path d="M${cx - ex - 10} ${eyeY - b.eye * 1.6} q10 -7 20 0 M${cx + ex - 10} ${eyeY - b.eye * 1.6} q10 -7 20 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>`
    : expr === "sad" ? `<path d="M${cx - ex - 8} ${eyeY - b.eye * 1.5} l13 -5 M${cx + ex + 8} ${eyeY - b.eye * 1.5} l-13 -5" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` : "";
  const blushOp = ["love", "joy", "shy", "proud", "star"].includes(expr) ? 0.85 : 0.45;
  const blush = ["sad", "sleepy"].includes(expr) ? "" : `<g filter="url(#sf2${g})"><ellipse cx="${cx - hx * 0.6}" cy="${H + hy * 0.38}" rx="${hx * 0.17}" ry="${hy * 0.1}" fill="#ff8fab" opacity="${blushOp}"/><ellipse cx="${cx + hx * 0.6}" cy="${H + hy * 0.38}" rx="${hx * 0.17}" ry="${hy * 0.1}" fill="#ff8fab" opacity="${blushOp}"/></g>`;
  const halo = heaven ? `<ellipse cx="${cx}" cy="${H - hy - 14}" rx="${hx * 0.62}" ry="8" fill="none" stroke="#ffe48f" stroke-width="6"/>
    <path d="M${cx - bx * 0.8} ${by - 10} q-46 -24 -26 -62 q22 24 46 30 z" fill="#fff" opacity=".95"/><path d="M${cx + bx * 0.8} ${by - 10} q46 -24 26 -62 q-22 24 -46 30 z" fill="#fff" opacity=".95"/>` : "";
  const strokes = furStrokes([[cx - 14, by - bry * 0.5, 1.9], [cx + 10, by - bry * 0.55, 1.2], [cx - 4, by - bry * 0.2, 1.6], [cx - hx * 0.75, H + hy * 0.5, 2.3], [cx + hx * 0.7, H + hy * 0.52, 0.8]], shade(base, -0.22));

  const tw = Math.max(bx * 1.75, 92), tubTop = by - bry * 0.42;
  const tubSvg = tub ? `<g class="svg-tub">
      <path d="M${cx - tw} ${tubTop} H${cx + tw} Q${cx + tw * 0.98} ${GROUND - 4} ${cx + tw * 0.72} ${GROUND + 1} H${cx - tw * 0.72} Q${cx - tw * 0.98} ${GROUND - 4} ${cx - tw} ${tubTop} z" fill="url(#tb${g})" stroke="#b9cbe0" stroke-width="2.5"/>
      <path d="M${cx - tw * 0.8} ${tubTop + 14} Q${cx - tw * 0.82} ${GROUND - 26} ${cx - tw * 0.6} ${GROUND - 20}" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>
      <rect x="${cx - tw - 8}" y="${tubTop - 8}" width="${tw * 2 + 16}" height="15" rx="7.5" fill="#fff" stroke="#b9cbe0" stroke-width="2.5"/>
      <path d="M${cx - tw * 0.62} ${GROUND} l-7 8 M${cx + tw * 0.62} ${GROUND} l7 8" stroke="#e0b44b" stroke-width="7" stroke-linecap="round"/>
      ${Array.from({ length: 11 }, (_, i) => `<circle cx="${cx - tw * 0.92 + i * tw * 0.184}" cy="${tubTop - 10 - (i % 2) * 6}" r="${11 + (i % 3) * 2.5}" fill="#fff" stroke="#d6e6f5" stroke-width="1.5"/>`).join("")}
    </g>` : "";
  const foam = tub ? [-0.4, 0, 0.35].map((t, i) => `<circle cx="${cx + t * hx}" cy="${H - hy * 0.92 + (i % 2) * 4}" r="${hx * 0.22}" fill="#fff" stroke="#d6e6f5" stroke-width="1.2"/>`).join("") : "";
  const bowl = opts.prop === "bowl" ? `<g class="svg-bowl"><path d="M${cx - 38} ${GROUND - 20} h76 q-4 22 -38 22 q-34 0 -38 -22 z" fill="#ef5f6e" stroke="#c9404f" stroke-width="2"/><ellipse cx="${cx}" cy="${GROUND - 20}" rx="38" ry="7" fill="#c9404f"/>${[-20, -8, 4, 16, -14, 10].map((x, i) => `<circle class="kibble" style="animation-delay:${0.3 + i * 0.3}s" cx="${cx + x}" cy="${GROUND - 23 - (i % 2) * 3}" r="5" fill="#a8693c"/>`).join("")}</g>` : "";

  return `<svg class="dog-svg pose-front stage-${st} mood-${expr}" viewBox="0 0 240 240" role="img" aria-label="강아지">
    ${defsSvg(g, fur, face)}${clip}
    <ellipse class="ground-shadow" cx="${cx}" cy="${GROUND}" rx="${bx * 1.2}" ry="7" fill="rgba(40,60,40,.2)"/>
    ${opts.prop === "bed" ? `<g class="svg-bed"><ellipse cx="${cx}" cy="${GROUND - 6}" rx="${Math.max(bx * 1.7, 90)}" ry="26" fill="#a996e0"/><ellipse cx="${cx}" cy="${GROUND - 12}" rx="${Math.max(bx * 1.45, 76)}" ry="17" fill="#e4dbfa"/><path d="M${cx - 70} ${GROUND - 30} q20 -10 40 0" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/></g>` : ""}
    <g class="dog-root" ${heaven ? 'opacity=".94"' : ""}>
      ${halo}${wearBehind}
      ${back ? "" : `<g class="tail" filter="url(#fur${g})" fill="${base}">${tailPath}</g>`}
      <g filter="url(#fur${g})" fill="${base}">
        ${tub ? "" : haunch(-1) + haunch(1)}
        <path d="${mass}"/>
        ${tub ? "" : [["leg-l", cx - 17], ["leg-r", cx + 17]].map(([cl, x]) => `<g class="leg ${cl}"><path d="${legPath(x)}"/><ellipse cx="${x}" cy="${footY - 2}" rx="${b.legW * 0.56}" ry="${b.legW * 0.36}" fill="${belly}" filter="url(#sf2${g})"/></g>`).join("")}
        ${bodyFluff}
        <g filter="url(#sf2${g})">${bodyPatches}</g>
        <g clip-path="url(#cm${g})" filter="url(#sf${g})">${shading}</g>
      </g>
      ${back ? "" : strokes}${dirt}
      ${wear}${back ? "" : neck}${tubSvg}${bowl}
      ${back ? `<g class="tail back-tail" filter="url(#fur${g})" fill="${base}"><path d="M${cx - 9} ${footY - 6} C${cx - 14} ${by}, ${cx - 6} ${by - bry * 0.6}, ${cx + 4} ${by - bry * 0.95} C${cx + 12} ${by - bry * 0.55}, ${cx + 10} ${by}, ${cx + 9} ${footY - 6} z"/></g>` : ""}
      <g class="head">
        ${face === "pointy" ? `<g filter="url(#fur${g})">${ears}</g>` : ""}
        <g filter="url(#fur${g})" fill="${base}">${head}${headFluff}
          <g filter="url(#sf2${g})">${headPatches}</g>
          <g filter="url(#sf${g})"><ellipse cx="${cx - hx * 0.2 + shiftE}" cy="${H - hy * 0.55}" rx="${hx * 0.55}" ry="${hy * 0.3}" fill="${light}" opacity=".5"/>${tv ? `<ellipse cx="${cx - hx * 0.85}" cy="${H + hy * 0.1}" rx="${hx * 0.3}" ry="${hy * 0.75}" fill="${dark}" opacity=".3"/>` : ""}<ellipse cx="${cx}" cy="${snY + b.snR * 0.75}" rx="${b.snR}" ry="${b.snR * 0.3}" fill="${dark}" opacity=".22"/></g>
        </g>
        ${face !== "pointy" && face !== "fluffy" ? `<g filter="url(#fur${g})">${ears}</g>` : ""}
        ${back ? `<g filter="url(#sf${g})"><ellipse cx="${cx}" cy="${H + hy * 0.2}" rx="${hx * 0.7}" ry="${hy * 0.6}" fill="${dark}" opacity=".18"/></g>` : `${brows}
        <g class="eyes"><g transform="translate(${eL} ${eyeY}) scale(${1 - tv * 0.28} 1) translate(${-eL} ${-eyeY})">${eyeSvg(expr, eL, eyeY, eR, g, 0)}</g>${eyeSvg(expr, eRx, eyeY, eR * (1 + tv * 0.05), g, 1)}</g>`}${expr === "shy" ? `<path d="M${cx - hx * 0.72} ${H + hy * 0.3} l5 -5 m3 7 l5 -5 M${cx + hx * 0.5} ${H + hy * 0.3} l5 -5 m3 7 l5 -5" stroke="#ff7b9c" stroke-width="2" stroke-linecap="round"/>` : ""}
        ${back ? "" : `${blush}
        ${noseSvg(snX + tv * 3, snY - b.snR * 0.22, b.snR * 0.52, g)}
        ${mouthSvg(expr, snX, snY + b.snR * 0.18, b.snR * 0.7)}`}
        ${opts.hat && !(back && opts.hat === "shades") ? hatAt(opts.hat, cx + shiftE * 0.5, H - hy * 0.95, hx, [eL, eRx], eyeY, b.eye, false) : ""}
        ${foam}
      </g>
    </g>
  </svg>`;
}

// ---------- 옆모습 (오른쪽을 봄) ----------
function dogSide(st, look, expr, opts) {
  const { fur, face } = lookOf(look);
  const b = BODY[st];
  const heaven = st === "heaven", senior = st === "senior" || heaven;
  const g = ++__gid;
  const base = fur.body, belly = fur.belly, earCol = fur.ear;
  const dark = shade(base, -0.3), light = shade(base, 0.5), far = shade(base, -0.14);
  const bcx = 104, bcy = b.bodyY - 12, brx = b.brx * 1.15, bry = b.bry * 0.62;
  const hcx = bcx + brx * 0.74, hcy = b.headY + 8, hx = b.hx * 0.92, hy = b.hy;
  const footY = GROUND - 6, legW = b.legW * 0.95;
  const snx = hcx + hx * 0.66, sny = hcy + hy * 0.34;
  const eyeX = hcx + hx * 0.34, eyeY = hcy + hy * 0.02;
  // 몸통: 등선이 이어진 한 덩어리 (목 포함)
  const torso = `M${bcx - brx} ${bcy + bry * 0.1}
    C${bcx - brx * 1.02} ${bcy - bry * 1.05}, ${bcx + brx * 0.2} ${bcy - bry * 1.2}, ${hcx - hx * 0.55} ${hcy + hy * 0.15}
    L${hcx + hx * 0.1} ${hcy + hy * 0.75}
    C${bcx + brx * 0.95} ${bcy + bry * 0.2}, ${bcx + brx * 0.8} ${bcy + bry * 1.05}, ${bcx + brx * 0.3} ${bcy + bry * 1.0}
    L${bcx - brx * 0.5} ${bcy + bry * 1.0}
    C${bcx - brx * 0.95} ${bcy + bry * 0.95}, ${bcx - brx * 1.0} ${bcy + bry * 0.6}, ${bcx - brx} ${bcy + bry * 0.1} z`.replace(/\s+/g, " ");
  const pawCol = (col) => (col === base ? belly : shade(belly, -0.12));
  const legP = (cls, x, col) => {
    const paw = `<ellipse cx="${x + legW * 0.12}" cy="${footY - 1}" rx="${legW * 0.62}" ry="${legW * 0.32}" fill="${pawCol(col)}"/>`;
    return cls.startsWith("leg-b")
      ? `<g class="leg ${cls}"><path fill="${col}" d="M${x - legW * 0.95} ${bcy - 8} C${x - legW * 1.3} ${bcy + bry * 0.9}, ${x - legW * 0.15} ${bcy + bry * 0.75}, ${x - legW * 0.32} ${footY - 5} C${x - legW * 0.5} ${footY + 4}, ${x + legW * 0.8} ${footY + 4}, ${x + legW * 0.62} ${footY - 4} C${x + legW * 0.55} ${bcy + bry * 0.9}, ${x + legW * 0.85} ${bcy + bry * 0.2}, ${x + legW * 0.65} ${bcy - 8} z"/>${paw}</g>`
      : `<g class="leg ${cls}"><path fill="${col}" d="M${x - legW * 0.55} ${bcy - 6} C${x - legW * 0.62} ${bcy + 20}, ${x - legW * 0.46} ${footY - 14}, ${x - legW * 0.5} ${footY - 4} C${x - legW * 0.6} ${footY + 4}, ${x + legW * 0.85} ${footY + 4}, ${x + legW * 0.62} ${footY - 4} C${x + legW * 0.48} ${footY - 14}, ${x + legW * 0.62} ${bcy + 20}, ${x + legW * 0.55} ${bcy - 6} z"/>${paw}</g>`;
  };
  const tx = bcx - brx * 0.95, ty = bcy - bry * 0.3;
  const tail = face === "pointy"
    ? `<circle cx="${tx - 12}" cy="${ty - 16}" r="${st === "baby" ? 11 : 14}" fill="${base}"/><circle cx="${tx - 12}" cy="${ty - 16}" r="${st === "baby" ? 4 : 5}" fill="${belly}"/>`
    : face === "fluffy" ? `<circle cx="${tx - 10}" cy="${ty - 18}" r="${st === "baby" ? 13 : 16}" fill="${base}"/>`
      : `<path fill="${base}" d="M${tx + 6} ${ty + 6} C${tx - 16} ${ty + 4}, ${tx - 28} ${ty - 22}, ${tx - 18} ${ty - 46} C${tx - 12} ${ty - 30}, ${tx - 4} ${ty - 14}, ${tx + 8} ${ty - 6} z"/>`;
  const headShape = `<ellipse cx="${hcx}" cy="${hcy}" rx="${hx}" ry="${hy * 0.95}"/><ellipse cx="${hcx + hx * 0.15}" cy="${hcy + hy * 0.35}" rx="${hx * 0.75}" ry="${hy * 0.55}"/><ellipse cx="${snx}" cy="${sny}" rx="${b.snR * 0.92}" ry="${b.snR * 0.66}"/>` +
    (face === "fluffy" ? [-0.8, -0.35, 0.1, -1.2].map((t) => `<circle cx="${hcx + Math.sin(t) * hx * 0.85}" cy="${hcy - Math.cos(t) * hy * 0.82}" r="${hx * 0.33}"/>`).join("") : "");
  let ear = "";
  const o = hx * 0.3;
  if (face === "pointy") ear = `<path d="M${hcx - hx * 0.48} ${hcy - hy * 0.5} C${hcx - hx * 0.45} ${hcy - hy * 1.2}, ${hcx - hx * 0.25} ${hcy - hy * 1.6}, ${hcx - hx * 0.15} ${hcy - hy * 1.55} C${hcx} ${hcy - hy * 1.2}, ${hcx + hx * 0.1} ${hcy - hy * 0.9}, ${hcx + hx * 0.1} ${hcy - hy * 0.65} z" fill="${earCol}"/><path d="M${hcx - hx * 0.36} ${hcy - hy * 0.62} C${hcx - hx * 0.3} ${hcy - hy * 1.1}, ${hcx - hx * 0.2} ${hcy - hy * 1.3}, ${hcx - hx * 0.15} ${hcy - hy * 1.28} C${hcx - hx * 0.05} ${hcy - hy * 1.0}, ${hcx} ${hcy - hy * 0.85}, ${hcx} ${hcy - hy * 0.68} z" fill="#f2a9b9" opacity=".9"/>`;
  else if (face === "fluffy") ear = `<circle cx="${hcx - hx * 0.38}" cy="${hcy + hy * 0.15}" r="${hx * 0.42}" fill="${base}"/><circle cx="${hcx - hx * 0.32}" cy="${hcy + hy * 0.52}" r="${hx * 0.32}" fill="${base}"/>`;
  else { const L = face === "floppy" ? 1.1 : 0.85; ear = `<path d="M${hcx - hx * 0.2 - o} ${hcy - hy * 0.72} C${hcx - hx * 0.8 - o} ${hcy - hy * 0.6}, ${hcx - hx * 0.75 - o} ${hcy + hy * L}, ${hcx - hx * 0.35 - o} ${hcy + hy * (L + 0.08)} C${hcx - hx * 0.02 - o} ${hcy + hy * (L - 0.05)}, ${hcx + hx * 0.08 - o} ${hcy - hy * 0.3}, ${hcx - hx * 0.2 - o} ${hcy - hy * 0.72} z" fill="${earCol}"/>`; }
  const patches = `<ellipse cx="${bcx + 8}" cy="${bcy + bry * 0.55}" rx="${brx * 0.6}" ry="${bry * 0.4}" fill="${belly}"/><ellipse cx="${snx + 2}" cy="${sny + 2}" rx="${b.snR * 0.85}" ry="${b.snR * 0.6}" fill="${senior ? "#f1eee9" : belly}"/><ellipse cx="${hcx + hx * 0.05}" cy="${hcy + hy * 0.8}" rx="${hx * 0.45}" ry="${hy * 0.3}" fill="${belly}"/>` +
    (face === "patch" ? `<ellipse cx="${eyeX + 2}" cy="${eyeY}" rx="${b.eye * 2}" ry="${b.eye * 1.8}" fill="${shade(earCol, -0.1)}"/>` : "") +
    (face === "floppy" ? `<path d="M${hcx + hx * 0.55} ${hcy - hy * 0.85} q${hx * 0.32} ${hy * 0.4} ${hx * 0.32} ${hy * 0.98}" stroke="${belly}" stroke-width="10" fill="none" stroke-linecap="round"/>` : "") +
    (face === "pointy" ? `<ellipse cx="${hcx + hx * 0.45}" cy="${hcy + hy * 0.45}" rx="${hx * 0.5}" ry="${hy * 0.34}" fill="${belly}"/>` : "");
  const shading = `<ellipse cx="${bcx}" cy="${bcy + bry * 0.95}" rx="${brx * 0.9}" ry="${bry * 0.35}" fill="${dark}" opacity=".4"/><ellipse cx="${hcx - hx * 0.5}" cy="${hcy + hy * 0.9}" rx="${hx * 0.5}" ry="${hy * 0.3}" fill="${dark}" opacity=".35"/><ellipse cx="${bcx - brx * 0.1}" cy="${bcy - bry * 0.7}" rx="${brx * 0.6}" ry="${bry * 0.3}" fill="${light}" opacity=".5"/><ellipse cx="${hcx}" cy="${hcy - hy * 0.55}" rx="${hx * 0.55}" ry="${hy * 0.28}" fill="${light}" opacity=".5"/>`;
  const clip = `<clipPath id="cb${g}"><path d="M${bcx - brx} ${bcy + bry * 0.1} C${bcx - brx * 1.02} ${bcy - bry * 1.05}, ${bcx + brx * 0.4} ${bcy - bry * 1.2}, ${bcx + brx * 0.75} ${bcy - bry * 0.6} C${bcx + brx * 0.95} ${bcy + bry * 0.2}, ${bcx + brx * 0.8} ${bcy + bry * 1.05}, ${bcx + brx * 0.3} ${bcy + bry * 1.0} L${bcx - brx * 0.5} ${bcy + bry * 1.0} C${bcx - brx * 0.95} ${bcy + bry * 0.95}, ${bcx - brx} ${bcy + bry * 0.6}, ${bcx - brx} ${bcy + bry * 0.1} z"/></clipPath><clipPath id="cm${g}"><path d="${torso}"/>${headShape}</clipPath>`;
  const ell = (x, y, rx, ry) => `M${x - rx} ${y} a${rx} ${ry} 0 1 1 ${2 * rx} 0 a${rx} ${ry} 0 1 1 ${-2 * rx} 0 z`;
  const bodyD = `${torso} ${ell(bcx - brx * 0.62, bcy + bry * 0.25, brx * 0.4, bry * 0.8)}`;
  let wear = "", neck = "", behind = "";
  if (opts.outfit && opts.outfit !== "bowtie") {
    if (opts.outfit === "cape") wear = garmentFit("cape", bodyD, bcx - brx * 1.1, hcx, bcy - bry * 1.25, bcy + bry * 0.2, g, true, bcx + brx * 0.4, bcx + brx * 0.82) +
      `<path d="M${bcx - brx * 1.05} ${bcy - bry * 0.4} Q${bcx - brx * 1.35} ${bcy + bry * 0.3} ${bcx - brx * 1.2} ${bcy + bry * 0.9} Q${bcx - brx * 1.05} ${bcy + bry * 0.55} ${bcx - brx * 0.9} ${bcy + bry * 0.3} z" fill="#c4303f"/>` +
      `<circle cx="${bcx + brx * 0.8}" cy="${bcy - bry * 0.55}" r="5.5" fill="#ffd34d" stroke="#d9a400" stroke-width="1.5"/>`;
    else wear = garmentFit(opts.outfit, bodyD, bcx - brx * 1.1, hcx, bcy - bry * 1.2, bcy + bry * 0.3, g, true, bcx + brx * 0.45, bcx + brx * 0.82);
  }
  if (opts.outfit === "bowtie") neck = `<path d="M${hcx - hx * 0.3} ${hcy + hy * 0.95} l-10 -7 v14 z M${hcx - hx * 0.3} ${hcy + hy * 0.95} l10 -7 v14 z" fill="#2f3b52"/>`;
  else if (!opts.outfit && st === "adult") neck = `<path d="M${hcx - hx * 0.9} ${hcy + hy * 0.25} Q${hcx - hx * 0.75} ${hcy + hy * 0.95} ${hcx - hx * 0.15} ${hcy + hy * 0.98}" stroke="#e0525f" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="${hcx - hx * 0.42}" cy="${hcy + hy * 1.12}" r="6" fill="#ffd34d" stroke="#d9a400" stroke-width="2"/>`;
  else if (!opts.outfit && st === "teen") neck = `<path d="M${hcx - hx * 0.9} ${hcy + hy * 0.25} Q${hcx - hx * 0.75} ${hcy + hy * 0.95} ${hcx - hx * 0.15} ${hcy + hy * 0.98} L${hcx - hx * 0.38} ${hcy + hy * 1.5} z" fill="#5aa9e6"/><circle cx="${hcx - hx * 0.5}" cy="${hcy + hy * 1.1}" r="2.5" fill="#fff"/>`;
  else if (!opts.outfit && senior) wear = garmentFit(heaven ? "angel" : "vest", bodyD, bcx - brx * 1.1, hcx, bcy - bry * 1.2, bcy + bry * 0.3, g, true, bcx + brx * 0.45, bcx + brx * 0.82);
  const sideGarment = opts.outfit && GARMENT[opts.outfit] ? opts.outfit : (!opts.outfit && senior ? (heaven ? "angel" : "vest") : null);
  const halo = heaven ? `<ellipse cx="${hcx}" cy="${hcy - hy - 12}" rx="${hx * 0.6}" ry="7" fill="none" stroke="#ffe48f" stroke-width="5"/><path d="M${bcx} ${bcy - bry * 0.6} q-30 -46 -66 -36 q24 18 36 44 z" fill="#fff" opacity=".95"/>` : "";
  const blush = ["sad", "sleepy"].includes(expr) ? "" : `<ellipse cx="${hcx + hx * 0.22}" cy="${hcy + hy * 0.4}" rx="${hx * 0.17}" ry="${hy * 0.1}" fill="#ff8fab" opacity=".6" filter="url(#sf2${g})"/>`;
  return `<svg class="dog-svg pose-side stage-${st} mood-${expr}" viewBox="0 0 240 240" role="img" aria-label="강아지 옆모습">
    ${defsSvg(g, fur, face)}${clip}
    <ellipse class="ground-shadow" cx="${bcx + 10}" cy="${GROUND}" rx="${brx * 1.2}" ry="7" fill="rgba(40,60,40,.2)"/>
    <g class="dog-root" ${heaven ? 'opacity=".94"' : ""}>
      ${halo}${behind}
      <g filter="url(#fur${g})">${legP("leg-bf", bcx - brx * 0.5, far)}${legP("leg-ff", bcx + brx * 0.5, far)}</g>
      <g class="tail" filter="url(#fur${g})">${tail}</g>
      ${face === "fluffy" ? "" : `<g filter="url(#fur${g})" opacity=".85" transform="translate(${hx * 0.32} ${-hy * 0.06})">${ear.replace(/fill="url\(#ea\d+\)"/g, `fill="${shade(earCol, -0.28)}"`)}</g>`}
      <g filter="url(#fur${g})" fill="${base}">
        <path d="${torso}"/>
        <ellipse cx="${bcx - brx * 0.62}" cy="${bcy + bry * 0.25}" rx="${brx * 0.4}" ry="${bry * 0.8}"/>
        ${legP("leg-bn", bcx - brx * 0.65, base)}${legP("leg-fn", bcx + brx * 0.62, base)}
        <g class="head-mass">${headShape}</g>
        <g filter="url(#sf2${g})">${patches}</g>
        <g clip-path="url(#cm${g})" filter="url(#sf${g})">${shading}</g>
      </g>
      ${opts.dirty ? `<g fill="#8c6a45" opacity=".6" filter="url(#sf2${g})"><circle cx="${bcx - 20}" cy="${bcy}" r="8"/><circle cx="${bcx + 18}" cy="${bcy + 10}" r="6"/></g>` : ""}
      ${wear}
      ${neck}
      ${opts.leash ? `<g class="leash-svg">${neck ? "" : `<path d="M${hcx - hx * 0.9} ${hcy + hy * 0.25} Q${hcx - hx * 0.75} ${hcy + hy * 0.95} ${hcx - hx * 0.15} ${hcy + hy * 0.98}" stroke="#e0525f" stroke-width="7" fill="none" stroke-linecap="round"/>`}<circle cx="${hcx - hx * 0.42}" cy="${hcy + hy * 1.1}" r="4" fill="none" stroke="#b8bec9" stroke-width="2.5"/><path d="M${hcx - hx * 0.42} ${hcy + hy * 1.1} Q${bcx + brx * 0.2} ${bcy - bry * 1.9} -20 ${bcy - bry * 2.6}" stroke="#e0525f" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>` : ""}
      <g class="head">
        <g filter="url(#fur${g})">${ear}</g>
        ${senior ? `<path d="M${eyeX - 9} ${eyeY - b.eye * 1.6} q9 -6 18 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>` : ""}
        <g class="eyes">${eyeSvg(expr, eyeX, eyeY, b.eye * 1.15, g, 1)}</g>
        ${blush}
        ${noseSvg(snx + b.snR * 0.72, sny - b.snR * 0.28, b.snR * 0.4, g)}
        ${["joy", "love", "bark", "wink", "star", "proud", "cry"].includes(expr) ? `<path d="M${snx - 1} ${sny + b.snR * 0.4} q${b.snR * 0.3} ${b.snR * 0.55} ${b.snR * 0.65} 0" fill="#8a3b44"/><path d="M${snx + 1} ${sny + b.snR * 0.52} q${b.snR * 0.12} ${b.snR * 0.55} ${b.snR * 0.36} ${b.snR * 0.08}" fill="#ff8fa6"/>` : `<path d="M${snx - 2} ${sny + b.snR * 0.42} q${b.snR * 0.35} ${b.snR * 0.25} ${b.snR * 0.65} 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`}
        ${opts.hat ? hatAt(opts.hat, hcx + hx * (face === "pointy" ? 0.36 : 0.22), hcy - hy * 0.86, hx * 0.8, eyeX, eyeY, b.eye, true) : ""}
      </g>
    </g>
  </svg>`;
}

function dogSvg(stageId, look, expr = "happy", opts = {}) {
  const st = BODY[stageId] ? stageId : "adult";
  return opts.pose === "side" ? dogSide(st, look, expr, opts) : dogFront(st, look, expr, opts);
}

function houseSvg(id) {
  switch (id) {
    case "mushroom": return `<svg viewBox="0 0 120 110"><rect x="34" y="52" width="52" height="56" rx="10" fill="#fff4e0"/><path d="M48 108 v-26 a12 12 0 0 1 24 0 v26z" fill="#b07a4f"/><path d="M6 58 Q8 8 60 6 Q112 8 114 58 Q60 70 6 58 z" fill="#e0525f"/><circle cx="36" cy="30" r="8" fill="#fff"/><circle cx="74" cy="22" r="6" fill="#fff"/><circle cx="88" cy="44" r="7" fill="#fff"/><circle cx="56" cy="46" r="5" fill="#fff"/></svg>`;
    case "igloo": return `<svg viewBox="0 0 120 110"><path d="M8 106 A52 52 0 0 1 112 106 z" fill="#f4fbff" stroke="#c6e2f5" stroke-width="2"/><path d="M14 84 H106 M24 64 H96 M40 46 H80" stroke="#c6e2f5" stroke-width="2"/><path d="M40 106 v-18 a20 20 0 0 1 40 0 v18z" fill="#7fb7e8"/></svg>`;
    case "cloud": return `<svg viewBox="0 0 120 110"><g fill="#fff" stroke="#d6e6f5" stroke-width="2"><circle cx="34" cy="62" r="24"/><circle cx="62" cy="44" r="30"/><circle cx="90" cy="62" r="24"/><rect x="14" y="62" width="92" height="44" rx="20"/></g><path d="M46 106 v-24 a14 14 0 0 1 28 0 v24z" fill="#b9a6ff"/><circle cx="96" cy="24" r="6" fill="#ffe48f"/></svg>`;
    case "wood": return `<svg viewBox="0 0 120 110"><path d="M10 50 L60 8 L110 50 Z" fill="#9b6b47"/><rect x="18" y="48" width="84" height="58" fill="#c98a5f"/><path d="M18 64 h84 M18 80 h84 M18 96 h84" stroke="#a8724d" stroke-width="2"/><path d="M44 106 v-30 a16 16 0 0 1 32 0 v30z" fill="#4a2f22"/></svg>`;
    case "redroof": return `<svg viewBox="0 0 120 110"><path d="M4 52 L60 4 L116 52 Z" fill="#e0525f"/><rect x="16" y="50" width="88" height="56" fill="#fff4e0"/><path d="M44 106 v-32 a16 16 0 0 1 32 0 v32z" fill="#5b3a2a"/><rect x="48" y="26" width="24" height="12" rx="3" fill="#fff"/><text x="60" y="35" text-anchor="middle" font-size="9" fill="#e0525f">멍</text></svg>`;
    case "tent": return `<svg viewBox="0 0 120 110"><path d="M60 6 L112 106 H8 Z" fill="#9fd0ff"/><path d="M60 6 L34 106 M60 6 L86 106" stroke="#fff" stroke-width="10"/><path d="M60 50 L44 106 H76 Z" fill="#2f3b52"/><path d="M60 6 l0 -6 l14 4 l-14 4" fill="#ff9aa8"/></svg>`;
    case "castle": return `<svg viewBox="0 0 120 110"><rect x="14" y="40" width="92" height="66" fill="#e9dcff"/><rect x="6" y="22" width="24" height="84" fill="#d4c2fb"/><rect x="90" y="22" width="24" height="84" fill="#d4c2fb"/><path d="M6 22 l12 -18 l12 18z M90 22 l12 -18 l12 18z" fill="#b9a6ff"/><path d="M14 40 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 v-8 h8 v8 h8" fill="none" stroke="#d4c2fb" stroke-width="8"/><path d="M46 106 v-28 a14 14 0 0 1 28 0 v28z" fill="#7a5bd6"/><circle cx="102" cy="2" r="3" fill="#ffd34d"/></svg>`;
    default: return "";
  }
}


const BADGES = [
  { id: "first_feed", icon: "🍚", name: "첫 끼니", desc: "처음으로 밥을 줬어요", reward: 5 },
  { id: "walker", icon: "🦮", name: "산책왕", desc: "산책 10번", reward: 20 },
  { id: "clean", icon: "🫧", name: "뽀송뽀송", desc: "목욕 5번", reward: 15 },
  { id: "petlover", icon: "🖐️", name: "쓰담쓰담 장인", desc: "쓰다듬기 30번", reward: 20 },
  { id: "trick1", icon: "🎓", name: "첫 재주", desc: "재주 하나 배우기", reward: 15 },
  { id: "trickall", icon: "🏅", name: "재주꾼", desc: "재주 3개 모두 배우기", reward: 40 },
  { id: "combo3", icon: "🔥", name: "척척 보호자", desc: "돌봄 콤보 3", reward: 20 },
  { id: "combo5", icon: "💎", name: "완벽한 돌봄", desc: "돌봄 콤보 5", reward: 40 },
  { id: "perfect3", icon: "🎾", name: "공 잡기 달인", desc: "공 잡기 PERFECT 3번", reward: 25 },
  { id: "lucky", icon: "✨", name: "행운의 뼈다귀", desc: "황금 뼈다귀 발견", reward: 10 },
  { id: "shop1", icon: "🎁", name: "첫 선물", desc: "상점에서 첫 구매", reward: 10 },
  { id: "fullset", icon: "👑", name: "패셔니스타", desc: "집·옷·모자 모두 갖추기", reward: 30 },
  { id: "life", icon: "🌈", name: "한평생", desc: "무지개다리까지 함께하기", reward: 50 },
  { id: "golden", icon: "🌟", name: "최고의 단짝", desc: "황금 무지개다리 엔딩", reward: 60 },
  { id: "collector", icon: "📚", name: "엔딩 수집가", desc: "서로 다른 엔딩 3개 보기", reward: 50 },
];

// ---------- 얼굴형 · 상점 아이템 ----------

// 현재 페이지 메뉴 표시 + 모바일 메뉴 토글
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  document.querySelectorAll(".nav a").forEach((a) => {
    if (a.dataset.page === page) a.setAttribute("aria-current", "page");
  });
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }
});
