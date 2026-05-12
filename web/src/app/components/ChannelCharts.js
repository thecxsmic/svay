"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#000',
      titleFont: { size: 10, weight: 'bold' },
      bodyFont: { size: 12, weight: 'black' },
      padding: 12,
      cornerRadius: 12,
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { display: false, drawBorder: false },
      ticks: { color: '#444', font: { size: 9, weight: 'bold' } }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
      ticks: { color: '#444', font: { size: 9, weight: 'bold' }, callback: (value) => value >= 1000000 ? (value/1000000).toFixed(1) + 'M' : value >= 1000 ? (value/1000).toFixed(1) + 'K' : value }
    }
  }
};

export function GrowthChart({ history }) {
  if (!history || !Array.isArray(history)) return null;

  const data = {
    labels: history.map(d => d.date.split(',')[1].trim()),
    datasets: [
      {
        fill: true,
        label: 'Views',
        data: history.map(d => d.viewsChange),
        borderColor: '#0070f3',
        backgroundColor: 'rgba(0, 112, 243, 0.05)',
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 3,
      },
    ],
  };

  return <Line options={commonOptions} data={data} />;
}

export function SubsChangeChart({ history }) {
    if (!history || !Array.isArray(history)) return null;

    const data = {
      labels: history.map(d => d.date.split(',')[1].trim()),
      datasets: [
        {
          label: 'New Subscribers',
          data: history.map(d => d.subsChange),
          backgroundColor: '#00dfd8',
          borderRadius: 8,
          barPercentage: 0.6,
        },
      ],
    };
  
    return <Bar options={commonOptions} data={data} />;
}

export function EngagementPieChart({ videos }) {
    if (!videos || videos.length === 0) return null;
    
    // Average engagement levels
    const scores = videos.map(v => {
        const stats = v.statistics || {};
        const views = parseInt(stats.viewCount || 1);
        const likes = parseInt(stats.likeCount || 0);
        return (likes / views) * 100;
    });

    const high = scores.filter(s => s > 4).length;
    const mid = scores.filter(s => s <= 4 && s > 2).length;
    const low = scores.filter(s => s <= 2).length;

    const data = {
      labels: ['High Engagement', 'Medium', 'Low'],
      datasets: [
        {
          data: [high, mid, low],
          backgroundColor: ['#0070f3', '#00dfd8', '#111111'],
          borderColor: 'rgba(255,255,255,0.05)',
          borderWidth: 2,
        },
      ],
    };

    const options = {
        ...commonOptions,
        scales: { x: { display: false }, y: { display: false } },
        plugins: { ...commonOptions.plugins, legend: { display: true, position: 'bottom', labels: { color: '#666', font: { size: 10, weight: 'bold' }, usePointStyle: true, padding: 20 } } }
    };
  
    return <Doughnut options={options} data={data} />;
}

export function RevenueProjectionChart({ history }) {
    if (!history || !Array.isArray(history)) return null;

    const data = {
      labels: history.map(d => d.date.split(',')[1].trim()),
      datasets: [
        {
          fill: true,
          label: 'Est. Revenue ($)',
          data: history.map(d => d.revMax),
          borderColor: '#00dfd8',
          backgroundColor: 'rgba(0, 223, 216, 0.05)',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#00dfd8',
          borderWidth: 2,
        },
      ],
    };
  
    return <Line options={commonOptions} data={data} />;
}
