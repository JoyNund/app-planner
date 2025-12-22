import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { join } from 'path';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

// Get all table schemas
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all() as { name: string }[];

let schema = '-- Auto-generated schema from database\n';
schema += `-- Generated: ${new Date().toISOString()}\n\n`;

for (const table of tables) {
  const createTable = db.prepare(`
    SELECT sql FROM sqlite_master 
    WHERE type='table' AND name = ?
  `).get(table.name) as { sql: string } | undefined;
  
  if (createTable) {
    schema += `${createTable.sql};\n\n`;
  }
}

// Get indexes
const indexes = db.prepare(`
  SELECT sql FROM sqlite_master 
  WHERE type='index' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all() as { sql: string }[];

if (indexes.length > 0) {
  schema += '-- Indexes\n';
  for (const idx of indexes) {
    if (idx.sql) {
      schema += `${idx.sql};\n`;
    }
  }
}

db.close();

// Write to file
const outputPath = join(process.cwd(), 'lib', 'schema_actual.sql');
writeFileSync(outputPath, schema);
console.log('Schema exportado a:', outputPath);

