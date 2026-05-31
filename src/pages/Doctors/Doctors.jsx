import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, CalendarDays } from 'lucide-react';
import { fetchWithAuth } from '../../api';
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
  const [scheduleForm, setScheduleForm] = useState({
    workDate: '',
    shiftStart: '',
    shiftEnd: '',
    status: 'AVAILABLE',
  });
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
    } catch {} finally { setLoading(false); }
  }, [keyword, specialtyId]);

  const fetchSpecialties = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/specialties');
      if (res.ok) setSpecialties(await res.json());
    } catch {}
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
      biography: '',
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
      status: 'AVAILABLE',
    });
    setScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setSelectedDoctor(null);
    setScheduleModalOpen(false);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    if (!scheduleForm.workDate || !scheduleForm.shiftStart || !scheduleForm.shiftEnd) {
      showToast('Vui lòng điền đầy đủ ngày và giờ', 'error');
      return;
    }
    setScheduleSaving(true);
    try {
      const res = await fetchWithAuth('/api/admin/doctor-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.doctorId,
          workDate: scheduleForm.workDate,
          shiftStart: scheduleForm.shiftStart,
          shiftEnd: scheduleForm.shiftEnd,
          status: scheduleForm.status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Có lỗi khi tạo lịch khám');
      }
      showToast('Tạo lịch khám thành công', 'success');
      closeScheduleModal();
    } catch (error) {
      showToast(error.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setScheduleSaving(false);
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
              {loading ? <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text-tertiary)'}}>Đang tải...</td></tr>
              : doctors.length === 0 ? <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text-tertiary)'}}>Không tìm thấy</td></tr>
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
                  <input className={styles.formInput} value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <input className={styles.formInput} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Số điện thoại</label>
                    <input className={styles.formInput} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                </div>
                {!editing && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mật khẩu</label>
                    <input className={styles.formInput} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Mặc định: 123456" />
                  </div>
                )}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Chuyên khoa</label>
                    <select className={styles.formSelect} value={form.specialtyId} onChange={e => setForm({...form, specialtyId: e.target.value})}>
                      <option value="">-- Chọn --</option>
                      {specialties.map(s => <option key={s.specialtyId} value={s.specialtyId}>{s.specialtyName}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Số CCHN</label>
                    <input className={styles.formInput} value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Chức danh</label>
                    <input className={styles.formInput} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="VD: BSCKII" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Số năm KN</label>
                    <input className={styles.formInput} type="number" min="0" value={form.experienceYears} onChange={e => setForm({...form, experienceYears: e.target.value})} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phí khám (VNĐ)</label>
                  <input className={styles.formInput} type="number" min="0" value={form.consultationFee} onChange={e => setForm({...form, consultationFee: e.target.value})} />
                </div>
                {!editing && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tiểu sử</label>
                    <textarea className={styles.formTextarea} rows={3} value={form.biography} onChange={e => setForm({...form, biography: e.target.value})} />
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
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Tạo lịch khám cho {selectedDoctor.fullName}</h2>
              <button className={styles.closeBtn} onClick={closeScheduleModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ngày khám</label>
                    <input className={styles.formInput} type="date" value={scheduleForm.workDate} onChange={(e) => setScheduleForm({ ...scheduleForm, workDate: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Giờ bắt đầu</label>
                    <input className={styles.formInput} type="time" value={scheduleForm.shiftStart} onChange={(e) => setScheduleForm({ ...scheduleForm, shiftStart: e.target.value })} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Giờ kết thúc</label>
                  <input className={styles.formInput} type="time" value={scheduleForm.shiftEnd} onChange={(e) => setScheduleForm({ ...scheduleForm, shiftEnd: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Trạng thái</label>
                  <select className={styles.formSelect} value={scheduleForm.status} onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.value })}>
                    <option value="AVAILABLE">Còn lịch</option>
                    <option value="FULL">Đã có người đặt</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={closeScheduleModal}>Hủy</button>
                <button type="submit" className={styles.submitBtn} disabled={scheduleSaving}>{scheduleSaving ? 'Đang tạo...' : 'Tạo lịch khám'}</button>
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
