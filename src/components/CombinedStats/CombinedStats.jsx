import React, { useEffect, useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, CategoryScale, LinearScale, BarElement } from 'chart.js';
import styles from './CombinedStats.module.css';
import api from '../../services/api';

ChartJS.register(ArcElement, Tooltip, CategoryScale, LinearScale, BarElement);

const MONTH_COLORS = ['#06b6d4','#34d399','#60a5fa','#f59e0b','#fb7185','#ef4444','#a78bfa','#10b981','#fca5a5','#94a3b8','#cbd5e1','#7dd3fc'];

const CombinedStats = ({ year }) => {
  const [monthly, setMonthly] = useState(null);
  const [summary, setSummary] = useState(null);
  const y = year || new Date().getFullYear();

  useEffect(() => {
    let mounted = true;
    api.get(`/api/stats/revenue?year=${y}`).then(res => {
      if (!mounted) return;
      setSummary(res.data);
    }).catch(() => {});

    api.get(`/api/stats/revenue/monthly?year=${y}`).then(res => {
      if (!mounted) return;
      setMonthly(res.data);
    }).catch(() => {});

    return () => { mounted = false };
  }, [y]);

  if (!monthly || !summary) return (
    <div className={styles.cardCombined}><div className={styles.loading}>Đang tải số liệu...</div></div>
  );

  const labels = monthly.labels || [];
  const values = (monthly.data || []).map(v => Number(v));

  const pie = { labels, datasets: [{ data: values, backgroundColor: MONTH_COLORS, borderWidth: 0 }] };

  const bar = { labels, datasets: [{ label: `${summary.year} - VND`, data: values, backgroundColor: MONTH_COLORS, borderRadius: 6 }] };

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { callback: (v) => Number(v).toLocaleString('vi-VN') } }, y: { grid: { display: false } } },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => Number(ctx.parsed.x).toLocaleString('vi-VN') + ' đ' } } }
  };

  return (
    <div className={styles.cardCombined}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Doanh thu theo tháng — {summary.year}</h3>
        <div className={styles.totals}>Tháng: {summary.month} — <strong>{Number(summary.monthRevenue || 0).toLocaleString('vi-VN')} đ</strong> &nbsp; | &nbsp; Năm: <strong>{Number(summary.yearRevenue || 0).toLocaleString('vi-VN')} đ</strong></div>
      </div>

      <div className={styles.legendRow}>
        {labels.map((l, i) => (
          <div key={l} className={styles.legendItem}>
            <span className={styles.legendDot} style={{background: MONTH_COLORS[i % MONTH_COLORS.length]}}></span>
            <span className={styles.legendText}>{l}</span>
          </div>
        ))}
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.pieCol}>
          <Pie data={pie} options={{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}}} />
        </div>
        <div className={styles.barCol}>
          <Bar data={bar} options={barOptions} />
        </div>
      </div>
    </div>
  );
};

export default CombinedStats;
