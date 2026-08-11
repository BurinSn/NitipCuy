import { describe, expect, it } from "vitest";

import {
  accountId,
  jastipperProfileId,
  orderRequestId,
  sessionId,
  tripId,
  type AuthenticatedActor,
  type SubmittedOrderRequest,
  type TripOffer,
} from "@nitipcuy/domain";

import {
  SubmitOrderRequest,
  type MarketplaceTransactionContext,
  type OrderSubmissionClaim,
} from "./index";

const customerAccountId = accountId("00000000-0000-4000-8000-000000000001");
const sellerAccountId = accountId("00000000-0000-4000-8000-000000000002");
const actor: AuthenticatedActor = {
  accountId: customerAccountId,
  assurance: "BASE",
  capabilities: new Set(),
  sessionId: sessionId("00000000-0000-4000-8000-000000000003"),
};

describe("server-authoritative order submission", () => {
  it("creates one submitted request from authoritative offer state", async () => {
    const fixture = new SubmissionFixture();
    const result = await fixture.submit();

    expect(result).toMatchObject({
      customerAccountId,
      reservedCapacityGrams: 1_250,
      sellerAccountId,
      serviceMode: "SHOP_FOR_ME",
      sourceOfferVersion: 3,
      status: "SUBMITTED",
    });
    expect(result.originLabel).toBe("Tokyo");
    expect(fixture.created).toEqual([result]);
    expect(fixture.reservations).toEqual([
      {
        expectedVersion: 3,
        requestedCapacityGrams: 1_250,
        tripId: fixture.trip.id,
      },
    ]);
    expect(fixture.audits).toHaveLength(1);
    expect(fixture.outbox).toHaveLength(1);
    expect(fixture.completions).toHaveLength(1);
  });

  it.each([
    ["before opening", "OFFER_INELIGIBLE", { now: "2026-08-24T23:59:59.999Z" }],
    ["at closing", "OFFER_INELIGIBLE", { now: "2026-09-18T09:00:00.000Z" }],
    ["unpublished offer", "OFFER_INELIGIBLE", { trip: { status: "DRAFT" } }],
    [
      "self order",
      "SELF_ORDER_DENIED",
      { trip: { ownerAccountId: customerAccountId } },
    ],
    [
      "unsupported mode",
      "SERVICE_MODE_UNAVAILABLE",
      { trip: { serviceModes: ["CARRY_MY_ITEM"] } },
    ],
    [
      "insufficient capacity",
      "CAPACITY_UNAVAILABLE",
      { trip: { remainingCapacityKg: 1 } },
    ],
    ["suspended seller", "OFFER_INELIGIBLE", { sellerStatus: "SUSPENDED" }],
    ["suspended profile", "OFFER_INELIGIBLE", { profileStatus: "SUSPENDED" }],
    ["stale reservation", "OFFER_REVISION_STALE", { reserveResult: false }],
  ] as const)("rejects %s", async (_label, code, changes) => {
    const fixture = new SubmissionFixture(changes);
    await expect(fixture.submit()).rejects.toMatchObject({ code });
    expect(fixture.created).toHaveLength(0);
    expect(fixture.completions).toHaveLength(0);
  });

  it("replays only the same account-bound payload", async () => {
    const replay = new SubmissionFixture();
    const stored = replay.storedRequest();
    replay.claim = { request: stored, status: "REPLAY" };
    await expect(replay.submit()).resolves.toEqual(stored);
    expect(replay.reservations).toHaveLength(0);

    const conflict = new SubmissionFixture();
    conflict.claim = { status: "CONFLICT" };
    await expect(conflict.submit()).rejects.toMatchObject({
      code: "IDEMPOTENCY_CONFLICT",
    });

    const active = new SubmissionFixture();
    active.claim = { status: "IN_PROGRESS" };
    await expect(active.submit()).rejects.toMatchObject({
      code: "IDEMPOTENCY_IN_PROGRESS",
    });
  });

  it.each(["short", " request-key-0001", "request-key-0001 "])(
    "rejects invalid idempotency key %j before opening a transaction",
    (key) => {
      const fixture = new SubmissionFixture();
      expect(() => fixture.submit(key)).toThrow(/Idempotency key/);
      expect(fixture.transactionCount).toBe(0);
    },
  );
});

interface FixtureChanges {
  readonly now?: string;
  readonly profileStatus?: "ACTIVE" | "SUSPENDED";
  readonly reserveResult?: boolean;
  readonly sellerStatus?: "ACTIVE" | "SUSPENDED";
  readonly trip?: Partial<TripOffer>;
}

class SubmissionFixture {
  readonly audits: unknown[] = [];
  readonly completions: unknown[] = [];
  readonly created: SubmittedOrderRequest[] = [];
  readonly outbox: unknown[] = [];
  readonly reservations: unknown[] = [];
  readonly trip: TripOffer;
  claim: OrderSubmissionClaim = { status: "CLAIMED" };
  transactionCount = 0;
  private readonly now: string;
  private readonly profileStatus: "ACTIVE" | "SUSPENDED";
  private readonly reserveResult: boolean;
  private readonly sellerStatus: "ACTIVE" | "SUSPENDED";
  private identifier = 10;

  constructor(changes: FixtureChanges = {}) {
    this.now = changes.now ?? "2026-09-01T00:00:00.000Z";
    this.profileStatus = changes.profileStatus ?? "ACTIVE";
    this.reserveResult = changes.reserveResult ?? true;
    this.sellerStatus = changes.sellerStatus ?? "ACTIVE";
    this.trip = {
      departureAt: "2026-09-20T01:00:00.000Z",
      departureDate: "2026-09-20",
      destinationLabel: "Bandung",
      destinationTimeZone: "Asia/Jakarta",
      estimatedArrivalAt: "2026-09-21T07:00:00.000Z",
      id: tripId("trip-order-unit"),
      jastipperProfileId: jastipperProfileId(
        "00000000-0000-4000-8000-000000000004",
      ),
      originLabel: "Tokyo",
      originTimeZone: "Asia/Tokyo",
      ownerAccountId: sellerAccountId,
      publishedAt: "2026-08-20T00:00:00.000Z",
      remainingCapacityKg: 2,
      requestDeadline: "2026-09-18T09:00:00.000Z",
      requestOpenAt: "2026-08-25T00:00:00.000Z",
      serviceModes: ["SHOP_FOR_ME", "CARRY_MY_ITEM"],
      serviceWindowEndAt: "2026-09-19T09:00:00.000Z",
      serviceWindowStartAt: "2026-09-10T00:00:00.000Z",
      status: "PUBLISHED",
      version: 3,
      ...changes.trip,
    } as TripOffer;
  }

  submit(idempotencyKey = "request-key-0001") {
    return this.useCase().execute(
      actor,
      {
        terms: {
          allowSubstitution: false,
          itemDescription: "Matcha gift set",
          maximumBudgetIdr: 750_000,
          quantity: 2,
          requestedCapacityGrams: 1_250,
          serviceMode: "SHOP_FOR_ME",
        },
        tripId: this.trip.id,
      },
      { correlationId: "order-unit-test", idempotencyKey },
    );
  }

  storedRequest(): SubmittedOrderRequest {
    return Object.freeze({
      customerAccountId,
      destinationLabel: this.trip.destinationLabel,
      estimatedArrivalAt: this.trip.estimatedArrivalAt,
      id: orderRequestId("00000000-0000-4000-8000-000000000099"),
      jastipperProfileId: this.trip.jastipperProfileId,
      orderCloseAt: this.trip.requestDeadline,
      orderOpenAt: this.trip.requestOpenAt,
      originLabel: this.trip.originLabel,
      reservedCapacityGrams: 1_250,
      sellerAccountId,
      serviceMode: "SHOP_FOR_ME",
      sourceOfferVersion: this.trip.version,
      status: "SUBMITTED",
      submittedAt: this.now,
      terms: {
        allowSubstitution: false,
        itemDescription: "Matcha gift set",
        maximumBudgetIdr: 750_000,
        quantity: 2,
        requestedCapacityGrams: 1_250,
        serviceMode: "SHOP_FOR_ME" as const,
      },
      transportDepartureAt: this.trip.departureAt,
      tripId: this.trip.id,
    });
  }

  private useCase(): SubmitOrderRequest {
    return new SubmitOrderRequest({
      clock: { now: () => "1900-01-01T00:00:00.000Z" },
      fingerprints: {
        sha256: () => "a".repeat(64),
      },
      identifiers: {
        next: () => {
          this.identifier += 1;
          return `00000000-0000-4000-8000-${this.identifier
            .toString()
            .padStart(12, "0")}`;
        },
      },
      unitOfWork: {
        execute: async (work) => {
          this.transactionCount += 1;
          return work(this.context());
        },
      },
    });
  }

  private context(): MarketplaceTransactionContext {
    return {
      accounts: {
        capabilitiesFor: async () => new Set(),
        findById: async (id) =>
          id === customerAccountId
            ? {
                displayName: "Customer",
                id: customerAccountId,
                sessionVersion: 1,
                status: "ACTIVE",
              }
            : {
                displayName: "Seller",
                id: sellerAccountId,
                sessionVersion: 1,
                status: this.sellerStatus,
              },
        isSessionActive: async () => true,
        resolveGoogleIdentity: async () => {
          throw new Error("not used");
        },
      },
      audit: { append: async (record) => void this.audits.push(record) },
      discussions: {
        createAnswer: async () => undefined,
        createQuestion: async () => undefined,
        findQuestionById: async () => null,
      },
      orderSubmissions: {
        authoritativeNow: async () => this.now,
        claim: async () => this.claim,
        complete: async (input) => void this.completions.push(input),
        create: async (request) => void this.created.push(request),
        lockEligibleSeller: async () =>
          this.sellerStatus === "ACTIVE" && this.profileStatus === "ACTIVE",
        reserveCapacity: async (input) => {
          this.reservations.push(input);
          return this.reserveResult ? this.now : null;
        },
      },
      outbox: { enqueue: async (message) => void this.outbox.push(message) },
      profiles: {
        create: async () => undefined,
        findByAccountId: async () => null,
        findById: async () => ({
          accountId: sellerAccountId,
          deliverySummary: "Pickup",
          displayName: "Seller",
          id: this.trip.jastipperProfileId,
          rateSummary: "Seller-set rate",
          sellerLocationLabel: "Tokyo",
          status: this.profileStatus,
        }),
      },
      trips: {
        create: async () => undefined,
        findById: async () => this.trip,
        recordModerationDecision: async () => undefined,
        save: async () => undefined,
      },
    };
  }
}
