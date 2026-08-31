import { timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createPool, type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

import type { LeadInput, LeadRecord } from "./leads.schema";

type LeadsGlobal = typeof globalThis & {
  __nexumLeadsDb?: DatabaseSync;
  __nexumLeadsMysql?: Promise<Pool>;
};

type MysqlLeadRow = RowDataPacket & {
  id: number | string;
  name: string;
  whatsapp: string;
  email: string;
  createdAt: string;
};

export function hasMysqlConfiguration() {
  const connectionUrl = process.env.DATABASE_URL?.trim();
  if (connectionUrl) {
    if (!connectionUrl.toLowerCase().startsWith("mysql://")) {
      throw new Error("DATABASE_URL precisa usar o protocolo mysql://.");
    }
    return true;
  }

  const requiredVariables = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const;
  const configuredVariables = requiredVariables.filter((key) => process.env[key]?.trim());

  if (configuredVariables.length > 0 && configuredVariables.length < requiredVariables.length) {
    const missingVariables = requiredVariables.filter((key) => !process.env[key]?.trim());
    throw new Error(`Configuração MySQL incompleta. Faltam: ${missingVariables.join(", ")}.`);
  }

  return configuredVariables.length === requiredVariables.length;
}

async function createMysqlDatabase() {
  const connectionUrl = process.env.DATABASE_URL?.trim();
  const port = Number(process.env.DB_PORT?.trim() || "3306");

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("DB_PORT precisa ser uma porta válida.");
  }

  const pool = connectionUrl
    ? createPool({
        uri: connectionUrl,
        connectionLimit: 5,
        enableKeepAlive: true,
      })
    : createPool({
        host: process.env.DB_HOST?.trim(),
        port,
        user: process.env.DB_USER?.trim(),
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME?.trim(),
        connectionLimit: 5,
        enableKeepAlive: true,
      });

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(160) NOT NULL,
      whatsapp VARCHAR(32) NOT NULL,
      email VARCHAR(320) NOT NULL,
      created_at VARCHAR(35) NOT NULL,
      PRIMARY KEY (id),
      INDEX leads_created_at_idx (created_at),
      INDEX leads_email_idx (email)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  return pool;
}

export function getMysqlDatabase() {
  const globalScope = globalThis as LeadsGlobal;
  globalScope.__nexumLeadsMysql ??= createMysqlDatabase();
  return globalScope.__nexumLeadsMysql;
}

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

export function getDatabase() {
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

export async function insertLead(input: LeadInput) {
  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    const createdAt = new Date().toISOString();
    const [result] = await database.execute<ResultSetHeader>(
      `INSERT INTO leads (name, whatsapp, email, created_at)
       VALUES (?, ?, ?, ?)`,
      [input.name, input.whatsapp, input.email, createdAt],
    );

    return {
      id: Number(result.insertId),
      createdAt,
    };
  }

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

export async function listLeads(): Promise<LeadRecord[]> {
  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    const [rows] = await database.query<MysqlLeadRow[]>(
      `SELECT id, name, whatsapp, email, created_at AS createdAt
       FROM leads
       ORDER BY created_at DESC, id DESC`,
    );

    return rows.map(normalizeRow);
  }

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
