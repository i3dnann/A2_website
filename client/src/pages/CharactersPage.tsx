import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Wallet, Briefcase, Heart, ShieldAlert, Phone, Calendar, Users2, Car, Link2, ShieldHalf, Package } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, MOCK } from "../api/client";
import { useToast, Skeleton } from "./../components/Toast";
import PageShell from "../components/PageShell";
import { VitalBar, VitalRing } from "../components/VitalBar";
import InventoryGrid from "../components/InventoryGrid";

type Character = {
  citizenid: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  gender: "Male" | "Female";
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

export default function CharactersPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Character | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      if (MOCK || !user?.steamLinked) {
        setChars(user?.steamLinked ? DEMO_CHARS : []);
        setLoading(false);
        return;
      }
      try {
        const r = await api<{ data: Character[]; error?: string }>("/api/characters");
        if (cancel) return;
        if (r.error) push({ kind: "info", message: r.error });
        setChars(r.data || []);
      } catch (e: any) {
        push({ kind: "error", message: e?.message || "Failed" });
      } finally { if (!cancel) setLoading(false); }
    };
    load();
    return () => { cancel = true; };
  }, [user?.steamLinked]);

  useEffect(() => {
    if (!selected) return;
    if (MOCK) { setInventory(DEMO_INV); setVehicles(DEMO_VEH); return; }
    api<{ character: Character; inventory: any[]; vehicles: any[] }>(`/api/characters/${selected.citizenid}`)
      .then((r) => { setInventory(r.inventory || []); setVehicles(r.vehicles || []); })
      .catch((e: any) => push({ kind: "error", message: e?.message || "Failed" }));
  }, [selected?.citizenid]);

  if (!user) {
    return (
      <PageShell subtitle="Restricted" title="Characters">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <ShieldAlert size={32} className="mx-auto text-orange-300" />
          <h3 className="mt-4 font-serif text-lg text-white">Login Required</h3>
          <p className="mt-2 text-sm text-white/55">Please log in to view your FiveM characters.</p>
          <Link to="/login" className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>
        </div>
      </PageShell>
    );
  }

  if (!user.steamLinked) {
    return (
      <PageShell subtitle="Link Steam" title="Characters">
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
          <Link2 size={32} className="mx-auto text-orange-300" />
          <h3 className="mt-4 font-serif text-lg text-white">Connect Your Steam Account</h3>
          <p className="mt-2 text-sm text-white/55">We match your Steam identity to your FiveM characters. Link Steam to see your characters, inventory, vehicles, and more.</p>
          <Link to="/dashboard" className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 px-5 py-2.5 text-sm font-semibold text-white">Go to Dashboard</Link>
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
                <Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" />
              </div>
            </div>
          ))}
        </div>
      ) : chars.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-12 text-center">
          <Users2 size={32} className="mx-auto text-white/20" />
          <h3 className="mt-4 font-serif text-lg text-white">No Characters Found</h3>
          <p className="mt-2 text-sm text-white/50">Your Steam account doesn't appear to own any characters on this server yet. Join the server and create one!</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {chars.map((c) => (
              <motion.button
                key={c.citizenid}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
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
                  <span className="flex items-center gap-1.5"><Briefcase size={12} className="text-orange-300" /> {c.job} · Grade {c.jobGrade}</span>
                  {c.gang && <span className="flex items-center gap-1.5"><Users2 size={12} className="text-orange-300" /> {c.gang}</span>}
                  {c.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {c.phone}</span>}
                  {c.birthdate && <span className="flex items-center gap-1.5"><Calendar size={12} /> {c.birthdate}</span>}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MoneyCell icon={Wallet} label="Cash" value={c.cash} color="text-emerald-300" />
                  <MoneyCell icon={Wallet} label="Bank" value={c.bank} color="text-orange-300" />
                </div>
              </motion.button>
            ))}
          </div>

          {/* Selected character detail */}
          {selected && (
            <motion.div
              key={selected.citizenid}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl text-white">{selected.name}</h3>
                  <p className="mt-0.5 text-xs text-white/40">Character details · Citizen ID: {selected.citizenid}</p>
                </div>
              </div>

              {/* Health & Armor vitals */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <VitalBar icon={Heart} label="Health" value={selected.health} tone="red" />
                <VitalBar icon={ShieldHalf} label="Armor" value={selected.armor} tone="blue" />
              </div>

              {vehicles.length > 0 && (
                <div className="mt-6">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-white"><Car size={14} /> Vehicles ({vehicles.length})</h4>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {vehicles.map((v, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -2 }}
                        className="rounded-lg border border-white/10 bg-black/20 p-3 transition-colors hover:border-orange-400/30"
                      >
                        <p className="font-serif text-sm text-white">{v.model || v.vehicle || "Unknown"}</p>
                        <p className="text-[11px] text-white/40">Plate: {v.plate || "—"}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Package size={14} /> Inventory ({inventory.length})
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

// Demo data for offline mode
const DEMO_CHARS: Character[] = [
  { citizenid: "ABD12345", name: "Marcus Halloway", firstName: "Marcus", lastName: "Halloway", gender: "Male", birthdate: "1992-04-12", phone: "555-0142", job: "Police Officer", jobGrade: 3, jobName: "police", gang: null, cash: 2450, bank: 48200, health: 100, armor: 60 },
  { citizenid: "XYZ98765", name: "Isabella Cruz", firstName: "Isabella", lastName: "Cruz", gender: "Female", birthdate: "1998-09-22", phone: "555-0199", job: "Civilian", jobGrade: 0, jobName: "unemployed", gang: "Lost MC", cash: 890, bank: 12750, health: 65, armor: 20 },
];
const DEMO_INV = [
  { name: "Radio", amount: 1 },
  { name: "Lockpick", amount: 3, info: { durability: "72%" } },
  { name: "Phone", amount: 1, info: { battery: "88%", locked: false } },
  { name: "Bandage", amount: 5 },
  { name: "Driver License", amount: 1, info: { class: "B", expires: "2029-01-01" } },
  { name: "Water Bottle", amount: 2 },
  { name: "Burger", amount: 1 },
  { name: "Weapon Pistol", amount: 1, info: { ammo: 12, serial: "GX291KD" } },
  { name: "Diamond Ring", amount: 1 },
  { name: "Fuel Can", amount: 1 },
  { name: "Repair Kit", amount: 2 },
  { name: "Backpack", amount: 1 },
];
const DEMO_VEH = [
  { model: "Sultan RS", plate: "GTH4M5" },
  { model: "Kuruma", plate: "NK77XZ" },
];
