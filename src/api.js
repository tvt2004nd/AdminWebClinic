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

export async function fetchDoctorSchedules(doctorId) {
  if (!doctorId) return [];

  const res = await fetchWithAuth(`/api/doctors/${doctorId}/schedules`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Không thể tải lịch khám của bác sĩ');
  }

  return res.json();
}

export async function fetchAdminSchedules({ startDate, endDate, doctorId, roomId, status } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (doctorId) params.set('doctorId', doctorId);
  if (roomId) params.set('roomId', roomId);
  if (status) params.set('status', status);

  const res = await fetchWithAuth(`/api/admin/doctor-schedules?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Không thể tải lịch');
  }
  return res.json();
}

export async function getAdminSchedule(scheduleId) {
  const res = await fetchWithAuth(`/api/admin/doctor-schedules?`);
  if (!res.ok) throw new Error('Không thể lấy lịch');
  // fallback: caller should filter; keep simple for now
  return res.json();
}

export async function checkScheduleConflict(payload) {
  const res = await fetchWithAuth('/api/doctors/check-schedule-conflict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Không thể kiểm tra xung đột lịch khám');
  }

  return res.json();
}
