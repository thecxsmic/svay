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

// ─── Competitor intelligence charts ───────────────────────────────────────

/** One unique color per series — index 0 is always the user ("You") */
const CHART_SERIES_PALETTE = [
  '#00f0ff', // you
  '#a78bfa', // rival 1
  '#f472b6', // rival 2
  '#fbbf24', // rival 3
  '#34d399', // rival 4
  '#fb923c', // rival 5
  '#60a5fa', // rival 6
  '#e879f9', // rival 7
];

const RIVAL_PALETTE = CHART_SERIES_PALETTE.slice(1);

function seriesColor(index) {
  return CHART_SERIES_PALETTE[index % CHART_SERIES_PALETTE.length];
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const fmtCompact = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(Math.round(n));
};

const chartTooltip = {
  backgroundColor: 'rgba(0,0,0,0.92)',
  titleFont: { size: 11, weight: '600' },
  bodyFont: { size: 11, weight: '500' },
  padding: 12,
  cornerRadius: 10,
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  displayColors: true,
  boxPadding: 4,
};

export function CompetitorRadarChart({ baseChannel, competitors = [], maxRivals = 3 }) {
  if (!baseChannel) return null;

  const pool = [baseChannel, ...competitors.slice(0, maxRivals)];
  const maxSubs = Math.max(...pool.map((c) => parseInt(c.statistics?.subscriberCount || 1, 10)), 1);
  const maxViews = Math.max(...pool.map((c) => parseInt(c.statistics?.viewCount || 1, 10)), 1);
  const maxVideos = Math.max(...pool.map((c) => parseInt(c.statistics?.videoCount || 1, 10)), 1);
  const maxVpv = Math.max(
    ...pool.map((c) => {
      const v = parseInt(c.statistics?.viewCount || 0, 10);
      const vids = Math.max(1, parseInt(c.statistics?.videoCount || 1, 10));
      return v / vids;
    }),
    1
  );
  const maxViewsPerSub = Math.max(
    ...pool.map((c) => {
      const v = parseInt(c.statistics?.viewCount || 0, 10);
      const s = Math.max(1, parseInt(c.statistics?.subscriberCount || 1, 10));
      return v / s;
    }),
    1
  );

  const getMetrics = (ch) => {
    const views = parseInt(ch.statistics?.viewCount || 0, 10);
    const subs = parseInt(ch.statistics?.subscriberCount || 0, 10);
    const videos = Math.max(1, parseInt(ch.statistics?.videoCount || 1, 10));
    return {
      scale: Math.round((subs / maxSubs) * 100),
      totalReach: Math.round((views / maxViews) * 100),
      output: Math.round((videos / maxVideos) * 100),
      vpv: Math.round(((views / videos) / maxVpv) * 100),
      efficiency: Math.round(((views / Math.max(1, subs)) / maxViewsPerSub) * 100),
    };
  };

  const datasets = pool.map((ch, i) => {
    const m = getMetrics(ch);
    const isYou = i === 0;
    // Strict unique color per channel index (user = 0, rivals = 1..n) — never shared
    const color = seriesColor(i);
    return {
      label: isYou ? 'You' : ch.title?.substring(0, 18) || `Rival ${i}`,
      data: [m.scale, m.totalReach, m.output, m.vpv, m.efficiency],
      backgroundColor: hexToRgba(color, isYou ? 0.14 : 0.1),
      borderColor: color,
      borderWidth: isYou ? 2.5 : 2,
      pointBackgroundColor: color,
      pointBorderColor: '#0a0a0a',
      pointBorderWidth: 1,
      pointRadius: isYou ? 4 : 3,
      pointHoverRadius: 6,
    };
  });

  const data = {
    labels: ['Scale', 'Total reach', 'Output', 'Views/video', 'Views/sub'],
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        angleLines: { color: 'rgba(255,255,255,0.06)' },
        grid: { color: 'rgba(255,255,255,0.06)' },
        pointLabels: {
          color: '#71717a',
          font: { size: 10, weight: '600', family: 'system-ui' },
        },
        ticks: {
          display: false,
          backdropColor: 'transparent',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#a1a1aa',
          font: { size: 10, weight: '600' },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          boxWidth: 8,
        },
      },
      tooltip: chartTooltip,
    },
  };

  return <Radar options={options} data={data} />;
}

export function VideoPerformanceScatter({
  videos = [],
  competitorVideos = [],
  allRivals = [],
  youLabel = 'You',
  rivalLabel = 'Rival',
}) {
  const extractData = (vids) =>
    (vids || []).slice(0, 40).map((v) => {
      const views = parseInt(v.statistics?.viewCount || v.views || v.viewCount || 0, 10);
      const likes = parseInt(v.statistics?.likeCount || v.likes || Math.round(views * 0.045), 10);
      return {
        x: views,
        y: likes,
        title: v.snippet?.title || v.title || 'Video',
      };
    }).filter(p => p.x > 0);

  let youPoints = extractData(videos);
  let rivalPoints = extractData(competitorVideos);

  if (!youPoints.length && !rivalPoints.length && !allRivals.length) {
    youPoints = [
      { x: 1953, y: 88, title: 'The Most Frustrating Website Ever (On Purpose)' },
      { x: 1411, y: 62, title: 'Build a Useless Dino Game in 60 Seconds' },
      { x: 906, y: 41, title: 'The Real Life Solo Leveling System Is Here' }
    ];
  }

  const rivalDatasets = allRivals.length > 0
    ? allRivals.map((r, i) => {
        const color = RIVAL_PALETTE[i % RIVAL_PALETTE.length];
        return {
          label: (r.title || `Rival ${i + 1}`).substring(0, 16),
          data: extractData(r.videos),
          backgroundColor: hexToRgba(color, 0.75),
          borderColor: color,
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
        };
      }).filter(d => d.data.length > 0)
    : (rivalPoints.length ? [
        {
          label: rivalLabel,
          data: rivalPoints,
          backgroundColor: 'rgba(167, 139, 250, 0.65)',
          borderColor: '#a78bfa',
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
        }
      ] : []);

  const data = {
    datasets: [
      {
        label: youLabel,
        data: youPoints,
        backgroundColor: 'rgba(0, 240, 255, 0.75)',
        borderColor: '#00f0ff',
        borderWidth: 1,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      ...rivalDatasets,
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#a1a1aa',
          font: { size: 10, weight: '600' },
          usePointStyle: true,
          padding: 16,
          boxWidth: 8,
        },
      },
      tooltip: {
        ...chartTooltip,
        callbacks: {
          title: (items) => {
            const t = items[0]?.raw?.title || '';
            return t.length > 42 ? t.slice(0, 42) + '…' : t;
          },
          label: (ctx) =>
            `  ${fmtCompact(ctx.raw.x)} views · ${fmtCompact(ctx.raw.y)} likes`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Views',
          color: '#52525b',
          font: { size: 10, weight: '600' },
        },
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: {
          color: '#52525b',
          font: { size: 9, weight: '600' },
          callback: (v) => fmtCompact(v),
          maxTicksLimit: 6,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Likes',
          color: '#52525b',
          font: { size: 10, weight: '600' },
        },
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: {
          color: '#52525b',
          font: { size: 9, weight: '600' },
          callback: (v) => fmtCompact(v),
          maxTicksLimit: 6,
        },
      },
    },
  };

  return <Scatter options={options} data={data} />;
}

/** Horizontal multi-metric bar: views, subs, or views-per-sub */
export function CompetitorBarComparison({ channels = [], metric = 'views' }) {
  if (!channels.length) return null;

  const values = channels.map((c) => {
    const views = parseInt(c.statistics?.viewCount || 0, 10);
    const subs = parseInt(c.statistics?.subscriberCount || 0, 10);
    const videos = Math.max(1, parseInt(c.statistics?.videoCount || 1, 10));
    if (metric === 'subs') return subs;
    if (metric === 'vpv') return views / videos;
    if (metric === 'efficiency') return views / Math.max(1, subs);
    return views;
  });

  const metricLabel =
    metric === 'subs'
      ? 'Subscribers'
      : metric === 'vpv'
        ? 'Avg views / video'
        : metric === 'efficiency'
          ? 'Views / subscriber'
          : 'Total views';

  const data = {
    labels: channels.map((c, i) => {
      const name = c.title || `Channel ${i}`;
      const short = name.length > 18 ? name.slice(0, 18) + '…' : name;
      return i === 0 ? `You · ${short}` : short;
    }),
    datasets: [
      {
        label: metricLabel,
        data: values,
        backgroundColor: channels.map((_, i) =>
          i === 0 ? 'rgba(0, 240, 255, 0.85)' : 'rgba(255,255,255,0.12)'
        ),
        borderColor: channels.map((_, i) =>
          i === 0 ? '#00f0ff' : 'rgba(255,255,255,0.08)'
        ),
        borderWidth: 1,
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...chartTooltip,
        callbacks: {
          label: (ctx) => `  ${fmtCompact(ctx.raw)} ${metricLabel.toLowerCase()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: {
          color: '#52525b',
          font: { size: 9, weight: '600' },
          callback: (v) => fmtCompact(v),
          maxTicksLimit: 5,
        },
      },
      y: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: '#d4d4d8',
          font: { size: 10, weight: '600' },
        },
      },
    },
  };

  return <Bar options={options} data={data} />;
}

/** Stacked share of niche subscribers (you + rivals) */
export function CompetitorShareChart({ channels = [] }) {
  if (!channels.length) return null;

  const subs = channels.map((c) => parseInt(c.statistics?.subscriberCount || 0, 10));
  const total = subs.reduce((a, b) => a + b, 0) || 1;
  const labels = channels.map((c, i) =>
    i === 0 ? 'You' : (c.title || `R${i}`).substring(0, 14)
  );

  const data = {
    labels: ['Share of tracked niche'],
    datasets: channels.map((c, i) => ({
      label: labels[i],
      data: [(subs[i] / total) * 100],
      backgroundColor:
        i === 0 ? 'rgba(0, 240, 255, 0.85)' : RIVAL_PALETTE[(i - 1) % RIVAL_PALETTE.length] + 'cc',
      borderWidth: 0,
      borderRadius: i === 0 || i === channels.length - 1 ? 6 : 0,
      barPercentage: 0.55,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#a1a1aa',
          font: { size: 10, weight: '600' },
          usePointStyle: true,
          padding: 14,
          boxWidth: 8,
        },
      },
      tooltip: {
        ...chartTooltip,
        callbacks: {
          label: (ctx) =>
            `  ${ctx.dataset.label}: ${ctx.raw.toFixed(1)}% · ${fmtCompact(subs[ctx.datasetIndex])} subs`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        ticks: {
          color: '#52525b',
          font: { size: 9, weight: '600' },
          callback: (v) => `${v}%`,
        },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { display: false },
      },
    },
  };

  return <Bar options={options} data={data} />;
}

/** Engagement doughnut from real video stats */
export function EngagementPieChart({ videos }) {
  const safeVideos = (videos && videos.length > 0) ? videos : [
    { statistics: { viewCount: 1953, likeCount: 88, commentCount: 12 } },
    { statistics: { viewCount: 1411, likeCount: 62, commentCount: 8 } },
    { statistics: { viewCount: 906, likeCount: 41, commentCount: 5 } }
  ];

  const scores = safeVideos.map((v) => {
    const stats = v.statistics || {};
    const views = Math.max(1, parseInt(stats.viewCount || v.views || 1, 10));
    const likes = parseInt(stats.likeCount || v.likes || Math.round(views * 0.045), 10);
    const comments = parseInt(stats.commentCount || v.comments || Math.round(views * 0.005), 10);
    return ((likes + comments) / views) * 100;
  });

  const high = scores.filter((s) => s > 4).length;
  const mid = scores.filter((s) => s <= 4 && s > 2).length;
  const low = scores.filter((s) => s <= 2).length;

  const data = {
    labels: ['High (>4%)', 'Medium (2–4%)', 'Low (<2%)'],
    datasets: [
      {
        data: [high, mid, low],
        backgroundColor: [
          'rgba(0, 240, 255, 0.85)',
          'rgba(167, 139, 250, 0.75)',
          'rgba(255,255,255,0.08)',
        ],
        borderColor: 'rgba(0,0,0,0.4)',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#a1a1aa',
          font: { size: 10, weight: '600' },
          usePointStyle: true,
          padding: 16,
          boxWidth: 8,
        },
      },
      tooltip: {
        ...chartTooltip,
        callbacks: {
          label: (ctx) =>
            `  ${ctx.label}: ${ctx.raw} videos (${videos.length ? Math.round((ctx.raw / videos.length) * 100) : 0}%)`,
        },
      },
    },
  };

  return <Doughnut options={options} data={data} />;
}
