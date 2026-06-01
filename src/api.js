const API_HOST = 'http://localhost:8080';

export function getToken() {
  const data = localStorage.getItem('auth');
  if (!data) return null;
  try {
    return JSON.parse(data).token;
  } catch {
    return null;
  }
}

export async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_HOST}${url}`, { ...options, headers });
  // If the token is invalid/expired, backend returns 401 -> sign out.
  // If the user is forbidden (403), do not auto-logout; let callers handle it.
  if (res.status === 401) {
    localStorage.removeItem('auth');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}
