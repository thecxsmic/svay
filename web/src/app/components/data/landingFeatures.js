// @ts-check
import { BarChart3, Zap, Users, Search, BookOpen, Cpu } from 'lucide-react';

/**
 * @typedef {Object} FeatureCard
 * @property {string} id - Unique feature identifier
 * @property {string} code - Display code label (e.g. "01 // VELOCITY TRACKING")
 * @property {string} accentColor - Tailwind color token for accent (e.g. "brand-volt")
 * @property {import('react').ElementType} icon - Lucide icon component
 * @property {string} title - Feature heading
 * @property {string} description - Feature description
 * @property {string[]} tags - Short tag labels displayed below the card
 * @property {string} colSpan - Optional md col-span class override
 */

/** @type {FeatureCard[]} */
export const FEATURE_CARDS = [
  {
    id: 'analytics',
    code: '01 // VELOCITY TRACKING',
    accentColor: 'brand-volt',
    icon: BarChart3,
    title: 'Analytics & Tracking',
    description:
      'Monitor views and upload habits across your niche. Receive clear insights on subscriber growth trends and channel milestones without constantly checking analytics.',
    tags: ['Growth trends', 'Projections', 'Milestones'],
    colSpan: 'md:col-span-2',
  },
  {
    id: 'radar',
    code: '02 // EARLY DETECTION',
    accentColor: 'brand-rose',
    icon: Zap,
    title: 'Trend Radar',
    description:
      'Detect rising search queries and tags early. Spot spikes in audience demand so you can outline videos before topics saturate.',
    tags: ['Spike alerts', 'Breakout tags', 'Video outlines'],
    colSpan: '',
  },
  {
    id: 'competitor',
    code: '03 // INTEL',
    accentColor: 'brand-mint',
    icon: Users,
    title: 'Competitor Matrix',
    description:
      'Compare your channel with direct competitors. Benchmark upload frequency, formats, and find what drives views.',
    tags: ['Format mapping', 'Benchmarks', 'Performance ratios'],
    colSpan: '',
  },
  {
    id: 'search',
    code: '04 // FILTERING',
    accentColor: 'brand-rose',
    icon: Search,
    title: 'Advanced Search',
    description:
      'Filter uploads by duration, location, and date. Sort by our virality score to find videos that resonated.',
    tags: ['Virality factor', 'Format filter', 'Precision search'],
    colSpan: '',
  },
  {
    id: 'notebook',
    code: '05 // WORKSPACE',
    accentColor: 'brand-volt',
    icon: BookOpen,
    title: 'Research Notebook',
    description:
      'Save key insights, high-momentum topics, and competitor references. Draft outlines in a dedicated notebook.',
    tags: ['Topic folders', 'Markdown notes', 'Title drafts'],
    colSpan: '',
  },
  {
    id: 'digests',
    code: '06 // DIGESTS',
    accentColor: 'brand-mint',
    icon: Cpu,
    title: 'Smart Notifications',
    description:
      'Get competitor digests and tag updates sent directly to your inbox. Stay updated on market changes without needing to open the workspace.',
    tags: ['Email updates', 'Breakout summaries', 'Custom timing'],
    colSpan: 'md:col-span-3',
  },
];
