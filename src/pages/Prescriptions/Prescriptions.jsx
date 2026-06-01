import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '../../api';
import styles from './Prescriptions.module.css';

const API_BASE = '/api/admin/medications';

const TYPE_OPTIONS = [
  { value: '', label: '-- Chọn loại --' },
  { value: 'ORAL', label: 'Thuốc uống' },
  { value: 'TOPICAL', label: 'Thuốc bôi' },
  { value: 'OTHER', label: 'Khác' },
];

const typeLabels = {
  ORAL: 'Thuốc uống',
  TOPICAL: 'Thuốc bôi',
  OTHER: 'Khác',
};

const emptyForm = {
  medCode: '',
  medName: '',
  categoryId: '',
  activeIngredient: '',
  dosageForm: '',
  unit: '',
  price: '',
  stockQuantity: '',
  isActive: true,
  medicationType: '',
};

const Prescriptions = () => {
  const [medications, setMedications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMedications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      params.set('page', String(page ?? 0));
      params.set('size', String(pageSize));
      const url = `${API_BASE}?${params}`;
      const res = await fetchWithAuth(url);
      if (res.ok) {
        const data = await res.json();
        setMedications(data.content);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      }
    } catch {
      showToast('Không thể tải danh sách thuốc', 'error');
    } finally {
      setLoading(false);
    }
  }, [keyword, page]);

  const fetchCategories = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/categories`);
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch {}
  };

  useEffect(() => {
    fetchMedications();
    fetchCategories();
  }, [fetchMedications]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (med) => {
    setEditing(med);
    setForm({
      medCode: med.medCode,
      medName: med.medName,
      categoryId: med.categoryId != null ? String(med.categoryId) : '',
      activeIngredient: med.activeIngredient || '',
      dosageForm: med.dosageForm || '',
      unit: med.unit || '',
      price: String(med.price),
      stockQuantity: String(med.stockQuantity ?? ''),
      isActive: med.isActive,
      medicationType: med.medicationType || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.medCode.trim()) errors.medCode = 'Vui lòng nhập mã thuốc';
    if (!form.medName.trim()) errors.medName = 'Vui lòng nhập tên thuốc';
    if (!form.price || Number(form.price) < 0) errors.price = 'Giá phải >= 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const body = {
      medCode: form.medCode.trim(),
      medName: form.medName.trim(),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      activeIngredient: form.activeIngredient.trim() || null,
      dosageForm: form.dosageForm.trim() || null,
      unit: form.unit.trim() || null,
      price: Number(form.price),
      stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : 0,
      isActive: form.isActive,
      medicationType: form.medicationType || null,
    };

    try {
      const url = editing ? `${API_BASE}/${editing.medicationId}` : API_BASE;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast(editing ? 'Cập nhật thuốc thành công' : 'Thêm thuốc thành công', 'success');
        setModalOpen(false);
        fetchMedications();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Có lỗi xảy ra', 'error');
      }
    } catch {
      showToast('Không thể kết nối máy chủ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fileInputRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetchWithAuth(`${API_BASE}/import`, { method: 'POST', body: formData });
      const data = await res.json();
      setImportResult(data);
      if (data.successCount > 0) fetchMedications();
    } catch {
      showToast('Không thể kết nối máy chủ', 'error');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetchWithAuth(`${API_BASE}/${deleteTarget.medicationId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Đã xóa thuốc', 'success');
        setDeleteTarget(null);
        fetchMedications();
      } else {
        showToast('Không thể xóa thuốc', 'error');
      }
    } catch {
      showToast('Không thể kết nối máy chủ', 'error');
    }
  };

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.message}
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý Thuốc</h1>
          <p className={styles.subtitle}>Thêm, sửa, xóa thông tin thuốc trong hệ thống.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button
            className={styles.secondaryBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload size={20} />
            <span>{importing ? 'Đang nhập...' : 'Import CSV'}</span>
          </button>
          <button className={styles.primaryBtn} onClick={openAdd}>
            <Plus size={20} />
            <span>Thêm Thuốc Mới</span>
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, tên hoặc hoạt chất..."
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã thuốc</th>
                <th>Ảnh</th>
                <th>Tên thuốc</th>
                <th>Danh mục</th>
                <th>Đơn vị</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Đang tải...</td></tr>
              ) : medications.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Chưa có thuốc nào</td></tr>
              ) : medications.map((med) => (
                <tr key={med.medicationId}>
                  <td className={styles.fw500}>{med.medCode}</td>
                  <td>
                    {med.imageUrl ? (
                      <img src={med.imageUrl.startsWith('http') ? med.imageUrl : `http://localhost:8080/uploads/${med.imageUrl.replace(/^\/uploads\//, '')}`} alt={med.medName} className={styles.medThumb} />
                    ) : <span className={styles.noImg}>--</span>}
                  </td>
                  <td>
                    <div className={styles.medInfo}>
                      <span className={styles.medName}>{med.medName}</span>
                      {med.activeIngredient && <span className={styles.medCode}>Hoạt chất: {med.activeIngredient}</span>}
                    </div>
                  </td>
                  <td>
                    {med.medicationType
                      ? <span className={`${styles.badge} ${med.medicationType === 'ORAL' ? styles.badgeOral : styles.badgeTopical}`}>
                          {typeLabels[med.medicationType] || med.medicationType}
                        </span>
                      : <span style={{ color: 'var(--text-tertiary)' }}>--</span>}
                  </td>
                  <td>{med.unit || '--'}</td>
                  <td className={styles.price}>{Number(med.price).toLocaleString('vi-VN')}₫</td>
                  <td className={med.stockQuantity != null && med.stockQuantity <= 10 ? styles.stockLow : styles.stockOk}>
                    {med.stockQuantity ?? 0}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${med.stockQuantity > 0 ? styles.badgeInStock : styles.badgeOutOfStock}`}>
                      {med.stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} title="Sửa" onClick={() => openEdit(med)}>
                        <Edit2 size={16} />
                      </button>
                      <button className={`${styles.iconBtn} ${styles.dangerBtn}`} title="Xóa" onClick={() => setDeleteTarget(med)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px',
          fontSize: '0.875rem', color: 'var(--text-secondary)'
        }}>
          <span>Tổng số: {totalElements} thuốc</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              style={{
                padding: '6px 12px', border: '1px solid var(--border-color)',
                borderRadius: 6, background: page === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                color: page === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8125rem'
              }}
            >Trước</button>
            {(() => {
              const items = [];
              const total = totalPages;
              const current = page;
              const addPage = (i) => items.push(
                <button key={i} onClick={() => setPage(i)} style={{
                  width: 32, height: 32, border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  background: i === current ? 'var(--primary)' : 'var(--bg-primary)',
                  color: i === current ? '#fff' : 'var(--text-primary)',
                  fontWeight: i === current ? 600 : 400,
                  cursor: 'pointer', fontSize: '0.8125rem'
                }}>{i + 1}</button>
              );
              const addEllipsis = (k) => items.push(
                <span key={`e${k}`} style={{ padding: '0 4px', color: 'var(--text-tertiary)' }}>...</span>
              );
              addPage(0);
              if (total <= 7) {
                for (let i = 1; i < total - 1; i++) addPage(i);
              } else {
                if (current <= 2) {
                  for (let i = 1; i <= 3; i++) addPage(i);
                  addEllipsis(1);
                } else if (current >= total - 3) {
                  addEllipsis(2);
                  for (let i = total - 4; i < total - 1; i++) addPage(i);
                } else {
                  addEllipsis(3);
                  addPage(current - 1);
                  addPage(current);
                  addPage(current + 1);
                  addEllipsis(4);
                }
              }
              if (total > 1) addPage(total - 1);
              return items;
            })()}
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              style={{
                padding: '6px 12px', border: '1px solid var(--border-color)',
                borderRadius: 6, background: page >= totalPages - 1 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                color: page >= totalPages - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '0.8125rem'
              }}
            >Sau</button>
          </div>
        </div>
      )}
      </div>

      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Sửa thông tin thuốc' : 'Thêm thuốc mới'}</h2>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mã thuốc *</label>
                    <input
                      className={styles.formInput}
                      placeholder="VD: MED001"
                      value={form.medCode}
                      onChange={(e) => setForm({ ...form, medCode: e.target.value })}
                    />
                    {formErrors.medCode && <span className={styles.formError}>{formErrors.medCode}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Đơn vị</label>
                    <input
                      className={styles.formInput}
                      placeholder="VD: Viên, Chai, Tuýp"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tên thuốc *</label>
                  <input
                    className={styles.formInput}
                    placeholder="VD: Amoxicillin 500mg"
                    value={form.medName}
                    onChange={(e) => setForm({ ...form, medName: e.target.value })}
                  />
                  {formErrors.medName && <span className={styles.formError}>{formErrors.medName}</span>}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Danh mục</label>
                    <select
                      className={styles.formSelect}
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Loại thuốc</label>
                    <select
                      className={styles.formSelect}
                      value={form.medicationType}
                      onChange={(e) => setForm({ ...form, medicationType: e.target.value })}
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hoạt chất</label>
                  <input
                    className={styles.formInput}
                    placeholder="VD: Amoxicillin"
                    value={form.activeIngredient}
                    onChange={(e) => setForm({ ...form, activeIngredient: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Giá *</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      min="0"
                      placeholder="VD: 15000"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                    {formErrors.price && <span className={styles.formError}>{formErrors.price}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tồn kho</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      min="0"
                      placeholder="VD: 100"
                      value={form.stockQuantity}
                      onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive">Đang hoạt động</label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Hủy</button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>
                  {saving ? 'Đang xử lý...' : editing ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importResult && (
        <div className={styles.overlay} onClick={() => setImportResult(null)}>
          <div className={styles.modal} style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Kết quả import CSV</h2>
              <button className={styles.closeBtn} onClick={() => setImportResult(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody} style={{ alignItems: 'center', textAlign: 'center' }}>
              {importResult.errorCount === 0 ? (
                <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: 8 }} />
              ) : (
                <AlertCircle size={48} style={{ color: importResult.successCount > 0 ? 'var(--warning)' : 'var(--danger)', marginBottom: 8 }} />
              )}
              <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
                {importResult.successCount > 0
                  ? `Đã import thành công ${importResult.successCount} thuốc`
                  : 'Import thất bại'}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Tổng: {importResult.totalRows} dòng | Thành công: {importResult.successCount} | Lỗi: {importResult.errorCount}
              </div>
              {importResult.errors?.length > 0 && (
                <div style={{ width: '100%', maxHeight: 200, overflowY: 'auto', textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 8, color: 'var(--danger)' }}>Chi tiết lỗi:</div>
                  {importResult.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                      Dòng {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalFooter} style={{ justifyContent: 'center' }}>
              <button className={styles.primaryBtn} onClick={() => setImportResult(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <Trash2 size={24} />
            </div>
            <h3 className={styles.confirmTitle}>Xóa thuốc</h3>
            <p className={styles.confirmText}>
              Bạn có chắc muốn xóa thuốc <strong>{deleteTarget.medName}</strong>?
            </p>
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

export default Prescriptions;
