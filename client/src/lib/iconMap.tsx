import {
  ShieldHalf, Car, Landmark, Radio, Users, Gavel, Siren, Sparkles,
  Newspaper, Trophy, Map, Briefcase, type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  ShieldHalf, Car, Landmark, Radio, Users, Gavel, Siren, Sparkles,
  Newspaper, Trophy, Map, Briefcase,
};

export function getIcon(name: string): LucideIcon {
  return map[name] ?? ShieldHalf;
}
