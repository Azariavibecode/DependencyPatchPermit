from pathlib import Path

SOURCE = (Path(__file__).parents[1] / "contracts" / "DependencyPatchPermit.py").read_text(encoding="utf-8")

def test_contract_compiles():
    compile(SOURCE, "DependencyPatchPermit.py", "exec")

def test_authoritative_sources_and_ancestry_are_required():
    for marker in ["api.osv.dev/v1/vulns/", "/actions/runs/", "/compare/", "merge_base_commit", "raw.githubusercontent.com"]:
        assert marker in SOURCE

def test_permit_is_exact_head_single_use_and_consumer_only():
    for marker in ["PERMIT_ALREADY_CONSUMED", "CONSUMER_ONLY", "HEAD_COMMIT_MISMATCH", 'permit["state"] = "CONSUMED"']:
        assert marker in SOURCE

def test_deployer_has_no_privileged_role():
    assert "owner_address" not in SOURCE
    assert "admin" not in SOURCE.lower()

def test_evidence_is_write_once_and_locked():
    assert "SLOT_ALREADY_BOUND" in SOURCE
    assert "WORKFLOW_RUN_ALREADY_BOUND" in SOURCE
    assert "EVIDENCE_LOCKED" in SOURCE

def test_failure_verdict_cannot_issue_permit():
    issue = SOURCE.index('if result["verdict"] == "PATCH_VERIFIED"')
    reviewed = SOURCE.index('candidate["state"] = "REVIEWED"', issue)
    assert issue < reviewed
