import { randomBytes } from "node:crypto";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import type {
  CourseActionResult,
  CourseInviteStatus,
  CoursePublicInvitation,
  CourseRegistrationRecord,
} from "./course.schema";
import { getDatabase, getMysqlDatabase, hasMysqlConfiguration } from "./leads.server";

const notFoundMessage = "Usuário não encontrado, confirmar E-mail.";
export const courseAccessDays = 25;
const dayInMilliseconds = 24 * 60 * 60 * 1000;

type LeadIdentity = {
  name: string;
  email: string;
};

type MysqlCourseRow = RowDataPacket & {
  id: number | string;
  name: string;
  email: string;
  inviteToken: string;
  status: CourseInviteStatus;
  createdAt: string;
  registeredAt: string | null;
  approvedAt: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function courseExpirationDate(approvedAt: string | null) {
  if (!approvedAt) return null;

  const approvedTimestamp = new Date(approvedAt).getTime();
  if (!Number.isFinite(approvedTimestamp)) return null;

  return new Date(approvedTimestamp + courseAccessDays * dayInMilliseconds).toISOString();
}

function normalizeCourseRow(row: Record<string, unknown>): CourseRegistrationRecord {
  const status: CourseInviteStatus =
    row.status === "approved" ? "approved" : row.status === "pending" ? "pending" : "invited";

  const approvedAt = row.approvedAt ? String(row.approvedAt) : null;
  const expiresAt = courseExpirationDate(approvedAt);

  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    inviteToken: String(row.inviteToken),
    status,
    createdAt: String(row.createdAt),
    registeredAt: row.registeredAt ? String(row.registeredAt) : null,
    approvedAt,
    expiresAt,
    accessExpired: expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false,
  };
}

async function ensureCourseTable() {
  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    await database.execute(`
      CREATE TABLE IF NOT EXISTS course_registrations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(160) NOT NULL,
        email VARCHAR(320) NOT NULL,
        invite_token CHAR(64) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'invited',
        created_at VARCHAR(35) NOT NULL,
        registered_at VARCHAR(35) NULL,
        approved_at VARCHAR(35) NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX course_registrations_email_idx (email),
        UNIQUE INDEX course_registrations_token_idx (invite_token),
        INDEX course_registrations_status_idx (status)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    return;
  }

  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS course_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      invite_token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'invited'
        CHECK (status IN ('invited', 'pending', 'approved')),
      created_at TEXT NOT NULL,
      registered_at TEXT,
      approved_at TEXT
    ) STRICT;

    CREATE INDEX IF NOT EXISTS course_registrations_status_idx
      ON course_registrations(status);
  `);
}

async function findLead(email: string): Promise<LeadIdentity | null> {
  const normalizedEmail = normalizeEmail(email);

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    const [rows] = await database.query<(RowDataPacket & LeadIdentity)[]>(
      `SELECT name, LOWER(TRIM(email)) AS email
       FROM leads
       WHERE LOWER(TRIM(email)) = ?
       ORDER BY id DESC
       LIMIT 1`,
      [normalizedEmail],
    );
    return rows[0] ?? null;
  }

  const row = getDatabase()
    .prepare(
      `SELECT name, LOWER(TRIM(email)) AS email
       FROM leads
       WHERE LOWER(TRIM(email)) = ?
       ORDER BY id DESC
       LIMIT 1`,
    )
    .get(normalizedEmail) as LeadIdentity | undefined;

  return row ?? null;
}

async function findRegistrationByEmail(email: string): Promise<CourseRegistrationRecord | null> {
  await ensureCourseTable();
  const normalizedEmail = normalizeEmail(email);

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    const [rows] = await database.query<MysqlCourseRow[]>(
      `SELECT id, name, email, invite_token AS inviteToken, status,
              created_at AS createdAt, registered_at AS registeredAt,
              approved_at AS approvedAt
       FROM course_registrations
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail],
    );
    return rows[0] ? normalizeCourseRow(rows[0]) : null;
  }

  const row = getDatabase()
    .prepare(
      `SELECT id, name, email, invite_token AS inviteToken, status,
              created_at AS createdAt, registered_at AS registeredAt,
              approved_at AS approvedAt
       FROM course_registrations
       WHERE email = ?
       LIMIT 1`,
    )
    .get(normalizedEmail) as Record<string, unknown> | undefined;

  return row ? normalizeCourseRow(row) : null;
}

async function findRegistrationByToken(token: string): Promise<CourseRegistrationRecord | null> {
  await ensureCourseTable();

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    const [rows] = await database.query<MysqlCourseRow[]>(
      `SELECT id, name, email, invite_token AS inviteToken, status,
              created_at AS createdAt, registered_at AS registeredAt,
              approved_at AS approvedAt
       FROM course_registrations
       WHERE invite_token = ?
       LIMIT 1`,
      [token],
    );
    return rows[0] ? normalizeCourseRow(rows[0]) : null;
  }

  const row = getDatabase()
    .prepare(
      `SELECT id, name, email, invite_token AS inviteToken, status,
              created_at AS createdAt, registered_at AS registeredAt,
              approved_at AS approvedAt
       FROM course_registrations
       WHERE invite_token = ?
       LIMIT 1`,
    )
    .get(token) as Record<string, unknown> | undefined;

  return row ? normalizeCourseRow(row) : null;
}

async function findRegistrationById(id: number): Promise<CourseRegistrationRecord | null> {
  await ensureCourseTable();

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    const [rows] = await database.query<MysqlCourseRow[]>(
      `SELECT id, name, email, invite_token AS inviteToken, status,
              created_at AS createdAt, registered_at AS registeredAt,
              approved_at AS approvedAt
       FROM course_registrations
       WHERE id = ?
       LIMIT 1`,
      [id],
    );
    return rows[0] ? normalizeCourseRow(rows[0]) : null;
  }

  const row = getDatabase()
    .prepare(
      `SELECT id, name, email, invite_token AS inviteToken, status,
              created_at AS createdAt, registered_at AS registeredAt,
              approved_at AS approvedAt
       FROM course_registrations
       WHERE id = ?
       LIMIT 1`,
    )
    .get(id) as Record<string, unknown> | undefined;

  return row ? normalizeCourseRow(row) : null;
}

export async function createCourseInvite(email: string): Promise<CourseActionResult> {
  const normalizedEmail = normalizeEmail(email);
  const lead = await findLead(normalizedEmail);

  if (!lead) return { ok: false, message: notFoundMessage };

  const existingRegistration = await findRegistrationByEmail(normalizedEmail);
  if (existingRegistration) {
    return {
      ok: true,
      status: existingRegistration.status,
      name: existingRegistration.name,
      token: existingRegistration.inviteToken,
    };
  }

  const token = randomBytes(32).toString("hex");
  const createdAt = new Date().toISOString();

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    await database.execute<ResultSetHeader>(
      `INSERT INTO course_registrations
         (name, email, invite_token, status, created_at)
       VALUES (?, ?, ?, 'invited', ?)`,
      [lead.name, normalizedEmail, token, createdAt],
    );
  } else {
    getDatabase()
      .prepare(
        `INSERT INTO course_registrations
           (name, email, invite_token, status, created_at)
         VALUES (?, ?, ?, 'invited', ?)`,
      )
      .run(lead.name, normalizedEmail, token, createdAt);
  }

  return { ok: true, status: "invited", name: lead.name, token };
}

export async function getPublicInvitation(token: string): Promise<CoursePublicInvitation | null> {
  const registration = await findRegistrationByToken(token);
  if (!registration) return null;

  return {
    name: registration.name,
    status: registration.status,
  };
}

export async function registerCourseInvite(input: {
  token: string;
  name: string;
  email: string;
}): Promise<CourseActionResult> {
  const email = normalizeEmail(input.email);
  const registration = await findRegistrationByToken(input.token);
  const lead = await findLead(email);

  if (!registration || !lead || registration.email !== email) {
    return { ok: false, message: notFoundMessage };
  }

  if (registration.status === "approved") {
    return {
      ok: true,
      status: "approved",
      name: registration.name,
      token: registration.inviteToken,
    };
  }

  const registeredAt = new Date().toISOString();
  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    await database.execute(
      `UPDATE course_registrations
       SET name = ?, status = 'pending', registered_at = ?
       WHERE id = ?`,
      [input.name, registeredAt, registration.id],
    );
  } else {
    getDatabase()
      .prepare(
        `UPDATE course_registrations
         SET name = ?, status = 'pending', registered_at = ?
         WHERE id = ?`,
      )
      .run(input.name, registeredAt, registration.id);
  }

  return { ok: true, status: "pending", name: input.name, token: input.token };
}

export async function approveCourseInvite(registrationId: number): Promise<CourseActionResult> {
  const registration = await findRegistrationById(registrationId);

  if (!registration || registration.status !== "pending") {
    return { ok: false, message: notFoundMessage };
  }

  const lead = await findLead(registration.email);
  if (!lead) return { ok: false, message: notFoundMessage };

  const approvedAt = new Date().toISOString();
  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    await database.execute(
      `UPDATE course_registrations SET status = 'approved', approved_at = ? WHERE id = ?`,
      [approvedAt, registrationId],
    );
  } else {
    getDatabase()
      .prepare(`UPDATE course_registrations SET status = 'approved', approved_at = ? WHERE id = ?`)
      .run(approvedAt, registrationId);
  }

  return {
    ok: true,
    status: "approved",
    name: registration.name,
    token: registration.inviteToken,
  };
}

export async function checkCourseToken(token: string): Promise<CourseActionResult> {
  const registration = await findRegistrationByToken(token);

  if (!registration || !(await findLead(registration.email))) {
    return { ok: false, message: notFoundMessage };
  }

  if (registration.status === "invited") {
    return { ok: false, message: "Finalize sua inscrição pelo link protegido." };
  }

  if (registration.status === "pending") {
    return { ok: false, message: "Seu acesso ainda está aguardando liberação." };
  }

  if (registration.accessExpired) {
    return { ok: false, message: "Seu período de 25 dias de acesso foi encerrado." };
  }

  return {
    ok: true,
    status: "approved",
    name: registration.name,
    token: registration.inviteToken,
  };
}

export async function listCourseRegistrations(): Promise<CourseRegistrationRecord[]> {
  await ensureCourseTable();

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    const [rows] = await database.query<MysqlCourseRow[]>(
      `SELECT id, name, email, invite_token AS inviteToken, status,
              created_at AS createdAt, registered_at AS registeredAt,
              approved_at AS approvedAt
       FROM course_registrations
       ORDER BY created_at DESC, id DESC`,
    );
    return rows.map(normalizeCourseRow);
  }

  const rows = getDatabase()
    .prepare(
      `SELECT id, name, email, invite_token AS inviteToken, status,
              created_at AS createdAt, registered_at AS registeredAt,
              approved_at AS approvedAt
       FROM course_registrations
       ORDER BY created_at DESC, id DESC`,
    )
    .all() as Record<string, unknown>[];

  return rows.map(normalizeCourseRow);
}

export { notFoundMessage };
