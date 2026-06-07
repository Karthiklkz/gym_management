import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import 'dotenv/config';

function splitSqlStatements(sqlText: string): string[] {
  const statements: string[] = [];
  let currentStatement = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inDollarQuote = false;

  for (let i = 0; i < sqlText.length; i++) {
    const char = sqlText[i];
    const nextChar = sqlText[i + 1];

    if (inDollarQuote) {
      currentStatement += char;
      if (char === '$' && sqlText[i - 1] === '$') {
        inDollarQuote = false;
      }
      continue;
    }

    if (inSingleQuote) {
      currentStatement += char;
      if (char === "'" && sqlText[i - 1] !== '\\') {
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      currentStatement += char;
      if (char === '"' && sqlText[i - 1] !== '\\') {
        inDoubleQuote = false;
      }
      continue;
    }

    if (char === '$' && nextChar === '$') {
      inDollarQuote = true;
      currentStatement += '$$';
      i++;
      continue;
    }

    if (char === "'") {
      inSingleQuote = true;
      currentStatement += char;
      continue;
    }

    if (char === '"') {
      inDoubleQuote = true;
      currentStatement += char;
      continue;
    }

    if (char === ';') {
      currentStatement = currentStatement.trim();
      if (currentStatement) {
        statements.push(currentStatement);
      }
      currentStatement = '';
      continue;
    }

    // Ignore inline comments --
    if (char === '-' && nextChar === '-') {
      while (i < sqlText.length && sqlText[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Ignore block comments /* ... */
    if (char === '/' && nextChar === '*') {
      i += 2;
      while (i < sqlText.length - 1 && !(sqlText[i] === '*' && sqlText[i + 1] === '/')) {
        i++;
      }
      i++; // skip /
      continue;
    }

    currentStatement += char;
  }

  currentStatement = currentStatement.trim();
  if (currentStatement) {
    statements.push(currentStatement);
  }

  return statements;
}

function splitTableDefinitions(defText: string): string[] {
  const parts: string[] = [];
  let currentPart = '';
  let parenCount = 0;
  let inSingleQuote = false;

  for (let i = 0; i < defText.length; i++) {
    const char = defText[i];
    if (inSingleQuote) {
      currentPart += char;
      if (char === "'") {
        inSingleQuote = false;
      }
      continue;
    }
    if (char === "'") {
      inSingleQuote = true;
      currentPart += char;
      continue;
    }
    if (char === '(') {
      parenCount++;
      currentPart += char;
      continue;
    }
    if (char === ')') {
      parenCount--;
      currentPart += char;
      continue;
    }
    if (char === ',' && parenCount === 0) {
      parts.push(currentPart.trim());
      currentPart = '';
      continue;
    }
    currentPart += char;
  }
  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }
  return parts;
}

export async function syncDatabaseSchema() {
  console.log('[DB Sync] Starting schema synchronization...');
  
  if (!process.env.DATABASE_URL) {
    console.error('[DB Sync] DATABASE_URL is not defined in environment variables.');
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const sqlFilePath = path.join(process.cwd(), 'gym-database.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`[DB Sync] Schema file not found at ${sqlFilePath}`);
      return;
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    const statements = splitSqlStatements(sqlContent);
    
    for (const stmt of statements) {
      const trimmedStmt = stmt.trim();
      
      // 1. EXTENSIONS
      if (trimmedStmt.toUpperCase().startsWith('CREATE EXTENSION')) {
        await pool.query(trimmedStmt);
        continue;
      }

      // 2. ENUM TYPES
      if (trimmedStmt.toUpperCase().startsWith('CREATE TYPE')) {
        const typeMatch = trimmedStmt.match(/CREATE\s+TYPE\s+([a-zA-Z0-9_]+)\s+AS\s+ENUM\s*\(([^)]+)\)/i);
        if (typeMatch) {
          const typeName = typeMatch[1];
          const valuesStr = typeMatch[2];
          const enumValues = valuesStr.split(',').map(v => v.trim().replace(/^'|'$/g, ''));
          
          // Check if enum type exists
          const typeCheck = await pool.query('SELECT 1 FROM pg_type WHERE typname = $1', [typeName]);
          if (typeCheck.rowCount === 0) {
            await pool.query(trimmedStmt);
            console.log(`[DB Sync] Created enum type: ${typeName}`);
          } else {
            // Check for missing enum values and add them
            const existingValuesResult = await pool.query(
              `SELECT enumlabel FROM pg_enum WHERE enumtypid = $1::regtype`,
              [typeName]
            );
            const existingValues = existingValuesResult.rows.map(r => r.enumlabel);
            for (const val of enumValues) {
              if (!existingValues.includes(val)) {
                await pool.query(`ALTER TYPE ${typeName} ADD VALUE IF NOT EXISTS '${val}'`);
                console.log(`[DB Sync] Added value '${val}' to enum type: ${typeName}`);
              }
            }
          }
        }
        continue;
      }

      // 3. TABLES
      if (trimmedStmt.toUpperCase().startsWith('CREATE TABLE')) {
        const tableMatch = trimmedStmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          const bodyText = tableMatch[2];
          
          // Check if table exists
          const tableCheck = await pool.query(
            "SELECT 1 FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public'",
            [tableName]
          );
          
          if (tableCheck.rowCount === 0) {
            // Table doesn't exist, execute entire CREATE TABLE
            await pool.query(trimmedStmt);
            console.log(`[DB Sync] Created table: ${tableName}`);
          } else {
            // Table exists, process columns and constraints
            const definitions = splitTableDefinitions(bodyText);
            
            for (const def of definitions) {
              const cleanedDef = def.replace(/\s+/g, ' ').trim();
              const upperDef = cleanedDef.toUpperCase();
              
              // Handle Table-level Constraints
              if (
                upperDef.startsWith('FOREIGN KEY') ||
                upperDef.startsWith('PRIMARY KEY') ||
                upperDef.startsWith('UNIQUE') ||
                upperDef.startsWith('CONSTRAINT')
              ) {
                // Handle foreign key specifically
                if (upperDef.startsWith('FOREIGN KEY')) {
                  const fkMatch = cleanedDef.match(/FOREIGN\s+KEY\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*REFERENCES\s*([a-zA-Z0-9_]+)\s*\(\s*([a-zA-Z0-9_]+)\s*\)/i);
                  if (fkMatch) {
                    const colName = fkMatch[1];
                    const refTable = fkMatch[2];
                    
                    // Check if FK constraint exists on this column
                    const fkCheck = await pool.query(
                      `SELECT 1 FROM information_schema.table_constraints tc
                       JOIN information_schema.key_column_usage kcu
                         ON tc.constraint_name = kcu.constraint_name
                         AND tc.table_schema = kcu.table_schema
                       WHERE tc.constraint_type = 'FOREIGN KEY'
                         AND tc.table_name = $1
                         AND kcu.column_name = $2`,
                      [tableName, colName]
                    );
                    
                    if (fkCheck.rowCount === 0) {
                      await pool.query(`ALTER TABLE ${tableName} ADD ${def}`);
                      console.log(`[DB Sync] Added foreign key constraint on ${colName} referencing ${refTable} in table ${tableName}`);
                    }
                  }
                }
                // Other table-level constraints can be skipped or added as needed
                continue;
              }
              
              // Otherwise, it is a column definition
              const firstSpaceIdx = cleanedDef.indexOf(' ');
              if (firstSpaceIdx > 0) {
                const columnName = cleanedDef.substring(0, firstSpaceIdx).replace(/^"|"$/g, '');
                const columnSpec = cleanedDef.substring(firstSpaceIdx + 1);
                
                // Check if column exists
                const colCheck = await pool.query(
                  "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
                  [tableName, columnName]
                );
                
                if (colCheck.rowCount === 0) {
                  // Add column
                  const alterQuery = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnSpec}`;
                  await pool.query(alterQuery);
                  console.log(`[DB Sync] Added column: ${columnName} ${columnSpec} to table ${tableName}`);
                }
              }
            }
          }
        }
        continue;
      }

      // 4. INDEXES
      if (trimmedStmt.toUpperCase().startsWith('CREATE INDEX')) {
        const idxMatch = trimmedStmt.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_]+)/i);
        if (idxMatch) {
          const indexName = idxMatch[1];
          const tableName = idxMatch[2];
          
          const idxCheck = await pool.query(
            'SELECT 1 FROM pg_indexes WHERE indexname = $1 AND tablename = $2',
            [indexName, tableName]
          );
          if (idxCheck.rowCount === 0) {
            await pool.query(trimmedStmt);
            console.log(`[DB Sync] Created index: ${indexName} on ${tableName}`);
          }
        }
        continue;
      }

      // 5. FUNCTIONS (e.g., CREATE OR REPLACE FUNCTION)
      if (trimmedStmt.toUpperCase().startsWith('CREATE OR REPLACE FUNCTION') || trimmedStmt.toUpperCase().startsWith('CREATE FUNCTION')) {
        await pool.query(trimmedStmt);
        console.log(`[DB Sync] Created or replaced trigger function`);
        continue;
      }

      // 6. TRIGGERS
      if (trimmedStmt.toUpperCase().startsWith('CREATE TRIGGER')) {
        const trigMatch = trimmedStmt.match(/CREATE\s+TRIGGER\s+([a-zA-Z0-9_]+)\s+[\s\S]+?ON\s+([a-zA-Z0-9_]+)/i);
        if (trigMatch) {
          const triggerName = trigMatch[1];
          const tableName = trigMatch[2];
          
          const trigCheck = await pool.query(
            'SELECT 1 FROM information_schema.triggers WHERE trigger_name = $1 AND event_object_table = $2',
            [triggerName, tableName]
          );
          
          if (trigCheck.rowCount === 0) {
            await pool.query(trimmedStmt);
            console.log(`[DB Sync] Created trigger: ${triggerName} on ${tableName}`);
          }
        }
        continue;
      }
    }

    // 7. Backfill existing members with NULL member_ids
    const checkNulls = await pool.query('SELECT 1 FROM members WHERE member_id IS NULL');
    if (checkNulls.rowCount && checkNulls.rowCount > 0) {
      console.log(`[DB Sync] Found ${checkNulls.rowCount} members with missing member_id. Backfilling...`);
      const backfillQuery = `
        WITH member_gyms AS (
          SELECT m.id AS member_id_uuid, g.name AS gym_name,
                 ROW_NUMBER() OVER (PARTITION BY g.id ORDER BY m.join_date, m.id) as rn
          FROM members m
          JOIN users u ON m.user_id = u.id
          JOIN gyms g ON u.gym_id = g.id
          WHERE m.member_id IS NULL
        )
        UPDATE members m
        SET member_id = RPAD(UPPER(SUBSTRING(REGEXP_REPLACE(mg.gym_name, '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 3)), 3, 'X') || LPAD(mg.rn::TEXT, 3, '0')
        FROM member_gyms mg
        WHERE m.id = mg.member_id_uuid;
      `;
      await pool.query(backfillQuery);
      console.log('[DB Sync] Member ID backfill completed successfully.');
    }

    console.log('[DB Sync] Database schema synchronization finished successfully.');
  } catch (error) {
    console.error('[DB Sync] Error synchronizing database schema:', error);
  } finally {
    await pool.end();
  }
}
