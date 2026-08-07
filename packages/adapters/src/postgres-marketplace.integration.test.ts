import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { Pool } from "pg";
import {
  GenericContainer,
  Wait,
  type StartedTestContainer,
} from "testcontainers";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  AnswerPublicQuestion,
  AskPublicQuestion,
  CreateJastipperProfile,
  CreateTripDraft,
  MarketplaceUseCaseError,
  ModerateTrip,
  ResolveGoogleAccount,
  SubmitTripForModeration,
  type ClockPort,
  type IdentifierPort,
  type VerifiedExternalIdentity,
} from "@nitipcuy/application";
import {
  accountId,
  sessionId,
  tripId,
  type AccountId,
  type AuthenticatedActor,
} from "@nitipcuy/domain";

import type { PrismaClient } from "./generated/prisma/client";
import { PostgresOAuthAttemptAuthority } from "./postgres-oauth-attempts";
import { PostgresSessionAuthority } from "./postgres-session-authority";
import { createPrismaClient } from "./prisma-client";
import {
  OptimisticConcurrencyError,
  PrismaMarketplaceUnitOfWork,
  PrismaTripDiscoveryRepository,
} from "./prisma-marketplace";

const migrationUrl = new URL(
  "../prisma/migrations/20260807050000_account_marketplace_foundation/migration.sql",
  import.meta.url,
);
const tables = [
  "public_answer",
  "public_question",
  "moderation_decision",
  "trip_offer",
  "jastipper_profile",
  "browser_session",
  "oauth_attempt",
  "account_capability_grant",
  "external_identity",
  "outbox_event",
  "audit_event",
  "account",
];

let container: StartedTestContainer;
let pool: Pool;
let prisma: PrismaClient;
let connectionString: string;

beforeAll(async () => {
  container = await new GenericContainer("postgres:18-alpine")
    .withEnvironment({
      POSTGRES_DB: "nitipcuy_test",
      POSTGRES_PASSWORD: "nitipcuy_test_password",
      POSTGRES_USER: "nitipcuy_test",
    })
    .withExposedPorts(5432)
    .withWaitStrategy(
      Wait.forLogMessage(/database system is ready to accept connections/, 2),
    )
    .withStartupTimeout(90_000)
    .start();

  connectionString = `postgresql://nitipcuy_test:nitipcuy_test_password@${container.getHost()}:${container.getMappedPort(5432)}/nitipcuy_test`;
  pool = new Pool({ connectionString, max: 2 });
  await pool.query(await readFile(migrationUrl, "utf8"));
  prisma = createPrismaClient({ connectionLimit: 3, connectionString });
}, 120_000);

beforeEach(async () => {
  await pool.query(
    `TRUNCATE TABLE ${tables.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
});

afterAll(async () => {
  await prisma?.$disconnect();
  await pool?.end();
  await container?.stop();
}, 30_000);

describe("persisted Google account to public marketplace slice", () => {
  it("persists identity, ownership, moderation, publication, and public Q&A atomically", async () => {
    const clock = new MutableClock("2026-08-07T05:00:00.000Z");
    const identifiers = new UuidSequence();
    const unitOfWork = new PrismaMarketplaceUnitOfWork(prisma);
    const dependencies = { clock, identifiers, unitOfWork };
    const resolveAccount = new ResolveGoogleAccount(dependencies);

    const seller = await resolveAccount.execute(
      googleIdentity(
        "seller-subject",
        "seller@example.com",
        "Rani Seller",
        clock,
      ),
      metadata("login-seller"),
    );
    const repeatedSeller = await resolveAccount.execute(
      googleIdentity(
        "seller-subject",
        "changed@example.com",
        "Rani Seller",
        clock,
      ),
      metadata("login-seller-again"),
    );
    const sameEmailDifferentSubject = await resolveAccount.execute(
      googleIdentity(
        "customer-subject",
        "seller@example.com",
        "Dina Buyer",
        clock,
      ),
      metadata("login-customer"),
    );

    expect(repeatedSeller.created).toBe(false);
    expect(repeatedSeller.account.id).toBe(seller.account.id);
    expect(sameEmailDifferentSubject.account.id).not.toBe(seller.account.id);
    expect(await prisma.account.count()).toBe(2);

    const sessions = sessionAuthority(clock);
    const sellerGrant = await sessions.create(seller.account.id);
    const customerGrant = await sessions.create(
      sameEmailDifferentSubject.account.id,
    );
    expect(sellerGrant).not.toBeNull();
    expect(customerGrant).not.toBeNull();
    const sellerActor = sellerGrant!.actor;
    const customerActor = customerGrant!.actor;

    const profile = await new CreateJastipperProfile(dependencies).execute(
      sellerActor,
      {
        deliverySummary: "Pickup in central Bandung",
        displayName: "Rani Jastip",
        rateSummary: "Rp275.000/kg, minimum 1 kg",
        sellerLocationLabel: "Bandung",
      },
      metadata("profile-create"),
    );

    const targetTripId = tripId("trip-persisted-001");
    const draft = await new CreateTripDraft(dependencies).execute(
      sellerActor,
      {
        departureAt: "2026-09-20T10:00:00+09:00",
        departureDate: "2026-09-20",
        destinationLabel: "Bandung",
        destinationTimeZone: "Asia/Jakarta",
        estimatedArrivalAt: "2026-09-21T14:00:00+07:00",
        id: targetTripId,
        originLabel: "Tokyo",
        originTimeZone: "Asia/Tokyo",
        remainingCapacityKg: 3,
        requestDeadline: "2026-09-18T18:00:00+09:00",
        requestOpenAt: "2026-08-25T09:00:00+07:00",
        serviceModes: ["CARRY_MY_ITEM"],
        serviceWindowEndAt: "2026-09-19T18:00:00+09:00",
        serviceWindowStartAt: "2026-09-10T09:00:00+09:00",
      },
      metadata("trip-create"),
    );
    expect(draft.jastipperProfileId).toBe(profile.id);

    await expect(
      new SubmitTripForModeration(dependencies).execute(
        customerActor,
        targetTripId,
        metadata("cross-account-submit"),
      ),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_OWNED" });
    expect(
      (await prisma.tripOffer.findUnique({ where: { id: targetTripId } }))
        ?.status,
    ).toBe("DRAFT");

    await new SubmitTripForModeration(dependencies).execute(
      sellerActor,
      targetTripId,
      metadata("trip-submit"),
    );
    await expect(
      unitOfWork.execute((transaction) =>
        transaction.trips.save(
          { ...draft, status: "PENDING_MODERATION", version: 2 },
          draft.version,
        ),
      ),
    ).rejects.toBeInstanceOf(OptimisticConcurrencyError);

    const moderator = await resolveAccount.execute(
      googleIdentity(
        "moderator-subject",
        "moderator@example.com",
        "Mira Moderator",
        clock,
      ),
      metadata("login-moderator"),
    );
    await prisma.accountCapabilityGrant.create({
      data: {
        accountId: moderator.account.id,
        capability: "MODERATE_TRIPS",
      },
    });
    const baseModerator = (await sessions.create(moderator.account.id))!.actor;
    await expect(
      new ModerateTrip(dependencies).execute(
        { ...baseModerator, assurance: "PHISHING_RESISTANT" },
        {
          decision: "APPROVED",
          reasonCode: "MANUAL_REVIEW_PASSED",
          tripId: targetTripId,
        },
        metadata("moderate-forged-assurance"),
      ),
    ).rejects.toMatchObject({ code: "SESSION_INACTIVE" });
    await expect(
      new ModerateTrip(dependencies).execute(
        baseModerator,
        {
          decision: "APPROVED",
          reasonCode: "MANUAL_REVIEW_PASSED",
          tripId: targetTripId,
        },
        metadata("moderate-without-step-up"),
      ),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_ASSURANCE" });

    const moderatorWithoutCapability = await insertAccount(
      "Moderator Without Capability",
    );
    const forgedCapabilityActor = await insertActorSession(
      clock,
      moderatorWithoutCapability,
      "PHISHING_RESISTANT",
      new Set(["MODERATE_TRIPS"]),
    );
    await expect(
      new ModerateTrip(dependencies).execute(
        forgedCapabilityActor,
        {
          decision: "APPROVED",
          reasonCode: "MANUAL_REVIEW_PASSED",
          tripId: targetTripId,
        },
        metadata("moderate-without-capability"),
      ),
    ).rejects.toMatchObject({ code: "MISSING_CAPABILITY" });

    const steppedUpModerator = await insertActorSession(
      clock,
      moderator.account.id,
      "PHISHING_RESISTANT",
      new Set(["MODERATE_TRIPS"]),
    );
    await new ModerateTrip(dependencies).execute(
      steppedUpModerator,
      {
        decision: "APPROVED",
        reasonCode: "MANUAL_REVIEW_PASSED",
        tripId: targetTripId,
      },
      metadata("moderate-approved"),
    );

    const discovery = new PrismaTripDiscoveryRepository(prisma);
    expect(
      await discovery.searchPublished({ destination: "bandung" }),
    ).toHaveLength(1);

    const question = await new AskPublicQuestion(dependencies).execute(
      customerActor,
      { message: "Can I request fragile packaging?", tripId: targetTripId },
      metadata("question-create"),
    );
    await expect(
      new AnswerPublicQuestion(dependencies).execute(
        customerActor,
        { message: "I should not answer this.", questionId: question.id },
        metadata("cross-account-answer"),
      ),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_OWNED" });

    await prisma.publicQuestion.update({
      data: { status: "HIDDEN" },
      where: { id: question.id },
    });
    await expect(
      new AnswerPublicQuestion(dependencies).execute(
        sellerActor,
        {
          message: "A hidden question must remain unanswerable.",
          questionId: question.id,
        },
        metadata("hidden-question-answer"),
      ),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" });
    await prisma.publicQuestion.update({
      data: { status: "VISIBLE" },
      where: { id: question.id },
    });

    await new AnswerPublicQuestion(dependencies).execute(
      sellerActor,
      {
        message: "Yes, please mention it in your request.",
        questionId: question.id,
      },
      metadata("question-answer"),
    );

    const published = await discovery.findPublishedById(targetTripId);
    expect(published?.publicQuestions).toEqual([
      expect.objectContaining({
        answer: expect.objectContaining({ authorDisplayName: "Rani Jastip" }),
        authorDisplayName: "Dina Buyer",
      }),
    ]);
    expect(published).not.toHaveProperty("ownerAccountId");
    expect(published?.publicQuestions[0]).not.toHaveProperty("authorAccountId");
    expect(await prisma.moderationDecision.count()).toBe(1);
    expect(await prisma.auditEvent.count()).toBeGreaterThanOrEqual(9);
    expect(await prisma.outboxEvent.count()).toBeGreaterThanOrEqual(5);

    const beforeDuplicateAuditCount = await prisma.auditEvent.count();
    await expect(
      new CreateJastipperProfile(dependencies).execute(
        sellerActor,
        {
          deliverySummary: "Duplicate should roll back",
          displayName: "Duplicate Profile",
          rateSummary: "Rp1",
          sellerLocationLabel: "Bandung",
        },
        metadata("profile-duplicate"),
      ),
    ).rejects.toThrow();
    expect(await prisma.auditEvent.count()).toBe(beforeDuplicateAuditCount);
  }, 30_000);

  it("stores only session digests and revokes a rotated family on token reuse", async () => {
    const clock = new MutableClock("2026-08-07T05:00:00.000Z");
    const targetAccountId = await insertAccount("Session Owner");
    const sessions = sessionAuthority(clock);
    const initial = await sessions.create(targetAccountId);
    expect(initial).not.toBeNull();
    expect(initial?.actor.assurance).toBe("BASE");

    const stored = await prisma.browserSession.findUnique({
      where: { id: initial!.actor.sessionId },
    });
    expect(stored?.tokenDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(stored?.tokenDigest).not.toContain(initial!.token);
    expect(await sessions.validate(initial!.token)).toMatchObject({
      accountId: targetAccountId,
    });

    const rotated = await sessions.rotate(initial!.token);
    expect(rotated?.token).not.toBe(initial!.token);
    expect(await sessions.validate(rotated!.token)).not.toBeNull();

    expect(await sessions.validate(initial!.token)).toBeNull();
    expect(await sessions.validate(rotated!.token)).toBeNull();
    expect(await sessions.listActive(targetAccountId)).toHaveLength(0);

    const replacement = await sessions.create(targetAccountId);
    await sessions.revokeAll(targetAccountId);
    expect(await sessions.validate(replacement!.token)).toBeNull();
    await expect(
      new CreateJastipperProfile({
        clock,
        identifiers: new UuidSequence(),
        unitOfWork: new PrismaMarketplaceUnitOfWork(prisma),
      }).execute(
        replacement!.actor,
        {
          deliverySummary: "Must not persist after revocation",
          displayName: "Revoked Session",
          rateSummary: "Rp100.000/kg",
          sellerLocationLabel: "Bandung",
        },
        metadata("revoked-session-write"),
      ),
    ).rejects.toMatchObject({ code: "SESSION_INACTIVE" });
    expect(await prisma.jastipperProfile.count()).toBe(0);
  });

  it("denies a disabled Google account without minting another account", async () => {
    const clock = new MutableClock("2026-08-07T05:00:00.000Z");
    const dependencies = {
      clock,
      identifiers: new UuidSequence(),
      unitOfWork: new PrismaMarketplaceUnitOfWork(prisma),
    };
    const resolve = new ResolveGoogleAccount(dependencies);
    const created = await resolve.execute(
      googleIdentity(
        "disabled-subject",
        "disabled@example.com",
        "Disabled User",
        clock,
      ),
      metadata("disabled-create"),
    );
    await prisma.account.update({
      data: { status: "SUSPENDED" },
      where: { id: created.account.id },
    });

    await expect(
      resolve.execute(
        googleIdentity(
          "disabled-subject",
          "disabled@example.com",
          "Disabled User",
          clock,
        ),
        metadata("disabled-login"),
      ),
    ).rejects.toBeInstanceOf(MarketplaceUseCaseError);
    expect(await prisma.account.count()).toBe(1);
    expect(await prisma.auditEvent.count()).toBe(1);
  });

  it("resolves concurrent proof for one issuer and subject to one account", async () => {
    const clock = new MutableClock("2026-08-07T05:00:00.000Z");
    const dependencies = {
      clock,
      identifiers: new UuidSequence(),
      unitOfWork: new PrismaMarketplaceUnitOfWork(prisma),
    };
    const resolve = new ResolveGoogleAccount(dependencies);

    const results = await Promise.all([
      resolve.execute(
        googleIdentity(
          "concurrent-subject",
          "first@example.com",
          "Concurrent User",
          clock,
        ),
        metadata("concurrent-login-first"),
      ),
      resolve.execute(
        googleIdentity(
          "concurrent-subject",
          "second@example.com",
          "Concurrent User",
          clock,
        ),
        metadata("concurrent-login-second"),
      ),
    ]);

    expect(new Set(results.map(({ account }) => account.id)).size).toBe(1);
    expect(results.filter(({ created }) => created)).toHaveLength(1);
    expect(await prisma.account.count()).toBe(1);
    expect(await prisma.externalIdentity.count()).toBe(1);
    expect(await prisma.auditEvent.count()).toBe(2);
  });

  it("enforces profile ownership in PostgreSQL and pages public reads", async () => {
    const owner = await insertAccount("Profile Owner");
    const otherAccount = await insertAccount("Other Account");
    const profileId = crypto.randomUUID();
    await prisma.jastipperProfile.create({
      data: {
        accountId: owner,
        deliverySummary: "Pickup",
        displayName: "Profile Owner",
        id: profileId,
        rateSummary: "Rp100.000/kg",
        sellerLocationLabel: "Bandung",
      },
    });

    await expect(
      prisma.tripOffer.create({
        data: persistedPublishedTrip(
          "trip-forged-owner",
          otherAccount,
          profileId,
          "2026-09-20",
        ),
      }),
    ).rejects.toThrow();

    await prisma.tripOffer.createMany({
      data: [
        persistedPublishedTrip("trip-page-one", owner, profileId, "2026-09-20"),
        persistedPublishedTrip("trip-page-two", owner, profileId, "2026-09-21"),
      ],
    });
    const discovery = new PrismaTripDiscoveryRepository(prisma);
    const firstPage = await discovery.searchPublished({ limit: 1 });
    const secondPage = await discovery.searchPublished({
      cursor: firstPage[0]!.id,
      limit: 1,
    });

    expect(firstPage.map(({ id }) => id)).toEqual(["trip-page-one"]);
    expect(secondPage.map(({ id }) => id)).toEqual(["trip-page-two"]);
  });

  it("consumes encrypted OAuth state once and expires stale attempts", async () => {
    const clock = new MutableClock("2026-08-07T05:00:00.000Z");
    const attempts = new PostgresOAuthAttemptAuthority(prisma, {
      clock,
      encryptionKey: Uint8Array.from({ length: 32 }, (_, index) => index + 1),
      ttlMs: 60_000,
    });

    const created = await attempts.create("/trips?from=google");
    const stored = await prisma.oAuthAttempt.findFirstOrThrow();
    expect(stored.stateDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(stored.stateDigest).not.toContain(created.state);
    expect(stored.browserBindingDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(stored.browserBindingDigest).not.toContain(created.browserBinding);
    expect(stored.sealedNonce).not.toContain(created.nonce);
    expect(stored.sealedCodeVerifier).not.toContain(created.codeVerifier);

    await expect(
      attempts.consume(created.state, "wrong-browser-binding"),
    ).resolves.toBeNull();
    await expect(
      attempts.consume(created.state, created.browserBinding),
    ).resolves.toEqual({
      codeVerifier: created.codeVerifier,
      nonce: created.nonce,
      returnTo: created.returnTo,
    });
    await expect(
      attempts.consume(created.state, created.browserBinding),
    ).resolves.toBeNull();

    const expired = await attempts.create("/");
    clock.set("2026-08-07T05:02:00.000Z");
    await expect(
      attempts.consume(expired.state, expired.browserBinding),
    ).resolves.toBeNull();
    expect(
      (
        await prisma.oAuthAttempt.findFirstOrThrow({
          where: { stateDigest: { not: stored.stateDigest } },
        })
      ).status,
    ).toBe("EXPIRED");

    const corrupted = await attempts.create("/");
    await prisma.oAuthAttempt.update({
      data: { sealedNonce: "not-valid-ciphertext" },
      where: {
        stateDigest: createHash("sha256").update(corrupted.state).digest("hex"),
      },
    });
    await expect(
      attempts.consume(corrupted.state, corrupted.browserBinding),
    ).resolves.toBeNull();
  });

  it("has no password credential columns or persistence model", async () => {
    const result = await pool.query<{
      table_name: string;
      column_name: string;
    }>(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (column_name ILIKE '%password%' OR column_name ILIKE '%credential%')
    `);
    expect(result.rows).toEqual([]);
    expect(Object.keys(prisma)).not.toContain("passwordCredential");
    const identityColumns = await pool.query<{ column_name: string }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'external_identity'
    `);
    expect(
      identityColumns.rows.map(({ column_name }) => column_name),
    ).not.toContain("email");
  });
});

function sessionAuthority(clock: ClockPort): PostgresSessionAuthority {
  return new PostgresSessionAuthority(prisma, {
    absoluteTtlMs: 60 * 60_000,
    clock,
    idleTtlMs: 10 * 60_000,
    tokenHmacKey: Uint8Array.from({ length: 32 }, (_, index) => 255 - index),
  });
}

async function insertAccount(displayName: string): Promise<AccountId> {
  const id = accountId(crypto.randomUUID());
  await prisma.account.create({ data: { displayName, id } });
  return id;
}

function googleIdentity(
  subject: string,
  email: string,
  displayName: string,
  clock: ClockPort,
): VerifiedExternalIdentity {
  return {
    assurance: "BASE",
    authenticatedAt: clock.now(),
    displayName,
    email,
    emailVerified: true,
    issuer: "https://accounts.google.com",
    provider: "GOOGLE",
    subject,
  };
}

function metadata(correlationId: string) {
  return { correlationId };
}

async function insertActorSession(
  clock: ClockPort,
  id: AccountId,
  assurance: AuthenticatedActor["assurance"],
  capabilities: AuthenticatedActor["capabilities"] = new Set(),
): Promise<AuthenticatedActor> {
  const createdAt = new Date(clock.now());
  const idValue = crypto.randomUUID();
  const account = await prisma.account.findUniqueOrThrow({ where: { id } });
  await prisma.browserSession.create({
    data: {
      absoluteExpiresAt: new Date(createdAt.getTime() + 60 * 60_000),
      accountId: id,
      accountSessionVersion: account.sessionVersion,
      assurance,
      createdAt,
      familyId: crypto.randomUUID(),
      id: idValue,
      idleExpiresAt: new Date(createdAt.getTime() + 10 * 60_000),
      lastSeenAt: createdAt,
      tokenDigest: createHash("sha256").update(idValue).digest("hex"),
    },
  });
  return {
    accountId: id,
    assurance,
    capabilities,
    sessionId: sessionId(idValue),
  };
}

class MutableClock implements ClockPort {
  constructor(private instant: string) {}

  now(): string {
    return this.instant;
  }

  set(instant: string): void {
    this.instant = instant;
  }
}

class UuidSequence implements IdentifierPort {
  private value = 0;

  next(): string {
    this.value += 1;
    return `00000000-0000-4000-8000-${this.value.toString().padStart(12, "0")}`;
  }
}

function persistedPublishedTrip(
  id: string,
  ownerAccountId: AccountId,
  jastipperProfileId: string,
  departureDate: string,
) {
  return {
    departureAt: new Date(`${departureDate}T01:00:00.000Z`),
    departureDate: new Date(`${departureDate}T00:00:00.000Z`),
    destinationLabel: "Bandung",
    destinationTimeZone: "Asia/Jakarta",
    estimatedArrivalAt: new Date(`${departureDate}T10:00:00.000Z`),
    id,
    jastipperProfileId,
    originLabel: "Tokyo",
    originTimeZone: "Asia/Tokyo",
    ownerAccountId,
    publishedAt: new Date("2026-08-07T05:00:00.000Z"),
    remainingCapacityKg: 2,
    requestDeadline: new Date("2026-09-18T09:00:00.000Z"),
    requestOpenAt: new Date("2026-08-25T02:00:00.000Z"),
    serviceModes: ["CARRY_MY_ITEM"],
    serviceWindowEndAt: new Date("2026-09-19T09:00:00.000Z"),
    serviceWindowStartAt: new Date("2026-09-10T00:00:00.000Z"),
    status: "PUBLISHED" as const,
  };
}
