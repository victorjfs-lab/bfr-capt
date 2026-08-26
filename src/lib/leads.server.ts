import { timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { LeadInput, LeadRecord } from "./leads.schema";

type LeadsGlobal = typeof globalThis & {
  __nexumLeadsDb?: DatabaseSync;
};

function databasePath() {
  const configuredPath = process.env.LEADS_DB_PATH?.trim();
  return configuredPath ? resolve(configuredPath) : resolve(process.cwd(), "data", "leads.sqlite");
}

function createDatabase() {
  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true });

  const database = new DatabaseSync(path);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
    CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
  `);

  return database;
}

function getDatabase() {
  const globalScope = globalThis as LeadsGlobal;
  globalScope.__nexumLeadsDb ??= createDatabase();
  return globalScope.__nexumLeadsDb;
}

function normalizeRow(row: Record<string, unknown>): LeadRecord {
  return {
    id: Number(row.id),
    name: String(row.name),
    whatsapp: String(row.whatsapp),
    email: String(row.email),
    createdAt: String(row.createdAt),
  };
}

export function insertLead(input: LeadInput) {
  const database = getDatabase();
  const createdAt = new Date().toISOString();
  const result = database
    .prepare(
      `INSERT INTO leads (name, whatsapp, email, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(input.name, input.whatsapp, input.email, createdAt);

  return {
    id: Number(result.lastInsertRowid),
    createdAt,
  };
}

export function listLeads(): LeadRecord[] {
  const rows = getDatabase()
    .prepare(
      `SELECT id, name, whatsapp, email, created_at AS createdAt
       FROM leads
       ORDER BY created_at DESC, id DESC`,
    )
    .all() as Record<string, unknown>[];

  return rows.map(normalizeRow);
}

export function isAdminPasswordValid(candidate: string) {
  const expected = process.env.ADMIN_PASSWORD?.trim();

  if (!expected) {
    if (process.env.NODE_ENV === "production") return false;
    return candidate === "nexum-admin";
  }

  const expectedBuffer = Buffer.from(expected);
  const candidateBuffer = Buffer.from(candidate);
  return (
    expectedBuffer.length === candidateBuffer.length &&
    timingSafeEqual(expectedBuffer, candidateBuffer)
  );
}
