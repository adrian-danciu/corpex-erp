import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

console.log('Testing direct Neon connection...\n');

const connectionString = process.env.DATABASE_URL;
console.log('Connection string:', connectionString?.substring(0, 30) + '...');

const pool = new Pool({ connectionString });

async function test() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Direct connection successful!');
    console.log('Server time:', result.rows[0]);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await pool.end();
  }
}

test();
