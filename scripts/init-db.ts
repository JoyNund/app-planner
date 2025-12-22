import Database from 'better-sqlite3';
import { join } from 'path';
import { initDatabase } from '../lib/db';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🔍 Verificando base de datos...');

// Check if database has tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name: string }>;

console.log(`📊 Tablas encontradas: ${tables.length}`);
if (tables.length > 0) {
  console.log('   Tablas:', tables.map(t => t.name).join(', '));
}

// Check if users table exists and has data
const hasUsers = tables.some(t => t.name === 'users');
let userCount = 0;
if (hasUsers) {
  const result = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  userCount = result.count;
  console.log(`👥 Usuarios en la base de datos: ${userCount}`);
}

db.close();

// Initialize database if needed
if (tables.length === 0 || !hasUsers || userCount === 0) {
  console.log('\n🌱 Inicializando base de datos...');
  initDatabase();
  console.log('✅ Base de datos inicializada');
  
  // Run seed if no users
  if (userCount === 0) {
    console.log('\n🌱 Ejecutando seed para crear usuarios de prueba...');
    const { exec } = require('child_process');
    exec('npx tsx lib/seed.ts', (error: any, stdout: string, stderr: string) => {
      if (error) {
        console.error('Error ejecutando seed:', error);
        return;
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
    });
  }
} else {
  console.log('\n✅ Base de datos ya está inicializada');
}

console.log('\n✨ Verificación completada');

