import { Bell, Search, User, Menu } from 'lucide-react';
import styles from './Header.module.css';

const Header = ({ toggleSidebar }) => {
  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button className={styles.menuBtn} onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.iconBtn}>
          <Bell size={20} />
          <span className={styles.badge}></span>
        </button>
        <div className={styles.profile}>
          <div className={styles.avatar}>
            <User size={20} />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Quản trị viên</span>
            <span className={styles.userRole}>Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
