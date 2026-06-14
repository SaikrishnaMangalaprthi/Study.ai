import json
import pytest
from datetime import date

def register_user(client, email='bob@example.com', password='secret'):
    resp = client.post('/api/auth/register', json={'email': email, 'password': password})
    assert resp.status_code == 201
    return email, password

def login_user(client, email, password):
    resp = client.post('/api/auth/login', json={'email': email, 'password': password})
    assert resp.status_code == 200
    token = resp.get_json()['access_token']
    return token

def auth_header(token):
    return {'Authorization': f'Bearer {token}'}

def test_goal_crud(client):
    # Register & login
    email, pw = register_user(client)
    token = login_user(client, email, pw)
    hdr = auth_header(token)

    # Create a goal
    goal_data = {
        'title': 'Learn Flask',
        'description': 'Complete the Flask tutorial',
        'target_percent': 50,
        'deadline': '2026-12-31'
    }
    resp = client.post('/api/goals/', json=goal_data, headers=hdr)
    assert resp.status_code == 201
    goal_id = resp.get_json()['id']

    # List goals – should contain the created one
    resp = client.get('/api/goals/', headers=hdr)
    assert resp.status_code == 200
    goals = resp.get_json()
    assert any(g['id'] == goal_id for g in goals)

    # Update the goal
    update_data = {'target_percent': 75}
    resp = client.put(f'/api/goals/{goal_id}', json=update_data, headers=hdr)
    assert resp.status_code == 200

    # Verify update
    resp = client.get('/api/goals/', headers=hdr)
    updated = next(g for g in resp.get_json() if g['id'] == goal_id)
    assert updated['target_percent'] == 75

    # Delete the goal
    resp = client.delete(f'/api/goals/{goal_id}', headers=hdr)
    assert resp.status_code == 200

    # Ensure it's gone
    resp = client.get('/api/goals/', headers=hdr)
    assert not any(g['id'] == goal_id for g in resp.get_json())
