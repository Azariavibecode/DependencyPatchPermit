# Evidence model and adversarial matrix

| Source | Authority | Binding enforced on-chain |
|---|---|---|
| Base manifest | GitHub commit/tree/raw APIs | registered repo, base SHA, exact path, blob SHA-1, byte size, SHA-256 |
| Head manifest | GitHub commit/tree/raw APIs | registered repo, head SHA, exact path, blob SHA-1, byte size, SHA-256 |
| Head lockfile | GitHub commit/tree/raw APIs | registered repo, head SHA, exact lock path, blob SHA-1, byte size, SHA-256 |
| CI | GitHub Actions API | run ID, registered repo, required workflow name, completed/success, exact head SHA |
| Commit relation | GitHub Compare API | base is merge base; result is ahead; final compared commit is head |
| Advisory | OSV API | registered advisory ID; affected package/range interpreted by validator consensus |

Self-authored claims, mutable branch URLs, screenshots, and locally written CI status files are not authoritative evidence.

## Required failure branches

- malformed owner/repository/advisory/path/hash/digest
- evidence from another repository, commit, or path
- duplicate evidence or workflow run binding
- incomplete evidence or missing workflow run
- truncated tree, missing blob, digest mismatch, oversized/unavailable response
- unrelated base/head history
- CI run for another SHA/repository/workflow, incomplete run, or failed conclusion
- advisory does not apply, fixed version absent, manifest/lock disagreement, insufficient migration/regression evidence
- review before lock or repeated review
- permit consumed by another wallet, wrong head, or replayed permit

The contract returns explicit deterministic status strings for lifecycle failures. Validator/source failures produce a bounded negative verdict and never issue a permit.
