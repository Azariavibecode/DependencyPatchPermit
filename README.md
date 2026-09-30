# DependencyPatchPermit

DependencyPatchPermit is a GenLayer intelligent contract that issues a single-use release capability only when an exact dependency upgrade is supported by immutable repository bytes, a canonical OSV advisory, a successful GitHub Actions run bound to the candidate head, and a valid GitHub base-to-head comparison.

The architecture is a capability pipeline, not a court or ballot: `ACTIVE POLICY → PROPOSED CANDIDATE → EVIDENCE LOCKED → COMPARATIVE REVIEW → PERMIT ISSUED → PERMIT CONSUMED`.

## Trust and roles

- The deployer receives no admin role.
- Any wallet can register its own consumer policy, propose a candidate, bind evidence, lock it, and request review.
- Only the policy consumer can consume its issued permit, and only for the exact reviewed head SHA.
- Evidence slots and workflow run IDs are write-once. Review uses GitHub commit/tree/raw APIs, GitHub Compare, GitHub Actions, and OSV.
- Fixtures are synthetic demonstrations; canonical review always fetches the registered public sources.

## Local verification

```bash
python -m pytest -q
cd frontend
npm install
npm run build
```

Configure `frontend/.env` with `VITE_CONTRACT_ADDRESS`. The UI also permits a reviewer to paste any deployed address and stores it locally. Network is StudioNet, chain ID `61999` (`0xf22f`).

## Reviewer flow

1. Connect any StudioNet wallet and register a policy for a public GitHub repository.
2. Propose a candidate with an OSV ID and distinct 40-byte base/head SHAs.
3. Bind `BASE_MANIFEST`, `HEAD_MANIFEST`, and `HEAD_LOCKFILE` using immutable source locators and SHA-256 digests.
4. Bind the numeric GitHub Actions run ID whose workflow name matches the policy.
5. Lock and review. Only `PATCH_VERIFIED` can create a permit.
6. The policy consumer consumes the permit with the exact head SHA. Wrong wallet, wrong head, and replay all fail.

See [docs/evidence-model.md](docs/evidence-model.md) for source semantics and adversarial cases.
