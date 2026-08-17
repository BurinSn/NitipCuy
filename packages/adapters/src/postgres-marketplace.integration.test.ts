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
  SubmitOrderRequest,
  SubmitTripForModeration,
  type ClockPort,
  type FingerprintPort,
  type IdentifierPort,
  type MarketplaceTransactionContext,
  type MarketplaceUnitOfWork,
  type OrderSubmissionRepository,
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
import {
  AbuseProtectionUnavailableError,
  PostgresAbuseProtection,
} from "./postgres-abuse-protection";
import { PostgresSessionAuthority } from "./postgres-session-authority";
import { createPrismaClient } from "./prisma-client";
import {
  OptimisticConcurrencyError,
  PrismaMarketplaceUnitOfWork,
  PrismaTripDiscoveryRepository,
} from "./prisma-marketplace";
import { Sha256Fingerprint } from "./node-platform-services";

const migrationUrls = [
  new URL(
    "../prisma/migrations/20260807050000_account_marketplace_foundation/migration.sql",
    import.meta.url,
  ),
  new URL(
    "../prisma/migrations/20260810090000_shared_abuse_controls/migration.sql",
    import.meta.url,
  ),
  new URL(
    "../prisma/migrations/20260811070000_order_submission_capacity/migration.sql",
    import.meta.url,
  ),
];
const tables = [
  "abuse_rate_limit_bucket",
  "order_submission_idempotency",
  "order_request",
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
  for (const migrationUrl of migrationUrls) {
    await pool.query(await readFile(migrationUrl, "utf8"));
  }
  prisma = createPrismaClient({ connectionLimit: 3, connectionString });
}, 120_000);

beforeEach(async () => {
  await pool.query(
    `TRUNCATE TABLE ${tables.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
});

describe("server-authoritative order submission", () => {
  it("persists both mode contracts, uses database time, and binds replay ownership", async () => {
    const fixture = await insertOrderFixture(5);
    const dependencies = {
      clock: new MutableClock("1900-01-01T00:00:00.000Z"),
      fingerprints: new Sha256Fingerprint(),
      identifiers: new UuidSequence(),
      unitOfWork: new PrismaMarketplaceUnitOfWork(prisma),
    };
    const submit = new SubmitOrderRequest(dependencies);

    const shop = await submit.execute(
      fixture.firstCustomer,
      {
        terms: {
          allowSubstitution: false,
          itemDescription: "Matcha gift set",
          maximumBudgetIdr: 750_000,
          quantity: 2,
          requestedCapacityGrams: 1_250,
          serviceMode: "SHOP_FOR_ME",
          variation: "Green package",
        },
        tripId: fixture.tripId,
      },
      {
        correlationId: "order-integration-shop",
        idempotencyKey: "shop-order-key-0001",
      },
    );
    const carry = await submit.execute(
      fixture.secondCustomer,
      {
        terms: {
          declaredValueIdr: 2_500_000,
          declaredWeightGrams: 2_500,
          handlingInstructions: "Keep upright",
          heightMillimeters: 300,
          itemDescription: "Camera tripod",
          lengthMillimeters: 700,
          serviceMode: "CARRY_MY_ITEM",
          widthMillimeters: 200,
        },
        tripId: fixture.tripId,
      },
      {
        correlationId: "order-integration-carry",
        idempotencyKey: "carry-order-key-0001",
      },
    );

    expect(shop.submittedAt).not.toContain("1900");
    expect(carry.reservedCapacityGrams).toBe(2_500);
    const rows = await prisma.orderRequest.findMany({ orderBy: { id: "asc" } });
    expect(rows).toHaveLength(2);
    expect(
      rows.find(({ serviceMode }) => serviceMode === "SHOP_FOR_ME"),
    ).toMatchObject({
      allowSubstitution: false,
      declaredWeightKg: null,
      maximumBudgetIdr: 750_000,
      quantity: 2,
      variation: "Green package",
    });
    expect(
      rows.find(({ serviceMode }) => serviceMode === "CARRY_MY_ITEM"),
    ).toMatchObject({
      declaredValueIdr: 2_500_000,
      handlingInstructions: "Keep upright",
      heightMillimeters: 300,
      maximumBudgetIdr: null,
      quantity: null,
    });
    const updatedTrip = await prisma.tripOffer.findUniqueOrThrow({
      where: { id: fixture.tripId },
    });
    expect(updatedTrip.remainingCapacityKg.toString()).toBe("1.25");
    expect(updatedTrip.version).toBe(3);
    expect(await prisma.orderSubmissionIdempotency.count()).toBe(2);
    expect(
      await prisma.auditEvent.count({
        where: { action: "order-request.submit" },
      }),
    ).toBe(2);
    expect(
      await prisma.outboxEvent.count({
        where: { topic: "order-request.submitted" },
      }),
    ).toBe(2);

    await prisma.orderSubmissionIdempotency.deleteMany({
      where: { requestId: shop.id },
    });
    await expect(
      pool.query(
        `INSERT INTO "order_submission_idempotency" (
          "customer_account_id", "operation", "key_digest", "fingerprint",
          "request_id", "completed_at", "expires_at"
        ) VALUES ($1, 'order.submit.v1', $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 day')`,
        [
          fixture.secondCustomer.accountId,
          "b".repeat(64),
          "c".repeat(64),
          shop.id,
        ],
      ),
    ).rejects.toMatchObject({ code: "23503" });

    const unrelatedProfileId = crypto.randomUUID();
    await prisma.jastipperProfile.create({
      data: {
        accountId: fixture.secondCustomer.accountId,
        deliverySummary: "Unrelated profile",
        displayName: "Unrelated Seller",
        id: unrelatedProfileId,
        rateSummary: "Unrelated terms",
        sellerLocationLabel: "Jakarta",
      },
    });
    await expect(
      pool.query(
        `UPDATE "order_request"
         SET "seller_account_id" = $1, "jastipper_profile_id" = $2
         WHERE "id" = $3`,
        [fixture.secondCustomer.accountId, unrelatedProfileId, shop.id],
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });

  it("allows only one independent transaction to reserve the final capacity and safely replays it", async () => {
    const fixture = await insertOrderFixture(1);
    const fingerprints = new Sha256Fingerprint();
    const identifiers = new UuidSequence();
    const createSubmitter = () =>
      new SubmitOrderRequest({
        clock: new MutableClock("1900-01-01T00:00:00.000Z"),
        fingerprints,
        identifiers,
        unitOfWork: new PrismaMarketplaceUnitOfWork(prisma),
      });
    const terms = {
      allowSubstitution: true,
      itemDescription: "Final capacity item",
      maximumBudgetIdr: 500_000,
      quantity: 1,
      requestedCapacityGrams: 1_000,
      serviceMode: "SHOP_FOR_ME" as const,
    };
    const attempts = [
      {
        actor: fixture.firstCustomer,
        key: "final-capacity-key-first",
        submitter: createSubmitter(),
      },
      {
        actor: fixture.secondCustomer,
        key: "final-capacity-key-second",
        submitter: createSubmitter(),
      },
    ];
    const results = await Promise.allSettled(
      attempts.map(({ actor: customer, key, submitter }) =>
        submitter.execute(
          customer,
          { terms, tripId: fixture.tripId },
          { correlationId: `concurrent-${key}`, idempotencyKey: key },
        ),
      ),
    );

    const successfulIndex = results.findIndex(
      (result) => result.status === "fulfilled",
    );
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(
      1,
    );
    expect(results.find(({ status }) => status === "rejected")).toMatchObject({
      reason: { code: "CAPACITY_UNAVAILABLE" },
    });
    expect(await prisma.orderRequest.count()).toBe(1);
    expect(await prisma.orderSubmissionIdempotency.count()).toBe(1);
    expect(
      await prisma.auditEvent.count({
        where: { action: "order-request.submit" },
      }),
    ).toBe(1);
    expect(
      await prisma.outboxEvent.count({
        where: { topic: "order-request.submitted" },
      }),
    ).toBe(1);
    const exhaustedTrip = await prisma.tripOffer.findUniqueOrThrow({
      where: { id: fixture.tripId },
    });
    expect(exhaustedTrip.remainingCapacityKg.toString()).toBe("0");
    expect(exhaustedTrip.version).toBe(2);

    const winner = attempts[successfulIndex]!;
    const firstResult = results[successfulIndex];
    if (firstResult?.status !== "fulfilled") {
      throw new Error("Expected one successful capacity reservation.");
    }
    await expect(
      winner.submitter.execute(
        winner.actor,
        { terms, tripId: fixture.tripId },
        {
          correlationId: "exact-replay",
          idempotencyKey: winner.key,
        },
      ),
    ).resolves.toEqual(firstResult.value);
    expect(await prisma.orderRequest.count()).toBe(1);
    expect(
      await prisma.auditEvent.count({
        where: { action: "order-request.submit" },
      }),
    ).toBe(1);

    await expect(
      winner.submitter.execute(
        winner.actor,
        {
          terms: { ...terms, maximumBudgetIdr: 500_001 },
          tripId: fixture.tripId,
        },
        {
          correlationId: "changed-replay",
          idempotencyKey: winner.key,
        },
      ),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  }, 30_000);

  it("rechecks live database time after work waits inside the transaction", async () => {
    const fixture = await insertOrderFixture(2);
    const observed = await pool.query<{ now: Date }>(
      'SELECT clock_timestamp() AS "now"',
    );
    const now = observed.rows[0]?.now;
    if (!now) {
      throw new Error("Disposable PostgreSQL time is unavailable.");
    }
    await prisma.tripOffer.update({
      data: { requestDeadline: new Date(now.getTime() + 1_000) },
      where: { id: fixture.tripId },
    });
    const submit = new SubmitOrderRequest({
      clock: new MutableClock("1900-01-01T00:00:00.000Z"),
      fingerprints: new Sha256Fingerprint(),
      identifiers: new UuidSequence(),
      unitOfWork: new DelayedReservationUnitOfWork(
        new PrismaMarketplaceUnitOfWork(prisma),
        1_200,
      ),
    });

    await expect(
      submit.execute(
        fixture.firstCustomer,
        {
          terms: {
            allowSubstitution: false,
            itemDescription: "Deadline boundary item",
            maximumBudgetIdr: 300_000,
            quantity: 1,
            requestedCapacityGrams: 500,
            serviceMode: "SHOP_FOR_ME",
          },
          tripId: fixture.tripId,
        },
        {
          correlationId: "deadline-order-submit",
          idempotencyKey: "deadline-order-key-0001",
        },
      ),
    ).rejects.toMatchObject({ code: "OFFER_REVISION_STALE" });

    await expectOrderSubmissionRolledBack(fixture.tripId, "2");
  });

  it("rolls capacity, request, audit, outbox, and idempotency back together", async () => {
    const fixture = await insertOrderFixture(2);
    const submit = new SubmitOrderRequest({
      clock: new MutableClock("1900-01-01T00:00:00.000Z"),
      fingerprints: new Sha256Fingerprint(),
      identifiers: new InvalidOutboxIdentifier(),
      unitOfWork: new PrismaMarketplaceUnitOfWork(prisma),
    });

    await expect(
      submit.execute(
        fixture.firstCustomer,
        {
          terms: {
            allowSubstitution: false,
            itemDescription: "Rollback item",
            maximumBudgetIdr: 300_000,
            quantity: 1,
            requestedCapacityGrams: 500,
            serviceMode: "SHOP_FOR_ME",
          },
          tripId: fixture.tripId,
        },
        {
          correlationId: "rollback-order-submit",
          idempotencyKey: "rollback-order-key-0001",
        },
      ),
    ).rejects.toThrow();

    await expectOrderSubmissionRolledBack(fixture.tripId, "2");
  });

  it("rolls every prior write back when the completed idempotency result is invalid", async () => {
    const fixture = await insertOrderFixture(2);
    const submit = new SubmitOrderRequest({
      clock: new MutableClock("1900-01-01T00:00:00.000Z"),
      fingerprints: new InvalidCompletionFingerprint(),
      identifiers: new UuidSequence(),
      unitOfWork: new PrismaMarketplaceUnitOfWork(prisma),
    });

    await expect(
      submit.execute(
        fixture.firstCustomer,
        {
          terms: {
            allowSubstitution: false,
            itemDescription: "Idempotency rollback item",
            maximumBudgetIdr: 300_000,
            quantity: 1,
            requestedCapacityGrams: 500,
            serviceMode: "SHOP_FOR_ME",
          },
          tripId: fixture.tripId,
        },
        {
          correlationId: "rollback-idempotency-completion",
          idempotencyKey: "rollback-completion-key-0001",
        },
      ),
    ).rejects.toThrow();

    await expectOrderSubmissionRolledBack(fixture.tripId, "2");
  });

  it("fails a concurrent duplicate closed while its transaction lock is active", async () => {
    const fixture = await insertOrderFixture(2);
    const fingerprints = new Sha256Fingerprint();
    const idempotencyKey = "in-progress-order-key-0001";
    const keyDigest = fingerprints.sha256(
      `nitipcuy-order-idempotency-key-v1\0${idempotencyKey}`,
    );
    const lockIdentity = [
      fixture.firstCustomer.accountId,
      "order.submit.v1",
      keyDigest,
    ].join(":");
    const lockConnection = await pool.connect();
    try {
      await lockConnection.query("BEGIN");
      await lockConnection.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [lockIdentity],
      );

      await expect(
        new SubmitOrderRequest({
          clock: new MutableClock("1900-01-01T00:00:00.000Z"),
          fingerprints,
          identifiers: new UuidSequence(),
          unitOfWork: new PrismaMarketplaceUnitOfWork(prisma),
        }).execute(
          fixture.firstCustomer,
          {
            terms: {
              allowSubstitution: false,
              itemDescription: "In-progress item",
              maximumBudgetIdr: 300_000,
              quantity: 1,
              requestedCapacityGrams: 500,
              serviceMode: "SHOP_FOR_ME",
            },
            tripId: fixture.tripId,
          },
          {
            correlationId: "in-progress-order-submit",
            idempotencyKey,
          },
        ),
      ).rejects.toMatchObject({ code: "IDEMPOTENCY_IN_PROGRESS" });
    } finally {
      await lockConnection.query("ROLLBACK");
      lockConnection.release();
    }

    await expectOrderSubmissionRolledBack(fixture.tripId, "2");
  });
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

describe("shared PostgreSQL abuse protection", () => {
  const subjectHmacKey = Uint8Array.from({ length: 32 }, (_, index) => index);

  it("uses PostgreSQL time unless a disposable test clock is explicitly acknowledged", async () => {
    expect(
      () =>
        new PostgresAbuseProtection(prisma, {
          identifiers: new UuidSequence(),
          subjectHmacKey,
          testClock: new MutableClock("2026-08-10T08:00:00.000Z"),
        }),
    ).toThrow(/acknowledgement/);

    const before = Date.now();
    const protection = new PostgresAbuseProtection(prisma, {
      identifiers: new UuidSequence(),
      subjectHmacKey,
    });
    await expect(
      protection.evaluate({
        correlationId: "database-time",
        limits: [
          {
            axis: "NETWORK",
            maximumAttempts: 2,
            subject: "database-time-network",
            windowMs: 60_000,
          },
        ],
        policy: "database.time.v1",
      }),
    ).resolves.toEqual({ allowed: true });
    const bucket = await prisma.abuseRateLimitBucket.findFirstOrThrow({
      where: { policy: "database.time.v1" },
    });
    expect(bucket.windowStartedAt.getTime()).toBeGreaterThanOrEqual(
      before - 60_000,
    );
    expect(bucket.windowStartedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("shares multi-axis counters across instances and bounds concurrent admission", async () => {
    const clock = new MutableClock("2026-08-10T09:00:00.000Z");
    const identifiers = new UuidSequence();
    const first = new PostgresAbuseProtection(prisma, {
      identifiers,
      subjectHmacKey,
      testClock: clock,
      testTargetAcknowledgement: "DISPOSABLE_TEST_DATABASE",
    });
    const second = new PostgresAbuseProtection(prisma, {
      identifiers,
      subjectHmacKey,
      testClock: clock,
      testTargetAcknowledgement: "DISPOSABLE_TEST_DATABASE",
    });
    const rawSubjects = {
      account: "00000000-0000-4000-8000-000000000901",
      network: "network-hmac-from-perimeter",
      session: "opaque-session-token-never-store",
      target: "trip-sensitive-target",
    };
    const limits = [
      {
        axis: "NETWORK" as const,
        maximumAttempts: 5,
        subject: rawSubjects.network,
        windowMs: 60_000,
      },
      {
        axis: "ACCOUNT" as const,
        maximumAttempts: 5,
        subject: rawSubjects.account,
        windowMs: 60_000,
      },
      {
        axis: "SESSION" as const,
        maximumAttempts: 5,
        subject: rawSubjects.session,
        windowMs: 60_000,
      },
      {
        axis: "TARGET" as const,
        maximumAttempts: 5,
        subject: rawSubjects.target,
        windowMs: 60_000,
      },
    ];

    const decisions = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        (index % 2 === 0 ? first : second).evaluate({
          correlationId: `concurrent-${index}`,
          limits,
          policy: "discussion.question.v1",
        }),
      ),
    );

    expect(decisions.filter(({ allowed }) => allowed)).toHaveLength(5);
    expect(decisions.filter(({ allowed }) => !allowed)).toHaveLength(7);
    expect(
      decisions
        .filter((decision) => !decision.allowed)
        .every(
          (decision) =>
            decision.retryAfterSeconds === 60 &&
            decision.deniedAxes.length === 4,
        ),
    ).toBe(true);

    const buckets = await prisma.abuseRateLimitBucket.findMany();
    expect(buckets).toHaveLength(4);
    expect(buckets.every(({ attemptCount }) => attemptCount === 12)).toBe(true);
    expect(buckets.every(({ denialAudited }) => denialAudited)).toBe(true);
    const audits = await prisma.auditEvent.findMany({
      where: { action: "security.rate-limit.discussion.question.v1" },
    });
    expect(audits).toHaveLength(4);
    expect(new Set(audits.map(({ reasonCode }) => reasonCode))).toEqual(
      new Set([
        "RATE_LIMIT_ACCOUNT",
        "RATE_LIMIT_NETWORK",
        "RATE_LIMIT_SESSION",
        "RATE_LIMIT_TARGET",
      ]),
    );

    const persisted = JSON.stringify({ audits, buckets });
    for (const rawSubject of Object.values(rawSubjects)) {
      expect(persisted).not.toContain(rawSubject);
    }
  });

  it("rolls fixed windows and reports a bounded retry interval", async () => {
    const clock = new MutableClock("2026-08-10T09:00:59.000Z");
    const protection = new PostgresAbuseProtection(prisma, {
      identifiers: new UuidSequence(),
      subjectHmacKey,
      testClock: clock,
      testTargetAcknowledgement: "DISPOSABLE_TEST_DATABASE",
    });
    const request = {
      correlationId: "window-boundary",
      limits: [
        {
          axis: "NETWORK" as const,
          maximumAttempts: 1,
          subject: "network-subject",
          windowMs: 60_000,
        },
      ],
      policy: "public.trip-list",
    };

    await expect(protection.evaluate(request)).resolves.toEqual({
      allowed: true,
    });
    await expect(protection.evaluate(request)).resolves.toEqual({
      allowed: false,
      deniedAxes: ["NETWORK"],
      retryAfterSeconds: 1,
    });
    clock.set("2026-08-10T09:01:00.000Z");
    await expect(protection.evaluate(request)).resolves.toEqual({
      allowed: true,
    });
  });

  it("cleans only a bounded batch of expired buckets per decision", async () => {
    const now = new Date("2026-08-10T10:00:00.000Z");
    await prisma.abuseRateLimitBucket.createMany({
      data: Array.from({ length: 5 }, (_, index) => ({
        axis: "NETWORK" as const,
        expiresAt: new Date(now.getTime() - 60_000),
        policy: `expired.bucket-${index}`,
        subjectDigest: createHash("sha256")
          .update(`expired-${index}`)
          .digest("hex"),
        updatedAt: new Date(now.getTime() - 120_000),
        windowStartedAt: new Date(now.getTime() - 120_000),
      })),
    });
    const protection = new PostgresAbuseProtection(prisma, {
      cleanupBatchSize: 2,
      identifiers: new UuidSequence(),
      subjectHmacKey,
      testClock: new MutableClock(now.toISOString()),
      testTargetAcknowledgement: "DISPOSABLE_TEST_DATABASE",
    });

    await protection.evaluate({
      correlationId: "bounded-cleanup",
      limits: [
        {
          axis: "NETWORK",
          maximumAttempts: 2,
          subject: "current-network",
          windowMs: 60_000,
        },
      ],
      policy: "auth.start",
    });

    expect(
      await prisma.abuseRateLimitBucket.count({
        where: { expiresAt: { lte: now } },
      }),
    ).toBe(3);
  });

  it("rolls back the counter and denies when its denial audit cannot persist", async () => {
    const protection = new PostgresAbuseProtection(prisma, {
      identifiers: { next: () => "not-a-uuid" },
      subjectHmacKey,
      testClock: new MutableClock("2026-08-10T11:00:00.000Z"),
      testTargetAcknowledgement: "DISPOSABLE_TEST_DATABASE",
    });
    const request = {
      correlationId: "audit-failure",
      limits: [
        {
          axis: "NETWORK" as const,
          maximumAttempts: 1,
          subject: "network-subject",
          windowMs: 60_000,
        },
      ],
      policy: "auth.callback",
    };

    await expect(protection.evaluate(request)).resolves.toEqual({
      allowed: true,
    });
    await expect(protection.evaluate(request)).rejects.toBeInstanceOf(
      AbuseProtectionUnavailableError,
    );
    await expect(
      prisma.abuseRateLimitBucket.findFirstOrThrow({
        where: { policy: request.policy },
      }),
    ).resolves.toMatchObject({ attemptCount: 1, denialAudited: false });
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

async function insertOrderFixture(capacityKg: number): Promise<{
  readonly firstCustomer: AuthenticatedActor;
  readonly secondCustomer: AuthenticatedActor;
  readonly tripId: ReturnType<typeof tripId>;
}> {
  const timeResult = await pool.query<{ observed_at: Date }>(
    'SELECT CURRENT_TIMESTAMP AS "observed_at"',
  );
  const observedAt = timeResult.rows[0]?.observed_at;
  if (!observedAt) {
    throw new Error("Disposable PostgreSQL time is unavailable.");
  }
  const clock = new MutableClock(observedAt.toISOString());
  const seller = await insertAccount("Order Seller");
  const firstCustomerId = await insertAccount("First Order Customer");
  const secondCustomerId = await insertAccount("Second Order Customer");
  const firstCustomer = await insertActorSession(
    clock,
    firstCustomerId,
    "BASE",
  );
  const secondCustomer = await insertActorSession(
    clock,
    secondCustomerId,
    "BASE",
  );
  const profileId = crypto.randomUUID();
  await prisma.jastipperProfile.create({
    data: {
      accountId: seller,
      deliverySummary: "Pickup after arrival",
      displayName: "Order Seller",
      id: profileId,
      rateSummary: "Seller-set request rate",
      sellerLocationLabel: "Tokyo",
    },
  });

  const openAt = new Date(observedAt.getTime() - 60 * 60_000);
  const closeAt = new Date(observedAt.getTime() + 2 * 60 * 60_000);
  const serviceStartAt = new Date(observedAt.getTime() - 30 * 60_000);
  const serviceEndAt = new Date(observedAt.getTime() + 3 * 60 * 60_000);
  const departureAt = new Date(observedAt.getTime() + 4 * 60 * 60_000);
  const arrivalAt = new Date(observedAt.getTime() + 28 * 60 * 60_000);
  const targetTripId = tripId(`trip-order-${crypto.randomUUID().slice(0, 20)}`);
  await prisma.tripOffer.create({
    data: {
      departureAt,
      departureDate: new Date(
        `${departureAt.toISOString().slice(0, 10)}T00:00:00.000Z`,
      ),
      destinationLabel: "Bandung",
      destinationTimeZone: "Asia/Jakarta",
      estimatedArrivalAt: arrivalAt,
      id: targetTripId,
      jastipperProfileId: profileId,
      originLabel: "Tokyo",
      originTimeZone: "Asia/Tokyo",
      ownerAccountId: seller,
      publishedAt: new Date(observedAt.getTime() - 24 * 60 * 60_000),
      remainingCapacityKg: capacityKg,
      requestDeadline: closeAt,
      requestOpenAt: openAt,
      serviceModes: ["SHOP_FOR_ME", "CARRY_MY_ITEM"],
      serviceWindowEndAt: serviceEndAt,
      serviceWindowStartAt: serviceStartAt,
      status: "PUBLISHED",
    },
  });
  return { firstCustomer, secondCustomer, tripId: targetTripId };
}

async function expectOrderSubmissionRolledBack(
  targetTripId: ReturnType<typeof tripId>,
  expectedCapacityKg: string,
): Promise<void> {
  expect(await prisma.orderRequest.count()).toBe(0);
  expect(await prisma.orderSubmissionIdempotency.count()).toBe(0);
  expect(await prisma.auditEvent.count()).toBe(0);
  expect(await prisma.outboxEvent.count()).toBe(0);
  const unchangedTrip = await prisma.tripOffer.findUniqueOrThrow({
    where: { id: targetTripId },
  });
  expect(unchangedTrip.remainingCapacityKg.toString()).toBe(expectedCapacityKg);
  expect(unchangedTrip.version).toBe(1);
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

class InvalidOutboxIdentifier implements IdentifierPort {
  next(namespace: string): string {
    return namespace === "outbox" ? "not-a-uuid" : crypto.randomUUID();
  }
}

class DelayedReservationUnitOfWork implements MarketplaceUnitOfWork {
  constructor(
    private readonly delegate: MarketplaceUnitOfWork,
    private readonly delayMilliseconds: number,
  ) {}

  execute<T>(
    work: (context: MarketplaceTransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.delegate.execute((context) => {
      const orderSubmissions: MarketplaceTransactionContext["orderSubmissions"] =
        Object.freeze({
          authoritativeNow: () => context.orderSubmissions.authoritativeNow(),
          claim: (input: Parameters<OrderSubmissionRepository["claim"]>[0]) =>
            context.orderSubmissions.claim(input),
          complete: (
            input: Parameters<OrderSubmissionRepository["complete"]>[0],
          ) => context.orderSubmissions.complete(input),
          create: (
            request: Parameters<OrderSubmissionRepository["create"]>[0],
          ) => context.orderSubmissions.create(request),
          lockEligibleSeller: (
            input: Parameters<
              OrderSubmissionRepository["lockEligibleSeller"]
            >[0],
          ) => context.orderSubmissions.lockEligibleSeller(input),
          reserveCapacity: async (
            input: Parameters<OrderSubmissionRepository["reserveCapacity"]>[0],
          ) => {
            await new Promise((resolve) =>
              setTimeout(resolve, this.delayMilliseconds),
            );
            return context.orderSubmissions.reserveCapacity(input);
          },
        });
      return work(Object.freeze({ ...context, orderSubmissions }));
    });
  }
}

class InvalidCompletionFingerprint implements FingerprintPort {
  sha256(value: string): string {
    return value.startsWith("nitipcuy-order-idempotency-key-v1\0")
      ? createHash("sha256").update(value, "utf8").digest("hex")
      : "not-a-valid-fingerprint";
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
