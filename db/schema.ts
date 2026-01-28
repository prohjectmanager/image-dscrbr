import { Database } from "@db/sqlite";

let db: Database | null = null;

export function initDb(): Database {
  if (db) return db;

  console.log("[db] Initializing SQLite database...");
  db = new Database("data/images.db");

  db.exec(`
    CREATE TABLE IF NOT EXISTS alt_texts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thumbnail BLOB NOT NULL,
      filename TEXT NOT NULL,
      alt_text TEXT NOT NULL,
      char_count INTEGER NOT NULL,
      model TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_created_at ON alt_texts(created_at);
  `);

  console.log("[db] Database ready");
  return db;
}

export interface AltTextResult {
  id: number;
  thumbnail: Uint8Array;
  filename: string;
  alt_text: string;
  char_count: number;
  model: string;
  created_at: string;
}

export function insertResult(
  thumbnail: Uint8Array,
  filename: string,
  altText: string,
  model: string,
): AltTextResult {
  const db = initDb();
  const createdAt = new Date().toISOString();
  const charCount = altText.length;

  db.exec(
    `INSERT INTO alt_texts (thumbnail, filename, alt_text, char_count, model, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [thumbnail, filename, altText, charCount, model, createdAt],
  );

  const id = db.lastInsertRowId;

  return {
    id: Number(id),
    thumbnail,
    filename,
    alt_text: altText,
    char_count: charCount,
    model,
    created_at: createdAt,
  };
}

interface DbRow {
  id: number;
  thumbnail: Uint8Array;
  filename: string;
  alt_text: string;
  char_count: number;
  model: string;
  created_at: string;
}

export function getResults(limit = 50): AltTextResult[] {
  const db = initDb();
  const rows = db.prepare(
    `SELECT id, thumbnail, filename, alt_text, char_count, model, created_at
     FROM alt_texts
     ORDER BY created_at DESC
     LIMIT ?`,
  ).all<DbRow>([limit]);

  return rows.map((row) => ({
    id: row.id,
    thumbnail: row.thumbnail,
    filename: row.filename,
    alt_text: row.alt_text,
    char_count: row.char_count,
    model: row.model,
    created_at: row.created_at,
  }));
}

export function getResultsByDateRange(
  from: string,
  to: string,
): AltTextResult[] {
  const db = initDb();
  const rows = db.prepare(
    `SELECT id, thumbnail, filename, alt_text, char_count, model, created_at
     FROM alt_texts
     WHERE created_at >= ? AND created_at <= ?
     ORDER BY created_at DESC`,
  ).all<DbRow>([from, to]);

  return rows.map((row) => ({
    id: row.id,
    thumbnail: row.thumbnail,
    filename: row.filename,
    alt_text: row.alt_text,
    char_count: row.char_count,
    model: row.model,
    created_at: row.created_at,
  }));
}
