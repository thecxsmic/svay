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
  RadialLinearScale,
  RadarController,
  ScatterController
} from 'chart.js';
import { Line, Bar, Doughnut, Radar, Scatter, PolarArea } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  RadarController,
  ScatterController,
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

// NEW ADVANCED CHARTS

export function CompetitorRadarChart({ baseChannel, competitors }) {
  if (!baseChannel || !competitors) return null;

  const getMetrics = (ch) => {
    const views = parseInt(ch.statistics?.viewCount || 0);
    const subs = parseInt(ch.statistics?.subscriberCount || 0);
    const videos = parseInt(ch.statistics?.videoCount || 1);
    return {
      reach: Math.min(100, (views / Math.max(1, subs)) * 10), // Normalized
      scale: Math.min(100, (subs / 10000000) * 100), // Normalized to 10M
      output: Math.min(100, (videos / 5000) * 100), // Normalized to 5k videos
      efficiency: Math.min(100, (views / Math.max(1, videos)) / 100000), // Normalized to 100k views/video
    };
  };

  const baseM = getMetrics(baseChannel);
  const compM = competitors[0] ? getMetrics(competitors[0]) : baseM;

  const data = {
    labels: ['Reach Potential', 'Scale Authority', 'Content Output', 'View Efficiency'],
    datasets: [
      {
        label: baseChannel.title,
        data: [baseM.reach, baseM.scale, baseM.output, baseM.efficiency],
        backgroundColor: 'rgba(0, 112, 243, 0.2)',
        borderColor: '#0070f3',
        pointBackgroundColor: '#0070f3',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#0070f3'
      },
      ...(competitors[0] ? [{
        label: competitors[0].title,
        data: [compM.reach, compM.scale, compM.output, compM.efficiency],
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        pointBackgroundColor: 'rgba(255, 255, 255, 0.5)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 255, 255, 0.5)'
      }] : [])
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        pointLabels: { color: '#888', font: { size: 10, weight: 'bold' } },
        ticks: { display: false, min: 0, max: 100 }
      }
    },
    plugins: {
      legend: { display: true, position: 'bottom', labels: { color: '#fff', font: { size: 10 } } }
    }
  };

  return <Radar options={options} data={data} />;
}

export function VideoPerformanceScatter({ videos, competitorVideos }) {
  if (!videos) return null;

  const extractData = (vids) => vids.map(v => ({
    x: parseInt(v.statistics?.viewCount || 0),
    y: parseInt(v.statistics?.likeCount || 0),
    title: v.snippet?.title || 'Video'
  }));

  const data = {
    datasets: [
      {
        label: 'Subject Videos',
        data: extractData(videos),
        backgroundColor: '#00dfd8',
      },
      ...(competitorVideos ? [{
        label: 'Rival Videos',
        data: extractData(competitorVideos),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      }] : [])
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: { display: true, position: 'top', labels: { color: '#fff', font: { size: 10 } } },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (ctx) => {
            const raw = ctx.raw;
            return `${raw.title.substring(0, 30)}... | Views: ${raw.x.toLocaleString()} | Likes: ${raw.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#666', callback: (value) => value >= 1000000 ? (value/1000000).toFixed(1) + 'M' : value >= 1000 ? (value/1000).toFixed(1) + 'K' : value }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#666', callback: (value) => value >= 1000000 ? (value/1000000).toFixed(1) + 'M' : value >= 1000 ? (value/1000).toFixed(1) + 'K' : value }
      }
    }
  };

  return <Scatter options={options} data={data} />;
}

export function CompetitorBarComparison({ channels }) {
  if (!channels || channels.length === 0) return null;

  const data = {
    labels: channels.map(c => c.title.substring(0, 15) + (c.title.length > 15 ? '...' : '')),
    datasets: [
      {
        label: 'Total Views (Millions)',
        data: channels.map(c => parseInt(c.statistics?.viewCount || 0) / 1000000),
        backgroundColor: channels.map((_, i) => i === 0 ? '#0070f3' : 'rgba(255, 255, 255, 0.1)'),
        borderRadius: 4,
      }
    ]
  };

  const options = {
    ...commonOptions,
    indexAxis: 'y',
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#888' } },
      y: { grid: { display: false, drawBorder: false }, ticks: { color: '#fff', font: { weight: 'bold' } } }
    }
  };

  return <Bar options={options} data={data} />;
}
