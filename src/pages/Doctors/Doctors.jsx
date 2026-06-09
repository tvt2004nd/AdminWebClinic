import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, CalendarDays } from 'lucide-react';
import { checkScheduleConflict, fetchDoctorSchedules, fetchWithAuth } from '../../api';
import ScheduleSuggestions from '../../components/ScheduleSuggestions/ScheduleSuggestions';
import { computeAvailableStandardShifts, STANDARD_SHIFTS } from '../../utils/scheduleUtils';
import styles from './Doctors.module.css';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  specialtyId: '',
  licenseNumber: '',
  title: '',
  biography: '',
  experienceYears: '',
  consultationFee: '',
};

const formatDateDisplay = (value) => {
  if (!value) return '--';
  const [year, month, day] = String(value).split('-').map((part) => Number(part));
  if (!year || !month || !day) return value;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

const formatTimeDisplay = (value) => {
  if (!value) return '--';
  return value.length > 5 ? value.slice(0, 5) : value;
};

const getScheduleSortKey = (schedule) => {
  const datePart = schedule.workDate || schedule.date || schedule.scheduleDate || '';
  const timePart = schedule.shiftStart || schedule.startTime || schedule.start || '00:00:00';
  const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart;
  const [year, month, day] = String(datePart).split('-').map((part) => Number(part));
  if (!year || !month || !day) return Number.MAX_SAFE_INTEGER;
  const [hours, minutes, seconds] = normalizedTime.split(':').map((part) => Number(part));
  return new Date(year, month - 1, day, Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, Number.isFinite(seconds) ? seconds : 0).getTime();
};

const todayMin = new Date().toISOString().slice(0, 10);

const sortSchedulesByNearestDate = (schedules) => [...schedules].sort((left, right) => getScheduleSortKey(left) - getScheduleSortKey(right));

const getBookedPatientsValue = (schedule) => schedule.bookedPatients ?? schedule.bookedCount ?? schedule.currentBookings ?? 0;

const getScheduleStatusLabel = (status) => {
  if (!status) return 'Không xác định';
  const labels = {
    AVAILABLE: 'Còn trống',
    FULL: 'Đã đầy',
    CANCELLED: 'Đã hủy',
    INACTIVE: 'Ngừng áp dụng',
    COMPLETED: 'Hoàn thành',
  };
  return labels[status] || status;
};

const getScheduleStatusClass = (status) => {
  if (status === 'FULL') return 'full';
  if (status === 'CANCELLED' || status === 'INACTIVE' || status === 'COMPLETED') return 'inactive';
  return 'available';
};

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleConflict, setScheduleConflict] = useState(null);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    workDate: '',
    shiftStart: '',
    shiftEnd: '',
    maxPatients: '20',
  });
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDoctors = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (specialtyId) params.set('specialtyId', specialtyId);
      const res = await fetchWithAuth(`/api/admin/doctors?${params}`);
      if (res.ok) setDoctors(await res.json());
    } catch { } finally { setLoading(false); }
  }, [keyword, specialtyId]);

  const fetchSpecialties = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/specialties');
      if (res.ok) setSpecialties(await res.json());
    } catch { }
  };

  useEffect(() => { fetchDoctors(); fetchSpecialties(); }, [fetchDoctors]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, password: '' });
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({
      fullName: d.fullName || '',
      email: d.email || '',
      phone: d.phone || '',
      password: '',
      specialtyId: d.specialtyId != null ? String(d.specialtyId) : '',
      licenseNumber: d.licenseNumber || '',
      title: d.title || '',
      biography: d.biography || '',
      experienceYears: d.experienceYears != null ? String(d.experienceYears) : '',
      consultationFee: d.consultationFee != null ? String(d.consultationFee) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { showToast('Họ tên không được để trống', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetchWithAuth(`/api/admin/doctors/${editing.doctorId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            specialtyId: form.specialtyId ? Number(form.specialtyId) : null,
            licenseNumber: form.licenseNumber.trim() || null,
            title: form.title.trim() || null,
            biography: form.biography.trim() || null,
            experienceYears: form.experienceYears ? Number(form.experienceYears) : 0,
            consultationFee: form.consultationFee ? Number(form.consultationFee) : 150000,
          }),
        });
        if (!res.ok) throw new Error();
        showToast('Cập nhật bác sĩ thành công', 'success');
      } else {
        const res = await fetchWithAuth('/api/admin/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            password: form.password || '123456',
            specialtyId: form.specialtyId ? Number(form.specialtyId) : null,
            licenseNumber: form.licenseNumber.trim() || null,
            title: form.title.trim() || null,
            biography: form.biography.trim() || null,
            experienceYears: form.experienceYears ? Number(form.experienceYears) : 0,
            consultationFee: form.consultationFee ? Number(form.consultationFee) : 150000,
          }),
        });
        if (!res.ok) throw new Error();
        showToast('Thêm bác sĩ thành công', 'success');
      }
      setModalOpen(false);
      fetchDoctors();
    } catch {
      showToast('Có lỗi xảy ra', 'error');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetchWithAuth(`/api/admin/doctors/${deleteTarget.doctorId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Đã xóa bác sĩ', 'success');
      setDeleteTarget(null);
      fetchDoctors();
    } catch { showToast('Không thể xóa', 'error'); }
  };

  const openScheduleModal = (doctor) => {
    setSelectedDoctor(doctor);
    setScheduleForm({
      workDate: '',
      shiftStart: '',
      shiftEnd: '',
      maxPatients: '20',
    });
    setEditingSchedule(null);
    setDoctorSchedules([]);
    setScheduleLoading(true);
    setScheduleConflict(null);
    setConflictLoading(false);
    setScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setSelectedDoctor(null);
    setDoctorSchedules([]);
    setScheduleLoading(false);
    setScheduleConflict(null);
    setConflictLoading(false);
    setEditingSchedule(null);
    setScheduleModalOpen(false);
  };

  useEffect(() => {
    if (!scheduleModalOpen || !selectedDoctor) return;

    let isActive = true;

    const loadSchedules = async () => {
      setScheduleLoading(true);
      try {
        const schedules = await fetchDoctorSchedules(selectedDoctor.doctorId);
        if (!isActive) return;
        setDoctorSchedules(sortSchedulesByNearestDate(Array.isArray(schedules) ? schedules : []));
      } catch (error) {
        if (!isActive) return;
        setDoctorSchedules([]);
        showToast(error.message || 'Không thể tải lịch khám của bác sĩ', 'error');
      } finally {
        if (isActive) setScheduleLoading(false);
      }
    };

    loadSchedules();

    return () => {
      isActive = false;
    };
  }, [scheduleModalOpen, selectedDoctor]);

  useEffect(() => {
    if (!scheduleModalOpen || !selectedDoctor) return;
    const date = scheduleForm.workDate;
    if (!date) {
      setSuggestions([]);
      return;
    }

    // filter schedules for the selected date and compute available standard shifts
    const schedulesForDate = (doctorSchedules || []).filter(s => {
      const d = s.workDate || s.date || s.scheduleDate || '';
      return d === date;
    });

    const computed = computeAvailableStandardShifts(schedulesForDate, STANDARD_SHIFTS || []);
    setSuggestions(computed || []);
  }, [scheduleModalOpen, selectedDoctor, scheduleForm.workDate, doctorSchedules]);

  useEffect(() => {
    if (!scheduleModalOpen || !selectedDoctor) return;

    const { workDate, shiftStart, shiftEnd } = scheduleForm;
    if (!workDate || !shiftStart || !shiftEnd) {
      setScheduleConflict(null);
      setConflictLoading(false);
      return;
    }

    let isActive = true;
    const timer = setTimeout(async () => {
      setConflictLoading(true);
      try {
        const data = await checkScheduleConflict({
          doctorId: selectedDoctor.doctorId,
          workDate,
          shiftStart: `${shiftStart}:00`,
          shiftEnd: `${shiftEnd}:00`,
        });
        if (!isActive) return;
        setScheduleConflict(data);
      } catch {
        if (!isActive) return;
        setScheduleConflict(null);
      } finally {
        if (isActive) setConflictLoading(false);
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [scheduleModalOpen, selectedDoctor, scheduleForm.workDate, scheduleForm.shiftStart, scheduleForm.shiftEnd]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    if (scheduleConflict?.conflict) {
      showToast('Bác sĩ đã có lịch khám trong thời gian này.', 'error');
      return;
    }
    if (!scheduleForm.workDate || !scheduleForm.shiftStart || !scheduleForm.shiftEnd) {
      showToast('Vui lòng điền đầy đủ ngày và giờ', 'error');
      return;
    }
    // date validation: no past dates
    const today = new Date();
    const selected = new Date(scheduleForm.workDate + 'T00:00:00');
    if (selected.setHours(0, 0, 0, 0) < (new Date()).setHours(0, 0, 0, 0)) {
      showToast('Không thể chọn ngày trong quá khứ', 'error');
      return;
    }
    // time validation: end must be after start
    const [sh, sm] = scheduleForm.shiftStart.split(':').map(Number);
    const [eh, em] = scheduleForm.shiftEnd.split(':').map(Number);
    if (eh < sh || (eh === sh && em <= sm)) {
      showToast('Giờ kết thúc phải sau giờ bắt đầu', 'error');
      return;
    }
    const maxPatients = Number(scheduleForm.maxPatients);
    if (!Number.isInteger(maxPatients) || maxPatients < 1 || maxPatients > 100) {
      showToast('Số bệnh nhân tối đa phải là số nguyên từ 1 đến 100', 'error');
      return;
    }
    setScheduleSaving(true);
    try {
      const payload = {
        doctorId: selectedDoctor.doctorId,
        workDate: scheduleForm.workDate,
        shiftStart: scheduleForm.shiftStart + ':00',
        shiftEnd: scheduleForm.shiftEnd + ':00',
        maxPatients,
        status: 'AVAILABLE',
      };
      let res;
      if (editingSchedule && editingSchedule.scheduleId) {
        // update existing
        res = await fetchWithAuth(`/api/admin/doctor-schedules/${editingSchedule.scheduleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // create new
        res = await fetchWithAuth('/api/admin/doctor-schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Có lỗi khi lưu lịch khám');
      }
      showToast(editingSchedule ? 'Cập nhật lịch khám thành công' : 'Tạo lịch khám thành công', 'success');
      const updatedSchedules = await fetchDoctorSchedules(selectedDoctor.doctorId);
      setDoctorSchedules(sortSchedulesByNearestDate(Array.isArray(updatedSchedules) ? updatedSchedules : []));
      closeScheduleModal();
    } catch (error) {
      showToast(error.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleEditSchedule = (s) => {
    setEditingSchedule(s);
    setScheduleForm({
      workDate: s.workDate || s.date || s.scheduleDate || '',
      shiftStart: (s.shiftStart || s.start || s.startTime || '').slice(0, 5),
      shiftEnd: (s.shiftEnd || s.end || s.endTime || '').slice(0, 5),
      maxPatients: s.maxPatients != null ? String(s.maxPatients) : '20',
    });
  };

  const handleDeleteSchedule = async (s) => {
    if (!s || !s.scheduleId) {
      showToast('Không thể xóa lịch này', 'error');
      return;
    }
    // quick client-side role check (helps surface permission issues faster)
    try {
      const authRaw = localStorage.getItem('auth');
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        const roles = parsed?.roles;
        if (roles && Array.isArray(roles)) {
          const hasAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');
          if (!hasAdmin) {
            showToast('Tài khoản hiện tại không có quyền quản trị (ADMIN).', 'error');
            console.warn('User roles:', roles);
            return;
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    }
    if (!window.confirm(`Xóa lịch ${formatDateDisplay(s.workDate)} ${formatTimeDisplay(s.shiftStart)} - ${formatTimeDisplay(s.shiftEnd)}?`)) return;

    // disable UI by setting a saving flag on schedule (local state)
    try {
      // debug: log token and roles before request
      let token = null;
      try { token = JSON.parse(localStorage.getItem('auth') || '{}').token; } catch { };
      console.debug('Deleting schedule, token present:', !!token, 'scheduleId=', s.scheduleId);
      const url = `/api/admin/doctor-schedules/${s.scheduleId}`;
      console.debug('DELETE', url);
      const res = await fetchWithAuth(url, { method: 'DELETE' });
      if (res.ok) {
        showToast('Đã xóa lịch khám', 'success');
        const updatedSchedules = await fetchDoctorSchedules(selectedDoctor.doctorId);
        setDoctorSchedules(sortSchedulesByNearestDate(Array.isArray(updatedSchedules) ? updatedSchedules : []));
        return;
      }

      // Try to parse error message from server
      let bodyText = '';
      try {
        const json = await res.json();
        bodyText = json?.message || JSON.stringify(json);
      } catch (e) {
        try { bodyText = await res.text(); } catch { bodyText = ''; }
      }

      if (res.status === 403) {
        console.error('Delete schedule forbidden:', res.status, bodyText);
        console.debug('Response headers:');
        try { for (const [k, v] of res.headers.entries()) console.debug(k, v); } catch (e) { }
        showToast(bodyText || 'Bạn không có quyền xóa lịch (403)', 'error');
        return;
      }

      console.error('Delete schedule failed:', res.status, bodyText);
      try { for (const [k, v] of res.headers.entries()) console.debug(k, v); } catch (e) { }
      showToast(bodyText || 'Không thể xóa lịch', 'error');
    } catch (err) {
      console.error('Delete schedule error:', err);
      showToast('Không thể xóa lịch', 'error');
    }
  };

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>{toast.message}</div>}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý Bác sĩ</h1>
          <p className={styles.subtitle}>Quản lý bác sĩ, chuyên khoa và thông tin chi tiết.</p>
        </div>
        <button className={styles.primaryBtn} onClick={openAdd}>
          <Plus size={20} /><span>Thêm Bác sĩ</span>
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <div className={styles.filters}>
            <select className={styles.select} value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)}>
              <option value="">Tất cả Chuyên khoa</option>
              {specialties.map(s => <option key={s.specialtyId} value={s.specialtyId}>{s.specialtyName}</option>)}
            </select>
            <span className={styles.totalCount}>{doctors.length} bác sĩ</span>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã BS</th><th>Họ và Tên</th><th>Chuyên khoa</th><th>Kinh nghiệm</th><th>Phí khám</th><th>Đánh giá</th><th>Trạng thái</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Đang tải...</td></tr>
                : doctors.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Không tìm thấy</td></tr>
                  : doctors.map(d => (
                    <tr key={d.doctorId}>
                      <td className={styles.fw500}>{d.doctorCode}</td>
                      <td>
                        <div className={styles.doctorInfo}>
                          <div className={styles.avatar}>{(d.fullName || '?').charAt(0).toUpperCase()}</div>
                          <span>{d.fullName}</span>
                        </div>
                      </td>
                      <td><span className={styles.badge}>{d.specialtyName || '--'}</span></td>
                      <td>{d.experienceYears != null ? `${d.experienceYears} năm` : '--'}</td>
                      <td>{d.consultationFee != null ? `${Number(d.consultationFee).toLocaleString('vi-VN')}₫` : '--'}</td>
                      <td><span className={styles.star}>★</span> {d.rating != null ? d.rating.toFixed(1) : '--'}</td>
                      <td><span className={`${styles.statusDot} ${d.isActive ? styles.active : styles.inactive}`} />{d.isActive ? 'Hoạt động' : 'Vô hiệu'}</td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.iconBtn} title="Lịch khám" onClick={() => openScheduleModal(d)}><CalendarDays size={16} /></button>
                          <button className={styles.iconBtn} title="Sửa" onClick={() => openEdit(d)}><Edit2 size={16} /></button>
                          <button className={`${styles.iconBtn} ${styles.dangerBtn}`} title="Xóa" onClick={() => setDeleteTarget(d)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Sửa bác sĩ' : 'Thêm bác sĩ'}</h2>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Họ và tên *</label>
                  <input className={styles.formInput} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <input className={styles.formInput} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Số điện thoại</label>
                    <input className={styles.formInput} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                {!editing && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mật khẩu</label>
                    <input className={styles.formInput} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mặc định: 123456" />
                  </div>
                )}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Chuyên khoa</label>
                    <select className={styles.formSelect} value={form.specialtyId} onChange={e => setForm({ ...form, specialtyId: e.target.value })}>
                      <option value="">-- Chọn --</option>
                      {specialties.map(s => <option key={s.specialtyId} value={s.specialtyId}>{s.specialtyName}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Số CCHN</label>
                    <input className={styles.formInput} value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Chức danh</label>
                    <input className={styles.formInput} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="VD: BSCKII" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Số năm KN</label>
                    <input className={styles.formInput} type="number" min="0" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: e.target.value })} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phí khám (VNĐ)</label>
                  <input className={styles.formInput} type="number" min="0" value={form.consultationFee} onChange={e => setForm({ ...form, consultationFee: e.target.value })} />
                </div>
                {!editing && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tiểu sử</label>
                    <textarea className={styles.formTextarea} rows={3} value={form.biography} onChange={e => setForm({ ...form, biography: e.target.value })} />
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Hủy</button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? 'Đang xử lý...' : editing ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scheduleModalOpen && selectedDoctor && (
        <div className={styles.overlay} onClick={closeScheduleModal}>
          <div className={`${styles.modal} ${styles.scheduleModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Tạo lịch khám cho {selectedDoctor.fullName}</h2>
              <button className={styles.closeBtn} onClick={closeScheduleModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.scheduleLayout}>
                  <div className={styles.scheduleColumn}>
                    <div className={styles.scheduleFormPanel}>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Ngày khám</label>
                          <input className={styles.formInput} type="date" min={todayMin} value={scheduleForm.workDate} onChange={(e) => setScheduleForm({ ...scheduleForm, workDate: e.target.value })} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Số bệnh nhân tối đa</label>
                          <input className={styles.formInput} type="number" min="1" max="100" value={scheduleForm.maxPatients} onChange={(e) => setScheduleForm({ ...scheduleForm, maxPatients: e.target.value })} />
                        </div>
                      </div>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Giờ bắt đầu</label>
                          <input className={styles.formInput} type="time" value={scheduleForm.shiftStart} onChange={(e) => setScheduleForm({ ...scheduleForm, shiftStart: e.target.value })} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Giờ kết thúc</label>
                          <input className={styles.formInput} type="time" value={scheduleForm.shiftEnd} onChange={(e) => setScheduleForm({ ...scheduleForm, shiftEnd: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <ScheduleSuggestions suggestions={suggestions} onSelect={(s) => {
                      setScheduleForm({ ...scheduleForm, shiftStart: s.start, shiftEnd: s.end });
                      showToast('Gợi ý ca trống đã được áp dụng', 'success');
                    }} />

                    {(conflictLoading || scheduleConflict?.conflict) && (
                      <div className={styles.scheduleWarning}>
                        {conflictLoading ? (
                          <span className={styles.scheduleWarningText}>Đang kiểm tra xung đột lịch khám...</span>
                        ) : (
                          <>
                            <strong className={styles.scheduleWarningTitle}>Bác sĩ đã có lịch khám trong thời gian này.</strong>
                            {scheduleConflict?.existingSchedule && (
                              <div className={styles.scheduleWarningDetails}>
                                <div>Ngày: {formatDateDisplay(scheduleConflict.existingSchedule.workDate)}</div>
                                <div>Giờ: {formatTimeDisplay(scheduleConflict.existingSchedule.shiftStart)} - {formatTimeDisplay(scheduleConflict.existingSchedule.shiftEnd)}</div>
                                <div>Đã đặt: {getBookedPatientsValue(scheduleConflict.existingSchedule)}</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.scheduleColumn}>
                    <div className={styles.scheduleListPanel}>
                      <div className={styles.schedulePanelHeader}>
                        <div>
                          <h3 className={styles.schedulePanelTitle}>Lịch khám hiện có</h3>
                          <p className={styles.schedulePanelSubtitle}>Các lịch được sắp xếp theo ngày gần nhất.</p>
                        </div>
                      </div>

                      <div className={styles.scheduleList}>
                        {scheduleLoading ? (
                          <div className={styles.scheduleState}>Đang tải lịch khám...</div>
                        ) : doctorSchedules.length === 0 ? (
                          <div className={styles.scheduleState}>Bác sĩ chưa có lịch khám nào.</div>
                        ) : doctorSchedules.map((schedule, index) => (
                          <article key={schedule.scheduleId || `${schedule.workDate}-${schedule.shiftStart}-${index}`} className={styles.scheduleCard}>
                            <div className={styles.scheduleCardHeader}>
                              <h4 className={styles.scheduleCardTitle}>Lịch khám</h4>
                              {selectedDoctor?.fullName ? (
                                <span className={`${styles.scheduleStatusBadge} ${styles.scheduleDoctorName}`}>{selectedDoctor.fullName}</span>
                              ) : null}
                            </div>
                            <div className={styles.scheduleCardGrid}>
                              <div className={styles.scheduleInfoItem}>
                                <span className={styles.scheduleInfoLabel}>Ngày</span>
                                <span className={styles.scheduleInfoValue}>{formatDateDisplay(schedule.workDate || schedule.date || schedule.scheduleDate)}</span>
                              </div>
                              <div className={styles.scheduleInfoItem}>
                                <span className={styles.scheduleInfoLabel}>Thời gian</span>
                                <span className={styles.scheduleInfoValue}>{formatTimeDisplay(schedule.shiftStart || schedule.startTime || schedule.start)} - {formatTimeDisplay(schedule.shiftEnd || schedule.endTime || schedule.end)}</span>
                              </div>
                              <div className={styles.scheduleInfoItem}>
                                <span className={styles.scheduleInfoLabel}>Đã đặt</span>
                                <span className={styles.scheduleInfoValue}>{getBookedPatientsValue(schedule)} / {schedule.maxPatients ?? '--'}</span>
                              </div>
                            </div>
                            <div className={styles.scheduleCardActions}>
                              <button type="button" className={styles.iconBtn} title="Sửa lịch" onClick={() => handleEditSchedule(schedule)}>
                                <Edit2 size={14} />
                              </button>
                              <button type="button" className={`${styles.iconBtn} ${styles.dangerBtn}`} title="Xóa lịch" onClick={() => handleDeleteSchedule(schedule)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={closeScheduleModal}>Hủy</button>
                <button type="submit" className={styles.submitBtn} disabled={scheduleSaving || conflictLoading || scheduleConflict?.conflict}>
                  {scheduleSaving ? (editingSchedule ? 'Đang cập nhật...' : 'Đang tạo...') : (editingSchedule ? 'Cập nhật lịch' : 'Tạo lịch khám')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}><Trash2 size={24} /></div>
            <h3 className={styles.confirmTitle}>Xóa bác sĩ</h3>
            <p className={styles.confirmText}>Xóa <strong>{deleteTarget.fullName}</strong>?</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className={styles.deleteBtn} onClick={confirmDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
