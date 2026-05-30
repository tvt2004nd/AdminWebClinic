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
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('auth');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}
