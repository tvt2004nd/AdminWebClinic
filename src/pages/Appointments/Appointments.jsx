import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, Edit2, Trash2, X } from 'lucide-react';
import { fetchWithAuth } from '../../api';
import Pagination from '../../components/Pagination/Pagination';
import styles from './Appointments.module.css';

// Simplified status set (backend-compatible): SCHEDULED = chưa khám, CONFIRMED = đã xác nhận, COMPLETED = đã khám
const statusColors = {
  SCHEDULED: { bg: '#eef2ff', color: '#4338ca' },
  CONFIRMED: { bg: '#fefce8', color: '#a16207' },
  COMPLETED: { bg: '#f0fdf4', color: '#15803d' },
};

const statusLabels = {
  SCHEDULED: 'Chưa khám',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Đã khám',
};

// Map any backend status into the simplified set for display and editing
const simplifyStatus = (s) => {
  if (!s) return 'SCHEDULED';
  if (s === 'COMPLETED') return 'COMPLETED';
  if (s === 'CONFIRMED') return 'CONFIRMED';
  // treat other states as not-yet-seen
  return 'SCHEDULED';
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ status: 'SCHEDULED', cancelReason: '', reason: '', appointmentDate: '', appointmentTime: '', doctorId: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        doctorId: form.doctorId ? Number(form.doctorId) : null,
        appointmentDate: form.appointmentDate || null,
        appointmentTime: form.appointmentTime || null,
        status: form.status || 'SCHEDULED',
        reason: form.reason || null,
      };
      const res = await fetchWithAuth(`/api/admin/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      showToast('Tạo lịch hẹn thành công', 'success');
      setModalOpen(false);
      fetchAppointments();
    } catch (err) {
      showToast('Không thể tạo lịch hẹn', 'error');
    } finally { setSaving(false); }
  };

  const fetchAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      if (statusFilter) params.set('status', statusFilter);
      if (doctorFilter) params.set('doctorId', doctorFilter);
      if (dateFilter) params.set('date', dateFilter);
      const res = await fetchWithAuth(`/api/admin/appointments?${params}`);
      if (res.ok) setAppointments(await res.json());
    } catch {
      showToast('Không thể tải lịch hẹn', 'error');
    } finally { setLoading(false); }
  }, [keyword, statusFilter, doctorFilter, dateFilter]);

  const fetchDoctors = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/doctors');
      if (res.ok) setDoctors(await res.json());
    } catch {}
  };

  useEffect(() => { fetchAppointments(); fetchDoctors(); }, [fetchAppointments]);

  useEffect(() => { setCurrentPage(1); }, [keyword, statusFilter, doctorFilter, dateFilter]);

  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentAppointments = appointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(appointments.length / pageSize);

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      status: simplifyStatus(a.status) || 'SCHEDULED',
      cancelReason: a.cancelReason || '',
      reason: a.reason || '',
      appointmentDate: a.appointmentDate || '',
      appointmentTime: a.appointmentTime || '',
      doctorId: a.doctorId != null ? String(a.doctorId) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        status: form.status,
        cancelReason: form.cancelReason || null,
        reason: form.reason || null,
        appointmentDate: form.appointmentDate || null,
        appointmentTime: form.appointmentTime || null,
        doctorId: form.doctorId ? Number(form.doctorId) : null,
      };
      const res = await fetchWithAuth(`/api/admin/appointments/${editing.appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      showToast('Cập nhật lịch hẹn thành công', 'success');
      setModalOpen(false);
      fetchAppointments();
    } catch {
      showToast('Có lỗi xảy ra', 'error');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetchWithAuth(`/api/admin/appointments/${deleteTarget.appointmentId}`, { method: 'DELETE' });
      console.debug('DELETE /appointments', deleteTarget.appointmentId, 'status', res.status);
      if (res.status === 403) {
        showToast('Bạn không có quyền xóa lịch hẹn', 'error');
        return;
      }
      if (!res.ok) throw new Error();
      showToast('Đã xóa lịch hẹn', 'success');
      setDeleteTarget(null);
      fetchAppointments();
    } catch (err) { console.error(err); showToast('Không thể xóa', 'error'); }
  };

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>{toast.message}</div>}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý Lịch hẹn</h1>
          <p className={styles.subtitle}>Theo dõi và quản lý lịch khám của bệnh nhân.</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <div className={styles.toolbarActions}>
            <button className={styles.addBtn} onClick={() => { setEditing(null); setForm({ status: 'SCHEDULED', cancelReason: '', reason: '', appointmentDate: '', appointmentTime: '', doctorId: '' }); setModalOpen(true); }}>Thêm lịch</button>
          </div>
          <div className={styles.filters}>
            <div className={styles.filterItem}>
              <Calendar size={16} className={styles.filterIcon} />
              <input type="date" className={styles.filterDate} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
            <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className={styles.filterSelect} value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}>
              <option value="">Tất cả bác sĩ</option>
              {doctors.map(d => <option key={d.doctorId} value={d.doctorId}>{d.fullName}</option>)}
            </select>
            <span className={styles.totalCount}>{appointments.length} lịch hẹn</span>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã</th><th>Bệnh nhân</th><th>Bác sĩ</th><th>Ngày</th><th>Giờ</th><th>Lý do</th><th>Trạng thái</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text-tertiary)'}}>Đang tải...</td></tr>
              : currentAppointments.length === 0 ? <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text-tertiary)'}}>Không tìm thấy</td></tr>
              : currentAppointments.map(a => {
                const simple = simplifyStatus(a.status);
                const sc = statusColors[simple] || { bg: '#f8fafc', color: '#64748b' };
                const label = statusLabels[simple] || simple;
                return (
                  <tr key={a.appointmentId}>
                    <td className={styles.fw500}>{a.appointmentCode}</td>
                    <td>{a.patientName}</td>
                    <td>{a.doctorName}</td>
                    <td>{a.appointmentDate}</td>
                    <td>{a.appointmentTime}</td>
                    <td className={styles.reasonCell}>{a.reason || '--'}</td>
                    <td><span className={styles.statusBadge} style={{backgroundColor: sc.bg, color: sc.color}}>{label}</span></td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.iconBtn} title="Sửa" onClick={() => openEdit(a)}><Edit2 size={16} /></button>
                        <button className={`${styles.iconBtn} ${styles.dangerBtn}`} title="Xóa" onClick={() => setDeleteTarget(a)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && currentAppointments.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Cập nhật lịch hẹn' : 'Tạo lịch hẹn'}</h2>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={editing ? handleSubmit : handleCreate}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mã lịch hẹn</label>
                  <input className={styles.formInput} value={editing?.appointmentCode || ''} disabled />
                </div>
                {!editing && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Lưu ý</label>
                    <input className={styles.formInput} value="Bệnh nhân sẽ tự đăng ký bác sĩ" disabled />
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bác sĩ</label>
                  <select className={styles.formSelect} value={form.doctorId} onChange={e => setForm({...form, doctorId: e.target.value})}>
                    <option value="">-- Chọn --</option>
                    {doctors.map(d => <option key={d.doctorId} value={d.doctorId}>{d.fullName}</option>)}
                  </select>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ngày hẹn</label>
                    <input className={styles.formInput} type="date" value={form.appointmentDate} onChange={e => setForm({...form, appointmentDate: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Giờ hẹn</label>
                    <input className={styles.formInput} type="time" value={form.appointmentTime} onChange={e => setForm({...form, appointmentTime: e.target.value})} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Lý do khám</label>
                  <textarea className={styles.formTextarea} rows={2} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Trạng thái</label>
                    <select className={styles.formSelect} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Lý do hủy</label>
                    <input className={styles.formInput} value={form.cancelReason} onChange={e => setForm({...form, cancelReason: e.target.value})} placeholder="Nếu hủy lịch hẹn" />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Hủy</button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? 'Đang xử lý...' : (editing ? 'Cập nhật' : 'Tạo')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}><Trash2 size={24} /></div>
            <h3 className={styles.confirmTitle}>Xóa lịch hẹn</h3>
            <p className={styles.confirmText}>Xóa lịch hẹn <strong>{deleteTarget.appointmentCode}</strong>?</p>
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

export default Appointments;
