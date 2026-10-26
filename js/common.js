// 멍생일기 공통 모듈: 저장, 생애 단계, 강아지 그림
const STORE_KEY = "mungsaeng-v1";

const STAGES = [
  { id: "baby", label: "아기 강아지", until: 12 },
  { id: "teen", label: "꼬마 강아지", until: 36 },
  { id: "adult", label: "어른 강아지", until: 96 },
  { id: "senior", label: "노견", until: Infinity },
];

const FUR = {
  cream: { body: "#f3d9a8", ear: "#d9a96a", label: "크림" },
  choco: { body: "#a8724d", ear: "#7a4d30", label: "초코" },
  snow: { body: "#fbfaf7", ear: "#e3ddd2", label: "눈송이" },
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : { dog: null, stars: [] };
  } catch (e) {
    return { dog: null, stars: [] };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    /* 저장 공간이 막혀도 게임은 계속 */
  }
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
  const ch = String(word).charCodeAt(String(word).length - 1);
  const hasBatchim = ch >= 0xac00 && ch <= 0xd7a3 && (ch - 0xac00) % 28 !== 0;
  const [withB, withoutB] = { 이가: ["이", "가"], 은는: ["은", "는"], 과와: ["과", "와"], 아야: ["아", "야"], 이야: ["이야", "야"] }[pair];
  return word + (hasBatchim ? withB : withoutB);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 강아지 SVG: 단계별 크기·표정·소품이 달라진다
function dogSvg(stageId, furKey, mood) {
  const fur = FUR[furKey] || FUR.cream;
  const scale = { baby: 0.72, teen: 0.86, adult: 1, senior: 1, heaven: 0.95 }[stageId] || 1;
  const senior = stageId === "senior";
  const heaven = stageId === "heaven";
  const sad = mood === "sad";
  const mouth = sad
    ? `<path d="M92 112 q8 -6 16 0" stroke="#3b2a20" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<path d="M92 108 q8 9 16 0" stroke="#3b2a20" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M98 114 q2 8 4 0" fill="#f28ca3"/>`;
  const eyes = heaven
    ? `<path d="M78 90 q6 -6 12 0" stroke="#3b2a20" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M110 90 q6 -6 12 0" stroke="#3b2a20" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<circle cx="84" cy="90" r="5.5" fill="#3b2a20"/><circle cx="116" cy="90" r="5.5" fill="#3b2a20"/><circle cx="86" cy="88" r="1.8" fill="#fff"/><circle cx="118" cy="88" r="1.8" fill="#fff"/>`;
  const brows = senior
    ? `<path d="M76 80 q8 -5 15 0" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M109 80 q8 -5 15 0" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : "";
  const muzzle = senior ? "#e9e6e1" : "#fff7ea";
  const halo = heaven
    ? `<ellipse cx="100" cy="44" rx="26" ry="7" fill="none" stroke="#ffe48f" stroke-width="5"/>
       <path d="M40 140 q-30 -20 -14 -48 q14 18 34 22 z" fill="#ffffff" opacity=".95"/>
       <path d="M160 140 q30 -20 14 -48 q-14 18 -34 22 z" fill="#ffffff" opacity=".95"/>`
    : "";
  const blush = sad ? "" : `<ellipse cx="72" cy="104" rx="7" ry="4" fill="#f6a9bd" opacity=".7"/><ellipse cx="128" cy="104" rx="7" ry="4" fill="#f6a9bd" opacity=".7"/>`;
  return `
  <svg class="dog-svg" viewBox="0 0 200 210" role="img" aria-label="강아지">
    <g transform="translate(100 120) scale(${scale}) translate(-100 -120)" ${heaven ? 'opacity=".92"' : ""}>
      ${halo}
      <g class="tail"><path d="M150 150 q28 -18 22 -42" stroke="${fur.ear}" stroke-width="12" fill="none" stroke-linecap="round"/></g>
      <ellipse cx="100" cy="158" rx="52" ry="38" fill="${fur.body}"/>
      <rect x="66" y="170" width="16" height="30" rx="8" fill="${fur.body}"/>
      <rect x="118" y="170" width="16" height="30" rx="8" fill="${fur.body}"/>
      <ellipse cx="100" cy="164" rx="26" ry="20" fill="${muzzle}" opacity=".7"/>
      <ellipse class="ear ear-l" cx="58" cy="86" rx="16" ry="30" fill="${fur.ear}" transform="rotate(18 58 86)"/>
      <ellipse class="ear ear-r" cx="142" cy="86" rx="16" ry="30" fill="${fur.ear}" transform="rotate(-18 142 86)"/>
      <circle cx="100" cy="92" r="46" fill="${fur.body}"/>
      <ellipse cx="100" cy="106" rx="24" ry="17" fill="${muzzle}"/>
      ${brows}${eyes}${blush}
      <ellipse cx="100" cy="99" rx="7" ry="5" fill="#3b2a20"/>
      ${mouth}
      ${senior ? '<rect x="74" y="132" width="52" height="9" rx="4.5" fill="#f6a9bd"/>' : '<rect x="76" y="132" width="48" height="8" rx="4" fill="#7fb7e8"/>'}
    </g>
  </svg>`;
}

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
