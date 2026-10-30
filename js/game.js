// 멍생일기 키우기 화면
const STAT_KEYS = ["배부름", "행복", "건강", "청결"];

// 돌보기: 나이에 따라 효과가 다르다 (아기는 낮잠이 잘 듣고, 노견은 산책이 버겁다)
const ACTIONS = {
  feed: {
    label: "밥 주기", emoji: "🍚", anim: "feed", ms: 2600, expr: "eat", sound: "munch", prop: "bowl",
    effect: { 배부름: 32, 건강: 3 },
    lines: { baby: ["냠냠… 우유 냄새 나!", "다 먹었어! 또 줘!"], teen: ["와구와구!", "그릇까지 핥을 거야!"], adult: ["역시 우리 집 밥이 최고야", "천천히 먹을게, 진짜야"], senior: ["부드러워서 좋다…", "고마워, 꼭꼭 씹어 먹을게"] },
  },
  walk: {
    label: "산책하기", emoji: "🦮", anim: "walk", ms: 3200, expr: "joy", sound: "steps", pose: "side", leash: true,
    effect: { 행복: 16, 건강: 15, 배부름: -10, 청결: -14 },
    byStage: { baby: { 건강: 8, 청결: -18 }, senior: { 행복: 10, 건강: 7 } },
    lines: { baby: ["바깥은 처음이야! 무서워!", "풀이 발바닥을 간질여"], teen: ["저기 비둘기다!", "킁킁, 여기 친구 냄새 나!"], adult: ["우리 산책 코스 다 외웠지", "보호자랑 걷는 게 제일 좋아"], senior: ["천천히 가자… 바람 좋다", "예전엔 저기까지 뛰었는데"] },
  },
  play: {
    label: "공놀이", emoji: "🎾", anim: "play", ms: 2600, expr: "joy", sound: "boing", pose: "side",
    effect: { 행복: 26, 배부름: -9, 건강: 4 },
    byStage: { baby: { 행복: 30 }, senior: { 행복: 14, 건강: -2 } },
    lines: { baby: ["공이 나보다 커!", "굴러간다 굴러간다!"], teen: ["또 던져! 또! 또!", "내가 잡았다!"], adult: ["점프 캐치 봤어?", "한 번만 더!"], senior: ["굴려 주면 갖다줄게", "공은 아직도 좋아"] },
  },
  bath: {
    label: "목욕하기", emoji: "🛁", anim: "bath", ms: 3000, expr: "surprised", sound: "splash", prop: "tub",
    effect: { 청결: 40, 행복: -6 },
    byStage: { baby: { 행복: -10 }, senior: { 행복: 2 } },
    lines: { baby: ["물 차가워! 낑낑", "보송보송해졌다"], teen: ["으악 물이다!", "부르르르! 다 털 거야"], adult: ["목욕은 참는 거야…", "개운하다!"], senior: ["따뜻한 물 좋네", "털 말려 줘서 고마워"] },
  },
  nap: {
    label: "낮잠 재우기", emoji: "💤", anim: "nap", ms: 3000, expr: "sleep", sound: "snore", prop: "bed",
    effect: { 건강: 22, 배부름: -5, 행복: 3 },
    byStage: { baby: { 건강: 28 }, senior: { 건강: 30, 행복: 6 } },
    lines: { baby: ["쿨쿨… 엄마 꿈 꿨어", "하암~"], teen: ["꿈에서 공 잡았어", "잘 잤다!"], adult: ["햇볕 낮잠 최고", "개운해"], senior: ["낮잠이 제일 좋아…", "보호자 옆이라 푹 잤어"] },
  },
};

const MAIN_STAT = { feed: "배부름", walk: "건강", play: "행복", bath: "청결", nap: "건강" };


const TRICKS = {
  sit: { label: "앉아", need: 3, minStage: "baby", anim: "sit" },
  paw: { label: "손", need: 4, minStage: "teen", anim: "paw" },
  down: { label: "엎드려", need: 5, minStage: "teen", anim: "down" },
};
const STAGE_ORDER = ["baby", "teen", "adult", "senior", "heaven"];
const BARK_WORD = { baby: "앙!", teen: "멍멍!", adult: "왈왈!", senior: "웡…", heaven: "멍~" };

const MILESTONES = [
  { at: 3, text: "처음으로 혼자 계단을 올라갔어요" },
  { at: 12, text: "첫 번째 생일! 케이크 냄새를 맡았어요" },
  { at: 36, text: "의젓한 어른 강아지가 되었어요" },
  { at: 60, text: "다섯 살 생일, 산책 코스를 다 외웠어요" },
  { at: 96, text: "주둥이에 하얀 털이 나기 시작했어요" },
  { at: 132, text: "열한 살, 걸음은 느려졌지만 꼬리는 그대로예요" },
];

// AI가 실패해도 게임이 멈추지 않도록 준비한 기본 내용
const LOCAL_EVENTS = [
  { title: "비 오는 날", situation: "창밖에 비가 와요. 강아지가 현관 앞에서 산책 가자고 낑낑거려요.", choices: [
    { label: "우비 입혀서 잠깐 나간다", result: "물웅덩이에서 신나게 첨벙첨벙! 대신 흙투성이가 됐어요.", effects: { 행복: 15, 청결: -15 } },
    { label: "집에서 터그 놀이를 한다", result: "거실에서 줄다리기 한판. 비 걱정 없이 즐거웠어요.", effects: { 행복: 8, 건강: 3 } }] },
  { title: "몰래 먹은 간식", situation: "식탁 밑에서 바스락 소리가… 강아지가 떨어진 과자를 물고 있어요!", choices: [
    { label: "손 내밀어 '놔!' 한다", result: "아쉬운 눈으로 과자를 내려놨어요. 칭찬 듬뿍!", effects: { 행복: -3, 건강: 4 } },
    { label: "강아지용 간식으로 바꿔 준다", result: "더 맛있는 걸 받아서 꼬리가 프로펠러가 됐어요.", effects: { 행복: 10, 배부름: 8 } }] },
  { title: "새 친구", situation: "산책길에 처음 보는 강아지가 꼬리를 흔들며 다가와요.", choices: [
    { label: "인사시켜 준다", result: "엉덩이 냄새로 인사 완료. 새 친구가 생겼어요!", effects: { 행복: 14, 청결: -5 } },
    { label: "조심스럽게 지나간다", result: "아쉬워하면서도 보호자 옆을 잘 따라왔어요.", effects: { 행복: -2, 건강: 3 } }] },
];

let state = loadState();
let busy = false;
let tempExpr = null;
let tempPose = null;
let tempProp = null;
let tempLeash = false;
let tempView = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 화면 전환: 동그랗게 닫혔다가 새 장소로 열림
async function curtain(fn) {
  fn();
  await sleep(120);
}
function setScene({ anim = "", bg = "", expr = null, pose = null, prop = null, leash = false } = {}) {
  const scene = $("scene");
  scene.dataset.anim = anim;
  scene.dataset.bg = bg;
  $("scene-back").innerHTML = BACK[bg] || "";
  $("scene-fx").innerHTML = anim && PROPS[anim] ? PROPS[anim](state.dog) : "";
  if (bg) moveDogTo(0, true);
  tempExpr = expr; tempPose = pose; tempProp = prop; tempLeash = leash; tempView = null;
  renderDog();
}
const $ = (id) => document.getElementById(id);

// ---------- 상태 ----------
function newDog(name, look) {
  return blankDogFields({
    name, look, fur: look.fur, months: 1,
    lifespan: 156 + Math.floor(Math.random() * 37),
    stats: { 배부름: 70, 행복: 70, 건강: 80, 청결: 70 },
    memories: [`${josa(name, "이가")} 우리 집에 왔어요`],
    inHeaven: false, letter: null,
    born: new Date().toISOString().slice(0, 10),
  });
}

function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }

function moodOf(dog) {
  if (dog.inHeaven) return { expr: "joy", label: "평온해요" };
  if (dog.lonelyNeed > 0) return { expr: "sad", label: "외로워해요" };
  const s = dog.stats;
  if (s.배부름 < 25) return { expr: "hungry", label: "배고파요" };
  if (s.건강 < 25) return { expr: "sleepy", label: "피곤해요" };
  if (s.행복 < 30) return { expr: "sad", label: "시무룩해요" };
  if (s.청결 < 25) return { expr: "happy", label: "꼬질꼬질해요" };
  const avg = STAT_KEYS.reduce((a, k) => a + s[k], 0) / 4;
  if (avg > 75 && s.행복 > 75) return { expr: "joy", label: "신났어요" };
  return { expr: "happy", label: "기분 좋아요" };
}

function stageIndex(id) { return STAGE_ORDER.indexOf(id); }

// ---------- 그리기 ----------
const DECOR = {
  baby: `<svg viewBox="0 0 400 120" aria-hidden="true"><g class="dr"><ellipse cx="300" cy="96" rx="80" ry="16" fill="#ffd6e4"/><path d="M228 92 q72 -26 144 0" fill="#ffc2d6"/></g><g class="dl" transform="translate(70 70)"><ellipse cx="0" cy="18" rx="20" ry="14" fill="#ffd84d"/><circle cx="10" cy="2" r="11" fill="#ffd84d"/><path d="M19 2 l10 3 l-10 4 z" fill="#ff9a3c"/><circle cx="12" cy="-1" r="2" fill="#333"/></g></svg>`,
  teen: `<svg viewBox="0 0 400 120" aria-hidden="true"><g class="dl" transform="translate(60 84) rotate(-12)"><rect x="-26" y="-6" width="52" height="12" rx="6" fill="#fff"/><circle cx="-26" cy="-6" r="8" fill="#fff"/><circle cx="-26" cy="6" r="8" fill="#fff"/><circle cx="26" cy="-6" r="8" fill="#fff"/><circle cx="26" cy="6" r="8" fill="#fff"/></g><g class="dr"><circle cx="330" cy="90" r="14" fill="#c7e85a"/><path d="M318 84 q12 8 24 0" stroke="#fff" stroke-width="2" fill="none"/></g></svg>`,
  adult: `<svg viewBox="0 0 400 120" aria-hidden="true"><g class="dl"><rect x="40" y="88" width="34" height="14" rx="6" fill="#7fb7e8"/></g></svg>`,
  senior: `<svg viewBox="0 0 400 120" aria-hidden="true"><g class="dr"><ellipse cx="320" cy="96" rx="70" ry="18" fill="#c9b8ef"/><ellipse cx="320" cy="90" rx="56" ry="10" fill="#e4dbfa"/></g><g class="dl" transform="translate(70 60)"><rect x="-4" y="0" width="8" height="40" rx="3" fill="#b07a4f"/><path d="M-4 0 q4 -16 18 -10" stroke="#b07a4f" stroke-width="7" fill="none" stroke-linecap="round"/></g></svg>`,
  heaven: `<svg viewBox="0 0 400 120" aria-hidden="true"><ellipse cx="90" cy="80" rx="60" ry="22" fill="#fff" opacity=".7"/><ellipse cx="320" cy="70" rx="70" ry="24" fill="#fff" opacity=".6"/></svg>`,
};

// 집 안 (포탈로 들어가는 공간)
const HOME_ROOM = `<svg class="room" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs><pattern id="wallp" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#fff4ea"/><circle cx="14" cy="14" r="2.5" fill="#ffd6e4"/><circle cx="0" cy="0" r="2" fill="#d6ecff"/><circle cx="28" cy="28" r="2" fill="#d6ecff"/></pattern></defs>
  <rect width="400" height="300" fill="url(#wallp)"/>
  <rect y="196" width="400" height="10" fill="#e8c9a8"/>
  <g transform="translate(250 40)"><rect width="110" height="86" rx="8" fill="#bfe6ff" stroke="#fff" stroke-width="7"/><path d="M55 0 v86 M0 43 h110" stroke="#fff" stroke-width="5"/><circle cx="84" cy="22" r="10" fill="#fff3a6"/><path d="M-6 -6 q30 30 0 100 M116 -6 q-30 30 0 100" fill="#ffc2d6" opacity=".9"/></g>
  <g transform="translate(150 50)"><rect width="56" height="44" rx="4" fill="#fff" stroke="#e0b07a" stroke-width="5"/><circle cx="28" cy="22" r="11" fill="#f3d9a8"/><circle cx="23" cy="20" r="1.8" fill="#333"/><circle cx="33" cy="20" r="1.8" fill="#333"/><path d="M16 14 q4 -8 8 0 M32 14 q4 -8 8 0" fill="#d9a96a"/></g>
  <g transform="translate(345 150)"><rect x="-4" y="0" width="8" height="50" fill="#b07a4f"/><ellipse cx="0" cy="-6" rx="22" ry="18" fill="#7cc576"/><ellipse cx="-12" cy="4" rx="12" ry="9" fill="#6cbf6a"/><path d="M-14 50 h28 l-4 -16 h-20 z" fill="#e0525f"/></g>
  <g transform="translate(225 150)"><path d="M0 0 h18 l-6 -30 h-6 z" fill="#ffe48f"/><rect x="7" y="0" width="4" height="46" fill="#9aa6bd"/></g>
</svg>`;
const HOME_FLOOR = `<svg class="room-floor" viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="80" fill="#d9a46b"/><g stroke="#c48d55" stroke-width="2">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 50} 0 v80"/>`).join("")}</g><ellipse cx="200" cy="40" rx="150" ry="26" fill="#ffd6e4"/><ellipse cx="200" cy="40" rx="120" ry="18" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/></svg>`;
const DOOR = `<svg viewBox="0 0 60 110" aria-hidden="true"><rect x="2" y="2" width="56" height="106" rx="6" fill="#b07a4f" stroke="#8c5a35" stroke-width="3"/><rect x="10" y="12" width="40" height="36" rx="4" fill="#c9926a"/><rect x="10" y="58" width="40" height="40" rx="4" fill="#c9926a"/><circle cx="46" cy="60" r="4" fill="#ffd34d"/></svg>`;
const DEFAULT_HOUSE = `<svg viewBox="0 0 120 110"><path d="M6 54 L60 10 L114 54 Z" fill="#f29e8e"/><rect x="16" y="52" width="88" height="56" fill="#fff4e0"/><rect x="26" y="62" width="22" height="18" fill="#bfe6ff" stroke="#fff" stroke-width="3"/><path d="M62 108 v-34 a15 15 0 0 1 30 0 v34z" fill="#b07a4f"/><circle cx="86" cy="92" r="2.5" fill="#ffd34d"/></svg>`;

function renderDog(exprOverride) {
  const dog = state.dog;
  const stage = stageOf(dog);
  const mood = moodOf(dog);
  const expr = exprOverride || tempExpr || mood.expr;
  const eq = state.equipped || {};
  $("dog-stage").innerHTML = dogSvg(stage.id, dog.look, expr, { dirty: !dog.inHeaven && dog.stats.청결 < 30 && tempProp !== "tub", outfit: eq.outfit, hat: eq.hat, pose: tempPose, prop: tempProp, leash: tempLeash, view: tempView });
  $("scene-toy").innerHTML = !dog.inHeaven && eq.toy ? toySvg(eq.toy) : "";
  renderPlace();
  $("scene-decor").innerHTML = DECOR[stage.id] || "";
  $("scene-house").innerHTML = dog.inHeaven ? "" : eq.house ? houseSvg(eq.house) : DEFAULT_HOUSE;
}

function render() {
  const dog = state.dog;
  $("adopt").hidden = !!dog;
  $("play-area").hidden = !dog;
  if (!dog) { document.body.dataset.stage = "spring"; return; }
  const stage = stageOf(dog);
  const mood = moodOf(dog);
  document.body.dataset.stage = stage.id;
  $("dog-name").textContent = dog.name;
  $("dog-age").textContent = dog.inHeaven ? "하늘나라" : `${ageText(dog.months)} · ${stage.label}`;
  $("dog-mood").textContent = mood.label;
  $("coin-count").textContent = state.coins;
  $("combo-chip").textContent = dog.combo >= 2 ? `🔥 콤보 ${dog.combo}` : "";
  $("combo-chip").hidden = !(dog.combo >= 2);
  $("badge-count").textContent = `${state.badges.length}/${BADGES.length}`;
  $("ending-hint").textContent = dog.inHeaven ? "" : `${endingHint(dog)} · 엔딩 ${state.endings.length}/${ENDINGS.length}`;
  document.body.dataset.ending = dog.inHeaven ? dog.ending || "star" : "";
  $("shop-btn").hidden = dog.inHeaven;
  renderDog();
  $("stats").innerHTML = STAT_KEYS.map((k) => `
    <div class="stat"><span>${k}</span>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${dog.stats[k]}" aria-label="${k}">
        <i style="width:${dog.stats[k]}%" class="${dog.stats[k] < 30 ? "low" : ""}"></i></div></div>`).join("");
  $("life-fill").style.width = `${dog.inHeaven ? 100 : Math.min(100, Math.round((dog.months / dog.lifespan) * 100))}%`;

  const si = stageIndex(stage.id);
  $("tricks").innerHTML = Object.entries(TRICKS).map(([k, t]) => {
    const locked = si < stageIndex(t.minStage);
    const n = dog.tricks[k] || 0;
    const learned = n >= t.need;
    return `<button type="button" class="trick ${learned ? "learned" : ""}" data-trick="${k}" ${locked ? "disabled" : ""}>
      ${t.label}<small>${locked ? "꼬마부터" : learned ? "배웠어요!" : `${n}/${t.need}`}</small></button>`;
  }).join("");

  const diary = dog.diaries[dog.diaries.length - 1];
  $("diary").hidden = !diary;
  if (diary) {
    $("diary-title").textContent = `${josa(diary.stageLabel, "이가")} 된 날의 일기`;
    $("diary-text").textContent = diary.text;
  }

  ["care", "interact", "talk", "diary"].forEach((id) => { if (dog.inHeaven) $(id).hidden = true; else if (id !== "diary") $(id).hidden = false; });
  $("heaven").hidden = !dog.inHeaven;
  if (dog.inHeaven) renderHeaven(dog);
  renderTalks();
  renderTalkGame();
  renderQuests();
  renderLonely();
}

function say(text) {
  const b = $("bubble");
  b.innerHTML = "";
  b.textContent = text;
  b.classList.remove("pop");
  void b.offsetWidth;
  b.classList.add("pop");
}

function typing() {
  $("bubble").innerHTML = '<span class="dots" aria-label="생각하는 중"><i></i><i></i><i></i></span>';
}

function setBusy(v) {
  busy = v;
  document.querySelectorAll(".act, .trick, #bark-btn, #pet-btn").forEach((b) => { b.disabled = v || b.dataset.locked === "1"; });
  if (!v) render();
}

// ---------- 장면 연출 ----------
const PROPS = {
  feed: () => `<p class="fx-word">냠냠</p>`,
  walk: () => `<p class="fx-word">킁킁</p>`,
  play: () => `<div class="prop ball"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#c7e85a"/><path d="M4 14 q16 10 32 0 M4 26 q16 -10 32 0" stroke="#fff" stroke-width="2.5" fill="none"/></svg></div><p class="fx-word">잡았다!</p>`,
  bath: () => `${Array.from({ length: 10 }, (_, i) => `<span class="bubble-fx" style="left:${18 + i * 7}%;animation-delay:${i * 0.18}s"></span>`).join("")}<p class="fx-word">부르르!</p>`,
  nap: () => `${["Z", "z", "Z"].map((z, i) => `<span class="zzz" style="animation-delay:${i * 0.7}s">${z}</span>`).join("")}`,
  pet: () => `${Array.from({ length: 6 }, (_, i) => `<span class="heart-fx" style="left:${35 + i * 6}%;animation-delay:${i * 0.12}s">♥</span>`).join("")}`,
  bark: (dog) => `<p class="fx-word bark-word">${BARK_WORD[stageOf(dog).id]}</p>`,
  sit: () => `<p class="fx-word">앉아!</p>`,
  paw: () => `<p class="fx-word">손!</p>`,
  down: () => `<p class="fx-word">엎드려!</p>`,
  fail: () => `<p class="fx-word">갸웃?</p>`,
  stageup: () => `${Array.from({ length: 18 }, (_, i) => `<span class="confetti" style="left:${5 + i * 5.2}%;animation-delay:${(i % 6) * 0.1}s;background:${["#ff9aa8", "#ffe48f", "#9fd0ff", "#a6e3a0", "#b9a6ff"][i % 5]}"></span>`).join("")}`,
};

const BACK = {
  walk: `<div class="walk-strip"><svg viewBox="0 0 1800 100" preserveAspectRatio="xMinYMax meet"><g transform="translate(40 0)"><path d="M0 50 l30 -26 l30 26z" fill="#f29e8e"/><rect x="6" y="50" width="48" height="50" fill="#fff4e0"/><rect x="24" y="72" width="12" height="28" fill="#c98a5f"/></g><g transform="translate(200 0)"><rect x="-5" y="60" width="10" height="40" fill="#9b6b47"/><circle cy="48" r="28" fill="#7cc576"/><circle cx="-14" cy="60" r="18" fill="#6cbf6a"/></g><g transform="translate(340 0)"><rect x="-5" y="60" width="10" height="40" fill="#9b6b47"/><circle cy="48" r="28" fill="#7cc576"/><circle cx="-14" cy="60" r="18" fill="#6cbf6a"/></g><g transform="translate(460 0)"><path d="M0 50 l30 -26 l30 26z" fill="#f29e8e"/><rect x="6" y="50" width="48" height="50" fill="#fff4e0"/><rect x="24" y="72" width="12" height="28" fill="#c98a5f"/></g><g transform="translate(620 0)"><rect x="-5" y="60" width="10" height="40" fill="#9b6b47"/><circle cy="48" r="28" fill="#7cc576"/><circle cx="-14" cy="60" r="18" fill="#6cbf6a"/></g><g transform="translate(760 0)"><rect x="-5" y="60" width="10" height="40" fill="#9b6b47"/><circle cy="48" r="28" fill="#7cc576"/><circle cx="-14" cy="60" r="18" fill="#6cbf6a"/></g><g transform="translate(880 0)"><path d="M0 50 l30 -26 l30 26z" fill="#f29e8e"/><rect x="6" y="50" width="48" height="50" fill="#fff4e0"/><rect x="24" y="72" width="12" height="28" fill="#c98a5f"/></g><g transform="translate(1040 0)"><rect x="-5" y="60" width="10" height="40" fill="#9b6b47"/><circle cy="48" r="28" fill="#7cc576"/><circle cx="-14" cy="60" r="18" fill="#6cbf6a"/></g><g transform="translate(1180 0)"><rect x="-5" y="60" width="10" height="40" fill="#9b6b47"/><circle cy="48" r="28" fill="#7cc576"/><circle cx="-14" cy="60" r="18" fill="#6cbf6a"/></g><g transform="translate(1300 0)"><path d="M0 50 l30 -26 l30 26z" fill="#f29e8e"/><rect x="6" y="50" width="48" height="50" fill="#fff4e0"/><rect x="24" y="72" width="12" height="28" fill="#c98a5f"/></g><g transform="translate(1460 0)"><rect x="-5" y="60" width="10" height="40" fill="#9b6b47"/><circle cy="48" r="28" fill="#7cc576"/><circle cx="-14" cy="60" r="18" fill="#6cbf6a"/></g><g transform="translate(1600 0)"><rect x="-5" y="60" width="10" height="40" fill="#9b6b47"/><circle cy="48" r="28" fill="#7cc576"/><circle cx="-14" cy="60" r="18" fill="#6cbf6a"/></g></svg></div>`,
  feed: `<svg class="backdrop" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice"><rect width="400" height="300" fill="#fff6e8"/><g fill="#ffe2b8">${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 40}" y="150" width="38" height="38" rx="3"/><rect x="${i * 40 + 20}" y="190" width="38" height="38" rx="3"/>`).join("")}</g><rect x="250" y="30" width="110" height="90" rx="8" fill="#bfe6ff" stroke="#fff" stroke-width="8"/><path d="M305 30 v90 M250 75 h110" stroke="#fff" stroke-width="5"/><rect x="30" y="60" width="140" height="14" rx="4" fill="#d9a46b"/><circle cx="60" cy="50" r="12" fill="#ff9aa8"/><rect x="95" y="38" width="20" height="24" rx="4" fill="#9fd0ff"/><rect x="130" y="44" width="26" height="18" rx="4" fill="#ffd34d"/></svg>`,
  play: `<svg class="backdrop" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice"><rect width="400" height="300" fill="#cdeeff"/><circle cx="340" cy="50" r="26" fill="#fff3a6"/><g fill="#fff"><ellipse cx="80" cy="60" rx="40" ry="14"/><ellipse cx="200" cy="40" rx="30" ry="10"/></g><g fill="#f4d7b0" stroke="#d9b48a" stroke-width="2">${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 30 + 4} 250 v-60 l10 -12 l10 12 v60 z"/>`).join("")}<rect x="0" y="205" width="400" height="10"/><rect x="0" y="232" width="400" height="10"/></g>${[30, 120, 260, 350].map((x) => `<g transform="translate(${x} 262)"><circle r="6" fill="#ff9aa8"/><circle r="2.5" fill="#ffd34d"/></g>`).join("")}</svg>`,
  bath: `<svg class="backdrop" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice"><rect width="400" height="300" fill="#e6f5ff"/><g fill="none" stroke="#c9e3f5" stroke-width="2">${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 36} 0 v300"/>`).join("")}${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${i * 36} h400"/>`).join("")}</g><rect x="40" y="40" width="80" height="100" rx="40" fill="#fff" stroke="#d6e6f5" stroke-width="4"/><ellipse cx="80" cy="90" rx="28" ry="40" fill="#cfe9ff"/><path d="M330 20 v60 q0 12 -14 12 h-30" stroke="#b9c9d9" stroke-width="6" fill="none"/><ellipse cx="282" cy="96" rx="16" ry="6" fill="#b9c9d9"/>${Array.from({ length: 6 }, (_, i) => `<path class="drop" style="animation-delay:${i * 0.15}s" d="M${272 + i * 4} 108 v14" stroke="#7fc4f5" stroke-width="3" stroke-linecap="round"/>`).join("")}</svg>`,
  nap: `<svg class="backdrop" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice"><rect width="400" height="300" fill="#2c2f5e"/><rect x="250" y="30" width="110" height="100" rx="10" fill="#1d2048" stroke="#8c7fd6" stroke-width="6"/><circle cx="320" cy="70" r="20" fill="#ffe48f"/><circle cx="330" cy="62" r="18" fill="#1d2048"/>${[[270, 50], [290, 110], [345, 105], [265, 95]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`).join("")}<rect x="50" y="110" width="10" height="70" fill="#c9b8ef"/><path d="M30 110 h50 l-10 -30 h-30 z" fill="#ffe48f" opacity=".9"/><ellipse cx="55" cy="200" rx="60" ry="40" fill="#ffe48f" opacity=".12"/></svg>`,
};

function playScene(type, ms, expr, extra = {}) {
  const scene = $("scene");
  const fx = $("scene-fx");
  scene.dataset.anim = type;
  fx.innerHTML = PROPS[type] ? PROPS[type](state.dog) : "";
  $("scene-back").innerHTML = BACK[type] || "";
  tempExpr = expr || null;
  tempPose = extra.pose || null;
  tempProp = extra.prop || null;
  renderDog();
  return new Promise((resolve) => setTimeout(() => {
    scene.dataset.anim = "";
    fx.innerHTML = "";
    $("scene-back").innerHTML = "";
    tempExpr = null;
    tempPose = null;
    tempProp = null;
    resolve();
  }, ms));
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ---------- 돌보기 ----------
async function doAction(key) {
  const dog = state.dog;
  if (!dog || dog.inHeaven || busy) return;
  const act = ACTIONS[key];
  const stage = stageOf(dog);
  setBusy(true);
  // 콤보: 가장 필요한 걸 챙겨 주면 이어짐
  const need = STAT_KEYS.reduce((lo, k) => (dog.stats[k] < dog.stats[lo] ? k : lo), STAT_KEYS[0]);
  const smart = dog.stats[MAIN_STAT[key]] <= dog.stats[need] + 5 || dog.stats[MAIN_STAT[key]] < 45;
  dog.combo = smart ? (dog.combo || 0) + 1 : 0;
  dog.bestCombo = Math.max(dog.bestCombo || 0, dog.combo);

  // 준비 동작 (집 안에서)
  if (key === "nap") {
    say(pick(["졸려… 집에 들어갈래", "하암, 내 자리로 갈래"]));
    await playScene("tohouse", 1000, "sleepy", { pose: "side" });
  } else if (key === "walk") {
    say(pick(["산책?! 산책 간다!!", "목줄이다! 신난다!"]));
    Sound.bark(stage.id, 2);
    await playScene("stand", 900, "star");
  }
  // 장소로 화면 전환
  let catchResult = null;
  await curtain(() => setScene({ anim: key === "play" ? "" : act.anim, bg: act.anim, expr: act.expr, pose: act.pose, prop: act.prop, leash: act.leash }));
  if (key === "play") {
    say("공 던진다~ 잡아 봐!");
    catchResult = await catchGame();
    setScene({ anim: "play", bg: "play", expr: catchResult === "miss" ? "surprised" : catchResult === "perfect" ? "star" : "joy", pose: "side" });
  }
  Sound[act.sound] && Sound[act.sound]();
  say(catchResult === "miss" ? "앗, 놓쳤다! 다시 던져 줘!" : catchResult === "perfect" ? "점프 캐치 봤어?!" : pick(act.lines[stage.id] || act.lines.adult));
  if (dog.combo >= 2) comboFx(dog.combo);
  await sleep(act.ms);
  await curtain(() => setScene({}));

  const eff = Object.assign({}, act.effect, (act.byStage || {})[stage.id] || {});
  if (catchResult === "perfect") { eff.행복 = (eff.행복 || 0) + 12; dog.perfects = (dog.perfects || 0) + 1; }
  if (catchResult === "miss") eff.행복 = Math.round((eff.행복 || 0) / 2);
  STAT_KEYS.forEach((k) => { dog.stats[k] = clamp(dog.stats[k] - 6 + (eff[k] || 0)); });
  dog.counts[key] += 1;
  questEvent(key);
  if (catchResult === "perfect") questEvent("perfect");
  if (dog.combo >= 3) questEvent("combo3");
  const before = dog.months;
  dog.months += dog.months < 12 ? 2 : 8;
  MILESTONES.forEach((m) => { if (before < m.at && dog.months >= m.at) dog.memories.push(`${ageText(m.at)}: ${m.text}`); });
  if (dog.counts[key] === 1) dog.memories.push(`${ageText(dog.months)}: 처음으로 ${act.label}를 했어요`);
  dog.actionsSinceEvent += 1;
  const avg = STAT_KEYS.reduce((a, k) => a + dog.stats[k], 0) / 4;
  dog.careSum = (dog.careSum || 0) + avg;
  dog.careN = (dog.careN || 0) + 1;
  const base = avg >= 80 ? 6 : avg >= 60 ? 4 : avg >= 40 ? 2 : 1;
  const mult = 1 + Math.min(dog.combo, 4) * 0.5;
  earn(Math.round(base * mult) + (catchResult === "perfect" ? 6 : catchResult === "good" ? 3 : 0),
    dog.combo >= 2 ? `콤보 x${dog.combo}` : catchResult === "perfect" ? "PERFECT" : "");
  if (Math.random() < 0.08) {
    dog.luckies = (dog.luckies || 0) + 1;
    luckyFx();
    setTimeout(() => earn(30, "황금 뼈다귀"), 600);
  }

  if (dog.months >= dog.lifespan) {
    dog.months = dog.lifespan;
    dog.inHeaven = true;
    dog.ending = decideEnding(dog);
    if (!state.endings.includes(dog.ending)) state.endings.push(dog.ending);
    dog.memories.push(`${ageText(dog.months)}: ${ENDINGS.find((e) => e.id === dog.ending).name}를 건넜어요`);
    saveState(state);
    setBusy(false);
    say(`${josa(dog.name, "이가")} 긴 낮잠을 자러 갔어요`);
    Sound.chime();
    badgeCheck();
    return;
  }

  const newStage = stageOf(dog);
  saveState(state);
  setBusy(false);
  badgeCheck();
  if (newStage.id !== stage.id) {
    await stageUp(newStage);
  } else if (dog.actionsSinceEvent >= 4 && Math.random() < 0.5) {
    await startEvent();
  }
}



// ---------- 엔딩: 어떻게 키웠는지에 따라 다른 무지개다리 ----------
function careScore(dog) { return dog.careN ? Math.round(dog.careSum / dog.careN) : 60; }
function decideEnding(dog) {
  const score = careScore(dog);
  const learned = Object.entries(TRICKS).filter(([k, t]) => dog.tricks[k] >= t.need).length;
  const c = dog.counts;
  const fun = c.play + c.pet / 4, out = c.walk;
  if (score >= 70 && learned >= 2 && (dog.bestCombo || 0) >= 3) return "golden";
  if (score < 45) return "rain";
  if (score >= 55 && fun >= out && fun >= 5) return "flower";
  if (score >= 55 && out > fun && out >= 5) return "cloud";
  return "star";
}
function endingHint(dog) {
  const e = ENDINGS.find((x) => x.id === decideEnding(dog));
  return `${e.icon} 지금 가는 길: ${e.name}`;
}


// ---------- 퀘스트 ----------
const QUESTS = [
  { id: "feed2", text: "밥 2번 주기", ev: "feed", n: 2, reward: 10 },
  { id: "walk1", text: "산책 1번 가기", ev: "walk", n: 1, reward: 8 },
  { id: "bath1", text: "목욕시키기", ev: "bath", n: 1, reward: 8 },
  { id: "nap1", text: "낮잠 재우기", ev: "nap", n: 1, reward: 6 },
  { id: "play2", text: "공놀이 2번", ev: "play", n: 2, reward: 10 },
  { id: "pet5", text: "쓰다듬기 5번", ev: "pet", n: 5, reward: 8 },
  { id: "talk2", text: "강아지와 대화 2번", ev: "talk", n: 2, reward: 12 },
  { id: "topic1", text: "오늘의 주제로 대화하기", ev: "topic", n: 1, reward: 15 },
  { id: "warm1", text: "따뜻한 말로 마음 통하기", ev: "warm", n: 1, reward: 12 },
  { id: "perfect1", text: "공 잡기 PERFECT", ev: "perfect", n: 1, reward: 15 },
  { id: "combo3", text: "돌봄 콤보 3 만들기", ev: "combo3", n: 1, reward: 15 },
  { id: "trick3", text: "훈련 3번 하기", ev: "trick", n: 3, reward: 10 },
  { id: "bark3", text: "짖어! 3번", ev: "bark", n: 3, reward: 5 },
  { id: "buy1", text: "상점에서 1개 사기", ev: "buy", n: 1, reward: 10 },
  { id: "mess1", text: "강아지 사고 수습하기", ev: "clean", n: 1, reward: 10 },
];
function fillQuests() {
  state.quests = (state.quests || []).filter((q) => QUESTS.find((x) => x.id === q.id));
  state.quests = state.quests.slice(0, 1);
  while (state.quests.length < 1) {
    const pool = QUESTS.filter((x) => !state.quests.find((q) => q.id === x.id) && x.id !== state.lastQuest);
    const pickQ = pool[Math.floor(Math.random() * pool.length)];
    state.quests.push({ id: pickQ.id, prog: 0 });
  }
}
function questEvent(ev, amount = 1) {
  if (!state.dog || state.dog.inHeaven) return;
  let changed = false;
  state.quests.forEach((q) => {
    const def = QUESTS.find((x) => x.id === q.id);
    if (def.ev !== ev || q.done) return;
    q.prog = Math.min(def.n, q.prog + amount);
    changed = true;
    if (q.prog >= def.n) {
      q.done = true;
      state.coins += def.reward;
      toast(`📜 퀘스트 완료! ${def.text}`, `🦴 +${def.reward}`);
      setTimeout(() => {
        state.lastQuest = q.id;
        state.quests = state.quests.filter((x) => x !== q);
        fillQuests();
        saveState(state);
        renderQuests();
      }, 1800);
    }
  });
  if (changed) { saveState(state); renderQuests(); }
}
function renderQuests() {
  const el = $("quest-list");
  if (!el || !state.quests || !state.quests.length) return;
  const q = state.quests[0];
  const def = QUESTS.find((x) => x.id === q.id);
  el.innerHTML = `<span class="q-ico">${q.done ? "✅" : "📜"}</span><span class="q-text">${def.text}</span><span class="q-prog">${q.prog}/${def.n}</span><span class="q-rew">🦴${def.reward}</span>`;
  el.classList.toggle("done", !!q.done);
}

// ---------- 대화 게임: 친밀도, 오늘의 주제 ----------
const TOPICS = ["간식", "산책", "꿈", "친구", "공", "비", "목욕", "생일", "노래", "바다", "눈", "낮잠"];
const AFF_LV = ["낯가림", "친구", "단짝", "가족", "영혼의 단짝"];
function affLevel(dog) { return Math.min(AFF_LV.length - 1, Math.floor((dog.affinity || 0) / 15)); }
function newTopic() { state.topic = TOPICS.filter((t) => t !== state.topic)[Math.floor(Math.random() * (TOPICS.length - 1))]; }
function renderTalkGame() {
  const dog = state.dog;
  if (!dog) return;
  const lv = affLevel(dog), aff = dog.affinity || 0;
  $("aff-label").textContent = `💗 친밀도 Lv.${lv + 1} ${AFF_LV[lv]}`;
  $("aff-fill").style.width = `${lv >= AFF_LV.length - 1 ? 100 : ((aff % 15) / 15) * 100}%`;
  $("topic-chip").textContent = `오늘의 주제: ${state.topic} (주제 단어를 넣으면 보너스!)`;
}


// ---------- 오랜만에 오면 외로워해요 ----------
function timeAgo(h) { return h >= 24 ? `${Math.floor(h / 24)}일` : `${Math.max(1, Math.round(h))}시간`; }
function checkAbsence() {
  const dog = state.dog, now = Date.now();
  if (dog && !dog.inHeaven && state.lastSeen) {
    const hours = (now - state.lastSeen) / 3600000;
    if (hours >= 1) {
      dog.lonelyNeed = hours >= 12 ? 4 : 2;
      dog.lonelyHours = hours;
      dog.stats.행복 = clamp(dog.stats.행복 - Math.min(35, hours * 3));
      dog.stats.배부름 = clamp(dog.stats.배부름 - Math.min(35, hours * 2));
      dog.memories.push(`${ageText(dog.months)}: 보호자를 ${timeAgo(hours)} 동안 기다렸어요`);
    }
  }
  state.lastSeen = now;
  saveState(state);
}
function renderLonely() {
  const dog = state.dog, el = $("lonely");
  if (!el) return;
  const on = !!(dog && !dog.inHeaven && dog.lonelyNeed > 0);
  el.hidden = !on;
  if (on) el.innerHTML = `💧 ${timeAgo(dog.lonelyHours || 1)} 만에 왔어… <b>쓰다듬거나 말을 걸어 달래 주세요</b> (${dog.lonelyNeed}번 남음)`;
}
async function comfort() {
  const dog = state.dog;
  if (!dog || !(dog.lonelyNeed > 0)) return;
  dog.lonelyNeed -= 1;
  if (dog.lonelyNeed <= 0) {
    dog.lonelyNeed = 0;
    saveState(state);
    renderLonely();
    say("보고 싶었어!! 이제 어디 가지 마!");
    Sound.bark(stageOf(dog).id, 3);
    await playScene("pet", 1500, "love");
    earn(5, "다시 만났어요");
  } else {
    say(pick(["킁… 진짜 온 거 맞지?", "조금만 더 안아 줘…", "기다리느라 혼났어…"]));
  }
  saveState(state);
  renderLonely();
}

// ---------- 시키지 않아도 하는 개인기·장난·사고 ----------
const ANTICS = [
  { type: "trick", anim: "spin", ms: 1400, expr: "joy", lines: ["빙글빙글~ 나 잘하지?", "혼자 연습한 거야!"] },
  { type: "trick", anim: "zoomies", ms: 2200, expr: "joy", pose: "side", lines: ["우다다다다!", "신난다아아!"] },
  { type: "trick", anim: "tailchase", ms: 1800, expr: "surprised", pose: "side", lines: ["내 꼬리 잡을 거야!", "저 꼬리 누구 거지?"] },
  { type: "trick", anim: "stand", ms: 1500, expr: "joy", lines: ["두 발로 섰다! 봤어?", "나 키 크지?"] },
  { type: "trick", anim: "fail", ms: 1200, expr: "surprised", lines: ["갸웃? 방금 무슨 소리야?", "킁킁… 뭔가 냄새 나"] },
  { type: "trick", anim: "yawn", ms: 1500, expr: "sleepy", lines: ["하아암~", "졸려… 근데 안 잘 거야"] },
  { type: "mess", emoji: "💩", label: "앗, 실수! 톡 눌러 치우기", lines: ["…헤헤. 나 아무것도 안 했어"], dirt: 6 },
  { type: "mess", emoji: "💦", label: "쉬야를 했어요! 톡 눌러 닦기", lines: ["참으려고 했는데…"], dirt: 5 },
  { type: "mess", emoji: "🧦", label: "양말을 훔쳐 갔어요! 톡 눌러 되찾기", lines: ["이건 이제 내 거야!"], dirt: 0 },
  { type: "mess", emoji: "🪴", label: "화분 흙을 팠어요! 톡 눌러 정리", lines: ["뭔가 묻혀 있는 냄새가 났어!"], dirt: 6 },
  { type: "choice", emoji: "🩴", label: "슬리퍼를 물어뜯었어요!", lines: ["이거 보호자 냄새 나서 좋아!"],
    choices: [{ t: "따끔하게 혼내기", r: "다음엔 안 그럴게… 낑", fx: { 행복: -5 } }, { t: "한 번만 봐주기", r: "역시 보호자 최고!", fx: { 행복: 5 } }] },
];
let nextAntic = Date.now() + 20000;
let messTimer = null;
function idleOK() {
  return state.dog && !state.dog.inHeaven && !busy && !$("scene").dataset.anim && $("shop").hidden && $("event").hidden;
}
async function runAntic() {
  const dog = state.dog;
  const hasMess = !!$("mess").innerHTML;
  const pool = ANTICS.filter((a) => a.type === "trick" || !hasMess);
  const a = pick(pool);
  if (a.type === "trick") {
    setBusy(true);
    say(pick(a.lines));
    if (a.anim !== "yawn") Sound.bark(stageOf(dog).id, 1);
    await playScene(a.anim, a.ms, a.expr, { pose: a.pose });
    setBusy(false);
    return;
  }
  say(pick(a.lines));
  Sound.bark(stageOf(dog).id, 1);
  const box = $("mess");
  if (a.type === "mess") {
    box.innerHTML = `<button type="button" class="mess-item"><span class="mess-emoji">${a.emoji}</span><span class="mess-label">${a.label}</span></button>`;
    box.querySelector("button").onclick = () => {
      clearTimeout(messTimer);
      box.innerHTML = "";
      say(pick(["헤헤, 고마워!", "다음엔 조심할게!", "보호자가 다 치워 줬다!"]));
      earn(2, "사고 수습");
      questEvent("clean");
      saveState(state);
    };
    clearTimeout(messTimer);
    messTimer = setTimeout(() => {
      if (!box.innerHTML) return;
      box.innerHTML = "";
      if (a.dirt) { dog.stats.청결 = clamp(dog.stats.청결 - a.dirt); saveState(state); render(); say("치워 주지 않아서 꼬질꼬질해졌어…"); }
    }, 40000);
  } else {
    box.innerHTML = `<div class="mess-item choice"><span class="mess-emoji">${a.emoji}</span><span class="mess-label">${a.label}</span><span class="mess-btns">${a.choices.map((c, i) => `<button type="button" data-i="${i}">${c.t}</button>`).join("")}</span></div>`;
    box.querySelectorAll("button").forEach((b) => b.onclick = () => {
      const c = a.choices[+b.dataset.i];
      Object.entries(c.fx).forEach(([k, v]) => { dog.stats[k] = clamp(dog.stats[k] + v); });
      box.innerHTML = "";
      say(c.r);
      tempExpr = c.fx.행복 < 0 ? "cry" : "wink"; renderDog();
      setTimeout(() => { tempExpr = null; if (!busy) renderDog(); }, 1800);
      questEvent("clean");
      saveState(state);
      render();
    });
  }
}



// ---------- 장소: 마당 ↔ 집 안 (집이나 문을 누르면 포탈처럼 이동) ----------
function renderPlace() {
  const scene = $("scene"), eq = state.equipped || {};
  const place = state.dog && !state.dog.inHeaven ? (state.place || "yard") : "yard";
  scene.dataset.place = place;
  scene.classList.toggle("has-toy", !!eq.toy);
  scene.classList.toggle("has-house", true);
  const layer = $("scene-place");
  if (layer.dataset.place !== place) {
    layer.dataset.place = place;
    layer.innerHTML = place === "home" ? HOME_ROOM + `<div class="room-floor-wrap">${HOME_FLOOR}</div>` : "";
  }
}
function sparkleAt(xPct) {
  const fx = document.createElement("div");
  fx.className = "portal-fx";
  fx.style.left = `${xPct}%`;
  fx.innerHTML = Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg;--d:${(i % 3) * 0.08}s"></i>`).join("") + "<span>✨</span>";
  $("scene").appendChild(fx);
  setTimeout(() => fx.remove(), 1100);
}
async function goPlace(target) {
  const dog = state.dog;
  if (!dog || dog.inHeaven || busy || $("scene").dataset.anim || $("scene").dataset.bg) return;
  if ((state.place || "yard") === target) return;
  setBusy(true);
  const scene = $("scene"), r = scene.getBoundingClientRect();
  const half = $("dog-stage").getBoundingClientRect().width / 2;
  const edge = r.width / 2 - half * 0.75;
  // 1) 문(포탈) 쪽으로 걸어감
  const toX = target === "home" ? edge : -edge;
  say(target === "home" ? pick(["집에 들어가자!", "우리 집이다~"]) : pick(["밖에 나가자!", "마당으로 출발!"]));
  moveDogTo(toX);
  await sleep(Math.max(350, Math.abs(toX - dogX) / 170 * 1000) + 150);
  // 2) 뒷모습으로 쏙 들어감 + 반짝
  tempPose = null; tempView = "back"; scene.dataset.anim = "enter"; renderDog();
  Sound.chime();
  sparkleAt(target === "home" ? 82 : 14);
  await sleep(650);
  // 3) 장소 바뀜
  state.place = target;
  saveState(state);
  scene.dataset.anim = "";
  tempView = null;
  renderDog();
  const fromX = target === "home" ? -edge : edge;
  moveDogTo(fromX, true);
  sparkleAt(target === "home" ? 14 : 82);
  scene.classList.add("place-fade");
  await sleep(250);
  scene.classList.remove("place-fade");
  // 4) 새 장소 가운데로 걸어 나옴
  moveDogTo(0);
  await sleep(Math.abs(fromX) / 170 * 1000 + 150);
  say(target === "home" ? pick(["집이 최고야~", "포근하다!", "내 방석 어디 있지?"]) : pick(["바깥 공기 좋다!", "킁킁, 풀 냄새!"]));
  setBusy(false);
}
async function jump() {
  if (busy) return;
  setBusy(true);
  Sound.boing && Sound.bark(stageOf(state.dog).id, 1);
  say(pick(["점프!", "하늘까지 닿을 거야!", "폴짝!"]));
  await playScene("hop", 800, "star");
  setBusy(false);
}

// ---------- 화면을 톡 누르면 그쪽으로 걸어가요 ----------
let dogX = 0, moveTimer = null;
function moveDogTo(x, instant) {
  const pos = $("dog-pos");
  if (!pos) return;
  const dist = Math.abs(x - dogX);
  const dur = instant ? 0 : Math.max(0.35, dist / 170);
  pos.style.transitionDuration = `${dur}s`;
  pos.style.transform = `translateX(${x}px)`;
  if (!instant && dist > 4) {
    pos.classList.toggle("face-left", x < dogX);
    clearTimeout(moveTimer);
    tempPose = "side";
    $("scene").dataset.anim = "move";
    renderDog();
    moveTimer = setTimeout(() => {
      if ($("scene").dataset.anim === "move") $("scene").dataset.anim = "";
      tempPose = null;
      pos.classList.remove("face-left");
      renderDog();
    }, dur * 1000 + 60);
  } else if (instant) {
    pos.classList.remove("face-left");
  }
  dogX = x;
}
function onSceneTap(e) {
  const scene = $("scene");
  if (!state.dog || state.dog.inHeaven || busy || (scene.dataset.anim && scene.dataset.anim !== "move") || scene.dataset.bg) return;
  if (e.target.closest("#scene-house") && (state.place || "yard") === "yard") { goPlace("home"); return; }
  if (e.target.closest("#door") && state.place === "home") { goPlace("yard"); return; }
  if (e.target.closest("#dog-stage, .mess, .event-card, .catch, button, .lonely")) return;
  const r = scene.getBoundingClientRect();
  if (e.clientY - r.top < r.height * 0.42) { jump(); return; }
  const half = $("dog-stage").getBoundingClientRect().width / 2;
  const limit = r.width / 2 - half * 0.75;
  const x = Math.max(-limit, Math.min(limit, e.clientX - r.left - r.width / 2));
  moveDogTo(x);
  if (Math.random() < 0.35) say(pick(["여기? 여기!", "총총총~", "보호자가 부르면 어디든 가지!", "킁킁, 여기 뭐 있어?"]));
}

// ---------- 도파민 장치: 콤보, 황금 뼈다귀, 공 잡기, 업적 ----------
function badgeCheck() {
  const dog = state.dog;
  if (!dog) return;
  const c = dog.counts;
  const learned = Object.entries(TRICKS).filter(([k, t]) => dog.tricks[k] >= t.need).length;
  const eq = state.equipped;
  const cond = {
    first_feed: c.feed >= 1, walker: c.walk >= 10, clean: c.bath >= 5, petlover: c.pet >= 30,
    trick1: learned >= 1, trickall: learned >= 3, combo3: (dog.bestCombo || 0) >= 3, combo5: (dog.bestCombo || 0) >= 5,
    perfect3: (dog.perfects || 0) >= 3, lucky: (dog.luckies || 0) >= 1,
    shop1: Object.values(state.owned).some((a) => a.length), fullset: !!(eq.house && eq.outfit && eq.hat), life: dog.inHeaven,
    golden: dog.ending === "golden", collector: state.endings.length >= 3,
  };
  BADGES.forEach((b) => {
    if (cond[b.id] && !state.badges.includes(b.id)) {
      state.badges.push(b.id);
      state.coins += b.reward;
      saveState(state);
      toast(`${b.icon} 업적 달성! ${b.name}`, `${b.desc} · 🦴 +${b.reward}`);
    }
  });
  const el = $("badge-count");
  if (el) el.textContent = `${state.badges.length}/${BADGES.length}`;
}

let toastQ = Promise.resolve();
function toast(title, sub) {
  toastQ = toastQ.then(() => new Promise((res) => {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<b>${escapeHtml(title)}</b><span>${escapeHtml(sub)}</span>`;
    document.body.appendChild(t);
    Sound.fanfare();
    setTimeout(() => { t.classList.add("out"); }, 2200);
    setTimeout(() => { t.remove(); res(); }, 2600);
  }));
}

function comboFx(n) {
  const t = document.createElement("span");
  t.className = "combo-fx";
  t.textContent = `콤보 x${n}!`;
  $("scene").appendChild(t);
  setTimeout(() => t.remove(), 1500);
}

function luckyFx() {
  const fx = document.createElement("div");
  fx.className = "lucky-fx";
  fx.innerHTML = `<span class="gold-bone">🦴</span><b>황금 뼈다귀!</b>` + Array.from({ length: 14 }, (_, i) => `<i style="--a:${i * 26}deg"></i>`).join("");
  $("scene").appendChild(fx);
  Sound.jackpot();
  setTimeout(() => fx.remove(), 2000);
}

// 공 잡기: 막대 위를 오가는 공을 초록 구간에서 탭
function catchGame() {
  return new Promise((resolve) => {
    const box = document.createElement("div");
    box.className = "catch";
    box.innerHTML = `<p>공이 날아와요! <b>초록 구간</b>에서 탭!</p><div class="catch-bar"><span class="zone good"></span><span class="zone perfect"></span><span class="ball-dot">🎾</span></div><button type="button" class="btn catch-btn">잡아!</button>`;
    $("scene").appendChild(box);
    const dot = box.querySelector(".ball-dot");
    const start = performance.now();
    const period = 1100;
    let done = false, raf;
    const pos = () => { const t = ((performance.now() - start) % (period * 2)) / period; return t <= 1 ? t : 2 - t; };
    const tick = () => { dot.style.left = `${pos() * 100}%`; raf = requestAnimationFrame(tick); };
    tick();
    const finish = (result) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      box.querySelector("p").innerHTML = { perfect: "<b class='perfect'>PERFECT!</b>", good: "<b>GOOD!</b>", miss: "놓쳤다…" }[result];
      setTimeout(() => { box.remove(); resolve(result); }, 650);
    };
    const hit = (e) => {
      e.preventDefault();
      const d = Math.abs(pos() - 0.5);
      finish(d < 0.07 ? "perfect" : d < 0.2 ? "good" : "miss");
    };
    box.querySelector(".catch-btn").addEventListener("click", hit);
    box.addEventListener("pointerdown", (e) => { if (!e.target.closest(".catch-btn")) hit(e); });
    setTimeout(() => finish("miss"), 4000);
  });
}

// ---------- 쓰다듬기·짖기·훈련 (시간이 흐르지 않음) ----------
async function pet() {
  const dog = state.dog;
  if (!dog || dog.inHeaven || busy) return;
  setBusy(true);
  dog.counts.pet += 1;
  questEvent("pet");
  if (dog.lonelyNeed > 0) { await comfort(); setBusy(false); return; }
  dog.stats.행복 = clamp(dog.stats.행복 + (dog.counts.pet % 3 === 0 ? 0 : 2));
  say(pick(["헤헤, 거기 좋아!", "더 쓰다듬어 줘~", "보호자 손 따뜻해", "배도! 배도 해 줘!"]));
  await playScene("pet", 1400, dog.counts.pet % 2 ? "love" : "shy");
  saveState(state);
  setBusy(false);
  badgeCheck();
}

async function bark() {
  const dog = state.dog;
  if (!dog || busy) return;
  setBusy(true);
  dog.counts.bark += 1;
  questEvent("bark");
  const stage = stageOf(dog);
  Sound.bark(stage.id, stage.id === "senior" ? 1 : 2);
  await playScene("bark", 900, "bark");
  saveState(state);
  setBusy(false);
}

async function trick(key) {
  const dog = state.dog;
  if (!dog || dog.inHeaven || busy) return;
  const t = TRICKS[key];
  const learned = dog.tricks[key] >= t.need;
  const chance = learned ? 0.95 : 0.35 + dog.stats.행복 / 250 + dog.tricks[key] * 0.08;
  questEvent("trick");
  setBusy(true);
  if (Math.random() < chance) {
    Sound.bark(stageOf(dog).id, 1);
    say(learned ? `${t.label}! 이제 식은 죽 먹기야` : "이렇게 하는 거 맞아?");
    await playScene(t.anim, 1500, learned ? "proud" : "star");
    if (!learned) {
      dog.tricks[key] += 1;
      if (dog.tricks[key] >= t.need) {
        dog.memories.push(`${ageText(dog.months)}: '${t.label}'를 배웠어요`);
        earn(15, "재주 습득");
        say(`'${t.label}'를 완벽하게 배웠어요!`);
        Sound.chime();
      }
    }
  } else {
    say("음… 무슨 말이야?");
    await playScene("fail", 1200, "dizzy");
  }
  saveState(state);
  setBusy(false);
  badgeCheck();
}

// ---------- AI 호출 공통 (빈 입력·오류·지연 처리) ----------
async function askAI(payload, ui = {}) {
  if (ui.status) { ui.status.textContent = "생각하는 중…"; ui.status.className = "status"; }
  if (ui.button) ui.button.disabled = true;
  const slow = setTimeout(() => { if (ui.status) ui.status.textContent = "조금 오래 걸리고 있어요. 그대로 기다려 주세요."; }, 7000);
  const ctrl = new AbortController();
  const stop = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch("/api/dog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `서버 오류가 났어요(코드 ${res.status}). 잠시 후 다시 시도해 주세요.`);
    if (ui.status) ui.status.textContent = "";
    return data;
  } catch (err) {
    if (ui.status) {
      ui.status.className = "status error";
      ui.status.textContent = err.name === "AbortError"
        ? "응답이 30초 넘게 오지 않아 멈췄어요. 잠시 후 다시 시도해 주세요."
        : err.message || "연결이 끊겼어요. 인터넷 연결을 확인해 주세요.";
    }
    return null;
  } finally {
    clearTimeout(slow);
    clearTimeout(stop);
    if (ui.button) setTimeout(() => { ui.button.disabled = false; }, 1500);
  }
}

function dogContext(dog) {
  const stage = stageOf(dog);
  return { name: dog.name, stage: stage.id, age: ageText(dog.months), stats: dog.stats };
}

// AI 1. 말 걸기
async function talk(e) {
  e.preventDefault();
  const dog = state.dog;
  const input = $("talk-input");
  const msg = input.value.trim();
  const ui = { status: $("talk-status"), button: $("talk-send") };
  if (!msg) {
    ui.status.className = "status error";
    ui.status.textContent = "강아지에게 할 말을 먼저 적어 주세요.";
    input.focus();
    return;
  }
  typing();
  tempExpr = "surprised"; renderDog();
  const data = await askAI(Object.assign({ mode: "talk", message: msg, topic: state.topic }, dogContext(dog)), ui);
  tempExpr = null; renderDog();
  if (!data) { say("…?"); return; }
  const warmth = Math.max(0, Math.min(3, Number(data.warmth) || 0));
  const emo = ["happy", "joy", "love", "surprised", "sad", "sleepy"].includes(data.emotion) ? data.emotion : "happy";
  say(data.reply.length > 60 ? data.reply.slice(0, 58) + "…" : data.reply);
  // 게임 요소: 마음이 통하면 행복·친밀도·뼈다귀
  const beforeLv = affLevel(dog);
  dog.affinity = (dog.affinity || 0) + 1 + warmth;
  dog.stats.행복 = clamp(dog.stats.행복 + warmth * 3);
  questEvent("talk");
  if (dog.lonelyNeed > 0) comfort();
  let bonus = warmth;
  const hitTopic = msg.includes(state.topic);
  if (hitTopic) { bonus += 5; questEvent("topic"); }
  if (warmth >= 2) questEvent("warm");
  if (bonus) earn(bonus, hitTopic ? "주제 보너스" : warmth >= 2 ? "마음이 통했어요" : "");
  const heart = document.createElement("span");
  heart.className = "warm-fx";
  heart.textContent = warmth >= 2 ? `💗 마음이 통했어요! 친밀도 +${1 + warmth}` : warmth === 1 ? `🙂 친밀도 +2` : `😶 시큰둥… 친밀도 +1`;
  $("scene").appendChild(heart);
  setTimeout(() => heart.remove(), 1800);
  tempExpr = emo; renderDog();
  setTimeout(() => { tempExpr = null; if (!busy) renderDog(); }, 2600);
  if (hitTopic) newTopic();
  if (affLevel(dog) > beforeLv) {
    state.coins += 15;
    toast(`💗 친밀도 레벨 업! ${AFF_LV[affLevel(dog)]}`, "🦴 +15");
  }
  dog.talks.unshift({ q: msg, a: data.reply, age: ageText(dog.months) });
  dog.talks = dog.talks.slice(0, 20);
  saveState(state);
  input.value = "";
  $("talk-count").textContent = "0";
  renderTalks();
  renderTalkGame();
  render();
}

function renderTalks() {
  const dog = state.dog;
  $("talk-log").innerHTML = (dog?.talks || []).slice(0, 4).reverse().map((t) => `
    <li><p class="me">${escapeHtml(t.q)}</p><p class="pup">${escapeHtml(t.a)}</p></li>`).join("");
}

// AI 2. 성장 일기 (단계가 바뀔 때)
async function stageUp(newStage) {
  const dog = state.dog;
  setBusy(true);
  Sound.chime();
  say(`${josa(newStage.label, "이가")} 되었어요!`);
  earn(20, "성장 축하");
  await playScene("stageup", 1800, "joy");
  setBusy(false);
  const entry = { stage: newStage.id, stageLabel: newStage.label, age: ageText(dog.months), text: "일기를 쓰는 중…" };
  dog.diaries.push(entry);
  render();
  const data = await askAI(Object.assign({ mode: "diary", memories: dog.memories.slice(-6) }, dogContext(dog)), { status: $("diary-status") });
  entry.text = data ? data.reply : `오늘부터 나는 ${newStage.label}! 몸이 조금 더 커진 것 같아. 보호자랑 했던 일들이 다 기억나. 앞으로도 같이 놀자.`;
  saveState(state);
  render();
}

// AI 3. 랜덤 이벤트 (선택지 2개)
async function startEvent() {
  const dog = state.dog;
  dog.actionsSinceEvent = 0;
  setBusy(true);
  const card = $("event");
  card.hidden = false;
  $("event-title").textContent = "무슨 일이 생겼어요…";
  $("event-text").innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
  $("event-choices").innerHTML = "";
  $("event-result").textContent = "";
  const data = await askAI(Object.assign({ mode: "event", memories: dog.memories.slice(-4) }, dogContext(dog)), { status: $("event-status") });
  const ev = data && data.event && Array.isArray(data.event.choices) && data.event.choices.length >= 2 ? data.event : pick(LOCAL_EVENTS);
  $("event-status").textContent = "";
  $("event-title").textContent = ev.title;
  $("event-text").textContent = ev.situation;
  $("event-choices").innerHTML = ev.choices.slice(0, 2).map((c, i) => `<button type="button" class="btn small choice" data-i="${i}">${escapeHtml(c.label)}</button>`).join("");
  $("event-choices").onclick = (e) => {
    const b = e.target.closest(".choice");
    if (!b) return;
    const c = ev.choices[+b.dataset.i];
    const fx = c.effects || {};
    STAT_KEYS.forEach((k) => { if (typeof fx[k] === "number") dog.stats[k] = clamp(dog.stats[k] + Math.max(-20, Math.min(20, fx[k]))); });
    dog.memories.push(`${ageText(dog.months)}: ${ev.title} — ${c.label}`);
    earn(3, "");
    saveState(state);
    $("event-choices").innerHTML = "";
    const changes = STAT_KEYS.filter((k) => typeof fx[k] === "number" && fx[k]).map((k) => `${k} ${fx[k] > 0 ? "+" : ""}${Math.max(-20, Math.min(20, fx[k]))}`).join(", ");
    $("event-result").textContent = `${c.result}${changes ? ` (${changes})` : ""}`;
    $("event-close").hidden = false;
  };
  $("event-close").hidden = true;
}

function closeEvent() {
  $("event").hidden = true;
  setBusy(false);
}

// AI 4. 하늘나라 편지
function favoriteOf(dog) {
  const care = Object.entries(dog.counts).filter(([k]) => ACTIONS[k]);
  const [key] = care.sort((a, b) => b[1] - a[1])[0];
  return ACTIONS[key].label;
}

function renderHeaven(dog) {
  const end = ENDINGS.find((e) => e.id === (dog.ending || "star"));
  $("heaven-title").textContent = `${end.icon} ${josa(dog.name, "은는")} ${josa(end.name, "을를")} 건넜어요`;
  $("heaven-desc").textContent = `${end.desc} — 돌봄 점수 ${careScore(dog)}점, 최고 콤보 ${dog.bestCombo || 0}`;
  const learned = Object.entries(TRICKS).filter(([k, t]) => dog.tricks[k] >= t.need).map(([, t]) => t.label);
  $("heaven-sub").textContent = `${ageText(dog.months)} 동안 함께했어요. 가장 좋아한 건 ${favoriteOf(dog)}, 쓰다듬은 횟수 ${dog.counts.pet}번${learned.length ? `, 배운 재주: ${learned.join(", ")}` : ""}.`;
  $("letter-box").hidden = !dog.letter;
  $("letter-text").textContent = dog.letter || "";
  $("letter-btn").hidden = !!dog.letter;
}

async function getLetter() {
  const dog = state.dog;
  const end = ENDINGS.find((e) => e.id === (dog.ending || "star"));
  const data = await askAI(Object.assign({ mode: "letter", memories: dog.memories.slice(-12), favorite: favoriteOf(dog), ending: end.name, endingId: end.id }, dogContext(dog), { stage: "heaven" }),
    { status: $("letter-status"), button: $("letter-btn") });
  if (!data) return;
  dog.letter = data.reply;
  saveState(state);
  render();
}

function adoptAgain() {
  const dog = state.dog;
  state.stars.unshift({ ending: dog.ending, name: dog.name, look: dog.look, fur: dog.fur, months: dog.months, memories: dog.memories, diaries: dog.diaries, letter: dog.letter, favorite: favoriteOf(dog), born: dog.born });
  state.dog = null;
  saveState(state);
  $("adopt-name").value = "";
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}


// ---------- 입양 미리보기 ----------
function pickedLook() {
  return {
    fur: document.querySelector('input[name="fur"]:checked').value,
    face: document.querySelector('input[name="face"]:checked').value,
  };
}
function renderAdoptPreview() {
  const look = pickedLook();
  $("adopt-preview").innerHTML = dogSvg("baby", look, "joy");
  document.querySelectorAll(".face-opt").forEach((el) => {
    el.querySelector(".face-mini").innerHTML = dogSvg("baby", { fur: look.fur, face: el.dataset.face }, "happy");
  });
}

// ---------- 뼈다귀(크레딧) ----------
function earn(n, why) {
  if (!n) return;
  state.coins += n;
  saveState(state);
  $("coin-count").textContent = state.coins;
  const t = document.createElement("span");
  t.className = "coin-fx";
  t.textContent = `+${n} 🦴${why ? " " + why : ""}`;
  $("scene").appendChild(t);
  setTimeout(() => t.remove(), 1600);
}

// ---------- 상점 ----------
let shopTab = "house";
const TAB_LABEL = { house: "집", outfit: "옷", hat: "모자·소품", toy: "장난감" };
function openShop() {
  $("shop").hidden = false;
  renderShop();
}
function renderShop() {
  const dog = state.dog;
  $("shop-coins").textContent = state.coins;
  $("shop-tabs").innerHTML = Object.entries(TAB_LABEL).map(([k, v]) => `<button type="button" data-tab="${k}" aria-pressed="${k === shopTab}">${v}</button>`).join("");
  const stage = stageOf(dog).id;
  $("shop-list").innerHTML = SHOP[shopTab].map((it) => {
    const owned = state.owned[shopTab].includes(it.id);
    const on = state.equipped[shopTab] === it.id;
    const preview = shopTab === "house" ? houseSvg(it.id) : shopTab === "toy" ? toySvg(it.id)
      : dogSvg(stage, dog.look, "happy", { [shopTab]: it.id });
    const btn = on ? `<button type="button" class="btn small ghost" data-act="off" data-id="${it.id}">${shopTab === "house" || shopTab === "toy" ? "치우기" : "벗기기"}</button>`
      : owned ? `<button type="button" class="btn small" data-act="on" data-id="${it.id}">${shopTab === "house" || shopTab === "toy" ? "놓기" : "입히기"}</button>`
      : `<button type="button" class="btn small" data-act="buy" data-id="${it.id}" ${state.coins < it.price ? "disabled" : ""}>🦴 ${it.price}</button>`;
    return `<li class="shop-item ${on ? "on" : ""}"><div class="shop-prev">${preview}</div><b>${it.name}</b>${btn}</li>`;
  }).join("");
}
function onShopClick(e) {
  const b = e.target.closest("button[data-act]");
  if (!b) return;
  const id = b.dataset.id;
  const item = SHOP[shopTab].find((x) => x.id === id);
  if (b.dataset.act === "buy") {
    if (state.coins < item.price) return;
    state.coins -= item.price;
    state.owned[shopTab].push(id);
    state.equipped[shopTab] = id;
    Sound.chime();
    questEvent("buy");
    state.dog.memories.push(`${ageText(state.dog.months)}: ${item.name}를 선물 받았어요`);
  } else if (b.dataset.act === "on") {
    state.equipped[shopTab] = id;
  } else {
    state.equipped[shopTab] = null;
  }
  saveState(state);
  renderShop();
  render();
  badgeCheck();
  say(b.dataset.act === "off" ? "가벼워졌다!" : shopTab === "house" ? "우와, 내 집이다!" : "어때? 잘 어울려?");
}

// ---------- 연결 ----------
document.addEventListener("DOMContentLoaded", () => {
  Sound.setEnabled(state.sound.on);
  Sound.setVolume(state.sound.volume);
  $("sound-on").checked = state.sound.on;
  $("sound-vol").value = state.sound.volume;
  $("sound-on").addEventListener("change", (e) => { state.sound.on = e.target.checked; Sound.setEnabled(e.target.checked); saveState(state); });
  $("sound-vol").addEventListener("input", (e) => { state.sound.volume = +e.target.value; Sound.setVolume(+e.target.value); saveState(state); });

  $("adopt-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("adopt-name").value.trim();
    const err = $("adopt-status");
    if (!name) { err.className = "status error"; err.textContent = "강아지 이름을 지어 주세요."; $("adopt-name").focus(); return; }
    err.textContent = "";
    state.dog = newDog(name, pickedLook());
    state.coins = 20; // 뼈다귀는 강아지마다 새로 시작
    state.quests = [];
    fillQuests();
    saveState(state);
    render();
    say(`안녕! 나는 ${josa(name, "이야")}. 잘 부탁해!`);
    Sound.bark("baby", 2);
  });
  $("adopt-form").addEventListener("change", renderAdoptPreview);
  renderAdoptPreview();
  $("shop-btn").addEventListener("click", openShop);
  $("shop-close").addEventListener("click", () => { $("shop").hidden = true; });
  $("shop-tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { shopTab = b.dataset.tab; renderShop(); } });
  $("shop-list").addEventListener("click", onShopClick);

  $("actions").innerHTML = Object.entries(ACTIONS).map(([k, a]) =>
    `<button type="button" class="act" data-act="${k}"><span aria-hidden="true">${a.emoji}</span>${a.label}</button>`).join("");
  $("actions").addEventListener("click", (e) => { const b = e.target.closest("[data-act]"); if (b) doAction(b.dataset.act); });
  $("tricks").addEventListener("click", (e) => { const b = e.target.closest("[data-trick]"); if (b && !b.disabled) trick(b.dataset.trick); });
  $("pet-btn").addEventListener("click", pet);
  $("bark-btn").addEventListener("click", bark);
  $("dog-stage").addEventListener("click", pet);
  $("scene").addEventListener("click", onSceneTap);
  $("door").innerHTML = DOOR;
  $("event-close").addEventListener("click", closeEvent);

  $("talk-form").addEventListener("submit", talk);
  $("talk-input").addEventListener("input", (e) => { $("talk-count").textContent = e.target.value.length; });
  $("letter-btn").addEventListener("click", getLetter);
  $("again-btn").addEventListener("click", adoptAgain);

  checkAbsence();
  setInterval(() => { state.lastSeen = Date.now(); saveState(state); }, 30000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { state.lastSeen = Date.now(); saveState(state); } });
  if (state.dog && state.dog.lonelyNeed > 0) {
    document.addEventListener("pointerdown", () => Sound.whine(), { once: true });
  }
  setInterval(() => {
    if (!idleOK() || tempExpr || tempPose || Math.random() < 0.4) return;
    const m = moodOf(state.dog).expr;
    tempExpr = m === "sad" ? pick(["pout", "cry", "look"]) : m === "hungry" ? pick(["hungry", "look", "pout"]) : pick(["blep", "wink", "look", "shy", "proud", "joy"]);
    renderDog();
    setTimeout(() => { tempExpr = null; if (idleOK()) renderDog(); }, 1700);
  }, 5000);
  setInterval(() => {
    if (!idleOK() || Date.now() < nextAntic) return;
    nextAntic = Date.now() + 16000 + Math.random() * 16000;
    runAntic();
  }, 2000);
  if (!state.topic) newTopic();
  fillQuests();
  saveState(state);
  setInterval(() => {
    if (!state.dog || state.dog.inHeaven || busy || $("scene").dataset.anim || $("shop").hidden === false) return;
    const v = pick(["side", "three", "three", "back"]);
    if (v === "side") tempPose = "side"; else tempView = v;
    renderDog();
    $("scene").dataset.idle = "turn";
    setTimeout(() => { if ((tempPose === "side" || tempView) && !$("scene").dataset.anim) { tempPose = null; tempView = null; renderDog(); } $("scene").dataset.idle = ""; }, 2200);
  }, 13000);
  render();
  if (state.dog && !state.dog.inHeaven) say(state.dog.lonelyNeed > 0 ? `보호자… ${timeAgo(state.dog.lonelyHours || 1)}이나 기다렸어… 낑낑` : `${josa(state.dog.name, "이가")} 꼬리를 흔들어요`);
});
