import { useState, useEffect, useCallback } from 'react';
import { Search, X, Eye, CheckCircle } from 'lucide-react';
import { fetchWithAuth } from '../../api';
import Pagination from '../../components/Pagination/Pagination';
import styles from './Invoices.module.css';

const STATUS_LABELS = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  PARTIAL: 'Thanh toán một phần',
  REFUNDED: 'Đã hoàn tiền',
  CANCELLED: 'Đã huỷ',
};

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'UNPAID', label: 'Chưa thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
];

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set('keyword', keyword);
      params.set('page', String(page ?? 0));
      params.set('size', String(pageSize));
      const res = await fetchWithAuth(`/api/admin/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        let list = data.content || [];
        if (statusFilter) {
          list = list.filter((inv) => inv.paymentStatus === statusFilter);
        }
        setInvoices(list);
        setPage(data.number !== undefined ? data.number : (data.page || 0));
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      }
    } catch {
      showToast('Không thể tải danh sách hóa đơn', 'error');
    } finally {
      setLoading(false);
    }
  }, [keyword, page, pageSize, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handlePay = async (invoiceId) => {
    if (!confirm('Xác nhận thanh toán hóa đơn này?')) return;
    setPaying(true);
    try {
      const detail = detailInvoice;
      const amount = detail ? detail.totalAmount : 0;
      const res = await fetchWithAuth(`/api/invoices/${invoiceId}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod: 'CASH' }),
      });
      if (res.ok) {
        showToast('Thanh toán thành công', 'success');
        setDetailInvoice(null);
        fetchInvoices();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Thanh toán thất bại', 'error');
      }
    } catch {
      showToast('Không thể kết nối máy chủ', 'error');
    } finally {
      setPaying(false);
    }
  };

  const fmtPrice = (v) => Number(v || 0).toLocaleString('vi-VN') + '₫';

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.message}
        </div>
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý Hóa đơn</h1>
          <p className={styles.subtitle}>Theo dõi và quản lý thanh toán hóa đơn khám bệnh.</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hóa đơn, tên bệnh nhân..."
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
            />
          </div>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <span className={styles.totalCount}>Tổng: {totalElements}</span>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã HD</th>
                <th>Bệnh nhân</th>
                <th>Bác sĩ</th>
                <th>Tiền thuốc</th>
                <th>Tổng cộng</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Đang tải...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Không tìm thấy hóa đơn nào</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.invoiceId}>
                  <td className={styles.fw500}>{inv.invoiceCode}</td>
                  <td>{inv.patientName}</td>
                  <td>{inv.doctorName || '--'}</td>
                  <td className={styles.price}>{fmtPrice(inv.medicationFee)}</td>
                  <td className={styles.price}>{fmtPrice(inv.totalAmount)}</td>
                  <td>
                    <span className={`${styles.badge} ${inv.paymentStatus === 'PAID' ? styles.badgePaid : styles.badgeUnpaid}`}>
                      {STATUS_LABELS[inv.paymentStatus] || inv.paymentStatus}
                    </span>
                  </td>
                  <td className={styles.date}>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('vi-VN') : '--'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} title="Xem chi tiết" onClick={() => setDetailInvoice(inv)}>
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && invoices.length > 0 && (
          <Pagination
            currentPage={page + 1}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p - 1)}
          />
        )}
      </div>

      {detailInvoice && (
        <div className={styles.overlay} onClick={() => setDetailInvoice(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Chi tiết hóa đơn</h2>
              <button className={styles.closeBtn} onClick={() => setDetailInvoice(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Mã hóa đơn</span>
                <span className={styles.detailValue}>{detailInvoice.invoiceCode}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Bệnh nhân</span>
                <span className={styles.detailValue}>{detailInvoice.patientName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Bác sĩ</span>
                <span className={styles.detailValue}>{detailInvoice.doctorName || '--'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Chẩn đoán</span>
                <span className={styles.detailValue}>{detailInvoice.diagnosis || '--'}</span>
              </div>
              <hr className={styles.divider} />
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tiền khám</span>
                <span className={styles.detailValue}>{fmtPrice(detailInvoice.consultationFee)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tiền thuốc</span>
                <span className={styles.detailValue}>{fmtPrice(detailInvoice.medicationFee)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Phí khác</span>
                <span className={styles.detailValue}>{fmtPrice(detailInvoice.otherFee)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Giảm giá</span>
                <span className={styles.detailValue} style={{ color: 'var(--danger)' }}>-{fmtPrice(detailInvoice.discount)}</span>
              </div>
              <hr className={styles.divider} />
              <div className={styles.detailRow}>
                <span className={styles.detailLabel} style={{ fontWeight: 700 }}>Tổng cộng</span>
                <span className={styles.detailValue} style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--primary-color)' }}>{fmtPrice(detailInvoice.totalAmount)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Trạng thái</span>
                <span className={`${styles.badge} ${detailInvoice.paymentStatus === 'PAID' ? styles.badgePaid : styles.badgeUnpaid}`}>
                  {STATUS_LABELS[detailInvoice.paymentStatus] || detailInvoice.paymentStatus}
                </span>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setDetailInvoice(null)}>Đóng</button>
              {detailInvoice.paymentStatus === 'UNPAID' && (
                <button className={styles.submitBtn} onClick={() => handlePay(detailInvoice.invoiceId)} disabled={paying}>
                  <CheckCircle size={18} />
                  <span>{paying ? 'Đang xử lý...' : 'Xác nhận thanh toán'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
