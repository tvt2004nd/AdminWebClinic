import { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '../../api';
import Pagination from '../../components/Pagination/Pagination';
import styles from './Users.module.css';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  roleId: '',
  isActive: true,
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const pageSize = 10;

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      params.set('page', String(page ?? 0));
      params.set('size', String(pageSize));
      const res = await fetchWithAuth(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.content);
        setPage(data.number !== undefined ? data.number : (data.page || 0));
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      }
    } catch {
      showToast('Không thể tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  }, [keyword, page]);

  const fetchRoles = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/roles');
      if (res.ok) setRoles(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers]);

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || '',
      roleId: u.roleId != null ? String(u.roleId) : '',
      isActive: u.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      roleId: form.roleId ? Number(form.roleId) : null,
      isActive: form.isActive,
    };
    try {
      const res = await fetchWithAuth(`/api/admin/users/${editing.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast('Cập nhật người dùng thành công', 'success');
        setModalOpen(false);
        fetchUsers();
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

  const toggleActive = async (u) => {
    try {
      const res = await fetchWithAuth(`/api/admin/users/${u.userId}/activate`, { method: 'PATCH' });
      if (res.ok) {
        showToast(u.isActive ? 'Đã vô hiệu hóa người dùng' : 'Đã kích hoạt người dùng', 'success');
        fetchUsers();
      }
    } catch {
      showToast('Không thể thay đổi trạng thái', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetchWithAuth(`/api/admin/users/${deleteTarget.userId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Đã xóa người dùng', 'success');
        setDeleteTarget(null);
        fetchUsers();
      } else {
        showToast('Không thể xóa người dùng', 'error');
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
          <h1 className={styles.title}>Quản lý Tài khoản</h1>
          <p className={styles.subtitle}>Quản lý người dùng, phân quyền và trạng thái hoạt động.</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
            />
          </div>
          <span className={styles.totalCount}>Tổng: {totalElements}</span>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Đang tải...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Không tìm thấy người dùng nào</td></tr>
              ) : users.map((u) => (
                <tr key={u.userId}>
                  <td className={styles.fw500}>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '--'}</td>
                  <td><span className={styles.roleBadge}>{u.roleName}</span></td>
                  <td>
                    <span className={`${styles.badge} ${u.isActive ? '' : styles.badgeInactive}`}>
                      {u.isActive ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} title="Sửa" onClick={() => openEdit(u)}>
                        <Edit2 size={16} />
                      </button>
                      <button className={`${styles.iconBtn} ${styles.dangerBtn}`} title={u.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} onClick={() => toggleActive(u)}>
                        {u.isActive ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                      </button>
                      <button className={`${styles.iconBtn} ${styles.dangerBtn}`} title="Xóa" onClick={() => setDeleteTarget(u)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && users.length > 0 && (
          <Pagination
            currentPage={page + 1}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p - 1)}
          />
        )}
      </div>

      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Sửa thông tin người dùng</h2>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Họ và tên</label>
                  <input className={styles.formInput} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <input className={styles.formInput} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Số điện thoại</label>
                    <input className={styles.formInput} placeholder="VD: 0123456789" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Vai trò</label>
                  <select className={styles.formSelect} value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                    <option value="">-- Chọn vai trò --</option>
                    {roles.map((r) => (
                      <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.checkboxGroup}>
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  <label htmlFor="isActive">Đang hoạt động</label>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Hủy</button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? 'Đang xử lý...' : 'Cập nhật'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}><Trash2 size={24} /></div>
            <h3 className={styles.confirmTitle}>Xóa người dùng</h3>
            <p className={styles.confirmText}>Bạn có chắc muốn xóa <strong>{deleteTarget.fullName}</strong>?</p>
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

export default Users;
