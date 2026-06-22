import { useEffect, useMemo, useRef, useState } from "react";
import { LogIn, MapPin, Volume2 } from "lucide-react";
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

function countdownEnabled(settings = {}) {
  return settings.maintenanceCountdownEnabled !== false;
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
  const showCountdown = countdownEnabled(settings);
  const remaining = endAt ? endAt - now : 0;
  const time = useMemo(() => parts(remaining), [remaining]);
  const title = settings.maintenanceTitle || "The city is being rebuilt in the shadows";
  const subtitle = settings.maintenanceSubtitle || "Gotham City is under maintenance. The signal will return soon.";
  const fontFamily = fonts[settings.maintenanceFont] || fonts.Orbitron;
  const soundUrl = settings.maintenanceSoundUrl || "";
  const brand = settings.websiteName || "Gotham City";

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!onExit && showCountdown && endAt && remaining <= 0) window.location.reload();
  }, [endAt, remaining, onExit, showCountdown]);

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
      <div className="maintenance-orb one" />
      <div className="maintenance-orb two" />
      <section className="maintenance-card">
        <header className="maintenance-topbar">
          <div className="maintenance-brand">
            <span className="maintenance-logo-mark">GC</span>
            <span>{brand}</span>
          </div>
          <div className="maintenance-top-actions">
            <Link to="/login" className="maintenance-login" onPointerDown={(event) => event.stopPropagation()}>
              <LogIn size={16} /> Admin Login
            </Link>
            {onExit && <button type="button" className="maintenance-exit" onClick={onExit}>Exit preview</button>}
          </div>
        </header>

        <div className="maintenance-content">
          <p className="maintenance-kicker">Maintenance Mode</p>
          <h1 style={{ fontFamily }}>{title}</h1>
          <p className="maintenance-subtitle">{subtitle}</p>

          {showCountdown && (
            <div className="maintenance-countdown" style={{ fontFamily }}>
              <TimeBox label="Days" value={time.days} />
              <TimeBox label="Hours" value={time.hours} />
              <TimeBox label="Minutes" value={time.minutes} />
              <TimeBox label="Seconds" value={time.seconds} />
            </div>
          )}

          {!showCountdown && <div className="maintenance-no-countdown">The countdown is hidden by city command.</div>}

          {soundUrl && (
            <label className="maintenance-volume">
              <span><Volume2 size={16} /> Volume {volume}%</span>
              <input type="range" min="5" max="100" step="1" value={volume} onChange={changeVolume} />
            </label>
          )}
        </div>

        <footer className="maintenance-footer">
          <span>The city is being rebuilt in the shadows</span>
          <span className="maintenance-location"><MapPin size={18} /> Gotham Signal</span>
        </footer>
      </section>
    </main>
  );
}

function TimeBox({ label, value }) {
  return <div><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>;
}
