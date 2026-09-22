"""
Unit and integration tests for AI Blood Supply Command Center FastAPI Bridge (src/api.py).
"""

import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from api import app

client = TestClient(app)


def test_api_health():
    """Verify health endpoint returns status healthy and models loaded."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["backend_ready"] is True
    assert len(data["models_integrated"]) == 4


def test_api_network():
    """Verify network endpoint returns 30 hospitals and 10 blood banks."""
    response = client.get("/api/network?scenario=normal")
    assert response.status_code == 200
    data = response.json()
    assert data["nodes"]["total_hospitals"] == 30
    assert data["nodes"]["total_blood_banks"] == 10
    assert len(data["routes"]) > 0
    assert "metrics" in data
    assert data["metrics"]["active_routes"] > 0


def test_api_inventory():
    """Verify inventory endpoint returns correct product categories and summary."""
    response = client.get("/api/inventory?horizon=72&scenario=normal")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert data["summary"]["total_units"] > 0
    assert "by_blood_group" in data
    assert "O_NEG" in data["by_blood_group"]
    assert "by_component" in data
    assert "RBC" in data["by_component"]
    assert len(data["facilities"]) == 40


def test_api_scenarios_list():
    """Verify all 9 stress scenarios are cataloged."""
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    data = response.json()
    scenarios = data["scenarios"]
    assert len(scenarios) == 9
    scenario_ids = [s["id"] for s in scenarios]
    assert "normal" in scenario_ids
    assert "mass_casualty" in scenario_ids
    assert "cooling_failure" in scenario_ids
    assert "transport_cut" in scenario_ids


def test_api_analytics():
    """Verify analytics endpoint delivers performance benchmarks for all engines."""
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "model_1_demand" in data
    assert "model_2_shortage" in data
    assert "model_3_donors" in data
    assert "engine_4_optimization" in data
    assert data["engine_4_optimization"]["metrics"]["shortage_elimination_rate_pct"] == 100.0


def test_api_hospital_intelligence():
    """Verify hospital intelligence detail drawer payload."""
    response = client.get("/api/hospital/HOSP_007")
    assert response.status_code == 200
    data = response.json()
    assert data["hospital_id"] == "HOSP_007"
    assert len(data["inventory"]) > 0
    assert "nearby_blood_banks" in data
    assert len(data["nearby_blood_banks"]) > 0


def test_api_command_center_and_optimization():
    """Verify unified command center execution and schema."""
    response = client.get("/api/command-center?date=2025-12-01&horizon=24&scenario=normal")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["optimization_status"] == "OPTIMAL"
    assert "shortage_alerts" in data
    assert "transfer_recommendations" in data
    assert "donor_recommendations" in data
    assert "network_metrics" in data
    assert "explanations" in data
    assert "disclaimer" in data
