const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Get database path from environment or use default
const dbPath =
  process.env.DB_PATH ||
  path.join(__dirname, "../../../database/taskmanagement.db");

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;
let SQL = null;
let isInitialized = false;
let lastFileModTime = null;

// SQLite compatibility layer to mimic mssql interface
class SqliteRequest {
  constructor(database) {
    this.db = database;
    this.params = {};
  }

  input(name, type, value) {
    this.params[name] = value;
    return this;
  }

  async query(sqlQuery) {
    // Convert @paramName to :paramName placeholders for sql.js
    const params = {};
    let processedQuery = sqlQuery.replace(/@(\w+)/g, (match, paramName) => {
      params[`:${paramName}`] = this.params[paramName];
      return `:${paramName}`;
    });

    // Handle SQL Server specific syntax
    processedQuery = processedQuery
      .replace(/SCOPE_IDENTITY\(\)/gi, "last_insert_rowid()")
      .replace(/GETDATE\(\)/gi, "datetime('now')")
      .replace(/CAST\(GETDATE\(\)\s+AS\s+DATE\)/gi, "date('now')")
      .replace(/IDENTITY\(1,1\)/gi, "AUTOINCREMENT")
      .replace(/INT\s+IDENTITY\(1,1\)/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");

    try {
      // Check if it's a SELECT query
      const trimmedQuery = processedQuery.trim().toUpperCase();
      const isSelect = trimmedQuery.startsWith("SELECT");
      const isInsert = trimmedQuery.startsWith("INSERT");
      const needsLastId =
        processedQuery.includes("SCOPE_IDENTITY()") ||
        processedQuery.includes("last_insert_rowid()");

      if (isSelect) {
        const stmt = this.db.prepare(processedQuery);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();

        // Don't save database after SELECT queries (read-only)

        return {
          recordset: rows,
        };
      } else if (isInsert && needsLastId) {
        // Handle INSERT with SCOPE_IDENTITY() - may have a SELECT after INSERT
        const statements = processedQuery
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        const insertQuery = statements[0];

        // Execute the INSERT
        this.db.run(insertQuery, params);
        const id = this.db.exec("SELECT last_insert_rowid() as id")[0]
          ?.values[0]?.[0];

        // Save database after insert
        saveDatabase();

        // Check if there's a SELECT statement after INSERT
        if (
          statements.length > 1 &&
          statements[1].toUpperCase().startsWith("SELECT")
        ) {
          // Execute the SELECT with the inserted ID
          const selectQuery = statements[1].replace(
            /last_insert_rowid\(\)/gi,
            id.toString()
          );
          const stmt = this.db.prepare(selectQuery);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();

          return {
            recordset: rows.length > 0 ? rows : [{ id }],
          };
        }

        return {
          recordset: [{ id }],
        };
      } else {
        // INSERT, UPDATE, DELETE
        this.db.run(processedQuery, params);

        // Save database after each query
        saveDatabase();

        return {
          recordset: [],
          rowsAffected: this.db.getRowsModified(),
        };
      }
    } catch (error) {
      console.error("Query error:", error);
      console.error("Original query:", sqlQuery);
      console.error("Processed query:", processedQuery);
      throw error;
    }
  }
}

class SqlitePool {
  constructor(database) {
    this.db = database;
  }

  request() {
    return new SqliteRequest(this.db);
  }

  close() {
    // sql.js databases don't need explicit closing
    // but we should save before closing
    if (this.db) {
      saveDatabase();
    }
  }
}

// SQL type constants for compatibility
const sql = {
  Int: "INT",
  VarChar: "VARCHAR",
  Text: "TEXT",
  Date: "DATE",
};

// Save database to file
function saveDatabase() {
  if (db) {
    try {
      // Check if file was modified externally before saving
      if (fs.existsSync(dbPath) && lastFileModTime) {
        const currentModTime = fs.statSync(dbPath).mtimeMs;
        if (currentModTime > lastFileModTime) {
          console.warn(
            "⚠️  Warning: Database file was modified externally. Reloading before save to prevent data loss..."
          );
          // Reload from disk to get latest data before saving
          const buffer = fs.readFileSync(dbPath);
          const tempDb = new db.constructor(buffer);
          // Close old db and use the reloaded one
          db.close();
          db = tempDb;
          db.run("PRAGMA foreign_keys = ON");
        }
      }

      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);

      // Update last modification time after saving
      if (fs.existsSync(dbPath)) {
        lastFileModTime = fs.statSync(dbPath).mtimeMs;
      }
    } catch (error) {
      console.error("Error saving database:", error);
    }
  }
}

// Initialize database schema
function initializeSchema() {
  if (isInitialized) return;

  console.log("Initializing database schema...");

  // Check if Users table exists (indicates schema is already initialized)
  const tableCheck = db.exec(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='Users'`
  );

  if (tableCheck.length > 0 && tableCheck[0].values.length > 0) {
    console.log("✅ Database schema already exists, skipping initialization.");
    isInitialized = true;
    return;
  }

  // Create Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
      created_at DATETIME NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create DivUsers Table (Users without login capability)
  db.run(`
    CREATE TABLE IF NOT EXISTS DivUsers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
      UNIQUE(user_id)
    )
  `);

  // Create Tasks Table
  db.run(`
    CREATE TABLE IF NOT EXISTS Tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
      assigned_to_div INTEGER,
      assigned_to_div_user INTEGER,
      created_by INTEGER NOT NULL,
      assignment_date DATE NOT NULL DEFAULT (date('now')),
      due_date DATETIME,
      status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'suspended')),
      tags TEXT,
      notes TEXT,
      FOREIGN KEY (assigned_to_div) REFERENCES Users(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_to_div_user) REFERENCES DivUsers(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE NO ACTION
    )
  `);

  // Create Subtasks Table
  db.run(`
    CREATE TABLE IF NOT EXISTS Subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'completed')),
      created_at DATETIME NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE
    )
  `);

  // Create TaskHistory Table
  db.run(`
    CREATE TABLE IF NOT EXISTS TaskHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      changed_by INTEGER NOT NULL,
      change_type TEXT NOT NULL CHECK (change_type IN ('status_change', 'assignment_change', 'tags_change', 'due_date_change', 'subtask_added', 'notes_updated', 'priority_change', 'task_created')),
      field_name TEXT,
      old_value TEXT,
      new_value TEXT,
      change_description TEXT,
      created_at DATETIME NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES Users(id) ON DELETE NO ACTION
    )
  `);

  // Create Tags Table
  db.run(`
    CREATE TABLE IF NOT EXISTS Tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create TaskTags Junction Table
  db.run(`
    CREATE TABLE IF NOT EXISTS TaskTags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES Tags(id) ON DELETE CASCADE,
      UNIQUE(task_id, tag_id)
    )
  `);

  // Create Files Table for Task and Subtask attachments
  db.run(`
    CREATE TABLE IF NOT EXISTS Files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      task_id INTEGER,
      subtask_id INTEGER,
      uploaded_by INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (subtask_id) REFERENCES Subtasks(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES Users(id) ON DELETE NO ACTION,
      CHECK ((task_id IS NOT NULL AND subtask_id IS NULL) OR (task_id IS NULL AND subtask_id IS NOT NULL))
    )
  `);

  // Create Indexes
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_divusers_user_id ON DivUsers(user_id)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_div ON Tasks(assigned_to_div)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_div_user ON Tasks(assigned_to_div_user)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON Tasks(created_by)`
  );
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON Tasks(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON Tasks(due_date)`);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON Subtasks(task_id)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_taskhistory_task_id ON TaskHistory(task_id)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_taskhistory_changed_by ON TaskHistory(changed_by)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_taskhistory_created_at ON TaskHistory(created_at)`
  );
  db.run(`CREATE INDEX IF NOT EXISTS idx_tags_name ON Tags(name)`);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_tasktags_task_id ON TaskTags(task_id)`
  );
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasktags_tag_id ON TaskTags(tag_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_files_task_id ON Files(task_id)`);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_files_subtask_id ON Files(subtask_id)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON Files(uploaded_by)`
  );

  console.log("✅ Database schema created successfully!");

  // Save database after schema creation
  saveDatabase();

  isInitialized = true;
}

async function getConnection() {
  try {
    // Check if database file was modified externally and reload if necessary
    if (db && fs.existsSync(dbPath) && lastFileModTime) {
      const currentModTime = fs.statSync(dbPath).mtimeMs;
      if (currentModTime > lastFileModTime) {
        console.log("🔄 Database file was modified externally, reloading...");
        db.close();
        db = null;
        isInitialized = false;
      }
    }

    if (db) {
      return new SqlitePool(db);
    }

    // Initialize SQL.js
    if (!SQL) {
      SQL = await initSqlJs();
    }

    // Check if database file exists
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
      // Track file modification time
      lastFileModTime = fs.statSync(dbPath).mtimeMs;
      console.log("📂 Loaded existing database from disk");
    } else {
      // Create new database
      db = new SQL.Database();
      console.log("🆕 Created new database");
    }

    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");

    // Initialize schema on first connection
    initializeSchema();

    console.log("✅ Connected to SQLite database:", dbPath);
    return new SqlitePool(db);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
}

async function closeConnection() {
  try {
    if (db) {
      saveDatabase();
      db.close();
      db = null;
      isInitialized = false;
      lastFileModTime = null;
      console.log("Database connection closed");
    }
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
}

async function reloadDatabase() {
  try {
    console.log("Reloading database from disk...");

    // Close existing connection (save first to preserve any changes)
    if (db) {
      saveDatabase();
      db.close();
      db = null;
      isInitialized = false;
      lastFileModTime = null;
    }

    // Reconnect (will load fresh from disk)
    await getConnection();

    console.log("✅ Database reloaded successfully");
  } catch (error) {
    console.error("Error reloading database:", error);
    throw error;
  }
}

module.exports = {
  sql,
  getConnection,
  closeConnection,
  reloadDatabase,
};
