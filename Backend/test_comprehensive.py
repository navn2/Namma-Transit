"""Comprehensive API test for Namma Transit."""
import requests, json, sys

BASE = "http://localhost:8000"
passed = 0
failed = 0

def test(name, method, path, expected_status=200, body=None, headers=None):
    global passed, failed
    url = f"{BASE}{path}"
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            r = requests.post(url, json=body, headers=headers, timeout=10)
        elif method == "DELETE":
            r = requests.delete(url, json=body, headers=headers, timeout=10)
        else:
            r = requests.get(url, timeout=10)
        status_ok = r.status_code == expected_status
        if status_ok:
            print(f"  PASS  {name}")
            passed += 1
        else:
            print(f"  FAIL  {name} — expected {expected_status}, got {r.status_code}")
            print(f"         Body: {r.text[:200]}")
            failed += 1
        return r
    except Exception as e:
        print(f"  FAIL  {name} — Exception: {e}")
        failed += 1
        return None

print("=" * 60)
print("NAMMA TRANSIT — Comprehensive API Test Suite")
print("=" * 60)

# 1. Health check
print("\n[HEALTH]")
test("Health check", "GET", "/")

# 2. Register user
print("\n[AUTH]")
r = test("Register user", "POST", "/api/auth/register", body={
    "name": "Test User",
    "email": "test@nammatransit.app",
    "password": "SecurePass123",
    "confirm_password": "SecurePass123"
})

token = None
if r and r.status_code in (200, 201):
    data = r.json()
    if isinstance(data, dict):
        token = data.get("token") or data.get("access_token")
    elif isinstance(data, str):
        token = data

# If register returned 201 but no token, try login instead
if not token:
    r = test("Login user", "POST", "/api/auth/login", expected_status=200, body={
        "email": "test@nammatransit.app",
        "password": "SecurePass123"
    })
    if r and r.status_code == 200:
        data = r.json()
        token = data.get("access_token") or data.get("token") or str(data.get("id", ""))

if not token:
    print("  INFO  Could not get auth token — trying with empty/demo token for testing")
    # Try registering with a different approach
    r = test("Register (try 2)", "POST", "/api/auth/register", body={
        "name": "Demo User",
        "email": "demo@test.app",
        "password": "DemoPass123",
        "confirm_password": "DemoPass123"
    })
    if r and r.status_code in (200, 201):
        data = r.json()
        token = data.get("access_token") or data.get("token") or data.get("id", "")

auth_headers = {"Authorization": f"Bearer {token}"} if token else {}

print(f"\n  Auth token obtained: {'Yes' if token else 'No'}")
print(f"  Token preview: {str(token)[:50] if token else 'N/A'}")

# 3. Transit endpoints
print("\n[TRANSIT]")

test("GET /plan", "GET",
    f"/api/transit/plan?origin_lat=13.0827&origin_lng=80.2707&dest_lat=12.9249&dest_lng=80.1000",
    headers=auth_headers if token else {})

test("GET /vehicles/live", "GET",
    "/api/transit/vehicles/live?lat=13.0827&lng=80.2707&radius_km=5",
    headers=auth_headers if token else {})

test("GET /reliability/trs", "GET",
    "/api/transit/reliability/trs?route_id=27B",
    headers=auth_headers if token else {})

# 4. Crowd Pulse
print("\n[CROWD PULSE]")

# Try without auth first to see expected behavior
test("POST /crowd/report", "POST",
    "/api/transit/crowd/report", expected_status=401 if not token else 400,
    body={
        "report_type": "congestion",
        "lat": 13.0827,
        "lng": 80.2707,
        "segment_id": "seg_001",
        "congestion_level": "high"
    },
    headers=auth_headers if token else {})

# 5. Voice / IVR
print("\n[IVR GATEWAY]")
test("GET /voice/lookup", "GET",
    "/api/transit/voice/lookup?phone=9876543210&stop=koyambedu")

# 6. SMS Alerts
print("\n[ALERTS]")
test("POST /alerts/subscribe", "POST",
    "/api/transit/alerts/subscribe",
    body={"phone_number": "9876543210", "route_id": "27B", "language": "ta"})

test("DELETE /alerts/unsubscribe", "DELETE",
    "/api/transit/alerts/unsubscribe",
    body={"phone_number": "9876543210", "route_id": "27B"})

# 7. Profile (if authenticated)
if token:
    print("\n[PROFILE]")
    test("GET /profile", "GET", "/api/profile", headers=auth_headers)

# 8. Rewards (if authenticated)
if token:
    print("\n[REWARDS]")
    test("GET /rewards/history", "GET", "/api/transit/rewards/history", headers=auth_headers)

# 9. Dashboard (if authenticated)
if token:
    print("\n[DASHBOARD]")
    test("GET /dashboard", "GET", "/api/transit/dashboard", headers=auth_headers)

# 10. Trip history (if authenticated)
if token:
    print("\n[TRIPS]")
    test("GET /trips/history", "GET", "/api/trips/history", headers=auth_headers)

print("\n" + "=" * 60)
print(f"RESULTS: {passed} passed, {failed} failed, {passed + failed} total")
print("=" * 60)
sys.exit(0 if failed == 0 else 1)
