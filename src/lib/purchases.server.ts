import { randomBytes, timingSafeEqual } from "node:crypto";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import nodemailer, { type Transporter } from "nodemailer";

import { getDatabase, getMysqlDatabase, hasMysqlConfiguration } from "./leads.server";

export type PurchaseDeliveryRecord = {
  id: number;
  transactionId: string;
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  productId: string;
  productName: string;
  downloadToken: string;
  status: "approved" | "revoked";
  approvedAt: string;
  emailSentAt: string | null;
  emailError: string | null;
  downloadCount: number;
  lastDownloadAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PurchaseInput = {
  transactionId: string;
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  productId: string;
  productName: string;
  approvedAt: string;
};

type MysqlPurchaseRow = RowDataPacket & {
  id: number | string;
  transactionId: string;
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  productId: string;
  productName: string;
  downloadToken: string;
  status: "approved" | "revoked";
  approvedAt: string;
  emailSentAt: string | null;
  emailError: string | null;
  downloadCount: number | string;
  lastDownloadAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PurchasesGlobal = typeof globalThis & {
  __nexumMailer?: Transporter;
};

const publicSiteUrl = "https://nexum.fluxosimplificado.com";

function normalizeRow(row: Record<string, unknown>): PurchaseDeliveryRecord {
  return {
    id: Number(row.id),
    transactionId: String(row.transactionId),
    eventId: String(row.eventId),
    buyerName: String(row.buyerName),
    buyerEmail: String(row.buyerEmail),
    productId: String(row.productId),
    productName: String(row.productName),
    downloadToken: String(row.downloadToken),
    status: row.status === "revoked" ? "revoked" : "approved",
    approvedAt: String(row.approvedAt),
    emailSentAt: row.emailSentAt ? String(row.emailSentAt) : null,
    emailError: row.emailError ? String(row.emailError) : null,
    downloadCount: Number(row.downloadCount),
    lastDownloadAt: row.lastDownloadAt ? String(row.lastDownloadAt) : null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

async function ensurePurchasesTable() {
  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    await database.execute(`
      CREATE TABLE IF NOT EXISTS purchase_deliveries (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        transaction_id VARCHAR(120) NOT NULL,
        event_id VARCHAR(120) NOT NULL,
        buyer_name VARCHAR(160) NOT NULL,
        buyer_email VARCHAR(320) NOT NULL,
        product_id VARCHAR(120) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        download_token CHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        approved_at VARCHAR(35) NOT NULL,
        email_sent_at VARCHAR(35) NULL,
        email_error TEXT NULL,
        download_count INT UNSIGNED NOT NULL DEFAULT 0,
        last_download_at VARCHAR(35) NULL,
        created_at VARCHAR(35) NOT NULL,
        updated_at VARCHAR(35) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX purchase_deliveries_transaction_idx (transaction_id),
        UNIQUE INDEX purchase_deliveries_token_idx (download_token),
        INDEX purchase_deliveries_email_idx (buyer_email),
        INDEX purchase_deliveries_status_idx (status)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    return;
  }

  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS purchase_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT NOT NULL UNIQUE,
      event_id TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      buyer_email TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      download_token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      approved_at TEXT NOT NULL,
      email_sent_at TEXT,
      email_error TEXT,
      download_count INTEGER NOT NULL DEFAULT 0,
      last_download_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS purchase_deliveries_email_idx
      ON purchase_deliveries(buyer_email);
    CREATE INDEX IF NOT EXISTS purchase_deliveries_status_idx
      ON purchase_deliveries(status);
  `);
}

const purchaseSelect = `
  SELECT id, transaction_id AS transactionId, event_id AS eventId,
         buyer_name AS buyerName, buyer_email AS buyerEmail,
         product_id AS productId, product_name AS productName,
         download_token AS downloadToken, status,
         approved_at AS approvedAt, email_sent_at AS emailSentAt,
         email_error AS emailError, download_count AS downloadCount,
         last_download_at AS lastDownloadAt, created_at AS createdAt,
         updated_at AS updatedAt
  FROM purchase_deliveries
`;

async function findPurchaseByTransaction(transactionId: string) {
  await ensurePurchasesTable();

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    const [rows] = await database.execute<MysqlPurchaseRow[]>(
      `${purchaseSelect} WHERE transaction_id = ? LIMIT 1`,
      [transactionId],
    );
    return rows[0] ? normalizeRow(rows[0]) : null;
  }

  const row = getDatabase()
    .prepare(`${purchaseSelect} WHERE transaction_id = ? LIMIT 1`)
    .get(transactionId) as Record<string, unknown> | undefined;
  return row ? normalizeRow(row) : null;
}

export async function saveApprovedPurchase(input: PurchaseInput) {
  await ensurePurchasesTable();
  const now = new Date().toISOString();
  const downloadToken = randomBytes(32).toString("hex");

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    await database.execute<ResultSetHeader>(
      `INSERT INTO purchase_deliveries
         (transaction_id, event_id, buyer_name, buyer_email, product_id, product_name,
          download_token, status, approved_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         event_id = VALUES(event_id), buyer_name = VALUES(buyer_name),
         buyer_email = VALUES(buyer_email), product_id = VALUES(product_id),
         product_name = VALUES(product_name), status = 'approved',
         approved_at = VALUES(approved_at), updated_at = VALUES(updated_at)`,
      [
        input.transactionId,
        input.eventId,
        input.buyerName,
        input.buyerEmail,
        input.productId,
        input.productName,
        downloadToken,
        input.approvedAt,
        now,
        now,
      ],
    );
  } else {
    getDatabase()
      .prepare(
        `INSERT INTO purchase_deliveries
           (transaction_id, event_id, buyer_name, buyer_email, product_id, product_name,
            download_token, status, approved_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)
         ON CONFLICT(transaction_id) DO UPDATE SET
           event_id = excluded.event_id, buyer_name = excluded.buyer_name,
           buyer_email = excluded.buyer_email, product_id = excluded.product_id,
           product_name = excluded.product_name, status = 'approved',
           approved_at = excluded.approved_at, updated_at = excluded.updated_at`,
      )
      .run(
        input.transactionId,
        input.eventId,
        input.buyerName,
        input.buyerEmail,
        input.productId,
        input.productName,
        downloadToken,
        input.approvedAt,
        now,
        now,
      );
  }

  const purchase = await findPurchaseByTransaction(input.transactionId);
  if (!purchase) throw new Error("A compra aprovada não pôde ser registrada.");
  return purchase;
}

export async function revokePurchase(transactionId: string, eventId: string) {
  await ensurePurchasesTable();
  const now = new Date().toISOString();

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    await database.execute(
      `UPDATE purchase_deliveries
       SET status = 'revoked', event_id = ?, updated_at = ?
       WHERE transaction_id = ?`,
      [eventId, now, transactionId],
    );
    return;
  }

  getDatabase()
    .prepare(
      `UPDATE purchase_deliveries
       SET status = 'revoked', event_id = ?, updated_at = ?
       WHERE transaction_id = ?`,
    )
    .run(eventId, now, transactionId);
}

export async function findApprovedPurchaseByToken(token: string) {
  await ensurePurchasesTable();

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    const [rows] = await database.execute<MysqlPurchaseRow[]>(
      `${purchaseSelect} WHERE download_token = ? AND status = 'approved' LIMIT 1`,
      [token],
    );
    return rows[0] ? normalizeRow(rows[0]) : null;
  }

  const row = getDatabase()
    .prepare(`${purchaseSelect} WHERE download_token = ? AND status = 'approved' LIMIT 1`)
    .get(token) as Record<string, unknown> | undefined;
  return row ? normalizeRow(row) : null;
}

export async function recordPurchaseDownload(transactionId: string) {
  const now = new Date().toISOString();

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    await database.execute(
      `UPDATE purchase_deliveries
       SET download_count = download_count + 1, last_download_at = ?, updated_at = ?
       WHERE transaction_id = ? AND status = 'approved'`,
      [now, now, transactionId],
    );
    return;
  }

  getDatabase()
    .prepare(
      `UPDATE purchase_deliveries
       SET download_count = download_count + 1, last_download_at = ?, updated_at = ?
       WHERE transaction_id = ? AND status = 'approved'`,
    )
    .run(now, now, transactionId);
}

export async function markPurchaseEmailSent(transactionId: string) {
  const now = new Date().toISOString();

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    await database.execute(
      `UPDATE purchase_deliveries
       SET email_sent_at = ?, email_error = NULL, updated_at = ?
       WHERE transaction_id = ?`,
      [now, now, transactionId],
    );
    return;
  }

  getDatabase()
    .prepare(
      `UPDATE purchase_deliveries
       SET email_sent_at = ?, email_error = NULL, updated_at = ?
       WHERE transaction_id = ?`,
    )
    .run(now, now, transactionId);
}

export async function markPurchaseEmailError(transactionId: string, error: unknown) {
  const now = new Date().toISOString();
  const message = (error instanceof Error ? error.message : String(error)).slice(0, 1000);

  if (hasMysqlConfiguration()) {
    const database = await getMysqlDatabase();
    await database.execute(
      `UPDATE purchase_deliveries SET email_error = ?, updated_at = ? WHERE transaction_id = ?`,
      [message, now, transactionId],
    );
    return;
  }

  getDatabase()
    .prepare(
      `UPDATE purchase_deliveries SET email_error = ?, updated_at = ? WHERE transaction_id = ?`,
    )
    .run(message, now, transactionId);
}

function requiredEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} não está configurado.`);
  return value;
}

function usesDevelopmentMailTransport() {
  return process.env.NODE_ENV !== "production" && process.env.SMTP_JSON_TRANSPORT === "true";
}

function mailer() {
  const globalScope = globalThis as PurchasesGlobal;
  if (globalScope.__nexumMailer) return globalScope.__nexumMailer;

  if (usesDevelopmentMailTransport()) {
    globalScope.__nexumMailer = nodemailer.createTransport({ jsonTransport: true });
    return globalScope.__nexumMailer;
  }

  const port = Number(process.env.SMTP_PORT?.trim() || "465");
  if (!Number.isInteger(port) || port <= 0) throw new Error("SMTP_PORT precisa ser válido.");

  globalScope.__nexumMailer = nodemailer.createTransport({
    host: requiredEnvironmentValue("SMTP_HOST"),
    port,
    secure: process.env.SMTP_SECURE?.trim().toLowerCase() !== "false",
    auth: {
      user: requiredEnvironmentValue("SMTP_USER"),
      pass: requiredEnvironmentValue("SMTP_PASSWORD"),
    },
  });
  return globalScope.__nexumMailer;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function siteOrigin() {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (!configured) return publicSiteUrl;

  const url = new URL(configured);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("PUBLIC_SITE_URL precisa usar HTTP ou HTTPS.");
  }
  return url.origin;
}

export async function sendPurchaseDeliveryEmail(purchase: PurchaseDeliveryRecord) {
  const fromEmail =
    process.env.SMTP_FROM_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    (usesDevelopmentMailTransport()
      ? "noreply@nexum.local"
      : requiredEnvironmentValue("SMTP_USER"));
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "NEXUM";
  const downloadUrl = `${siteOrigin()}/api/compra/arquivo?token=${purchase.downloadToken}`;
  const firstName = purchase.buyerName.trim().split(/\s+/)[0] || "Trader";

  await mailer().sendMail({
    from: { name: fromName, address: fromEmail },
    to: purchase.buyerEmail,
    subject: "Seu NEXUM está liberado",
    text: [
      `Olá, ${firstName}!`,
      "",
      "Seu pagamento foi confirmado e o seu indicador NEXUM já está disponível.",
      "",
      `Baixe o arquivo por este link: ${downloadUrl}`,
      "",
      "Guarde este e-mail para acessar novamente quando precisar.",
      "",
      "Equipe NEXUM",
    ].join("\n"),
    html: `
      <div style="margin:0;background:#08070f;padding:32px 16px;color:#f7f4ff;font-family:Arial,sans-serif">
        <div style="max-width:600px;margin:0 auto;border:1px solid #32274a;border-radius:18px;background:#100d19;padding:32px">
          <p style="margin:0 0 16px;color:#a566ff;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Pagamento confirmado</p>
          <h1 style="margin:0 0 18px;font-size:30px;line-height:1.15">Seu NEXUM está liberado.</h1>
          <p style="margin:0 0 14px;color:#c9c3d5;font-size:16px;line-height:1.6">Olá, ${escapeHtml(firstName)}! Seu pagamento foi confirmado e o indicador já está disponível para download.</p>
          <a href="${downloadUrl}" style="display:block;margin:26px 0;padding:17px 22px;border-radius:10px;background:#8a2cff;color:#fff;font-size:16px;font-weight:700;text-align:center;text-decoration:none">BAIXAR INDICADOR NEXUM</a>
          <p style="margin:0;color:#8f899b;font-size:13px;line-height:1.5">Guarde este e-mail para acessar novamente quando precisar. Se o botão não abrir, copie este endereço:<br><span style="word-break:break-all;color:#b9a8d6">${downloadUrl}</span></p>
        </div>
      </div>
    `,
  });
}

export function isHotmartHottokValid(candidate: string | null | undefined) {
  const expected = process.env.HOTMART_HOTTOK?.trim();
  const received = candidate?.trim();
  if (!expected || !received) return false;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export function isConfiguredHotmartProduct(productId: string, productUcode?: string) {
  const expected = process.env.HOTMART_PRODUCT_ID?.trim();
  if (!expected) return true;
  return expected === productId || expected === productUcode;
}
