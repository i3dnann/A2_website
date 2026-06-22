import { useEffect, useMemo, useRef, useState } from "react";
import { Construction, LogIn, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import "./MaintenanceScreen.css";

function targetMs(settings = {}) {
  const value = settings.maintenanceEndsAt || settings.maintenance_end_at || "";
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function parts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60
  };
}

function volumeValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 35;
  return Math.min(100, Math.max(5, number));
}

const fonts = {
  Orbitron: "Orbitron, Inter, sans-serif",
  Inter: "Inter, sans-serif",
  Serif: "Georgia, serif",
  Mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  Impact: "Impact, Haettenschweiler, Arial Black, sans-serif"
};

export default function MaintenanceScreen({ settings = {}, onExit }) {
  const [now, setNow] = useState(Date.now());
  const [volume, setVolume] = useState(volumeValue(settings.maintenanceVolume));
  const audioRef = useRef(null);
  const endAt = targetMs(settings);
  const remaining = endAt ? endAt - now : 0;
  const time = useMemo(() => parts(remaining), [remaining]);
  const title = settings.maintenanceTitle || "Website maintenance";
  const subtitle = settings.maintenanceSubtitle || "We are updating the website. Access will open automatically when the timer ends.";
  const fontFamily = fonts[settings.maintenanceFont] || fonts.Orbitron;
  const soundUrl = settings.maintenanceSoundUrl || "";

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!onExit && endAt && remaining <= 0) window.location.reload();
  }, [endAt, remaining, onExit]);

  const startSound = async (nextVolume = volume) => {
    if (!audioRef.current) return;
    audioRef.current.loop = true;
    audioRef.current.volume = volumeValue(nextVolume) / 100;
    await audioRef.current.play().catch(() => null);
  };

  useEffect(() => {
    if (soundUrl) startSound(volume);
  }, [soundUrl]);

  const changeVolume = async (event) => {
    const next = volumeValue(event.target.value);
    setVolume(next);
    await startSound(next);
  };

  return (
    <main className="maintenance-screen" onPointerDown={() => startSound(volume)}>
      {soundUrl && <audio ref={audioRef} src={soundUrl} loop preload="auto" />}
      <div className="maintenance-lightning" />
      <div className="maintenance-lightning second" />
      <Link to="/login" className="maintenance-login" onPointerDown={(event) => event.stopPropagation()}>
        <LogIn size={17} /> Admin Login
      </Link>
      {onExit && <button type="button" className="maintenance-exit" onClick={onExit}>Exit preview</button>}
      <section className="maintenance-card">
        <div className="maintenance-icon"><Construction size={38} /></div>
        <h1 style={{ fontFamily }}>{title}</h1>
        <p>{subtitle}</p>
        <div className="maintenance-countdown" style={{ fontFamily }}>
          <TimeBox label="Days" value={time.days} />
          <TimeBox label="Hours" value={time.hours} />
          <TimeBox label="Minutes" value={time.minutes} />
          <TimeBox label="Seconds" value={time.seconds} />
        </div>
        {soundUrl && (
          <label className="maintenance-volume">
            <span><Volume2 size={17} /> Volume {volume}%</span>
            <input type="range" min="5" max="100" step="1" value={volume} onChange={changeVolume} />
          </label>
        )}
      </section>
    </main>
  );
}

function TimeBox({ label, value }) {
  return <div><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>;
}
