// @ts-check

/**
 * @typedef {Object} Testimonial
 * @property {string} id
 * @property {string} quote
 * @property {string} name
 * @property {string} role
 * @property {string} accentColor - Tailwind color token (e.g. "brand-volt")
 * @property {string} avatarGradFrom - SVG linearGradient stop 0% color
 * @property {string} avatarGradTo   - SVG linearGradient stop 100% color
 * @property {'tech' | 'glasses' | 'cap' | 'spark'} avatarVariant
 */

/** @type {Testimonial[]} */
export const TESTIMONIALS = [
  {
    id: 'sarah',
    quote:
      '"Before using Svay, our team was spending 10+ hours a week manually scraping competitor uploads. Now, we spot rising concepts in 5 minutes and outline our video pipeline with hard demand data. It\'s completely transformed our production rate."',
    name: 'Sarah Jenkins',
    role: 'Tech Reviewer · 340K subs',
    accentColor: 'brand-volt',
    avatarGradFrom: '#ff4f6d',
    avatarGradTo: '#7c3aed',
    avatarVariant: 'tech',
  },
  {
    id: 'david',
    quote:
      '"We used to rely purely on gut feeling for titles and topics. Svay\'s Virality Index showed us exactly what format gaps we were missing. We locked in our early adopter price and it\'s already paid for itself 10x over."',
    name: 'David Chen',
    role: 'Productivity Hacks · 1.2M subs',
    accentColor: 'brand-mint',
    avatarGradFrom: '#00f0ff',
    avatarGradTo: '#0052ff',
    avatarVariant: 'glasses',
  },
];
