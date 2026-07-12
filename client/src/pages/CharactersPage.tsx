import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Wallet, Briefcase, Heart, ShieldAlert, Phone, Calendar, Users2, Car, Link2, ShieldHalf, Package } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { api } from "../api/client";
import { useToast, Skeleton } from "../components/Toast";
import PageShell from "../components/PageShell";
import { VitalBar, VitalRing } from "../components/VitalBar";
import InventoryGrid from "../components/InventoryGrid";

type Character = {
  citizenid: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  gender: string;
  birthdate: string | null;
  phone: string | null;
  job: string;
  jobGrade: number;
  jobName: string | null;
  gang: string | null;
  cash: number;
  bank: number;
  health: number;
  armor: number;
};

function mapCharacter(character: any): Character {
  return {
    citizenid: character.citizenid,
    name: character.fullName || character.name || character.citizenid || "Unknown Character",
    firstName: character.firstName || null,
    lastName: character.lastName || null,
    gender: character.gender || "Unknown",
    birthdate: character.birthdate || null,
    phone: character.phone || null,
    job: character.jobName || "Unknown",
    jobGrade: Number(character.raw?.job?.grade?.level || character.jobGrade || 0),
    jobName: character.raw?.job?.name || character.jobName || null,
    gang: character.gang === "None" ? null : character.gang || null,
    cash: Number(character.cash || 0),
    bank: Number(character.bank || 0),
    health: Number(character.health ?? character.raw?.metadata?.health ?? character.raw?.metadata?.hp ?? 100),
    armor: Number(character.armor ?? character.raw?.metadata?.armor ?? character.raw?.metadata?.armour ?? 0),
  };
}

function mapInventory(item: any) {
  return {
    name: item.label || item.name || "Unknown item",
    amount: Number(item.amount ?? item.count ?? 1),
    info: item.info || item.metadata || {},
  };
}

export default function CharactersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { push } = useToast();
  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Character | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      if (!user?.steamLinked) {
        setChars([]);
        setLoading(false);
        return;
      }
      try {
        const r = await api<{ characters: any[]; message?: string }>("/api/player/characters");
        if (cancel) return;
        if (r.message) push({ kind: "info", message: r.message });
        setChars((r.characters || []).map(mapCharacter));
      } catch (e: any) {
        push({ kind: "error", message: e?.message || "Failed" });
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => {
      cancel = true;
    };
  }, [push, user?.steamLinked]);

  useEffect(() => {
    if (!selected) return;
    let cancel = false;
    const loadDetails = async () => {
      setInventory([]);
      setVehicles([]);
      try {
        const r = await api<{ character: any; inventory: any[]; vehicles: any[] }>(`/api/player/characters/${selected.citizenid}`);
        if (cancel) return;
        setInventory((r.inventory || []).map(mapInventory));
        setVehicles(r.vehicles || []);
        if (r.character) {
          const fresh = mapCharacter(r.character);
          setChars((current) => current.map((character) => (character.citizenid === fresh.citizenid ? fresh : character)));
          setSelected(fresh);
        }
      } catch (e: any) {
        if (!cancel) push({ kind: "error", message: e?.message || "Failed to load character details" });
      }
    };
    loadDetails();
    return () => {
      cancel = true;
    };
  }, [push, selected?.citizenid]);

  if (!user) {
    return (
      <PageShell subtitle="Restricted" title="Characters">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <ShieldAlert size={32} className="mx-auto text-orange-300" />
          <h3 className="mt-4 font-serif text-lg text-white">{t("Login Required")}</h3>
          <p className="mt-2 text-sm text-white/55">{t("Please log in to view your FiveM characters.")}</p>
          <Link to="/login" className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-5 py-2.5 text-sm font-semibold text-white">{t("Sign in")}</Link>
        </div>
      </PageShell>
    );
  }

  if (!user.steamLinked) {
    return (
      <PageShell subtitle="Link Steam" title="Characters">
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
          <Link2 size={32} className="mx-auto text-orange-300" />
          <h3 className="mt-4 font-serif text-lg text-white">{t("Connect Your Steam Account")}</h3>
          <p className="mt-2 text-sm text-white/55">{t("We match your Steam identity to your FiveM characters. Link Steam to see your characters, inventory, vehicles, and more.")}</p>
          <Link to="/dashboard" className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-5 py-2.5 text-sm font-semibold text-white">{t("Go to Dashboard")}</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell subtitle="My Server Data" title="My Characters">
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="mt-3 h-4 w-1/3" />
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </div>
          ))}
        </div>
      ) : chars.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-12 text-center">
          <Users2 size={32} className="mx-auto text-white/20" />
          <h3 className="mt-4 font-serif text-lg text-white">{t("No Characters Found")}</h3>
          <p className="mt-2 text-sm text-white/50">{t("Your Steam account doesn't appear to own any characters on this server yet. Join the server and create one!")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {chars.map((c) => (
              <motion.button
                key={c.citizenid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelected(c)}
                className={`group rounded-2xl border p-6 text-left transition-colors ${
                  selected?.citizenid === c.citizenid ? "border-orange-400/50 bg-orange-500/[0.06]" : "border-white/10 bg-white/[0.03] hover:border-orange-400/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <VitalRing icon={Heart} value={c.health} tone="red" />
                    <div>
                      <h3 className="font-serif text-xl text-white">{c.name}</h3>
                      <p className="mt-0.5 text-xs font-mono text-white/40">CID: {c.citizenid}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-200">{c.gender}</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60">
                  <span className="flex items-center gap-1.5"><Briefcase size={12} className="text-orange-300" /> {t(c.job)} · {t("Grade")} {c.jobGrade}</span>
                  {c.gang && <span className="flex items-center gap-1.5"><Users2 size={12} className="text-orange-300" /> {c.gang}</span>}
                  {c.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {c.phone}</span>}
                  {c.birthdate && <span className="flex items-center gap-1.5"><Calendar size={12} /> {c.birthdate}</span>}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MoneyCell icon={Wallet} label={t("Cash")} value={c.cash} color="text-emerald-300" />
                  <MoneyCell icon={Wallet} label={t("Bank")} value={c.bank} color="text-orange-300" />
                </div>
              </motion.button>
            ))}
          </div>

          {selected && (
            <motion.div
              key={selected.citizenid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl text-white">{selected.name}</h3>
                  <p className="mt-0.5 text-xs text-white/40">{t("Character details")} · {t("Citizen ID")}: {selected.citizenid}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <VitalBar icon={Heart} label={t("Health")} value={selected.health} tone="red" />
                <VitalBar icon={ShieldHalf} label={t("Armor")} value={selected.armor} tone="blue" />
              </div>

              {vehicles.length > 0 && (
                <div className="mt-6">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-white"><Car size={14} /> {t("Vehicles")} ({vehicles.length})</h4>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {vehicles.map((v, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -2 }}
                        className="rounded-lg border border-white/10 bg-black/20 p-3 transition-colors hover:border-orange-400/30"
                      >
                        <p className="font-serif text-sm text-white">{v.model || v.vehicle || t("Unknown")}</p>
                        <p className="text-[11px] text-white/40">{t("Plate")}: {v.plate || "-"}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Package size={14} /> {t("Inventory")} ({inventory.length})
                </h4>
                <div className="mt-3">
                  <InventoryGrid items={inventory} />
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </PageShell>
  );
}

function MoneyCell({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <Icon size={14} className={`mx-auto ${color}`} />
      <p className="mt-1 text-sm font-semibold text-white">${value.toLocaleString()}</p>
      <p className="text-[10px] uppercase text-white/40">{label}</p>
    </div>
  );
}
