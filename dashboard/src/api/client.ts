const BASE = '/api';

export const api = {
  async login(passphrase: string) {
    const res = await fetch(`${BASE}/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async get(endpoint: string, token: string) {
    const res = await fetch(`${BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`GET ${endpoint} failed`);
    return res.json();
  },

  async post(endpoint: string, body: any, token: string) {
    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'POST', headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${endpoint} failed`);
    return res.json();
  },

  async put(endpoint: string, body: any, token: string) {
    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'PUT', headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${endpoint} failed`);
    return res.json();
  },

  async del(endpoint: string, token: string) {
    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`DELETE ${endpoint} failed`);
    return res.json();
  },
};