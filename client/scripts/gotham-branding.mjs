import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(clientRoot, "..");

const replacements = [
  ["A2 Studio Roleplay", "Gotham City"],
  ["A2 Studio control center", "Gotham City control center"],
  ["A2 Studio Website Launch", "Gotham City Website Launch"],
  ["A2 Studio Terms", "Gotham City Terms"],
  ["A2 Studio", "Gotham City"],
  ["A2 Discord", "Gotham Discord"],
  ["A2 Creator", "Gotham Creator"],
  ["A2 Owner", "Gotham Owner"],
  ["A2 Developer", "Gotham Developer"],
  ["A2 Support", "Gotham Support"],
  ["a2creator", "gothamcreator"],
  ["Premium FiveM community", "Gotham City FiveM server"],
  ["premium FiveM community", "Gotham City FiveM server"],
  ["A premium FiveM roleplay community website.", "Gotham City FiveM server website."],
  ["FiveM community", "FiveM server"],
  ["QBCore roleplay community", "FiveM roleplay server"],
  ["QBCore roleplay", "FiveM roleplay"],
  ["#b7fe1a", "#8b5cf6"],
  ["b7fe1a", "8b5cf6"],
  ["#ef4444", "#8b5cf6"],
  ["#35ff6b", "#8b5cf6"],
  ["#38bdf8", "#8b5cf6"]
];

const exactFiles = [
  path.join(clientRoot, "index.html"),
  path.join(clientRoot, "src"),
  path.join(repoRoot, "server", "src")
];

function shouldProcess(file) {
  return /\.(js|jsx|ts|tsx|css|html|json)$/i.test(file);
}

function walk(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return shouldProcess(target) ? [target] : [];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", ".git"].includes(entry.name)) return [];
    return walk(path.join(target, entry.name));
  });
}

let changed = 0;
for (const file of exactFiles.flatMap(walk)) {
  const original = fs.readFileSync(file, "utf8");
  let next = original;
  for (const [from, to] of replacements) {
    next = next.replaceAll(from, to);
  }
  if (next !== original) {
    fs.writeFileSync(file, next);
    changed += 1;
  }
}

console.log(`[gotham-branding] cleaned ${changed} file(s)`);
