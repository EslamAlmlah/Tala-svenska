// Minimal Supabase client over plain fetch: password sign-in, token refresh and REST calls.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let SESSION_KEY = 'ts_session';
export const useSessionKey = k => { SESSION_KEY = k; };

export const cloudEnabled = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
function saveSession(s) {
  try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch {}
}

function toSession(json) {
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + (json.expires_in - 60) * 1000,
    user: { id: json.user.id, email: json.user.email },
  };
}

export function currentUser() { return loadSession()?.user || null; }

export async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.msg || 'login failed');
  const s = toSession(json);
  saveSession(s);
  return s.user;
}

export function signOut() { saveSession(null); }

async function token() {
  let s = loadSession();
  if (!s) throw new Error('not signed in');
  if (Date.now() > s.expires_at) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    if (!res.ok) throw new Error('session expired');
    s = toSession(await res.json());
    saveSession(s);
  }
  return s.access_token;
}

export async function rest(path, { method = 'GET', body, prefer } = {}) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${await token()}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 || method !== 'GET' ? null : res.json();
}
