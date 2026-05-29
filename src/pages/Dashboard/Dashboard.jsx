import { Users, Stethoscope, CalendarCheck, TrendingUp } from 'lucide-react';
import styles from './Dashboard.module.css';

const StatCard = ({ title, value, trend, icon: Icon, colorClass }) => (
  <div className={styles.statCard}>
    <div className={styles.statInfo}>
      <span className={styles.statTitle}>{title}</span>
      <h3 className={styles.statValue}>{value}</h3>
      <div className={styles.statTrend}>
        <TrendingUp size={16} className={styles.trendIcon} />
        <span>{trend}</span>
      </div>
    </div>
    <div className={`${styles.statIcon} ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tổng quan Hệ thống</h1>
          <p className={styles.subtitle}>Chào mừng trở lại, dưới đây là tình hình hoạt động của DermaCare hôm nay.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard 
          title="Tổng Bệnh nhân" 
          value="1,284" 
          trend="+12% so với tháng trước" 
          icon={Users}
          colorClass={styles.iconBlue}
        />
        <StatCard 
          title="Bác sĩ Hoạt động" 
          value="24" 
          trend="+2 trong tháng này" 
          icon={Stethoscope}
          colorClass={styles.iconTeal}
        />
        <StatCard 
          title="Lịch khám Hôm nay" 
          value="86" 
          trend="14 đang chờ" 
          icon={CalendarCheck}
          colorClass={styles.iconWarning}
        />
        <StatCard 
          title="Doanh thu Tháng" 
          value="240.5M ₫" 
          trend="+18% so với tháng trước" 
          icon={TrendingUp}
          colorClass={styles.iconSuccess}
        />
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Lịch hẹn Gần đây</h3>
          <div className={styles.emptyState}>
            <CalendarCheck size={48} className={styles.emptyIcon} />
            <p>Đang tải lịch hẹn gần đây...</p>
          </div>
        </div>
        
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Thống kê Chẩn đoán AI</h3>
          <div className={styles.emptyState}>
            <Stethoscope size={48} className={styles.emptyIcon} />
            <p>Đang tải dữ liệu AI...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
