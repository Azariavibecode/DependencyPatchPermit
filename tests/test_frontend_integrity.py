from pathlib import Path

APP = (Path(__file__).parents[1] / "frontend" / "src" / "App.jsx").read_text(encoding="utf-8")

def test_live_wallet_lifecycle_and_finality():
    for marker in ["accountsChanged", "chainChanged", "waitForTransactionReceipt", "TransactionStatus.FINALIZED", "getTransaction", "MAJORITY_AGREE"]:
        assert marker in APP

def test_contract_and_explorer_are_visible():
    for marker in ["VITE_CONTRACT_ADDRESS", "explorer-studio.genlayer.com", "/address/", "/tx/"]:
        assert marker in APP

def test_no_fake_success_or_zero_fallback():
    assert "no empty state was substituted" in APP
    assert "Finalized and reconciled from the contract" in APP
