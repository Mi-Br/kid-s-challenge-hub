// Cute UI sounds synthesized with Web Audio API — no assets, tiny footprint.
// Kids get soft clicks on taps, pops on hover, and playful chimes on success.

type SoundName = "click" | "pop" | "success" | "error" | "sparkle" | "whoosh";

const STORAGE_KEY = "soundsMuted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let lastPlay = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.18; // soft overall volume
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
}

export function setMuted(v: boolean) {
  try { localStorage.setItem(STORAGE_KEY, v ? "1" : "0"); } catch {}
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; slideTo?: number; delay?: number } = {}) {
  const c = getCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
  const peak = opts.gain ?? 0.5;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playSound(name: SoundName) {
  if (isMuted()) return;
  const now = performance.now();
  if (now - lastPlay < 40) return; // rate-limit rapid fire
  lastPlay = now;

  switch (name) {
    case "click":
      tone(720, 0.06, { type: "triangle", gain: 0.35, slideTo: 540 });
      break;
    case "pop":
      tone(880, 0.05, { type: "sine", gain: 0.25, slideTo: 1200 });
      break;
    case "success":
      tone(660, 0.12, { type: "triangle", gain: 0.4 });
      tone(880, 0.14, { type: "triangle", gain: 0.4, delay: 0.09 });
      tone(1175, 0.18, { type: "triangle", gain: 0.4, delay: 0.18 });
      break;
    case "error":
      tone(300, 0.14, { type: "sine", gain: 0.4, slideTo: 200 });
      tone(220, 0.18, { type: "sine", gain: 0.35, slideTo: 160, delay: 0.1 });
      break;
    case "sparkle":
      tone(1400, 0.08, { type: "sine", gain: 0.25, slideTo: 2100 });
      tone(1800, 0.09, { type: "sine", gain: 0.22, slideTo: 2600, delay: 0.06 });
      break;
    case "whoosh":
      tone(500, 0.18, { type: "sawtooth", gain: 0.12, slideTo: 120 });
      break;
  }
}

// Attach a delegated click listener so every button/link gets a soft click,
// unless it opts out via `data-sound="off"` or provides its own via `data-sound="pop|success|error|sparkle"`.
export function installGlobalClickSounds() {
  if (typeof window === "undefined") return;
  if ((window as any).__soundsInstalled) return;
  (window as any).__soundsInstalled = true;

  const handler = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const el = target.closest<HTMLElement>(
      'button, a, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], input[type="checkbox"], input[type="radio"], label[for]',
    );
    if (!el) return;
    const opt = el.closest<HTMLElement>('[data-sound]');
    const kind = opt?.dataset.sound;
    if (kind === "off") return;
    playSound((kind as SoundName) || "click");
  };
  window.addEventListener("pointerdown", handler, { capture: true, passive: true });

  // Unlock audio on first user gesture (mobile browsers require it).
  const unlock = () => { getCtx(); };
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true });
}
