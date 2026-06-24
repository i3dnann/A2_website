import { useEffect, useState } from "react";
import { Palette, Save, Sparkles, Type } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";
import { animationOptions, fontOptions } from "../data/fonts.js";
import { globalEffectOptions, uiThemeOptions } from "../data/themeOptions.js";

const colorFields = [
  ["primaryColor", "Primary color"],
  ["backgroundColor", "Background color"],
  ["textColor", "Text color"],
  ["secondaryColor", "Panel color"],
  ["cardBackground", "Card color"],
  ["borderColor", "Border color"],
  ["mutedTextColor", "Muted text"],
  ["dangerColor", "Danger color"],
  ["warningColor", "Warning color"],
  ["successColor", "Success color"]
];

const defaults = {
  primaryColor: "#8b5cf6",
  backgroundColor: "#000000",
  textColor: "#ffffff",
  secondaryColor: "#111111",
  cardBackground: "#141414",
  borderColor: "#242424",
  mutedTextColor: "#b8b8b8",
  dangerColor: "#ff3333",
  warningColor: "#ffaa00",
  successColor: "#8b5cf6",
  headerFont: "Gotham Regular",
  textFont: "Inter",
  buttonFont: "Montserrat",
  adobeFontsKitUrl: "",
  uiTheme: "gotham-realistic",
  globalEffect: "rain",
  websiteAnimationType: "cinematic-rise",
  performanceMode: false
};

export default function ThemeSettingsPage() {
  const { setSettings } = useApp();
  const { data, loading } = useApi(() => api.get("/api/admin/settings"), [], { settings: {} });
  const [draft, setDraft] = useState(defaults);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setDraft((current) => ({ ...current, ...(data?.settings || {}) }));
  }, [data]);

  const setField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    setStatus("");
    const payload = {
      ...Object.fromEntries(colorFields.map(([field]) => [field, draft[field] || defaults[field]])),
      headerFont: draft.headerFont || defaults.headerFont,
      textFont: draft.textFont || defaults.textFont,
      buttonFont: draft.buttonFont || defaults.buttonFont,
      adobeFontsKitUrl: draft.adobeFontsKitUrl || "",
      uiTheme: draft.uiTheme || defaults.uiTheme,
      globalEffect: draft.globalEffect || defaults.globalEffect,
      websiteAnimationType: draft.websiteAnimationType || defaults.websiteAnimationType,
      performanceMode: Boolean(draft.performanceMode)
    };
    const response = await api.patch("/api/admin/theme", payload);
    setSettings((current) => ({ ...current, ...(response.settings || payload) }));
    setStatus("Theme, fonts, UI style, and effects saved.");
  };

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Theme control</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">UI style, effects, fonts and colors</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/55">Choose one of three Gotham UI styles, apply global weather/effect layers, and control website-wide fonts.</p>
      </header>

      <Card>
        {loading ? <div className="h-96 rounded skeleton" /> : (
          <form className="grid gap-6" onSubmit={save}>
            <section className="grid gap-4 rounded-xl border border-a2-border bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-a2-green"><Sparkles size={16} /> Website UI style</div>
              <div className="grid gap-4 md:grid-cols-3">
                <Select label="UI design" value={draft.uiTheme || defaults.uiTheme} options={uiThemeOptions} onChange={(value) => setField("uiTheme", value)} />
                <Select label="Whole website effect" value={draft.globalEffect || defaults.globalEffect} options={globalEffectOptions} onChange={(value) => setField("globalEffect", value)} />
                <Select label="Page animation" value={draft.websiteAnimationType || defaults.websiteAnimationType} options={animationOptions} onChange={(value) => setField("websiteAnimationType", value)} />
              </div>
              <p className="rounded-lg border border-a2-border bg-black/30 p-3 text-xs leading-6 text-white/50">Effects apply to the whole website. Use Performance mode if the browser gets heavy.</p>
              <label className="flex items-center gap-3 rounded-lg border border-a2-border bg-black/30 p-3 text-sm font-bold">
                <input type="checkbox" checked={Boolean(draft.performanceMode)} onChange={(event) => setField("performanceMode", event.target.checked)} />
                Performance mode
              </label>
            </section>

            <section className="grid gap-4 rounded-xl border border-a2-border bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-a2-green"><Type size={16} /> Website fonts</div>
              <div className="grid gap-4 md:grid-cols-3">
                <FontSelect label="Header font" value={draft.headerFont || defaults.headerFont} onChange={(value) => setField("headerFont", value)} />
                <FontSelect label="Text font" value={draft.textFont || defaults.textFont} onChange={(value) => setField("textFont", value)} />
                <FontSelect label="Buttons font" value={draft.buttonFont || defaults.buttonFont} onChange={(value) => setField("buttonFont", value)} />
              </div>
              <label className="grid gap-2 text-sm font-bold">
                Adobe Fonts kit CSS URL
                <input className="form-input" value={draft.adobeFontsKitUrl || ""} onChange={(event) => setField("adobeFontsKitUrl", event.target.value)} placeholder="https://use.typekit.net/xxxxxxx.css" />
                <span className="text-xs text-white/45">Adobe Fonts cannot be loaded as a full public list. Paste your Adobe kit URL here.</span>
              </label>
              <p className="rounded-lg border border-a2-border bg-black/30 p-3 text-xs leading-6 text-white/50">Gotham Regular is included as a font option. To use the real Gotham file, place your licensed font at <code>/fonts/gotham-regular.woff2</code> or <code>/fonts/gotham-regular.otf</code>.</p>
            </section>

            <section className="grid gap-4 rounded-xl border border-a2-border bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-a2-green"><Palette size={16} /> Website colors</div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {colorFields.map(([field, label]) => (
                  <label key={field} className="grid gap-2 text-sm font-bold">
                    {label}
                    <input className="form-input h-12" type="color" value={draft[field] || defaults[field]} onChange={(event) => setField(field, event.target.value)} />
                  </label>
                ))}
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit"><Save size={15} /> Save theme</Button>
              {status && <span className="text-sm text-a2-success">{status}</span>}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

function FontSelect({ label, value, onChange }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <select className="form-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {fontOptions.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
      </select>
    </label>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <select className="form-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
