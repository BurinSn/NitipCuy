import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";

export interface PrismaClientOptions {
  readonly connectionString: string;
  readonly connectionLimit?: number;
  readonly connectionTimeoutMs?: number;
  readonly idleTimeoutMs?: number;
  readonly statementTimeoutMs?: number;
}

export function createPrismaClient(options: PrismaClientOptions): PrismaClient {
  const connectionString = requirePostgresUrl(options.connectionString);
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: boundedInteger(
      options.connectionTimeoutMs ?? 5_000,
      "Connection timeout",
      250,
      30_000,
    ),
    idleTimeoutMillis: boundedInteger(
      options.idleTimeoutMs ?? 10_000,
      "Idle timeout",
      1_000,
      60_000,
    ),
    max: boundedInteger(
      options.connectionLimit ?? 5,
      "Connection limit",
      1,
      20,
    ),
    query_timeout: boundedInteger(
      options.statementTimeoutMs ?? 5_000,
      "Query timeout",
      250,
      30_000,
    ),
    statement_timeout: boundedInteger(
      options.statementTimeoutMs ?? 5_000,
      "Statement timeout",
      250,
      30_000,
    ),
  });

  return new PrismaClient({ adapter });
}

function requirePostgresUrl(value: string): string {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Database connection string must be a PostgreSQL URL.");
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("Database connection string must be a PostgreSQL URL.");
  }

  if (!parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
    throw new Error(
      "Database connection string must name a host and database.",
    );
  }

  return value;
}

function boundedInteger(
  value: number,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${field} must be between ${minimum} and ${maximum}.`);
  }

  return value;
}
