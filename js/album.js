// 추억 앨범: 지금 키우는 강아지 + 하늘나라 강아지들
document.addEventListener("DOMContentLoaded", () => {
  const state = loadState();
  const now = document.getElementById("now");
  const stars = document.getElementById("stars");

  if (state.dog) {
    const d = state.dog;
    const stage = stageOf(d);
    now.innerHTML = `
      <article class="album-card">
        <div class="album-dog">${dogSvg(stage.id, d.fur, "happy")}</div>
        <div>
          <h3>${escapeHtml(d.name)}</h3>
          <p class="muted">${d.inHeaven ? "하늘나라" : `${ageText(d.months)} · ${stage.label}`}</p>
          <ol class="timeline">${d.memories.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ol>
          ${d.letter ? `<blockquote class="letter">${escapeHtml(d.letter)}</blockquote>` : ""}
        </div>
      </article>`;
  } else {
    now.innerHTML = `<p class="empty">아직 키우는 강아지가 없어요. <a href="game.html">강아지 입양하러 가기</a></p>`;
  }

  stars.innerHTML = state.stars.length
    ? state.stars.map((d) => `
      <article class="album-card star">
        <div class="album-dog">${dogSvg("heaven", d.fur, "happy")}</div>
        <div>
          <h3>${escapeHtml(d.name)}</h3>
          <p class="muted">${ageText(d.months)}을 함께했어요 · 좋아한 것: ${escapeHtml(d.favorite)}</p>
          ${d.letter ? `<blockquote class="letter">${escapeHtml(d.letter)}</blockquote>` : `<p class="muted">하늘나라 편지를 받지 않았어요.</p>`}
        </div>
      </article>`).join("")
    : `<p class="empty">무지개다리를 건넌 강아지가 생기면 여기에 별처럼 남아요.</p>`;
});
