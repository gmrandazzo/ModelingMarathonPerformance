from fastapi.testclient import TestClient
from marathon_model.main import app

client = TestClient(app)


def test_calculate_endpoint():
    payload = {"vo2_max": 70, "lactate_mmol": 2.5, "economy_factor": 0.5}
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "marathon_speed_kmh" in data
    assert "marathon_time" in data
    assert "plot_data" in data
    assert len(data["plot_data"]) > 0
    assert data["vo2_lt"] == 56.0  # 70 * 80%


def test_invalid_payload():
    response = client.post("/api/calculate", json={"bad": "data"})
    assert response.status_code == 422
