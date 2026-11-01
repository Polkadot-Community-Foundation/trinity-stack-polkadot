// Compares model.json's dotns with the protocol registry it names, read through the stack's eth-rpc, and checks
// that every stated address holds code. Exits non-zero on any difference.
//
// node scripts/check-dotns.mjs [model.json]
import { readFileSync } from "node:fs";

// The registry keys of dotNS's DotnsConstants. The deploy leaves multicall3 out of the registry.
const KEYS = [
  "costModel", "protocolRegistry", "registrar", "controller", "registry", "reverseResolver", "popRules",
  "storeFactory", "resolver", "contentResolver", "popController", "popResolver", "popLens", "nameEscrow",
  "multicall3", "create3Factory", "nameWhitelist",
];
const NOT_IN_REGISTRY = new Set(["multicall3"]);
const GET = "0x8eaa6ac0"; // get(bytes32)

const model = JSON.parse(readFileSync(process.argv[2] ?? "model.json", "utf8"));
const rpc = model.services.find((service) => service.kind === "eth-rpc")?.urls[0];
const dotns = Object.fromEntries(Object.entries(model.dotns ?? {}).map(([key, address]) => [key, address.toLowerCase()]));
if (!rpc) throw new Error("model.json has no eth-rpc service");
if (!dotns.protocolRegistry) throw new Error("model.json has no dotns.protocolRegistry");

async function call(method, params) {
  const response = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const { result, error } = await response.json();
  if (error) throw new Error(`${method}: ${error.message}`);
  return result;
}

const key32 = (key) => Buffer.concat([Buffer.from(key, "ascii"), Buffer.alloc(32 - key.length)]).toString("hex");
const problems = [];
for (const key of KEYS) {
  const word = await call("eth_call", [{ to: dotns.protocolRegistry, data: GET + key32(key) }, "latest"]);
  const onChain = "0x" + word.slice(-40);
  const set = !/^0x0{40}$/.test(onChain);
  if (set && dotns[key] !== onChain) problems.push(`${key}: registry ${onChain}, descriptor ${dotns[key] ?? "missing"}`);
  if (!set && dotns[key] && !NOT_IN_REGISTRY.has(key)) problems.push(`${key}: unset in the registry, descriptor ${dotns[key]}`);
}
for (const [key, address] of Object.entries(dotns)) {
  if (!KEYS.includes(key)) problems.push(`${key}: not a DotnsConstants key`);
  if ((await call("eth_getCode", [address, "latest"])) === "0x") problems.push(`${key}: no code at ${address}`);
}

for (const problem of problems) console.error(problem);
console.log(`${Object.keys(dotns).length} dotns entries checked against ${dotns.protocolRegistry}: ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
