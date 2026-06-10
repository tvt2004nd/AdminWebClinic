import { Users, Stethoscope, CalendarCheck, TrendingUp, Smile, FileText, XCircle } from 'lucide-react';
import styles from './Dashboard.module.css';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import RevenueChart from '../../components/RevenueChart/RevenueChart';
import CombinedStats from '../../components/CombinedStats/CombinedStats';

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
  const [stats, setStats] = useState({ doctors: 0, patients: 0, appointments: 0, medicalRecords: 0 });
  const [revenue, setRevenue] = useState({ monthRevenue: 0, yearRevenue: 0, month: null, year: null });
  const [monthlyRevenue, setMonthlyRevenue] = useState(null);

  useEffect(() => {
    api.get('/api/dashboard').then(res => setStats(res.data)).catch(() => {});
    api.get('/api/stats/revenue').then(res => setRevenue(res.data)).catch(() => {});
    api.get('/api/stats/revenue/monthly').then(res => setMonthlyRevenue(res.data)).catch(() => {});
  }, []);

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
          value={stats.patients.toLocaleString()}
          trend=""
          icon={Users}
          colorClass={styles.iconBlue}
        />
        <StatCard 
          title="Bác sĩ" 
          value={stats.doctors}
          trend=""
          icon={Stethoscope}
          colorClass={styles.iconTeal}
        />
        {/* Revenue chart is shown below */}
        <StatCard 
          title="Lịch khám (tổng)" 
          value={stats.appointments}
          trend=""
          icon={CalendarCheck}
          colorClass={styles.iconWarning}
        />
        <StatCard 
          title="Hồ sơ y tế" 
          value={stats.medicalRecords}
          trend=""
          icon={TrendingUp}
          colorClass={styles.iconSuccess}
        />
      </div>

      <div className={styles.satisfactionSection}>
        <div className={styles.satisfactionCard}>
          <div>
            <h3 className={styles.cardTitle}>Tỉ lệ theo dõi bệnh</h3>
            <ul className={styles.diseaseList}>
              <li className={styles.diseaseItem}>Mụn trứng cá: <strong>78%</strong></li>
              <li className={styles.diseaseItem}>Viêm da cơ địa: <strong>64%</strong></li>
              <li className={styles.diseaseItem}>Nấm da: <strong>53%</strong></li>
            </ul>
            <p className={styles.smallText}>Tỉ lệ bệnh nhân quay lại / theo dõi sau khám, theo loại bệnh</p>
          </div>
          <div className={`${styles.statIcon} ${styles.iconTeal}`}>
            <FileText size={28} />
          </div>
        </div>

        <div className={styles.satisfactionCard}>
          <div>
            <h3 className={styles.cardTitle}>Tỉ lệ Huỷ lịch hẹn</h3>
            <div className={styles.satisfactionPercent}>6%</div>
            <p className={styles.smallText}>Tỉ lệ huỷ so với tổng lịch hẹn (xem chi tiết ở phần Lịch hẹn)</p>
            <a href="/appointments" className={styles.cancelLink}>Xem Lịch hẹn</a>
          </div>
          <div className={`${styles.statIcon} ${styles.iconWarning}`}>
            <XCircle size={28} />
          </div>
        </div>
      </div>

      <div className={styles.contentGridSingle}>
        <div className={styles.cardFull}>
          <CombinedStats />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
