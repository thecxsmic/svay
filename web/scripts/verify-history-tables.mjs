#!/usr/bin/env node

/**
 * Verify History Tables Script
 * Checks if history tables were created successfully
 * 
 * Usage:
 *   node --env-file=.env scripts/verify-history-tables.mjs
 */

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

console.log('🔍 Verifying history tables...\n');

async function verifyTables() {
  try {
    // Check trend_radar_history table
    const trendRadarCheck = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='trend_radar_history'
    `);
    
    const trendRadarExists = trendRadarCheck.rows.length > 0;
    console.log(trendRadarExists ? '✅' : '❌', 'trend_radar_history table');
    
    if (trendRadarExists) {
      const trendCount = await client.execute(`SELECT COUNT(*) as count FROM trend_radar_history`);
      console.log(`   └─ Records: ${trendCount.rows[0].count}`);
    }
    
    // Check competitor_history table
    const competitorCheck = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='competitor_history'
    `);
    
    const competitorExists = competitorCheck.rows.length > 0;
    console.log(competitorExists ? '✅' : '❌', 'competitor_history table');
    
    if (competitorExists) {
      const compCount = await client.execute(`SELECT COUNT(*) as count FROM competitor_history`);
      console.log(`   └─ Records: ${compCount.rows[0].count}`);
    }
    
    // Check indexes
    console.log('\n🔍 Checking indexes...');
    const indexes = await client.execute(`
      SELECT name, tbl_name FROM sqlite_master 
      WHERE type='index' AND (
        tbl_name='trend_radar_history' OR 
        tbl_name='competitor_history'
      )
    `);
    
    if (indexes.rows.length > 0) {
      indexes.rows.forEach(idx => {
        console.log(`✅ ${idx.name} on ${idx.tbl_name}`);
      });
    } else {
      console.log('⚠️  No custom indexes found (using default)');
    }
    
    console.log('\n✅ Verification complete!');
    
    if (trendRadarExists && competitorExists) {
      console.log('\n🎉 History feature is ready to use!');
      console.log('   • Trend Radar will remember past scans');
      console.log('   • Competitors will track changes over time');
    } else {
      console.log('\n❌ Some tables are missing. Run init-history-tables.mjs first.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyTables();
