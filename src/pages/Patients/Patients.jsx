import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, Eye } from 'lucide-react';
import { fetchWithAuth } from '../../api';
import Pagination from '../../components/Pagination/Pagination';
import styles from './Patients.module.css';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  bloodType: '',
  insuranceNumber: '',
  emergencyContact: '',
  emergencyPhone: '',
  medicalHistory: '',
};

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPatients = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      const res = await fetchWithAuth(`/api/admin/patients?${params}`);
      if (res.ok) setPatients(await res.json());
    } catch {
      showToast('Không thể tải danh sách bệnh nhân', 'error');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => { setCurrentPage(1); }, [keyword]);

  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentPatients = patients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(patients.length / pageSize);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, password: '' });
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      fullName: p.fullName || '',
      email: p.email || '',
      phone: p.phone || '',
      password: '',
      bloodType: p.bloodType || '',
      insuranceNumber: p.insuranceNumber || '',
      emergencyContact: p.emergencyContact || '',
      emergencyPhone: p.emergencyPhone || '',
      medicalHistory: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { showToast('Họ tên không được để trống', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetchWithAuth(`/api/admin/patients/${editing.patientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            bloodType: form.bloodType || null,
            insuranceNumber: form.insuranceNumber || null,
            emergencyContact: form.emergencyContact || null,
            emergencyPhone: form.emergencyPhone || null,
          }),
        });
        if (!res.ok) throw new Error();
        showToast('Cập nhật bệnh nhân thành công', 'success');
      } else {
        const res = await fetchWithAuth('/api/admin/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            password: form.password || '123456',
            bloodType: form.bloodType || null,
            insuranceNumber: form.insuranceNumber || null,
            emergencyContact: form.emergencyContact || null,
            emergencyPhone: form.emergencyPhone || null,
            medicalHistory: form.medicalHistory || null,
          }),
        });
        if (!res.ok) throw new Error();
        showToast('Thêm bệnh nhân thành công', 'success');
      }
      setModalOpen(false);
      fetchPatients();
    } catch {
      showToast('Có lỗi xảy ra', 'error');
    } finally {
      setSaving(false);
    }
  };

  const viewDetail = async (patientId) => {
    try {
      const res = await fetchWithAuth(`/api/admin/patients/${patientId}`);
      if (res.ok) setDetail(await res.json());
    } catch {
      showToast('Không thể tải thông tin bệnh nhân', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetchWithAuth(`/api/admin/patients/${deleteTarget.patientId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Đã xóa bệnh nhân', 'success');
      setDeleteTarget(null);
      fetchPatients();
    } catch {
      showToast('Không thể xóa bệnh nhân', 'error');
    }
  };

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>{toast.message}</div>}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý Bệnh nhân</h1>
          <p className={styles.subtitle}>Quản lý thông tin bệnh nhân trong hệ thống.</p>
        </div>
        <button className={styles.primaryBtn} onClick={openAdd}>
          <Plus size={20} /><span>Thêm Bệnh nhân</span>
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <span className={styles.totalCount}>Tổng: {patients.length}</span>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã BN</th><th>Họ tên</th><th>Email</th><th>Điện thoại</th><th>Giới tính</th><th>Nhóm máu</th><th>Bảo hiểm</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--text-tertiary)' }}>Đang tải...</td></tr>
              : currentPatients.length === 0 ? <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--text-tertiary)' }}>Không tìm thấy</td></tr>
              : currentPatients.map(p => (
                <tr key={p.patientId}>
                  <td className={styles.fw500}>{p.patientCode}</td>
                  <td>{p.fullName}</td>
                  <td>{p.email}</td>
                  <td>{p.phone || '--'}</td>
                  <td>{p.gender === 'M' ? 'Nam' : p.gender === 'F' ? 'Nữ' : '--'}</td>
                  <td><span className={styles.bloodBadge}>{p.bloodType || '--'}</span></td>
                  <td>{p.insuranceNumber || '--'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} title="Xem" onClick={() => viewDetail(p.patientId)}><Eye size={16} /></button>
                      <button className={styles.iconBtn} title="Sửa" onClick={() => openEdit(p)}><Edit2 size={16} /></button>
                      <button className={`${styles.iconBtn} ${styles.dangerBtn}`} title="Xóa" onClick={() => setDeleteTarget(p)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && currentPatients.length > 0 && (
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
              <h2 className={styles.modalTitle}>{editing ? 'Sửa bệnh nhân' : 'Thêm bệnh nhân'}</h2>
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
                    <label className={styles.formLabel}>Nhóm máu</label>
                    <select className={styles.formSelect} value={form.bloodType} onChange={e => setForm({...form, bloodType: e.target.value})}>
                      <option value="">-- Chọn --</option>
                      <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option>
                      <option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option><option value="UNKNOWN">UNKNOWN</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Số bảo hiểm</label>
                    <input className={styles.formInput} value={form.insuranceNumber} onChange={e => setForm({...form, insuranceNumber: e.target.value})} />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Liên hệ khẩn cấp</label>
                    <input className={styles.formInput} value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>SĐT khẩn cấp</label>
                    <input className={styles.formInput} value={form.emergencyPhone} onChange={e => setForm({...form, emergencyPhone: e.target.value})} />
                  </div>
                </div>
                {!editing && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tiền sử bệnh</label>
                    <textarea className={styles.formTextarea} rows={3} value={form.medicalHistory} onChange={e => setForm({...form, medicalHistory: e.target.value})} />
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

      {detail && (
        <div className={styles.overlay} onClick={() => setDetail(null)}>
          <div className={styles.modal} style={{maxWidth: 640}} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Chi tiết bệnh nhân</h2>
              <button className={styles.closeBtn} onClick={() => setDetail(null)}><X size={20} /></button>
            </div>
            <div className={styles.detailBody}>
              <div className={styles.detailGrid}>
                {[{l:'Mã BN', v:detail.patientCode},{l:'Họ tên', v:detail.fullName},{l:'Email', v:detail.email},{l:'Điện thoại', v:detail.phone},
                  {l:'Giới tính', v:detail.gender === 'M' ? 'Nam' : detail.gender === 'F' ? 'Nữ' : '--'},{l:'Ngày sinh', v:detail.dateOfBirth || '--'},
                  {l:'Địa chỉ', v:detail.address || '--'},{l:'Nhóm máu', v:detail.bloodType || '--'},{l:'Bảo hiểm', v:detail.insuranceNumber || '--'},
                  {l:'LH khẩn cấp', v:detail.emergencyContact || '--'},{l:'SĐT khẩn cấp', v:detail.emergencyPhone || '--'},{l:'Ngày tạo', v:detail.createdAt || '--'}
                ].map((item, i) => (
                  <div key={i} className={styles.detailItem}>
                    <span className={styles.detailLabel}>{item.l}</span>
                    <span className={styles.detailValue}>{item.v}</span>
                  </div>
                ))}
              </div>
              {detail.medicalHistory && (
                <div className={styles.medicalHistorySection}>
                  <h4 className={styles.sectionTitle}>Tiền sử bệnh</h4>
                  <p className={styles.medicalHistoryText}>{detail.medicalHistory}</p>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}><Trash2 size={24} /></div>
            <h3 className={styles.confirmTitle}>Xóa bệnh nhân</h3>
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

export default Patients;
