// HABYO - Módulo de Conexão com o Banco de Dados PostgreSQL

const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/habyo_db';

const isCloudDb = connectionString.includes('supabase') || connectionString.includes('neon') || connectionString.includes('render') || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('⚡️ Conectado com sucesso ao Banco de Dados PostgreSQL HABYO');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado na conexão PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
