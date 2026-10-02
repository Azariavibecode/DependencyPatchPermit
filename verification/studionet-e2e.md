# StudioNet end-to-end verification

- Date: 2026-10-02
- Network: StudioNet, chain ID `61999`
- Contract: [`0xFEE5e0ca9DcbD52E75D4c1f7dE25dF94e475385E`](https://explorer-studio.genlayer.com/address/0xFEE5e0ca9DcbD52E75D4c1f7dE25dF94e475385E)
- Test wallet A / policy consumer: `0x67A1A08Fc4cf7D05c859d0d3D8398a3A30B1677e`
- Test wallet B / proposer and evidence binder: `0x7C87B10a3d43F3b3551414401F8b26B9F662bAB5`
- Canonical base commit: [`4b7da55`](https://github.com/Azariavibecode/DependencyPatchPermit/commit/4b7da55c1f4e209a34c3435ded931f77f61c5cc1)
- Canonical head commit: [`1ba86e9`](https://github.com/Azariavibecode/DependencyPatchPermit/commit/1ba86e9f1d23da0044c6beedd1a9444234152f91)
- Canonical CI: [GitHub Actions run `36949687426`](https://github.com/Azariavibecode/DependencyPatchPermit/actions/runs/36949687426), completed successfully for the exact head SHA.

## Outcome

The live comparative review returned `PATCH_VERIFIED`, `HIGH` confidence and `FIXED_VERSION_CONFIRMED`. Permit `0` was issued for the exact head commit and consumed once by the policy consumer. Final counts are one policy, one candidate, one permit and one consumed permit.

## Transaction evidence

| Branch | Expected result | Transaction |
|---|---|---|
| Register policy | Policy `0` created by wallet A | [`0xc978…bbbd`](https://explorer-studio.genlayer.com/tx/0xc9780059234e9bd734d1db09b4822095f05cdb1543718c4679fcc07d5acabbbd) |
| Propose candidate | Candidate `0` created by wallet B | [`0x19d9…3f89`](https://explorer-studio.genlayer.com/tx/0x19d96c0695d4c401cdf899de7dd68811cfa31bb52ab17f212161d5a26a103f89) |
| Incomplete lock | Remains `PROPOSED` | [`0x4479…cc5f`](https://explorer-studio.genlayer.com/tx/0x447962617d0e87c6f3a2ebf55b7e42d225ed24a7b55576ae4200df41e1e5cc5f) |
| Foreign-repository conflict | Evidence rejected; slot remains empty | [`0x45eb…488a`](https://explorer-studio.genlayer.com/tx/0x45eb2a9f27936d29416b3b14114034c7b97c122a401f3a8807e95a18b515488a) |
| Invalid workflow ID | Candidate unchanged | [`0x84d7…f95a`](https://explorer-studio.genlayer.com/tx/0x84d7c013490c9528f180541d6e243cee942cab0c19b429e4444a95de6740f95a) |
| Bind base manifest | Immutable evidence accepted | [`0x6eb4…2b01`](https://explorer-studio.genlayer.com/tx/0x6eb45945636870fb2c4e71aa4e25717d8bf255d22d18bc541c94b25c42f82b01) |
| Bind head manifest | Immutable evidence accepted | [`0xaa8f…1bb2`](https://explorer-studio.genlayer.com/tx/0xaa8fa9234c5f0302befb7d30807ffe5c4a39005881f3e39602761b58ac111bb2) |
| Bind head lockfile | Immutable evidence accepted | [`0xf6da…35b3`](https://explorer-studio.genlayer.com/tx/0xf6da3bd5faa0c3963ef634b275b173e0425359f46072bed3f19e5669b9c635b3) |
| Duplicate evidence | Original evidence retained | [`0xd6af…4a09`](https://explorer-studio.genlayer.com/tx/0xd6aff82e10dec5864ef27be74f8625f43d458ad6646f329535bc8e5b5bf14a09) |
| Bind canonical workflow | Run `36949687426` bound | [`0x319c…5a85`](https://explorer-studio.genlayer.com/tx/0x319caa5d2fdc7d9c31201a036157f6b15b4a8470a6f72186396d8a2ec9885a85) |
| Lock candidate | State becomes `EVIDENCE_LOCKED` | [`0xd71a…a8ed`](https://explorer-studio.genlayer.com/tx/0xd71af771365dccbb65f9b805b0482abcba0040908cd4a4983dd06d2e30b3a8ed) |
| Mutation after lock | Candidate unchanged | [`0x939b…4984`](https://explorer-studio.genlayer.com/tx/0x939b6fa1e9c63a20d13ae4e381a11fd4a3c18f33ed5bbdf86748e78974eb4984) |
| Comparative review | `PATCH_VERIFIED`, permit issued | [`0x7b84…fd97`](https://explorer-studio.genlayer.com/tx/0x7b849c0aa37da9e7b72674cf44d1cb5e19e3463adb8c73520218ceab8f8ffd97) |
| Wrong consumer | Permit remains `ISSUED` | [`0x2b4a…5c64`](https://explorer-studio.genlayer.com/tx/0x2b4adcfdff6994df9c0049a5fcdf9a083432448687728f3115f23f2cc9b55c64) |
| Wrong head | Permit remains `ISSUED` | [`0x8106…f830`](https://explorer-studio.genlayer.com/tx/0x81067707dc24e7ec6a943d38566d0c2abac43fe86fe77bad4afcb421fd18f830) |
| Correct consume | Permit becomes `CONSUMED` | [`0x8b56…c3ec`](https://explorer-studio.genlayer.com/tx/0x8b564989669bc25c3e9094bc91787c09f93fe5eabe957a82671916ccd590c3ec) |
| Replay consume | Count and permit unchanged | [`0x9721…9e5c`](https://explorer-studio.genlayer.com/tx/0x9721ff78ca4855ae6c8b8c6e7c658cccb93adc4f3c201e875e72fb0637739e5c) |

Every transaction above finalized with `MAJORITY_AGREE`. For negative branches that means validators agreed on the contract's explicit rejection result; the runner then performed canonical readback and asserted that protected state did not change. Machine-readable state and transaction details are in [`studionet-e2e.json`](studionet-e2e.json).

## UI reconciliation

The production frontend reads `get_counts`, `get_candidate`, and `get_permit` from this deployment. It retains no fabricated zero state on RPC failure. The ledger now renders both candidate state and the permit state, so the live screen shows `PATCH_VERIFIED`, candidate `PERMIT_ISSUED`, and permit `CONSUMED` simultaneously.
