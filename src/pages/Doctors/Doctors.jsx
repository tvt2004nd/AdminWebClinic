import { Plus, Search, Edit2, Trash2, MoreVertical } from 'lucide-react';
import styles from './Doctors.module.css';

const mockDoctors = [
  { id: 1, code: 'DOC001', name: 'BS. Nguyễn Văn A', specialty: 'Da liễu tổng quát', experience: 10, rating: 4.8 },
  { id: 2, code: 'DOC002', name: 'BS. Trần Thị B', specialty: 'Thẩm mỹ nội khoa', experience: 5, rating: 4.5 },
  { id: 3, code: 'DOC003', name: 'BS. Lê Văn C', specialty: 'Da liễu nhi', experience: 8, rating: 4.9 },
  { id: 4, code: 'DOC004', name: 'BS. Phạm Thị D', specialty: 'Da liễu tổng quát', experience: 12, rating: 4.7 },
];

const Doctors = () => {
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
              <option value="Da liễu tổng quát">Da liễu tổng quát</option>
              <option value="Thẩm mỹ nội khoa">Thẩm mỹ nội khoa</option>
              <option value="Da liễu nhi">Da liễu nhi</option>
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
                <th>Đánh giá</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockDoctors.map((doc) => (
                <tr key={doc.id}>
                  <td className={styles.fw500}>{doc.code}</td>
                  <td>
                    <div className={styles.doctorInfo}>
                      <div className={styles.avatar}>{doc.name.charAt(4)}</div>
                      <span>{doc.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.badge}>{doc.specialty}</span>
                  </td>
                  <td>{doc.experience} năm</td>
                  <td>
                    <div className={styles.rating}>
                      <span>⭐</span> {doc.rating}
                    </div>
                  </td>
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
              ))}
            </tbody>
          </table>
        </div>
        
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>Đang hiển thị 1 đến 4 trong số 24 kết quả</span>
          <div className={styles.pageControls}>
            <button className={styles.pageBtn} disabled>Trước</button>
            <button className={`${styles.pageBtn} ${styles.activePage}`}>1</button>
            <button className={styles.pageBtn}>2</button>
            <button className={styles.pageBtn}>3</button>
            <button className={styles.pageBtn}>Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Doctors;
