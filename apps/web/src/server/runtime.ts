import "server-only";

import { randomUUID } from "node:crypto";

import {
  GoogleOidcClient,
  PostgresOAuthAttemptAuthority,
  PostgresSessionAuthority,
  PrismaMarketplaceUnitOfWork,
  PrismaTripDiscoveryRepository,
  SystemClock,
  UuidIdentifier,
  createPrismaClient,
  oauthAttemptCookie,
  safeLocalReturnPath,
  sessionCookie,
} from "@nitipcuy/adapters";
import {
  AnswerPublicQuestion,
  AskPublicQuestion,
  CreateJastipperProfile,
  CreateTripDraft,
  GetPublishedTrip,
  ListPublishedTrips,
  ModerateTrip,
  ResolveGoogleAccount,
  SubmitTripForModeration,
} from "@nitipcuy/application";

interface RuntimeConfiguration {
  readonly appOrigin: string;
  readonly databaseUrl: string;
  readonly oauthEncryptionKey: Uint8Array;
  readonly sessionHmacKey: Uint8Array;
}

const clock = new SystemClock();
const identifiers = new UuidIdentifier();
let runtimeSingleton: ReturnType<typeof createRuntime> | undefined;
let oidcSingleton: Promise<GoogleOidcClient> | undefined;

export const runtimeSessionCookie = sessionCookie;
export const runtimeOAuthAttemptCookie = oauthAttemptCookie;
export const safeAuthenticationReturnPath = safeLocalReturnPath;

interface RuntimeCookiePolicy {
  readonly httpOnly: boolean;
  readonly path: string;
  readonly sameSite: "lax";
  readonly secure: boolean;
}

export function runtimeCookieOptions(
  policy: RuntimeCookiePolicy,
  maxAge: number,
) {
  return Object.freeze({
    httpOnly: policy.httpOnly,
    maxAge,
    path: policy.path,
    sameSite: policy.sameSite,
    secure: policy.secure,
  });
}

export function cookieMaxAge(expiresAt: string): number {
  return Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1_000));
}

export class RuntimeConfigurationError extends Error {
  constructor() {
    super("Persisted account runtime is not configured.");
    this.name = "RuntimeConfigurationError";
  }
}

export function hasPersistedRuntimeConfiguration(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getRuntime() {
  runtimeSingleton ??= createRuntime(readRuntimeConfiguration());
  return runtimeSingleton;
}

export function getGoogleOidcClient(): Promise<GoogleOidcClient> {
  const configuration = readRuntimeConfiguration();
  oidcSingleton ??= GoogleOidcClient.discover({
    clientId: requiredEnvironment("GOOGLE_CLIENT_ID"),
    clientSecret: requiredEnvironment("GOOGLE_CLIENT_SECRET"),
    redirectUri: `${configuration.appOrigin}/auth/google/callback`,
  });
  return oidcSingleton;
}

export async function recordAuthenticationOutcome(
  reasonCode: string,
  outcome: "DENIED" | "FAILED",
): Promise<void> {
  const runtime = getRuntime();
  await runtime.prisma.auditEvent.create({
    data: {
      action: "authentication.google-callback",
      correlationId: randomUUID(),
      id: randomUUID(),
      occurredAt: new Date(clock.now()),
      outcome,
      reasonCode,
      targetId: "unresolved",
      targetType: "oauth-attempt",
    },
  });
}

function createRuntime(configuration: RuntimeConfiguration) {
  const prisma = createPrismaClient({
    connectionLimit: 5,
    connectionString: configuration.databaseUrl,
    connectionTimeoutMs: 5_000,
    idleTimeoutMs: 10_000,
  });
  const unitOfWork = new PrismaMarketplaceUnitOfWork(prisma);
  const dependencies = { clock, identifiers, unitOfWork };
  const discovery = new PrismaTripDiscoveryRepository(prisma);

  return Object.freeze({
    answerPublicQuestion: new AnswerPublicQuestion(dependencies),
    appOrigin: configuration.appOrigin,
    askPublicQuestion: new AskPublicQuestion(dependencies),
    createJastipperProfile: new CreateJastipperProfile(dependencies),
    createTripDraft: new CreateTripDraft(dependencies),
    getPublishedTrip: new GetPublishedTrip(discovery),
    listPublishedTrips: new ListPublishedTrips(discovery),
    moderateTrip: new ModerateTrip(dependencies),
    oauthAttempts: new PostgresOAuthAttemptAuthority(prisma, {
      clock,
      encryptionKey: configuration.oauthEncryptionKey,
    }),
    prisma,
    resolveGoogleAccount: new ResolveGoogleAccount(dependencies),
    sessions: new PostgresSessionAuthority(prisma, {
      clock,
      tokenHmacKey: configuration.sessionHmacKey,
    }),
    submitTripForModeration: new SubmitTripForModeration(dependencies),
  });
}

function readRuntimeConfiguration(): RuntimeConfiguration {
  return Object.freeze({
    appOrigin: exactOrigin(requiredEnvironment("NITIPCUY_APP_ORIGIN")),
    databaseUrl: requiredEnvironment("DATABASE_URL"),
    oauthEncryptionKey: base64Key(
      requiredEnvironment("OAUTH_ATTEMPT_ENCRYPTION_KEY_BASE64"),
      "OAuth attempt encryption key",
    ),
    sessionHmacKey: base64Key(
      requiredEnvironment("SESSION_TOKEN_HMAC_KEY_BASE64"),
      "Session HMAC key",
    ),
  });
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new RuntimeConfigurationError();
  }
  return value;
}

function exactOrigin(value: string): string {
  const url = new URL(value);
  const localDevelopment =
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if (
    (url.protocol !== "https:" && !localDevelopment) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("NitipCuy application origin is invalid.");
  }
  return url.origin;
}

function base64Key(value: string, field: string): Uint8Array {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error(`${field} must be base64 encoded.`);
  }
  const key = Buffer.from(value, "base64");
  if (key.byteLength !== 32) {
    throw new Error(`${field} must decode to exactly 32 bytes.`);
  }
  return Uint8Array.from(key);
}
