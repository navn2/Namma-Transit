import requests, sys, json

base = 'http://localhost:8000'
r = requests.post(f'{base}/api/auth/login',
    json={'email': 'test@nammatransit.app', 'password': 'SecurePass123'}, timeout=10)
data = r.json()
token = data.get('token', '')
print(f'Token: {token[:50]}...')
h = {'Authorization': f'Bearer {token}'}

tests = [
    ('GET', '/api/transit/plan?origin_lat=13.0827&origin_lng=80.2707&dest_lat=12.9249&dest_lng=80.1000', None),
    ('GET', '/api/transit/vehicles/live?lat=13.0827&lng=80.2707', None),
    ('GET', '/api/transit/reliability/trs?route_id=27B', None),
    ('GET', '/api/transit/crowd/recent', None),
    ('POST', '/api/transit/crowd/report',
     {'report_type': 'congestion', 'lat': 13.0827, 'lng': 80.2707, 'congestion_level': 'high'}),
    ('GET', '/api/transit/rewards/history', None),
    ('GET', '/api/transit/dashboard', None),
    ('GET', '/api/profile', None),
    ('GET', '/api/trips/history', None),
    ('GET', '/api/transit/voice/lookup?phone=9876543210&stop=koyambedu', None),
    ('POST', '/api/transit/alerts/subscribe',
     {'phone_number': '9876543210', 'route_id': '27B', 'language': 'ta'}),
]

all_pass = True
for method, path, body in tests:
    url = f'{base}{path}'
    try:
        if method == 'GET':
            r = requests.get(url, headers=h, timeout=10)
        elif method == 'POST':
            r = requests.post(url, json=body, headers=h, timeout=10)
        ok = r.status_code in (200, 201)
        status = 'PASS' if ok else 'FAIL'
        if not ok:
            all_pass = False
        resp = r.json()
        snippet = json.dumps(resp, indent=2)[:200]
        print(f'  {status} [{r.status_code}] {method} {path}')
        print(f'         {snippet}')
    except Exception as e:
        all_pass = False
        print(f'  FAIL [{path}] {e}')

sys.exit(0 if all_pass else 1)
