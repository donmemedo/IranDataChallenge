import os
import tempfile

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "t.db")

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402

api = TestClient(main.app)


def post(slug, body, **form):
    return api.post(f"/api/challenges/{slug}/submit", data={"team": "Test Team", **form}, files={"file": ("s.csv", body)})


def test_metrics():
    assert main.score("accuracy", [1, 0, 1, 1], [1, 0, 0, 1]) == 0.75
    assert main.score("rmse", [0, 0], [3, 4]) == (12.5) ** 0.5
    assert main.score("macro_f1", [0, 1], [0, 1]) == 1.0


def test_submit_flow():
    assert len(api.get("/api/challenges").json()) == len(main.CHALLENGES)
    sample = api.get("/api/challenges/persian-sentiment/sample.csv").text
    r = post("persian-sentiment", sample).json()
    assert 0 <= r["score"] <= 1 and 1 <= r["rank"] <= r["total"]
    perfect = "id,prediction\n" + "".join(f"{i},{v}\n" for i, v in enumerate(main.truth(main.BY_SLUG["tehran-air"]), 1))
    assert post("tehran-air", perfect).json()["rank"] == 1
    assert post("persian-sentiment", "a,b\n1,2").json()["detail"] == "bad_header"
    assert post("persian-sentiment", "id,prediction\n1,2").json()["detail"] == "missing_ids"
    assert post("bank-churn", sample).json()["detail"] == "nda_required"
    assert api.post("/api/leads", json={"name": "A", "org": "x", "contact": "y", "kind": "public"}).status_code == 422
