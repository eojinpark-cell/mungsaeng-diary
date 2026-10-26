// 멍생일기 키우기 화면
const ACTIONS = {
  feed: { label: "밥 주기", emoji: "🍚", effect: { 배부름: 30, 건강: 3 }, lines: ["와구와구! 맛있어!", "밥이다 밥이다!", "한 그릇 더…는 안 되지?"] },
  walk: { label: "산책하기", emoji: "🦮", effect: { 행복: 15, 건강: 15, 배부름: -10, 청결: -12 }, lines: ["풀 냄새 최고!", "저기 비둘기다!", "보호자랑 걷는 게 제일 좋아"] },
  play: { label: "공놀이", emoji: "🎾", effect: { 행복: 25, 배부름: -8 }, lines: ["공! 공! 또 던져 줘!", "내가 잡았다!", "한 번만 더!"] },
  bath: { label: "목욕하기", emoji: "🛁", effect: { 청결: 35, 행복: -5 }, lines: ["으으 물 싫어…", "뽀송뽀송해졌다!", "털 말려 줘!"] },
  nap: { label: "낮잠 재우기", emoji: "💤", effect: { 건강: 20, 배부름: -5 }, lines: ["쿨쿨…", "꿈에서 뼈다귀 먹었어", "잘 잤다!"] },
};
const STAT_KEYS = ["배부름", "행복", "건강", "청결"];
const MILESTONES = [
  { at: 3, text: "처음으로 혼자 계단을 올라갔어요" },
  { at: 12, text: "첫 번째 생일! 케이크 냄새를 맡았어요" },
  { at: 36, text: "의젓한 어른 강아지가 되었어요" },
  { at: 60, text: "다섯 살 생일, 산책 코스를 다 외웠어요" },
  { at: 96, text: "주둥이에 하얀 털이 나기 시작했어요" },
  { at: 132, text: "열한 살, 걸음은 느려졌지만 꼬리는 그대로예요" },
];

let state = loadState();
const $ = (id) => document.getElementById(id);

function newDog(name, fur) {
  return {
    name, fur, months: 1,
    lifespan: 156 + Math.floor(Math.random() * 37), // 13~16살
    stats: { 배부름: 70, 행복: 70, 건강: 80, 청결: 70 },
    counts: { feed: 0, walk: 0, play: 0, bath: 0, nap: 0 },
    memories: [`${josa(name, "이가")} 우리 집에 왔어요`],
    talks: [],
    inHeaven: false, letter: null,
    born: new Date().toISOString().slice(0, 10),
  };
}

function mood(dog) {
  const avg = STAT_KEYS.reduce((s, k) => s + dog.stats[k], 0) / STAT_KEYS.length;
  return avg < 40 ? "sad" : "happy";
}

function render() {
  const dog = state.dog;
  $("adopt").hidden = !!dog;
  $("play-area").hidden = !dog;
  if (!dog) {
    document.body.dataset.stage = "spring";
    return;
  }
  const stage = stageOf(dog);
  document.body.dataset.stage = stage.id;
  $("dog-name").textContent = dog.name;
  $("dog-age").textContent = dog.inHeaven ? "하늘나라" : `${ageText(dog.months)} · ${stage.label}`;
  $("dog-stage").innerHTML = dogSvg(stage.id, dog.fur, mood(dog));
  $("stats").innerHTML = STAT_KEYS.map((k) => `
    <div class="stat">
      <span>${k}</span>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${dog.stats[k]}" aria-label="${k}">
        <i style="width:${dog.stats[k]}%" class="${dog.stats[k] < 30 ? "low" : ""}"></i>
      </div>
    </div>`).join("");
  const lifePct = Math.min(100, Math.round((dog.months / dog.lifespan) * 100));
  $("life-fill").style.width = `${dog.inHeaven ? 100 : lifePct}%`;

  $("actions").hidden = dog.inHeaven;
  $("talk").hidden = dog.inHeaven;
  $("heaven").hidden = !dog.inHeaven;
  if (dog.inHeaven) renderHeaven(dog);
}

function say(text) {
  const b = $("bubble");
  b.textContent = text;
  b.classList.remove("pop");
  void b.offsetWidth;
  b.classList.add("pop");
}

function doAction(key) {
  const dog = state.dog;
  if (!dog || dog.inHeaven) return;
  const act = ACTIONS[key];
  STAT_KEYS.forEach((k) => {
    dog.stats[k] = Math.max(0, Math.min(100, dog.stats[k] - 6 + (act.effect[k] || 0)));
  });
  dog.counts[key] += 1;
  const before = dog.months;
  dog.months += dog.months < 12 ? 1 : 6;
  MILESTONES.forEach((m) => {
    if (before < m.at && dog.months >= m.at) dog.memories.push(`${ageText(m.at)}: ${m.text}`);
  });
  if (dog.counts[key] === 1) dog.memories.push(`${ageText(dog.months)}: 처음으로 ${act.label}를 했어요`);
  say(act.lines[Math.floor(Math.random() * act.lines.length)]);

  if (dog.months >= dog.lifespan) {
    dog.months = dog.lifespan;
    dog.inHeaven = true;
    dog.memories.push(`${ageText(dog.months)}: 무지개다리를 건넜어요`);
    say(`${josa(dog.name, "이가")} 긴 낮잠을 자러 갔어요`);
  }
  saveState(state);
  render();
}

function favoriteOf(dog) {
  const [key] = Object.entries(dog.counts).sort((a, b) => b[1] - a[1])[0];
  return ACTIONS[key].label;
}

// ---- AI 호출 공통 (빈 입력·오류·지연 처리) ----
async function askDog(payload, ui) {
  ui.status.textContent = "생각하는 중…";
  ui.status.className = "status";
  ui.button.disabled = true;
  const slow = setTimeout(() => { ui.status.textContent = "조금 오래 걸리고 있어요. 그대로 기다려 주세요."; }, 8000);
  const ctrl = new AbortController();
  const stop = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await fetch("/api/dog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `서버 오류가 났어요(코드 ${res.status}). 잠시 후 다시 시도해 주세요.`);
    ui.status.textContent = "";
    return data.reply;
  } catch (err) {
    ui.status.className = "status error";
    ui.status.textContent = err.name === "AbortError"
      ? "응답이 25초 넘게 오지 않아 멈췄어요. 잠시 후 다시 시도해 주세요."
      : err.message || "연결이 끊겼어요. 인터넷 연결을 확인해 주세요.";
    return null;
  } finally {
    clearTimeout(slow);
    clearTimeout(stop);
    setTimeout(() => { ui.button.disabled = false; }, 2000); // 연타 방지(호출량 절약)
  }
}

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
  const stage = stageOf(dog);
  const reply = await askDog({
    mode: "talk", name: dog.name, stage: stage.id, age: ageText(dog.months), stats: dog.stats, message: msg,
  }, ui);
  if (!reply) return;
  dog.talks.unshift({ q: msg, a: reply, age: ageText(dog.months) });
  dog.talks = dog.talks.slice(0, 20);
  saveState(state);
  input.value = "";
  $("talk-count").textContent = "0";
  renderTalks();
}

function renderTalks() {
  const dog = state.dog;
  $("talk-log").innerHTML = (dog?.talks || []).slice(0, 5).map((t) => `
    <li><p class="me">${escapeHtml(t.q)}</p><p class="pup">${escapeHtml(t.a)}</p></li>`).join("");
}

function renderHeaven(dog) {
  $("heaven-title").textContent = `${josa(dog.name, "은는")} 무지개다리를 건넜어요`;
  $("heaven-sub").textContent = `${ageText(dog.months)} 동안 함께했어요. 가장 좋아한 건 ${favoriteOf(dog)}였어요.`;
  $("letter-box").hidden = !dog.letter;
  $("letter-text").textContent = dog.letter || "";
  $("letter-btn").hidden = !!dog.letter;
}

async function getLetter() {
  const dog = state.dog;
  const ui = { status: $("letter-status"), button: $("letter-btn") };
  const reply = await askDog({
    mode: "letter", name: dog.name, stage: "heaven", age: ageText(dog.months),
    memories: dog.memories.slice(-12), favorite: favoriteOf(dog),
  }, ui);
  if (!reply) return;
  dog.letter = reply;
  saveState(state);
  render();
}

function adoptAgain() {
  const dog = state.dog;
  state.stars.unshift({
    name: dog.name, fur: dog.fur, months: dog.months, memories: dog.memories,
    letter: dog.letter, favorite: favoriteOf(dog), born: dog.born,
  });
  state.dog = null;
  saveState(state);
  $("adopt-name").value = "";
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", () => {
  $("adopt-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("adopt-name").value.trim();
    const err = $("adopt-status");
    if (!name) {
      err.textContent = "강아지 이름을 지어 주세요.";
      $("adopt-name").focus();
      return;
    }
    err.textContent = "";
    const fur = document.querySelector('input[name="fur"]:checked').value;
    state.dog = newDog(name, fur);
    saveState(state);
    render();
    say(`안녕! 나는 ${josa(name, "이야")}. 잘 부탁해!`);
  });

  $("actions").innerHTML = Object.entries(ACTIONS).map(([k, a]) =>
    `<button type="button" class="act" data-act="${k}"><span aria-hidden="true">${a.emoji}</span>${a.label}</button>`).join("");
  $("actions").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (btn) doAction(btn.dataset.act);
  });

  $("talk-form").addEventListener("submit", talk);
  $("talk-input").addEventListener("input", (e) => { $("talk-count").textContent = e.target.value.length; });
  $("letter-btn").addEventListener("click", getLetter);
  $("again-btn").addEventListener("click", adoptAgain);

  render();
  renderTalks();
  if (state.dog && !state.dog.inHeaven) say(`${josa(state.dog.name, "이가")} 꼬리를 흔들어요`);
});
