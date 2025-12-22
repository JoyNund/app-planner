import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'mkt-planner.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Migration v9: Remove role CHECK constraint to allow custom roles
export function migrateV9() {
  try {
    // Check if we can insert a custom role (test if constraint exists)
    try {
      // Try to get table schema
      const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as { sql: string } | undefined;
      
      if (schema && schema.sql.includes("CHECK(role IN")) {
        // Constraint exists, need to remove it
        console.log('Migration v9: Removing role CHECK constraint...');
        
        // Disable foreign keys temporarily
        db.pragma('foreign_keys = OFF');
        
        // Step 1: Create new table without constraint
        db.exec(`
          CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            avatar_color TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Step 2: Copy data from old table
        db.exec(`
          INSERT INTO users_new (id, username, password_hash, full_name, role, avatar_color, created_at)
          SELECT id, username, password_hash, full_name, role, avatar_color, created_at
          FROM users;
        `);

        // Step 3: Drop old table
        db.exec(`DROP TABLE users;`);

        // Step 4: Rename new table
        db.exec(`ALTER TABLE users_new RENAME TO users;`);

        // Re-enable foreign keys
        db.pragma('foreign_keys = ON');
        
        console.log('Migration v9: Removed role CHECK constraint - custom roles now allowed');
      } else {
        console.log('Migration v9: Role CHECK constraint already removed or doesn\'t exist');
      }
    } catch (testError: any) {
      // If we can't check, assume it's already done or table doesn't have constraint
      console.log('Migration v9: Could not verify constraint, assuming already migrated');
    }
  } catch (error) {
    console.error('Migration v9 error:', error);
    // Re-enable foreign keys in case of error
    db.pragma('foreign_keys = ON');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateV9();
  db.close();
}

export default migrateV9;

