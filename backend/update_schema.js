require('dotenv').config();
const { Pool } = require('pg');

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'fietsvergoeding',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT) || 5432,
};

const pool = new Pool(dbConfig);

async function updateSchema() {
    try {
        console.log('Adding missing columns to trajectories table...');
        await pool.query('ALTER TABLE trajectories ADD COLUMN IF NOT EXISTS name VARCHAR(255)');
        await pool.query('ALTER TABLE trajectories ADD COLUMN IF NOT EXISTS start_location VARCHAR(255)');
        await pool.query('ALTER TABLE trajectories ADD COLUMN IF NOT EXISTS end_location VARCHAR(255)');
        console.log('✅ Columns name, start_location, end_location added successfully');
    } catch (error) {
        console.error('❌ Error updating schema:', error);
    } finally {
        pool.end();
    }
}

updateSchema();
