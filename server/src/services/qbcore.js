import { query } from "../config/db.js";
import { databaseEnabled } from "../config/env.js";
import { safeJson } from "../utils/sanitize.js";

function normalizePlayer(row) {
  const charinfo = safeJson(row.charinfo);
  const money = safeJson(row.money);
  const job = safeJson(row.job);
  const gang = safeJson(row.gang);
  return {
    citizenid: row.citizenid,
    license: row.license,
    name: `${charinfo.firstname || ""} ${charinfo.lastname || ""}`.trim() || row.name || row.citizenid,
    phone: charinfo.phone || "",
    job: job.label || job.name || "Unemployed",
    jobGrade: job.grade?.name || job.grade?.level || "",
    gang: gang.label || gang.name || "None",
    cash: money.cash || 0,
    bank: money.bank || 0,
    raw: { charinfo, money, job, gang }
  };
}

export async function searchQbPlayers({ q = "", citizenid = "", phone = "", license = "", limit = 25 }) {
  if (!databaseEnabled) {
    return [
      {
        citizenid: "A2DEMO1",
        license: "license:demo",
        name: "Maya Knox",
        phone: "555-0101",
        job: "Police",
        jobGrade: "Cadet",
        gang: "None",
        cash: 1500,
        bank: 25000
      }
    ].filter((player) => JSON.stringify(player).toLowerCase().includes(String(q || citizenid || phone || license || "").toLowerCase()));
  }

  const rows = await query(
    `SELECT citizenid, license, name, charinfo, money, job, gang
     FROM players
     WHERE (:q = '' OR citizenid LIKE :like OR license LIKE :like OR name LIKE :like OR charinfo LIKE :like)
       AND (:citizenid = '' OR citizenid = :citizenid)
       AND (:license = '' OR license = :license)
       AND (:phone = '' OR charinfo LIKE :phoneLike)
     LIMIT :limit`,
    {
      q,
      like: `%${q}%`,
      citizenid,
      license,
      phone,
      phoneLike: `%${phone}%`,
      limit: Math.min(Number(limit) || 25, 100)
    }
  );
  return rows?.map(normalizePlayer) || [];
}

export async function getQbPlayerByCitizenId(citizenid) {
  const [player] = await searchQbPlayers({ citizenid, limit: 1 });
  if (!player) return null;

  if (!databaseEnabled) {
    return {
      ...player,
      vehicles: [
        { plate: "A2DEMO", vehicle: "sultan", garage: "Legion", state: "Stored" }
      ],
      houses: [],
      warnings: [],
      bans: []
    };
  }

  const vehicles = await query("SELECT plate, vehicle, garage, state FROM player_vehicles WHERE citizenid = :citizenid LIMIT 50", { citizenid });
  return {
    ...player,
    vehicles: vehicles || [],
    houses: [],
    warnings: [],
    bans: []
  };
}
