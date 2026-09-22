"""
FastAPI Endpoints Audit Script.
Tests all 12 endpoints against the running FastAPI server at http://127.0.0.1:8000.
"""

import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000"

endpoints = [
    ("GET", "/api/health", None),
    ("GET", "/api/command-center?scenario=normal&horizon=72", None),
    ("GET", "/api/shortages?horizon=72&risk_level=all", None),
    ("GET", "/api/inventory", None),
    ("GET", "/api/network", None),
    ("GET", "/api/donors?hospital_id=HOSP_007&blood_group=O_NEG&urgency=emergency", None),
    ("GET", "/api/optimization?scenario=normal", None),
    ("GET", "/api/hospital/HOSP_007", None),
    ("GET", "/api/scenarios", None),
    ("GET", "/api/scenarios/mass_casualty", None),
    ("GET", "/api/analytics", None),
    ("POST", "/api/optimize", {"scenario": "normal", "horizon": 72, "date": "2025-12-01"}),
]

print("--- FASTAPI ENDPOINTS AUDIT ---")
passed = 0
failed = 0

for method, path, payload in endpoints:
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    if payload:
        data = json.dumps(payload).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    else:
        data = None

    t0 = time.time()
    try:
        with urllib.request.urlopen(req, data=data, timeout=30) as resp:
            elapsed = time.time() - t0
            status_code = resp.getcode()
            body = resp.read().decode("utf-8")
            res_json = json.loads(body)
            passed += 1
            print(f"  [PASS] {method:4s} {path:55s} -> Status {status_code} ({elapsed*1000:.1f}ms) | Keys: {list(res_json.keys())[:4]}")
    except Exception as e:
        failed += 1
        print(f"  [FAIL] {method:4s} {path:55s} -> Error: {e}")

print(f"\nFastAPI Results: {passed} passed, {failed} failed out of {len(endpoints)} tested.")
assert failed == 0, f"{failed} endpoints failed!"
