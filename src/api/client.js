import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

/** HTTP-клиент к backend АСУ «Мои Дома» Light. Токен Sanctum хранится в SecureStore (Keychain). */

const TOKEN_KEY = 'asu_light_token';
export const API_BASE = (Constants.expoConfig?.extra?.apiBaseUrl || 'https://asu-md-light.duckdns.org').replace(/\/$/, '');

let memToken = null;
export async function getToken() {
  if (memToken === null) memToken = (await SecureStore.getItemAsync(TOKEN_KEY)) || '';
  return memToken || null;
}
export async function setToken(token) {
  memToken = token || '';
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, errors) { super(message); this.status = status; this.errors = errors || null; }
}

const listeners = new Set();
export const onUnauthorized = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

async function request(method, path, body) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Сервер недоступен. Проверьте соединение.', 0);
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!res.ok) {
    if (res.status === 401) { await setToken(null); listeners.forEach((fn) => fn()); }
    throw new ApiError((data && data.message) || `Ошибка запроса (${res.status})`, res.status, data && data.errors);
  }
  return data;
}

export const api = {
  login: (login, password) => request('POST', '/api/auth/login', { login, password }),
  logout: () => request('POST', '/api/auth/logout'),
  me: () => request('GET', '/api/auth/me'),
  houses: (mark) => request('GET', `/api/houses?mark=${encodeURIComponent(mark || '')}`),
  houseCard: (buildId, mark) => request('GET', `/api/houses/card?build_id=${encodeURIComponent(buildId)}&mark=${encodeURIComponent(mark || '')}`),
  users: () => request('GET', '/api/users'),
  createUser: (p) => request('POST', '/api/users', p),
  updateUser: (id, p) => request('PUT', `/api/users/${id}`, p),
  deleteUser: (id) => request('DELETE', `/api/users/${id}`),
};
