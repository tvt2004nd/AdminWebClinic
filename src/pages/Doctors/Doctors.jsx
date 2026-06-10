import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, MoreVertical } from 'lucide-react';
import styles from './Doctors.module.css';
import api from '../../services/api';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/api/doctors')
      .then((res) => setDoctors(res.data))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý Bác sĩ</h1>
          <p className={styles.subtitle}>Quản lý danh sách bác sĩ, chuyên khoa và lịch làm việc.</p>
        </div>
        <button className={styles.primaryBtn}>
          <Plus size={20} />
          <span>Thêm Bác sĩ Mới</span>
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên hoặc mã bác sĩ..." 
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filters}>
            <select className={styles.select}>
              <option value="">Tất cả Chuyên khoa</option>
            </select>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã Bác sĩ</th>
                <th>Họ và Tên</th>
                <th>Chuyên khoa</th>
                <th>Kinh nghiệm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}>Đang tải...</td></tr>
              ) : doctors.length === 0 ? (
                <tr><td colSpan={5}>Không có bác sĩ</td></tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.doctorId}>
                    <td className={styles.fw500}>{doc.doctorCode}</td>
                    <td>
                      <div className={styles.doctorInfo}>
                        <div className={styles.avatar}>{doc.specialtyName ? doc.specialtyName.charAt(0) : 'B'}</div>
                        <span>{doc.title ? doc.title + ' ' : ''}{doc.userFullName || doc.userName || ''}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.badge}>{doc.specialtyName}</span>
                    </td>
                    <td>{doc.experienceYears || 0} năm</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.iconBtn} title="Sửa">
                          <Edit2 size={16} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.dangerBtn}`} title="Xóa">
                          <Trash2 size={16} />
                        </button>
                        <button className={styles.iconBtn}>
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Doctors;
