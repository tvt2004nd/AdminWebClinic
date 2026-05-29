import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  UserSquare2, 
  CalendarCheck, 
  FileText,
  Pill,
  CreditCard,
  LogOut,
  X
} from 'lucide-react';
import styles from './Sidebar.module.css';

const menuItems = [
  { path: '/dashboard', name: 'Tổng quan', icon: LayoutDashboard },
  { path: '/users', name: 'Tài khoản', icon: Users },
  { path: '/doctors', name: 'Bác sĩ', icon: Stethoscope },
  { path: '/patients', name: 'Bệnh nhân', icon: UserSquare2 },
  { path: '/appointments', name: 'Lịch hẹn', icon: CalendarCheck },
  { path: '/records', name: 'Bệnh án', icon: FileText },
  { path: '/prescriptions', name: 'Đơn thuốc', icon: Pill },
  { path: '/invoices', name: 'Hóa đơn', icon: CreditCard },
];

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.logo}>
        <div className={styles.logoWrapper}>
          <div className={styles.logoIcon}>
            <span className={styles.logoDot}></span>
          </div>
          <h2>DermaCare</h2>
        </div>
        <button className={styles.closeBtn} onClick={closeSidebar}>
          <X size={24} />
        </button>
      </div>

      <nav className={styles.nav}>
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
                  onClick={closeSidebar}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
