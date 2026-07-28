import { describe, expect, it } from "vitest";

import { createPublishedTrip, tripId } from "@nitipcuy/domain";

import {
  FixedClock,
  InMemoryAudit,
  InMemoryEvidenceStorage,
  InMemoryOutbox,
  InMemoryTripDiscoveryRepository,
  MockIdentityVerification,
  MockLogisticsGateway,
  MockPaymentGateway,
  SequenceIdentifier,
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

  it("records payment commands without contacting a provider", async () => {
    const gateway = new MockPaymentGateway();

    const result = await gateway.createHeldPayment({
      idempotencyKey: "hold-order-001",
      orderId: "order-001",
      amountMinor: 250_000n,
      currency: "IDR",
    });

    expect(result).toEqual({
      paymentReference: "mock-payment-order-001",
      status: "HELD",
    });
    expect(gateway.heldPayments).toHaveLength(1);
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
        provider: "fixture",
        subject: "subject-001",
        assurance: "BASE",
        authenticatedAt: clock.now(),
      },
    });
    const evidence = new InMemoryEvidenceStorage();

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

    const content = new Uint8Array([1, 2, 3]);
    const stored = await evidence.store({
      idempotencyKey: "evidence-001",
      evidenceId: identifiers.next("evidence"),
      ownerAccountId: "account-001",
      classification: "WEIGHT",
      contentType: "image/jpeg",
      byteLength: 3,
      sha256: "a".repeat(64),
      content,
    });
    content[0] = 9;

    expect(result?.subject).toBe("subject-001");
    expect(audit.records).toHaveLength(1);
    expect(outbox.messages[0]?.id).toBe("message-0001");
    expect(stored).toEqual({
      objectReference: "mock-evidence-evidence-0002",
      sha256: "a".repeat(64),
      byteLength: 3,
    });
    expect([...new Uint8Array(evidence.stored[0]?.content ?? [])]).toEqual([
      1, 2, 3,
    ]);
  });

  it("rejects inconsistent evidence metadata before storage", async () => {
    const evidence = new InMemoryEvidenceStorage();

    await expect(
      evidence.store({
        idempotencyKey: "evidence-invalid",
        evidenceId: "evidence-0001",
        ownerAccountId: "account-001",
        classification: "DELIVERY",
        contentType: "image/jpeg",
        byteLength: 4,
        sha256: "a".repeat(64),
        content: new Uint8Array([1, 2, 3]),
      }),
    ).rejects.toThrow("Evidence byte length must match non-empty content.");
  });
});
