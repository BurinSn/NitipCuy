import { describe, expect, it } from "vitest";

import { createPublishedTrip, tripId } from "@nitipcuy/domain";

import {
  FixedClock,
  InMemoryAudit,
  InMemoryOutbox,
  InMemoryTripDiscoveryRepository,
  MockIdentityVerification,
  MockLogisticsGateway,
  MockPaymentGateway,
  oauthAttemptCookie,
  SequenceIdentifier,
  sessionCookie,
} from "./index";

describe("mock and in-memory adapters", () => {
  it("keeps seller-defined rate text unchanged in discovery", async () => {
    const repository = new InMemoryTripDiscoveryRepository([
      createPublishedTrip({
        id: tripId("trip-rate-check"),
        jastipperDisplayName: "Sari",
        originLabel: "Tokyo",
        originTimeZone: "Asia/Tokyo",
        destinationLabel: "Bandung",
        destinationTimeZone: "Asia/Jakarta",
        serviceWindowStartAt: "2026-09-10T09:00:00+09:00",
        serviceWindowEndAt: "2026-09-19T18:00:00+09:00",
        departureDate: "2026-09-20",
        departureAt: "2026-09-20T10:00:00+09:00",
        requestOpenAt: "2026-08-25T09:00:00+07:00",
        requestDeadline: "2026-09-18T18:00:00+09:00",
        estimatedArrivalAt: "2026-09-21T14:00:00+07:00",
        serviceModes: ["CARRY_MY_ITEM"],
        remainingCapacityKg: 3,
        sellerLocationLabel: "Bandung",
        deliverySummary: "Pickup only",
        rateSummary: "Rp275.000/kg, minimum 1 kg",
        rating: { average: 4.8, count: 12 },
        publicQuestions: [],
      }),
    ]);

    const [result] = await repository.searchPublished({
      destination: "Bandung",
    });

    expect(result?.rateSummary).toBe("Rp275.000/kg, minimum 1 kg");
  });

  it("records payment initiation without inventing a held state", async () => {
    const gateway = new MockPaymentGateway({
      initiationReceipt: {
        submissionStatus: "ACCEPTED_FOR_PROCESSING",
        operationReference: "operation-initiate-001",
        paymentReference: "payment-001",
        expiresAt: "2026-09-20T09:00:00+07:00",
        customerAction: {
          kind: "DISPLAY_VIRTUAL_ACCOUNT",
          bankCode: "FIXTURE",
          accountNumber: "000000000001",
        },
      },
    });

    const result = await gateway.initiatePayment({
      idempotencyKey: "initiate-order-001",
      paymentAttemptId: "payment-attempt-001",
      orderId: "order-001",
      amountMinor: 250_000n,
      currency: "IDR",
    });

    expect(result).toEqual({
      submissionStatus: "ACCEPTED_FOR_PROCESSING",
      operationReference: "operation-initiate-001",
      paymentReference: "payment-001",
      expiresAt: "2026-09-20T09:00:00+07:00",
      customerAction: {
        kind: "DISPLAY_VIRTUAL_ACCOUNT",
        bankCode: "FIXTURE",
        accountNumber: "000000000001",
      },
    });
    expect(result).not.toHaveProperty("status", "HELD");
    expect(gateway.initiations).toHaveLength(1);
  });

  it("returns processing receipts instead of completing release or refund", async () => {
    const gateway = new MockPaymentGateway({
      releaseReceipt: {
        submissionStatus: "ACCEPTED_FOR_PROCESSING",
        operationReference: "operation-release-001",
      },
      refundReceipt: {
        submissionStatus: "UNKNOWN",
        reasonCode: "TIMEOUT",
        operationReference: null,
      },
    });

    const release = await gateway.requestRelease({
      idempotencyKey: "release-order-001",
      orderId: "order-001",
      paymentReference: "payment-001",
      sellerAmountMinor: 230_000n,
      platformAmountMinor: 20_000n,
      currency: "IDR",
    });
    const refund = await gateway.requestRefund({
      idempotencyKey: "refund-order-001",
      orderId: "order-001",
      paymentReference: "payment-001",
      amountMinor: 250_000n,
      currency: "IDR",
    });

    expect(release).toEqual({
      submissionStatus: "ACCEPTED_FOR_PROCESSING",
      operationReference: "operation-release-001",
    });
    expect(refund).toEqual({
      submissionStatus: "UNKNOWN",
      reasonCode: "TIMEOUT",
      operationReference: null,
    });
    expect(gateway.releaseRequests).toHaveLength(1);
    expect(gateway.refundRequests).toHaveLength(1);
  });

  it("preserves a provider rejection without inventing a payment reference", async () => {
    const gateway = new MockPaymentGateway({
      initiationReceipt: {
        submissionStatus: "REJECTED",
        reasonCode: "PROVIDER_REJECTED",
      },
    });

    const result = await gateway.initiatePayment({
      idempotencyKey: "initiate-order-rejected",
      paymentAttemptId: "payment-attempt-rejected",
      orderId: "order-rejected",
      amountMinor: 250_000n,
      currency: "IDR",
    });

    expect(result).toEqual({
      submissionStatus: "REJECTED",
      reasonCode: "PROVIDER_REJECTED",
    });
    expect(result).not.toHaveProperty("paymentReference");
  });

  it("returns configured provider observations for reconciliation", async () => {
    const gateway = new MockPaymentGateway({
      snapshot: {
        paymentAttemptId: "payment-attempt-001",
        paymentReference: "payment-001",
        observedAt: "2026-09-20T08:00:00+07:00",
        currency: "IDR",
        collectionStatus: "CONFIRMED",
        holdStatus: "FAILED",
        releaseStatus: "NOT_REQUESTED",
        refundStatus: "NOT_REQUESTED",
        settlementStatus: "NOT_STARTED",
        chargebackStatus: "NONE",
        collectedAmountMinor: 250_000n,
        heldAmountMinor: null,
        refundedAmountMinor: null,
        settledSellerAmountMinor: null,
        settledPlatformAmountMinor: null,
      },
    });

    const result = await gateway.inspectPayment({
      orderId: "order-001",
      paymentAttemptId: "payment-attempt-001",
      paymentReference: "payment-001",
    });

    expect(result.collectionStatus).toBe("CONFIRMED");
    expect(result.holdStatus).toBe("FAILED");
    expect(gateway.inspections).toHaveLength(1);
  });

  it("can inspect an ambiguous initiation by stable attempt id", async () => {
    const gateway = new MockPaymentGateway({
      initiationReceipt: {
        submissionStatus: "UNKNOWN",
        reasonCode: "TIMEOUT",
        operationReference: null,
      },
      snapshot: {
        paymentAttemptId: "payment-attempt-timeout",
        paymentReference: null,
        observedAt: "2026-09-20T08:00:00+07:00",
        currency: "IDR",
        collectionStatus: "UNKNOWN",
        holdStatus: "UNKNOWN",
        releaseStatus: "NOT_REQUESTED",
        refundStatus: "NOT_REQUESTED",
        settlementStatus: "NOT_STARTED",
        chargebackStatus: "NONE",
        collectedAmountMinor: null,
        heldAmountMinor: null,
        refundedAmountMinor: null,
        settledSellerAmountMinor: null,
        settledPlatformAmountMinor: null,
      },
    });

    await gateway.initiatePayment({
      idempotencyKey: "initiate-order-timeout",
      paymentAttemptId: "payment-attempt-timeout",
      orderId: "order-timeout",
      amountMinor: 250_000n,
      currency: "IDR",
    });
    const result = await gateway.inspectPayment({
      orderId: "order-timeout",
      paymentAttemptId: "payment-attempt-timeout",
      paymentReference: null,
    });

    expect(result.paymentAttemptId).toBe("payment-attempt-timeout");
    expect(result.paymentReference).toBeNull();
    expect(result.collectionStatus).toBe("UNKNOWN");
  });

  it("fails closed when a mock payment outcome is not configured", async () => {
    const gateway = new MockPaymentGateway();

    await expect(
      gateway.initiatePayment({
        idempotencyKey: "initiate-order-001",
        paymentAttemptId: "payment-attempt-001",
        orderId: "order-001",
        amountMinor: 250_000n,
        currency: "IDR",
      }),
    ).rejects.toThrow("Mock payment initiation response must be configured.");
  });

  it("returns configured logistics quotes without inventing a platform rate", async () => {
    const gateway = new MockLogisticsGateway([
      {
        quoteReference: "quote-001",
        serviceCode: "FIXTURE",
        serviceName: "Configured fixture",
        amountMinor: 25_000n,
        currency: "IDR",
        expiresAt: "2026-09-21T12:00:00+07:00",
      },
    ]);

    const quotes = await gateway.quote({
      originPostalCode: "40111",
      destinationPostalCode: "40123",
      weightGrams: 1_000,
    });

    expect(quotes[0]?.amountMinor).toBe(25_000n);
    expect(gateway.quoteRequests).toHaveLength(1);
  });

  it("provides deterministic non-provider platform services", async () => {
    const clock = new FixedClock("2026-09-20T08:00:00+07:00");
    const identifiers = new SequenceIdentifier();
    const audit = new InMemoryAudit();
    const outbox = new InMemoryOutbox();
    const identities = new MockIdentityVerification({
      "proof-001": {
        provider: "GOOGLE",
        issuer: "https://accounts.google.com",
        subject: "subject-001",
        email: "sari@example.test",
        emailVerified: true,
        displayName: "Sari",
        assurance: "BASE",
        authenticatedAt: clock.now(),
      },
    });

    await audit.append({
      actorId: "account-001",
      action: "trip.publish",
      targetType: "trip",
      targetId: "trip-001",
      reasonCode: "OWNER_REQUEST",
      occurredAt: clock.now(),
      correlationId: "correlation-001",
      outcome: "SUCCEEDED",
    });
    await outbox.enqueue({
      id: identifiers.next("message"),
      topic: "trip.published",
      aggregateType: "trip",
      aggregateId: "trip-001",
      occurredAt: clock.now(),
      payload: { destination: "Bandung" },
    });
    const result = await identities.verifyProof("proof-001");

    expect(result?.subject).toBe("subject-001");
    expect(audit.records).toHaveLength(1);
    expect(outbox.messages[0]?.id).toBe("message-0001");
  });

  it("keeps session and OAuth browser-binding cookies host-only", () => {
    expect(sessionCookie).toEqual({
      httpOnly: true,
      name: "__Host-nitipcuy-session",
      path: "/",
      sameSite: "lax",
      secure: true,
    });
    expect(oauthAttemptCookie).toEqual({
      httpOnly: true,
      name: "__Host-nitipcuy-oauth-attempt",
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });
});
