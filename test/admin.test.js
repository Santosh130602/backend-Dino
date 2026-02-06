// run-seed.js
require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

async function runSeed() {
  console.log('🌱 Starting database seed...');
  
  // Create connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Read SQL file
    const sql = fs.readFileSync('seed.sql', 'utf8');
    
    // Connect and run
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Execute SQL
    console.log('🚀 Executing seed SQL...');
    await client.query(sql);
    
    console.log('🎉 Database seeded successfully!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

runSeed();