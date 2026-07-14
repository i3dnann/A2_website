import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { Link } from "react-router-dom";
import { useSite } from "../context/SiteContext";

type GameState = "idle" | "playing" | "paused" | "over";
type Entity = { id: number; kind: "coin" | "barrier"; x: number; passed?: boolean };

const BEST_KEY = "signal-run-best";

export default function MaintenancePage() {
  const { content } = useSite();
  const [state, setState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY) || 0));
  const [lastRun, setLastRun] = useState(0);
  const [runnerY, setRunnerY] = useState(0);
  const [muted, setMuted] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const entitiesRef = useRef<Entity[]>([]);
  const frame = useRef(0);
  const lastSpawn = useRef(0);
  const speed = useRef(0.012);
  const runnerYRef = useRef(0);
  const velocityRef = useRef(0);
  const jumpsUsedRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((kind: "coin" | "fail") => {
    if (muted) return;
    const audio = audioRef.current ?? new AudioContext();
    audioRef.current = audio;
    if (audio.state === "suspended") void audio.resume();
    const now = audio.currentTime;
    const gain = audio.createGain();
    gain.connect(audio.destination);
    gain.gain.setValueAtTime(0.0001, now);
    if (kind === "coin") {
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      [880, 1320].forEach((frequency, index) => {
        const oscillator = audio.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.055);
        oscillator.connect(gain);
        oscillator.start(now + index * 0.055);
        oscillator.stop(now + 0.22);
      });
    } else {
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
      const oscillator = audio.createOscillator();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(170, now);
      oscillator.frequency.exponentialRampToValueAtTime(48, now + 0.45);
      oscillator.connect(gain);
      oscillator.start(now);
      oscillator.stop(now + 0.48);
    }
  }, [muted]);

  const jump = useCallback(() => {
    if (state !== "playing" || jumpsUsedRef.current >= 2) return;
    velocityRef.current = runnerYRef.current > 0 ? .59 : .72;
    jumpsUsedRef.current += 1;
  }, [state]);

  const start = useCallback(() => {
    if (!muted) {
      const audio = audioRef.current ?? new AudioContext();
      audioRef.current = audio;
      if (audio.state === "suspended") void audio.resume();
    }
    const initialEntities: Entity[] = [
      { id: performance.now(), kind: "coin", x: 72 },
      { id: performance.now() + 1, kind: "coin", x: 88 },
      { id: performance.now() + 2, kind: "barrier", x: 118 },
    ];
    setScore(0); setCombo(0); setEntities(initialEntities);
    entitiesRef.current = initialEntities;
    scoreRef.current = 0; comboRef.current = 0;
    runnerYRef.current = 0; velocityRef.current = 0; jumpsUsedRef.current = 0; setRunnerY(0);
    speed.current = 0.012; lastSpawn.current = 0;
    setState("playing");
  }, [muted]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (["Space", "ArrowUp", "KeyW"].includes(event.code)) { event.preventDefault(); jump(); }
      if (event.code === "KeyP" && state !== "idle" && state !== "over") setState(s => s === "paused" ? "playing" : "paused");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, state]);

  useEffect(() => {
    if (state !== "playing") return;
    let previous = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(32, now - previous); previous = now;
      speed.current = Math.min(.042, speed.current + dt * .00000008);
      if (runnerYRef.current > 0 || velocityRef.current > 0) {
        velocityRef.current -= .0018 * dt;
        runnerYRef.current += velocityRef.current * dt;
        if (runnerYRef.current <= 0) {
          runnerYRef.current = 0;
          velocityRef.current = 0;
          jumpsUsedRef.current = 0;
        }
        setRunnerY(runnerYRef.current);
      }
      lastSpawn.current += dt;
      scoreRef.current += dt * .005;
      setScore(Math.floor(scoreRef.current));
      {
        const current = entitiesRef.current;
        let hit = false;
        const moved = current.map(item => ({ ...item, x: item.x - speed.current * dt }));
        const next = moved.map(item => {
          if (!item.passed && item.x < 28 && item.x > 15) {
            if (item.kind === "barrier" && item.x < 24 && item.x > 20 && runnerYRef.current < 22) {
              hit = true;
              return { ...item, passed: true };
            }
            if (item.kind === "coin") {
              playSound("coin");
              scoreRef.current += 100 + Math.min(10, comboRef.current) * 20;
              comboRef.current += 1;
              speed.current = Math.min(.042, speed.current + .00075 + Math.min(10, comboRef.current) * .00004);
              setScore(Math.floor(scoreRef.current));
              setCombo(comboRef.current);
              return { ...item, passed: true, x: -20 };
            }
          }
          if (!item.passed && item.x < 15) {
            if (item.kind === "coin") { comboRef.current = 0; setCombo(0); }
            return { ...item, passed: true };
          }
          return item;
        }).filter(item => item.x > -12);
        if (hit) {
          playSound("fail");
          const finalScore = Math.floor(scoreRef.current);
          setLastRun(finalScore);
          if (finalScore > best) {
            setBest(finalScore);
            localStorage.setItem(BEST_KEY, String(finalScore));
          }
          scoreRef.current = 0;
          comboRef.current = 0;
          setScore(0);
          setCombo(0);
          setState("over");
        }
        if (lastSpawn.current > Math.max(720, 1280 - scoreRef.current * .08)) {
          lastSpawn.current = 0;
          const barrierTooClose = next.some(item => item.kind === "barrier" && !item.passed && item.x > 20);
          const kind: Entity["kind"] = Math.random() <= .34 && !barrierTooClose ? "barrier" : "coin";
          next.push({ id: now + Math.random(), kind, x: 104 });
        }
        entitiesRef.current = next;
        setEntities(next);
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [state, best, playSound]);

  useEffect(() => {
    if (state !== "over" || score <= best) return;
    setBest(score); localStorage.setItem(BEST_KEY, String(score));
  }, [state, score, best]);

  const mission = score >= 2500 ? 3 : combo >= 10 ? 2 : score >= 600 ? 1 : 0;

  return <main className="signal-page min-h-screen overflow-x-hidden text-white">
    <header className="signal-header">
      <div className="signal-brand"><img src="/assets/gotham-logo-96.webp" alt="" /><div><strong>{content.siteName}</strong><span>FIVEM ROLEPLAY</span></div></div>
      <Link to="/login" className="signal-admin"><ShieldCheck size={16} /> Admin login</Link>
    </header>

    <section className="signal-intro">
      <h1>City upgrade in progress</h1>
      <p>We’re improving the city. Keep the signal alive while you wait.</p>
      <div className="signal-title"><i /> <strong>Signal Run</strong> <i /></div>
    </section>

    <section className="signal-game" aria-label="Signal Run mini game">
      <div className="signal-hud">
        <div><span>Score</span><strong>{score.toLocaleString()}</strong></div>
        <div><span>Combo</span><strong className={combo > 4 ? "hot" : ""}>×{combo}</strong></div>
        <div><span>Best</span><strong>{Math.max(best, score).toLocaleString()}</strong></div>
        <button aria-label={muted ? "Turn sound on" : "Mute sound"} onClick={() => setMuted(value => {
          if (value) {
            const audio = audioRef.current ?? new AudioContext();
            audioRef.current = audio;
            if (audio.state === "suspended") void audio.resume();
          }
          return !value;
        })}>{muted ? <VolumeX /> : <Volume2 />}</button>
        <button aria-label={state === "paused" ? "Resume game" : "Pause game"} disabled={state === "idle" || state === "over"} onClick={() => setState(s => s === "paused" ? "playing" : "paused")}>{state === "paused" ? <Play /> : <Pause />}</button>
      </div>
      <div className={`signal-stage ${state === "playing" ? "is-running" : ""}`} onPointerDown={jump}>
        <div className="signal-searchlights"><i /><i /><i /></div><div className="signal-roof-scroll" />
        <div className={`signal-runner ${runnerY > 0 ? "physics-jump" : ""}`} style={{ transform: `translateY(${-runnerY}px)` }}><span className="runner-sprite" aria-hidden="true" /></div>
        {entities.map(item => item.kind === "coin"
          ? <div key={item.id} className="signal-coin" style={{ left: `${item.x}%` }}><i /></div>
          : <div key={item.id} className="signal-barrier" style={{ left: `${item.x}%` }}><i /><i /><i /></div>)}
        {state !== "playing" && <div className="signal-overlay">
          {state === "idle" && <><span className="signal-callout">The city needs a runner</span><h2>How far can you take the signal?</h2><p>He runs automatically. Jump barriers and collect every coin.</p><button onClick={start}><Play size={20} fill="currentColor" /> Play now</button></>}
          {state === "paused" && <><span className="signal-callout">Run paused</span><h2>The signal is waiting.</h2><button onClick={() => setState("playing")}><Play size={20} fill="currentColor" /> Resume</button></>}
          {state === "over" && <><span className="signal-callout">Obstacle hit · score reset</span><h2>{lastRun >= best && lastRun > 0 ? "New personal best." : "The city got you."}</h2><p>Last run: {lastRun.toLocaleString()} · Best: {best.toLocaleString()}</p><button onClick={start}><RotateCcw size={20} /> Run again</button></>}
        </div>}
      </div>
      <div className="signal-controls"><span><kbd>Space</kbd> or <kbd>↑</kbd> · press twice to double jump</span><strong>He runs automatically</strong><span>The city gets faster</span></div>
    </section>

    <section className="signal-missions" aria-label="Mission progress">
      {[{n:1,t:"Warm up the signal",d:"Score 600 points"},{n:2,t:"Build momentum",d:"Reach a ×10 combo"},{n:3,t:"Own the night",d:"Score 2,500 points"}].map(item => <div key={item.n} className={mission >= item.n ? "complete" : ""}><b>{mission >= item.n ? "✓" : item.n}</b><span><strong>{item.t}</strong><small>{item.d}</small></span></div>)}
    </section>
    <p className="signal-status"><i /> Maintenance is underway <span>·</span> Your best score stays on this device</p>
  </main>;
}
