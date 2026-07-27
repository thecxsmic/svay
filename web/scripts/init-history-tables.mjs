#!/usr/bin/env node

/**
 * Database Migration Script
 * Initialize history tracking tables for Svay
 * 
 * Usage:
 *   node --env-file=.env scripts/init-history-tables.mjs
 */

import { initHistoryTables } from '../src/lib/cache/turso.js';

console.log('🔄 Initializing history tables...');

initHistoryTables()
  .then(() => {
    console.log('✅ History tables initialized successfully!');
    console.log('\nTables created:');
    console.log('  - trend_radar_history (tracks past trend scans)');
    console.log('  - competitor_history (tracks past competitor analyses)');
    console.log('\nFeatures enabled:');
    console.log('  ✓ Trend Radar remembers past ideas');
    console.log('  ✓ AI generates contextual suggestions based on history');
    console.log('  ✓ Competitor analyses track changes over time');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to initialize history tables:', error);
    process.exit(1);
  });
