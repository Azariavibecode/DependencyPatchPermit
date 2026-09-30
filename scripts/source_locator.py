"""Create a contract source locator from a checked-out immutable commit."""
import argparse, hashlib, json
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument("--owner", required=True)
p.add_argument("--repo", required=True)
p.add_argument("--commit", required=True)
p.add_argument("--path", required=True)
a = p.parse_args()
path = Path(a.path)
body = path.read_bytes()
print(json.dumps({"owner": a.owner, "repo": a.repo, "commit": a.commit.lower(), "path": "/" + path.as_posix().lstrip("/"), "digest": hashlib.sha256(body).hexdigest()}, separators=(",", ":")))
