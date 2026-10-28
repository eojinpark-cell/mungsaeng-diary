// 효과음: 파일 없이 Web Audio로 직접 합성한다 (짖는 소리는 나이에 따라 음높이가 다르다)
const Sound = (() => {
  let ctx = null;
  let master = null;
  let enabled = true;
  let volume = 0.6;

  function ensure() {
    if (!enabled) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function noise(dur) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  // 귀여운 강아지 "왕!": 짧게 위로 튀었다가 내려오는 음 + 부드러운 콧소리
  function yip(t, base) {
    const out = ctx.createGain();
    env(out, t, 0.008, 0.85, 0.17);
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = base * 2.2;
    f.Q.value = 0.9;
    f.connect(out).connect(master);
    [[1, "triangle", 0.8], [2, "sine", 0.35], [3, "sine", 0.12]].forEach(([mul, type, amp]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(base * mul * 0.95, t);
      o.frequency.exponentialRampToValueAtTime(base * mul * 1.45, t + 0.035);
      o.frequency.exponentialRampToValueAtTime(base * mul * 0.82, t + 0.15);
      const gg = ctx.createGain();
      gg.gain.value = amp;
      o.connect(gg).connect(f);
      o.start(t);
      o.stop(t + 0.18);
    });
    const n = noise(0.05);
    const nf = ctx.createBiquadFilter();
    nf.type = "highpass";
    nf.frequency.value = 2500;
    const ng = ctx.createGain();
    env(ng, t, 0.003, 0.08, 0.05);
    n.connect(nf).connect(ng).connect(master);
    n.start(t);
  }

  // 낑낑: 높게 떨리는 콧소리
  function whineAt(t, base, dur) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(base, t);
    o.frequency.linearRampToValueAtTime(base * 1.35, t + dur * 0.4);
    o.frequency.linearRampToValueAtTime(base * 0.9, t + dur);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 9;
    const lg = ctx.createGain();
    lg.gain.value = base * 0.04;
    lfo.connect(lg).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.08);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t); lfo.start(t);
    o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  }

  const BARK_BASE = { baby: 820, teen: 640, adult: 520, senior: 430, heaven: 700 };

  return {
    setEnabled(v) { enabled = v; if (ctx && !v) ctx.suspend(); if (ctx && v) ctx.resume(); },
    setVolume(v) { volume = v; if (master) master.gain.value = v; },
    bark(stage, times = 2) {
      if (!ensure()) return;
      const base = BARK_BASE[stage] || 300;
      const t = ctx.currentTime;
      for (let i = 0; i < times; i++) yip(t + i * 0.2, base * (1 + (i % 2 ? 0.06 : 0) + (Math.random() - 0.5) * 0.05));
    },
    whine() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      whineAt(t, 900, 0.7);
      whineAt(t + 0.85, 1000, 0.9);
    },
    munch() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const n = noise(0.05);
        const f = ctx.createBiquadFilter();
        f.type = "highpass";
        f.frequency.value = 1800;
        const g = ctx.createGain();
        env(g, t + i * 0.28, 0.005, 0.35, 0.06);
        n.connect(f).connect(g).connect(master);
        n.start(t + i * 0.28);
      }
    },
    boing() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [0, 0.55, 0.95].forEach((d, i) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(180, t + d);
        o.frequency.exponentialRampToValueAtTime(520 - i * 80, t + d + 0.14);
        const g = ctx.createGain();
        env(g, t + d, 0.01, 0.5, 0.2);
        o.connect(g).connect(master);
        o.start(t + d);
        o.stop(t + d + 0.22);
      });
    },
    splash() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      const n = noise(1.6);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(3000, t);
      f.frequency.linearRampToValueAtTime(900, t + 1.6);
      const g = ctx.createGain();
      env(g, t, 0.05, 0.3, 1.6);
      n.connect(f).connect(g).connect(master);
      n.start(t);
    },
    snore() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [0, 1.1].forEach((d) => {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.setValueAtTime(90, t + d);
        o.frequency.linearRampToValueAtTime(70, t + d + 0.8);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t + d);
        g.gain.linearRampToValueAtTime(0.35, t + d + 0.4);
        g.gain.linearRampToValueAtTime(0.0001, t + d + 0.9);
        o.connect(g).connect(master);
        o.start(t + d);
        o.stop(t + d + 1);
      });
    },
    steps() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 8; i++) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = i % 2 ? 140 : 170;
        const g = ctx.createGain();
        env(g, t + i * 0.3, 0.005, 0.25, 0.08);
        o.connect(g).connect(master);
        o.start(t + i * 0.3);
        o.stop(t + i * 0.3 + 0.1);
      }
    },
    fanfare() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [523, 659, 784, 1047].forEach((fq, i) => {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = fq;
        const g = ctx.createGain();
        env(g, t + i * 0.09, 0.01, 0.35, 0.35 + (i === 3 ? 0.4 : 0));
        o.connect(g).connect(master);
        o.start(t + i * 0.09);
        o.stop(t + i * 0.09 + 0.8);
      });
    },
    jackpot() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 12; i++) {
        const o = ctx.createOscillator();
        o.type = "square";
        o.frequency.value = 880 + (i % 4) * 220;
        const g = ctx.createGain();
        env(g, t + i * 0.06, 0.005, 0.12, 0.1);
        o.connect(g).connect(master);
        o.start(t + i * 0.06);
        o.stop(t + i * 0.06 + 0.12);
      }
    },
    chime() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [660, 880, 1320].forEach((fq, i) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = fq;
        const g = ctx.createGain();
        env(g, t + i * 0.12, 0.01, 0.3, 0.6);
        o.connect(g).connect(master);
        o.start(t + i * 0.12);
        o.stop(t + i * 0.12 + 0.65);
      });
    },
  };
})();
