// Fails when model.json's validUntil is less than 14 days away, the cue to publish the descriptor again.
//
// node scripts/check-valid-until.mjs [model.json]
import { readFileSync } from "node:fs";

const WARN_DAYS = 14;

const { validUntil } = JSON.parse(readFileSync(process.argv[2] ?? "model.json", "utf8"));
if (validUntil === undefined) {
  console.log("model.json sets no validUntil");
  process.exit(0);
}
const days = (validUntil - Date.now() / 1000) / 86400;
const when = new Date(validUntil * 1000).toISOString();
if (days < WARN_DAYS) {
  console.error(`validUntil ${when} is ${days.toFixed(1)} days away: publish the descriptor again`);
  process.exit(1);
}
console.log(`validUntil ${when}, ${Math.floor(days)} days away`);
