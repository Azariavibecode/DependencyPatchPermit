import { createClient } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";
import { TransactionStatus } from "../frontend/node_modules/genlayer-js/dist/types/index.js";
import { privateKeyToAccount } from "../frontend/node_modules/viem/_esm/accounts/index.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.+)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

const contract = "0xFEE5e0ca9DcbD52E75D4c1f7dE25dF94e475385E";
const keys = [process.env.TEST_WALLET_A_PRIVATE_KEY, process.env.TEST_WALLET_B_PRIVATE_KEY];
if (keys.some((key) => !/^(0x)?[0-9a-fA-F]{64}$/.test(key || ""))) throw new Error("Set both test wallet private keys in the ignored .env file");
const wallets = keys.map((key) => privateKeyToAccount(key.startsWith("0x") ? key : `0x${key}`));
if (wallets[0].address.toLowerCase() === wallets[1].address.toLowerCase()) throw new Error("Test wallets must differ");

const reader = createClient({ chain: studionet });
const writer = (wallet) => createClient({ chain: studionet, account: wallet });
const parse = async (name, args = []) => JSON.parse(await reader.readContract({ address: contract, functionName: name, args }));
const transactions = [];
async function write(wallet, functionName, args, label) {
  const hash = await writer(wallet).writeContract({ address: contract, functionName, args });
  const receipt = await reader.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 3000, retries: 80 });
  const status = receipt.status_name || receipt.status;
  const transaction = await reader.getTransaction({ hash });
  const resultName = transaction?.result_name || transaction?.resultName || transaction?.result?.name || "";
  if (status !== TransactionStatus.FINALIZED || (resultName && resultName !== "MAJORITY_AGREE")) throw new Error(`${label} failed: ${status}/${resultName}`);
  transactions.push({ label, hash, actor: wallet.address, status, result_name: resultName || "FINALIZED" });
  console.log(`${label}: ${hash}`);
  return hash;
}

const base = "4b7da55c1f4e209a34c3435ded931f77f61c5cc1";
const head = "1ba86e9f1d23da0044c6beedd1a9444234152f91";
const source = (commit, path, digest) => JSON.stringify({ owner: "Azariavibecode", repo: "DependencyPatchPermit", commit, path, digest });
const sources = {
  BASE_MANIFEST: source(base, "/fixtures/e2e/package.json", "b8b9c9b48dc408d69858e9ae3b0e3b115150bf19ed96b3a8141e4446fb381ddb"),
  HEAD_MANIFEST: source(head, "/fixtures/e2e/package.json", "4d79f9c82e2d49347d96a21d1240b447f5a77f98ff2dccc60494ef19f205e511"),
  HEAD_LOCKFILE: source(head, "/fixtures/e2e/package-lock.json", "0706f059495cf5ea0378190ca1503ad1422a12822dae625539ec3f6b36a1c97d"),
};

const before = await parse("get_counts");
const policyId = BigInt(before.policy_count), candidateId = BigInt(before.candidate_count);
await write(wallets[0], "register_policy", ["Azariavibecode", "DependencyPatchPermit", "npm", "lodash", "/fixtures/e2e/package.json", "/fixtures/e2e/package-lock.json", "dependency-policy"], "happy_register_policy");
await write(wallets[1], "propose_candidate", [policyId, "GHSA-35jh-r3h4-6jhm", base, head, "4.17.20", "4.17.21"], "happy_propose_candidate");
await write(wallets[0], "lock_candidate", [candidateId], "failure_lock_incomplete");
const afterIncompleteLock = await parse("get_candidate", [candidateId]);
if (afterIncompleteLock.state !== "PROPOSED") throw new Error("Incomplete candidate was locked");
const foreignSource = JSON.stringify({ owner: "Azariavibecode", repo: "AnotherRepository", commit: base, path: "/fixtures/e2e/package.json", digest: "b8b9c9b48dc408d69858e9ae3b0e3b115150bf19ed96b3a8141e4446fb381ddb" });
await write(wallets[1], "bind_evidence", [candidateId, "BASE_MANIFEST", foreignSource], "conflict_foreign_repository");
const afterForeignEvidence = await parse("get_evidence", [candidateId, "BASE_MANIFEST"]);
if (!afterForeignEvidence.error) throw new Error("Foreign repository evidence was accepted");
await write(wallets[1], "bind_workflow_run", [candidateId, "not-a-run"], "failure_invalid_workflow_id");
const afterInvalidWorkflow = await parse("get_candidate", [candidateId]);
if (afterInvalidWorkflow.workflow_run_id !== "") throw new Error("Invalid workflow ID was bound");
for (const [slot, locator] of Object.entries(sources)) await write(wallets[1], "bind_evidence", [candidateId, slot, locator], `happy_bind_${slot.toLowerCase()}`);
const evidenceBeforeDuplicate = await parse("get_evidence", [candidateId, "BASE_MANIFEST"]);
await write(wallets[0], "bind_evidence", [candidateId, "BASE_MANIFEST", sources.BASE_MANIFEST], "failure_duplicate_evidence");
const evidenceAfterDuplicate = await parse("get_evidence", [candidateId, "BASE_MANIFEST"]);
if (JSON.stringify(evidenceBeforeDuplicate) !== JSON.stringify(evidenceAfterDuplicate)) throw new Error("Duplicate evidence mutated state");
await write(wallets[1], "bind_workflow_run", [candidateId, "36949687426"], "happy_bind_workflow");
await write(wallets[0], "lock_candidate", [candidateId], "happy_lock_candidate");
const locked = await parse("get_candidate", [candidateId]);
await write(wallets[1], "bind_workflow_run", [candidateId, "36949687426"], "failure_mutate_locked_candidate");
const lockedAfterMutation = await parse("get_candidate", [candidateId]);
if (JSON.stringify(locked) !== JSON.stringify(lockedAfterMutation)) throw new Error("Locked candidate mutated");
await write(wallets[1], "review_candidate", [candidateId], "happy_review_candidate");
const reviewed = await parse("get_candidate", [candidateId]);
if (reviewed.state !== "PERMIT_ISSUED" || reviewed.verdict !== "PATCH_VERIFIED" || reviewed.permit_id < 0) throw new Error(`Positive review failed: ${JSON.stringify(reviewed)}`);
const permitId = BigInt(reviewed.permit_id);
await write(wallets[1], "consume_permit", [permitId, head], "failure_wrong_consumer");
const afterWrongConsumer = await parse("get_permit", [permitId]);
if (afterWrongConsumer.state !== "ISSUED") throw new Error("Wrong consumer changed permit");
await write(wallets[0], "consume_permit", [permitId, base], "failure_wrong_head");
const afterWrongHead = await parse("get_permit", [permitId]);
if (afterWrongHead.state !== "ISSUED") throw new Error("Wrong head changed permit");
await write(wallets[0], "consume_permit", [permitId, head], "happy_consume_permit");
const consumed = await parse("get_permit", [permitId]);
if (consumed.state !== "CONSUMED" || consumed.consumed_by.toLowerCase() !== wallets[0].address.toLowerCase()) throw new Error("Permit consumption did not reconcile");
const countBeforeReplay = await parse("get_counts");
await write(wallets[0], "consume_permit", [permitId, head], "failure_replay_permit");
const after = await parse("get_counts");
if (after.consumed_count !== countBeforeReplay.consumed_count) throw new Error("Replay changed consumed counter");

const result = { generated_at: new Date().toISOString(), network: "StudioNet", chain_id: 61999, contract, wallets: wallets.map((w) => w.address), github: { base, head, workflow_run_id: "36949687426" }, before, after, policy: await parse("get_policy", [policyId]), candidate: reviewed, permit: consumed, transactions };
writeFileSync("verification/studionet-e2e.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
