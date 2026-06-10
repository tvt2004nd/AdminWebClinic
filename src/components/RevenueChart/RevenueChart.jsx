import { useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './RevenueChart.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const RevenueChart = ({ revenue, monthly }) => {
  const [type, setType] = useState('bar');

  // monthly: { year, labels: [...], data: [...] }
  const isMonthly = monthly && Array.isArray(monthly.data) && monthly.data.length > 0;

  // generate a color palette (cycle if more labels than colors)
  const basePalette = [
    '#06b6d4', // teal
    '#34d399', // green
    '#60a5fa', // blue
    '#f59e0b', // amber
    '#f97316', // orange
    '#ef4444', // red
    '#8b5cf6', // purple
    '#10b981', // emerald
    '#e879f9', // pink
    '#94a3b8', // slate
  ];

  const makeColors = (n) => {
    if (!n || n <= 0) return [];
    const colors = [];
    for (let i = 0; i < n; i++) {
      if (i < basePalette.length) colors.push(basePalette[i]);
      else {
        // generate additional color by shifting hue
        const hue = (i * 47) % 360; // step hue
        colors.push(`hsl(${hue} 70% 55%)`);
      }
    }
    return colors;
  };

  const data = isMonthly
    ? (() => {
        const labels = monthly.labels || monthly.data.map((_, i) => `Thg ${i + 1}`);
        const values = monthly.data.map((d) => Number(d));
        const backgroundColor = makeColors(labels.length);
        return {
          labels,
          datasets: [
            {
              label: `${monthly.year} - VND`,
              data: values,
              backgroundColor,
            },
          ],
        };
      })()
    : {
        labels: ['Doanh thu tháng', 'Doanh thu năm'],
        datasets: [
          {
            label: 'VND',
            data: [Number(revenue.monthRevenue || 0), Number(revenue.yearRevenue || 0)],
            backgroundColor: ['#06b6d4', '#34d399'],
          },
        ],
      };

  // Chart options: responsive and tidy tooltips
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 18, boxHeight: 10 } },
      tooltip: { mode: 'index', intersect: false },
    },
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { ticks: { callback: (v) => v.toLocaleString() }, beginAtZero: true },
    },
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Doanh thu</h3>
        <div className={styles.controls}>
          <button className={styles.btn} onClick={() => setType('bar')}>Cột</button>
          <button className={styles.btn} onClick={() => setType('pie')}>Tròn</button>
        </div>
      </div>

      {/* Legend grid for monthly colors */}
      {isMonthly && (
        <div className={styles.legendRow}>
          { (monthly.labels || []).map((lbl, idx) => (
            <div key={lbl + idx} className={styles.legendItem}>
              <div className={styles.colorBox} style={{ background: Array.isArray(data.datasets[0].backgroundColor) ? data.datasets[0].backgroundColor[idx] : data.datasets[0].backgroundColor }} />
              <div>{lbl}</div>
            </div>
          )) }
        </div>
      )}

      <div className={styles.chart}>
        {type === 'bar' ? <Bar data={data} options={options} /> : <Pie data={data} options={options} />}
      </div>
    </div>
  );
};

export default RevenueChart;
