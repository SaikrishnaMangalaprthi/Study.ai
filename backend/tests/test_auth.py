import json

def test_register_login(client):
    # Register a new user
    resp = client.post('/api/auth/register', json={'email': 'alice@example.com', 'password': 'secret'})
    assert resp.status_code == 201
    data = resp.get_json()
    assert data['msg'] == 'registered'

    # Login with the same credentials
    resp = client.post('/api/auth/login', json={'email': 'alice@example.com', 'password': 'secret'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'access_token' in data
    token = data['access_token']

    # Access a protected route
    resp = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['email'] == 'alice@example.com'
