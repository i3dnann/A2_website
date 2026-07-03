import {
  Package, UtensilsCrossed, GlassWater, Radio, KeyRound, Smartphone,
  FileText, CreditCard, Crosshair, Fuel, Wrench, Cigarette, Backpack,
  Pill, Shirt, Gem, Battery, Flashlight, Lock, Sparkles, type LucideIcon,
} from "lucide-react";

type ItemVisual = { icon: LucideIcon; color: string; glow: string };

const RULES: { test: RegExp; icon: LucideIcon; color: string; glow: string }[] = [
  { test: /weapon|pistol|rifle|knife|gun/i, icon: Crosshair, color: "text-red-300", glow: "from-red-500/25 to-red-900/5" },
  { test: /bread|food|burger|apple|sandwich|taco|donut/i, icon: UtensilsCrossed, color: "text-amber-300", glow: "from-amber-500/25 to-amber-900/5" },
  { test: /water|juice|soda|cola|coffee|drink/i, icon: GlassWater, color: "text-cyan-300", glow: "from-cyan-500/25 to-cyan-900/5" },
  { test: /radio/i, icon: Radio, color: "text-emerald-300", glow: "from-emerald-500/25 to-emerald-900/5" },
  { test: /lockpick|key/i, icon: KeyRound, color: "text-yellow-300", glow: "from-yellow-500/25 to-yellow-900/5" },
  { test: /phone/i, icon: Smartphone, color: "text-red-300", glow: "from-red-500/25 to-red-900/5" },
  { test: /license|id_card|identification|passport/i, icon: CreditCard, color: "text-blue-300", glow: "from-blue-500/25 to-blue-900/5" },
  { test: /document|paper|note|contract/i, icon: FileText, color: "text-slate-300", glow: "from-slate-500/25 to-slate-900/5" },
  { test: /bandage|medkit|firstaid|health|pill|painkiller/i, icon: Pill, color: "text-rose-300", glow: "from-rose-500/25 to-rose-900/5" },
  { test: /fuel|gas|petrol|jerry/i, icon: Fuel, color: "text-orange-300", glow: "from-orange-500/25 to-orange-900/5" },
  { test: /repair|wrench|tool|kit/i, icon: Wrench, color: "text-zinc-300", glow: "from-zinc-500/25 to-zinc-900/5" },
  { test: /cigar|cigarette|smoke/i, icon: Cigarette, color: "text-stone-300", glow: "from-stone-500/25 to-stone-900/5" },
  { test: /bag|backpack|pouch/i, icon: Backpack, color: "text-lime-300", glow: "from-lime-500/25 to-lime-900/5" },
  { test: /shirt|clothes|jacket|mask|hat|outfit/i, icon: Shirt, color: "text-pink-300", glow: "from-pink-500/25 to-pink-900/5" },
  { test: /diamond|gold|gem|jewel|ring|necklace/i, icon: Gem, color: "text-orange-300", glow: "from-orange-500/25 to-orange-900/5" },
  { test: /battery|charge/i, icon: Battery, color: "text-green-300", glow: "from-green-500/25 to-green-900/5" },
  { test: /flashlight|torch|light/i, icon: Flashlight, color: "text-yellow-200", glow: "from-yellow-400/25 to-yellow-900/5" },
  { test: /lockbox|safe|vault/i, icon: Lock, color: "text-indigo-300", glow: "from-indigo-500/25 to-indigo-900/5" },
];

export function getItemVisual(name: string): ItemVisual {
  const rule = RULES.find((r) => r.test.test(name));
  if (rule) return rule;
  return { icon: Package, color: "text-white/70", glow: "from-white/10 to-white/0" };
}

export const RareSparkle = Sparkles;
