import { randomUUID } from "node:crypto";

import type {
  AccountRecord,
  AccountRepository,
  JastipperProfileRecord,
  JastipperProfileRepository,
  MarketplaceTransactionContext,
  MarketplaceUnitOfWork,
  OrderSubmissionRepository,
  PublicDiscussionRepository,
  ResolveGoogleIdentityInput,
  ResolveGoogleIdentityResult,
  StoredPublicQuestion,
  TripDiscoveryRepository,
  TripOfferRepository,
  TripSearchCriteria,
} from "@nitipcuy/application";
import type { AuditRecord, OutboxMessage } from "@nitipcuy/application";
import {
  accountId,
  createPublishedTrip,
  jastipperProfileId,
  orderRequestId,
  tripId,
  type AccountId,
  type Capability,
  type JastipperProfileId,
  type PublishedTrip,
  type PublicQuestion,
  type SubmittedOrderRequest,
  type ServiceMode,
  type TripId,
  type TripOffer,
} from "@nitipcuy/domain";

import { Prisma, type PrismaClient } from "./generated/prisma/client";
import { serializableTransactionOptions } from "./prisma-transaction";

type TransactionClient = Prisma.TransactionClient;

export class OptimisticConcurrencyError extends Error {
  constructor() {
    super("The persisted aggregate changed before this command completed.");
    this.name = "OptimisticConcurrencyError";
  }
}

export class PrismaMarketplaceUnitOfWork implements MarketplaceUnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(
    work: (context: MarketplaceTransactionContext) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          (transaction) => work(createTransactionContext(transaction)),
          serializableTransactionOptions,
        );
      } catch (error) {
        if (attempt === 3 || !isRetryableTransactionConflict(error)) {
          throw error;
        }
      }
    }

    throw new Error("Transaction retry budget was exhausted.");
  }
}

export class PrismaTripDiscoveryRepository implements TripDiscoveryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async searchPublished(
    criteria: TripSearchCriteria,
  ): Promise<readonly PublishedTrip[]> {
    const rows = await this.prisma.tripOffer.findMany({
      ...(criteria.cursor ? { cursor: { id: criteria.cursor }, skip: 1 } : {}),
      include: publicProjectionInclude,
      orderBy: [{ departureDate: "asc" }, { id: "asc" }],
      take: criteria.limit ?? 20,
      where: {
        status: "PUBLISHED",
        ...(criteria.destination
          ? {
              destinationLabel: {
                contains: criteria.destination,
                mode: "insensitive" as const,
              },
            }
          : {}),
        ...(criteria.departureFrom || criteria.departureTo
          ? {
              departureDate: {
                ...(criteria.departureFrom
                  ? { gte: dateOnly(criteria.departureFrom) }
                  : {}),
                ...(criteria.departureTo
                  ? { lte: dateOnly(criteria.departureTo) }
                  : {}),
              },
            }
          : {}),
      },
    });

    return Object.freeze(rows.map(mapPublishedTrip));
  }

  async findPublishedById(id: TripId): Promise<PublishedTrip | null> {
    const row = await this.prisma.tripOffer.findFirst({
      include: publicProjectionInclude,
      where: { id, status: "PUBLISHED" },
    });

    return row ? mapPublishedTrip(row) : null;
  }
}

function createTransactionContext(
  transaction: TransactionClient,
): MarketplaceTransactionContext {
  return Object.freeze({
    accounts: new PrismaAccountRepository(transaction),
    audit: {
      append: (record: AuditRecord) => appendAudit(transaction, record),
    },
    discussions: new PrismaPublicDiscussionRepository(transaction),
    outbox: {
      enqueue: (message: OutboxMessage) => enqueueOutbox(transaction, message),
    },
    orderSubmissions: new PrismaOrderSubmissionRepository(transaction),
    profiles: new PrismaJastipperProfileRepository(transaction),
    trips: new PrismaTripOfferRepository(transaction),
  });
}

class PrismaOrderSubmissionRepository implements OrderSubmissionRepository {
  constructor(private readonly transaction: TransactionClient) {}

  async authoritativeNow(): Promise<string> {
    const rows = await this.transaction.$queryRaw<
      readonly { readonly observedAt: Date }[]
    >`SELECT clock_timestamp() AS "observedAt"`;
    const observedAt = rows[0]?.observedAt;
    if (!(observedAt instanceof Date) || Number.isNaN(observedAt.getTime())) {
      throw new Error("Authoritative database time is unavailable.");
    }
    return observedAt.toISOString();
  }

  async claim(
    input: Parameters<OrderSubmissionRepository["claim"]>[0],
  ): ReturnType<OrderSubmissionRepository["claim"]> {
    const lockIdentity = [
      input.customerAccountId,
      input.operation,
      input.keyDigest,
    ].join(":");
    const locks = await this.transaction.$queryRaw<
      readonly { readonly acquired: boolean }[]
    >`SELECT pg_try_advisory_xact_lock(hashtextextended(${lockIdentity}, 0)) AS "acquired"`;
    if (locks[0]?.acquired !== true) {
      return Object.freeze({ status: "IN_PROGRESS" });
    }

    const existing =
      await this.transaction.orderSubmissionIdempotency.findUnique({
        include: { request: true },
        where: {
          customerAccountId_operation_keyDigest: {
            customerAccountId: input.customerAccountId,
            keyDigest: input.keyDigest,
            operation: input.operation,
          },
        },
      });
    if (!existing) {
      return Object.freeze({ status: "CLAIMED" });
    }

    const observedAt = new Date(input.observedAt);
    if (existing.expiresAt <= observedAt) {
      await this.transaction.orderSubmissionIdempotency.delete({
        where: {
          customerAccountId_operation_keyDigest: {
            customerAccountId: input.customerAccountId,
            keyDigest: input.keyDigest,
            operation: input.operation,
          },
        },
      });
      return Object.freeze({ status: "CLAIMED" });
    }
    if (existing.fingerprint !== input.fingerprint) {
      return Object.freeze({ status: "CONFLICT" });
    }
    return Object.freeze({
      request: mapSubmittedOrderRequest(existing.request),
      status: "REPLAY",
    });
  }

  async reserveCapacity(
    input: Parameters<OrderSubmissionRepository["reserveCapacity"]>[0],
  ): Promise<string | null> {
    const capacityKg = gramsToDecimalKilograms(input.requestedCapacityGrams);
    const candidates = await this.transaction.$queryRaw<
      readonly {
        readonly orderCloseAt: Date;
        readonly orderOpenAt: Date;
        readonly reservedAt: Date;
      }[]
    >`
      SELECT
        trip."request_open_at" AS "orderOpenAt",
        trip."request_deadline" AS "orderCloseAt",
        clock_timestamp() AS "reservedAt"
      FROM "trip_offer" AS trip
      WHERE trip."id" = ${input.tripId}
        AND trip."status" = 'PUBLISHED'::"TripOfferStatus"
        AND trip."version" = ${input.expectedVersion}
        AND trip."remaining_capacity_kg" >= ${capacityKg}
      FOR UPDATE OF trip
    `;
    const candidate = candidates[0];
    if (
      !candidate ||
      candidate.reservedAt < candidate.orderOpenAt ||
      candidate.reservedAt >= candidate.orderCloseAt
    ) {
      return null;
    }

    const result = await this.transaction.tripOffer.updateMany({
      data: {
        remainingCapacityKg: { decrement: capacityKg },
        version: { increment: 1 },
      },
      where: {
        id: input.tripId,
        remainingCapacityKg: { gte: capacityKg },
        status: "PUBLISHED",
        version: input.expectedVersion,
      },
    });
    return result.count === 1 ? candidate.reservedAt.toISOString() : null;
  }

  async lockEligibleSeller(
    input: Parameters<OrderSubmissionRepository["lockEligibleSeller"]>[0],
  ): Promise<boolean> {
    const rows = await this.transaction.$queryRaw<
      readonly { eligible: boolean }[]
    >`
      SELECT TRUE AS "eligible"
      FROM "account" AS account
      INNER JOIN "jastipper_profile" AS profile
        ON profile."account_id" = account."id"
      WHERE account."id" = ${input.sellerAccountId}::uuid
        AND account."status" = 'ACTIVE'::"AccountStatus"
        AND profile."id" = ${input.jastipperProfileId}::uuid
        AND profile."status" = 'ACTIVE'::"JastipperProfileStatus"
      FOR SHARE OF account, profile
    `;
    return rows[0]?.eligible === true;
  }

  async create(request: SubmittedOrderRequest): Promise<void> {
    const capacityKg = gramsToDecimalKilograms(request.reservedCapacityGrams);
    await this.transaction.orderRequest.create({
      data: {
        customerAccountId: request.customerAccountId,
        destinationLabel: request.destinationLabel,
        estimatedArrivalAt: new Date(request.estimatedArrivalAt),
        id: request.id,
        itemDescription: request.terms.itemDescription,
        jastipperProfileId: request.jastipperProfileId,
        orderCloseAt: new Date(request.orderCloseAt),
        orderOpenAt: new Date(request.orderOpenAt),
        originLabel: request.originLabel,
        reservedCapacityKg: capacityKg,
        sellerAccountId: request.sellerAccountId,
        serviceMode: request.serviceMode,
        sourceOfferVersion: request.sourceOfferVersion,
        status: request.status,
        submittedAt: new Date(request.submittedAt),
        transportDepartureAt: new Date(request.transportDepartureAt),
        tripId: request.tripId,
        ...(request.terms.serviceMode === "SHOP_FOR_ME"
          ? {
              allowSubstitution: request.terms.allowSubstitution,
              maximumBudgetIdr: request.terms.maximumBudgetIdr,
              quantity: request.terms.quantity,
              variation: request.terms.variation ?? null,
            }
          : {
              declaredValueIdr: request.terms.declaredValueIdr,
              declaredWeightKg: gramsToDecimalKilograms(
                request.terms.declaredWeightGrams,
              ),
              handlingInstructions: request.terms.handlingInstructions ?? null,
              heightMillimeters: request.terms.heightMillimeters,
              lengthMillimeters: request.terms.lengthMillimeters,
              widthMillimeters: request.terms.widthMillimeters,
            }),
      },
    });
  }

  async complete(
    input: Parameters<OrderSubmissionRepository["complete"]>[0],
  ): Promise<void> {
    await this.transaction.orderSubmissionIdempotency.create({
      data: {
        completedAt: new Date(input.completedAt),
        customerAccountId: input.customerAccountId,
        expiresAt: new Date(input.expiresAt),
        fingerprint: input.fingerprint,
        keyDigest: input.keyDigest,
        operation: input.operation,
        requestId: input.requestId,
      },
    });
  }
}

class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly transaction: TransactionClient) {}

  async resolveGoogleIdentity(
    input: ResolveGoogleIdentityInput,
  ): Promise<ResolveGoogleIdentityResult> {
    const existing = await this.transaction.externalIdentity.findUnique({
      include: { account: true },
      where: {
        issuer_subject: {
          issuer: input.identity.issuer,
          subject: input.identity.subject,
        },
      },
    });

    if (existing) {
      await this.transaction.externalIdentity.update({
        data: {
          assurance: input.identity.assurance,
          emailVerified: input.identity.emailVerified,
          lastAuthenticatedAt: new Date(input.identity.authenticatedAt),
        },
        where: { id: existing.id },
      });

      return Object.freeze({
        account: mapAccount(existing.account),
        created: false,
      });
    }

    const created = await this.transaction.account.create({
      data: {
        displayName: input.identity.displayName,
        id: input.accountId,
        identities: {
          create: {
            assurance: input.identity.assurance,
            emailVerified: input.identity.emailVerified,
            id: input.identityId,
            issuer: input.identity.issuer,
            lastAuthenticatedAt: new Date(input.identity.authenticatedAt),
            provider: input.identity.provider,
            subject: input.identity.subject,
          },
        },
      },
    });

    return Object.freeze({ account: mapAccount(created), created: true });
  }

  async findById(id: AccountId): Promise<AccountRecord | null> {
    const row = await this.transaction.account.findUnique({ where: { id } });
    return row ? mapAccount(row) : null;
  }

  async isSessionActive(
    actor: Parameters<AccountRepository["isSessionActive"]>[0],
    observedAt: string,
  ): Promise<boolean> {
    const now = new Date(observedAt);
    if (Number.isNaN(now.getTime())) {
      return false;
    }
    const row = await this.transaction.browserSession.findUnique({
      include: { account: true },
      where: { id: actor.sessionId },
    });

    return Boolean(
      row &&
      row.accountId === actor.accountId &&
      row.assurance === actor.assurance &&
      row.status === "ACTIVE" &&
      row.account.status === "ACTIVE" &&
      row.accountSessionVersion === row.account.sessionVersion &&
      row.idleExpiresAt > now &&
      row.absoluteExpiresAt > now,
    );
  }

  async capabilitiesFor(id: AccountId): Promise<ReadonlySet<Capability>> {
    const rows = await this.transaction.accountCapabilityGrant.findMany({
      select: { capability: true },
      where: { accountId: id },
    });

    return new Set(rows.map((row) => row.capability));
  }
}

class PrismaJastipperProfileRepository implements JastipperProfileRepository {
  constructor(private readonly transaction: TransactionClient) {}

  async create(profile: JastipperProfileRecord): Promise<void> {
    await this.transaction.jastipperProfile.create({
      data: {
        accountId: profile.accountId,
        deliverySummary: profile.deliverySummary,
        displayName: profile.displayName,
        id: profile.id,
        rateSummary: profile.rateSummary,
        sellerLocationLabel: profile.sellerLocationLabel,
        status: profile.status,
      },
    });
  }

  async findByAccountId(id: AccountId): Promise<JastipperProfileRecord | null> {
    const row = await this.transaction.jastipperProfile.findUnique({
      where: { accountId: id },
    });
    return row ? mapProfile(row) : null;
  }

  async findById(
    id: JastipperProfileId,
  ): Promise<JastipperProfileRecord | null> {
    const row = await this.transaction.jastipperProfile.findUnique({
      where: { id },
    });
    return row ? mapProfile(row) : null;
  }
}

class PrismaTripOfferRepository implements TripOfferRepository {
  constructor(private readonly transaction: TransactionClient) {}

  async create(offer: TripOffer): Promise<void> {
    await this.transaction.tripOffer.create({
      data: { id: offer.id, ...tripWriteData(offer) },
    });
  }

  async findById(id: TripId): Promise<TripOffer | null> {
    const row = await this.transaction.tripOffer.findUnique({ where: { id } });
    return row ? mapTripOffer(row) : null;
  }

  async save(offer: TripOffer, expectedVersion: number): Promise<void> {
    const result = await this.transaction.tripOffer.updateMany({
      data: tripWriteData(offer),
      where: { id: offer.id, version: expectedVersion },
    });

    if (result.count !== 1) {
      throw new OptimisticConcurrencyError();
    }
  }

  async recordModerationDecision(
    input: Parameters<TripOfferRepository["recordModerationDecision"]>[0],
  ): Promise<void> {
    await this.transaction.moderationDecision.create({
      data: {
        createdAt: new Date(input.createdAt),
        decision: input.decision,
        id: input.id,
        moderatorAccountId: input.moderatorAccountId,
        reasonCode: input.reasonCode,
        tripId: input.tripId,
      },
    });
  }
}

class PrismaPublicDiscussionRepository implements PublicDiscussionRepository {
  constructor(private readonly transaction: TransactionClient) {}

  async createQuestion(question: StoredPublicQuestion): Promise<void> {
    await this.transaction.publicQuestion.create({
      data: {
        authorAccountId: question.authorAccountId,
        authorDisplayName: question.authorDisplayName,
        createdAt: new Date(question.createdAt),
        id: question.id,
        message: question.message,
        status: question.status,
        tripId: question.tripId,
      },
    });
  }

  async findQuestionById(id: string): Promise<StoredPublicQuestion | null> {
    const row = await this.transaction.publicQuestion.findUnique({
      include: { answer: true },
      where: { id },
    });

    if (!row) {
      return null;
    }

    return Object.freeze({
      authorAccountId: accountId(row.authorAccountId),
      authorDisplayName: row.authorDisplayName,
      createdAt: row.createdAt.toISOString(),
      id: row.id,
      message: row.message,
      status: row.status,
      tripId: tripId(row.tripId),
      ...(row.answer
        ? {
            answer: Object.freeze({
              authorAccountId: accountId(row.answer.authorAccountId),
              authorDisplayName: row.answer.authorDisplayName,
              createdAt: row.answer.createdAt.toISOString(),
              id: row.answer.id,
              message: row.answer.message,
              status: row.answer.status,
            }),
          }
        : {}),
    });
  }

  async createAnswer(
    input: Parameters<PublicDiscussionRepository["createAnswer"]>[0],
  ): Promise<void> {
    await this.transaction.publicAnswer.create({
      data: {
        authorAccountId: input.answer.authorAccountId,
        authorDisplayName: input.answer.authorDisplayName,
        createdAt: new Date(input.answer.createdAt),
        id: input.id,
        message: input.answer.message,
        questionId: input.questionId,
        status: "VISIBLE",
      },
    });
  }
}

async function appendAudit(
  transaction: TransactionClient,
  record: AuditRecord,
): Promise<void> {
  await transaction.auditEvent.create({
    data: {
      action: record.action,
      actorAccountId: record.actorId || null,
      correlationId: record.correlationId,
      id: randomUUID(),
      occurredAt: new Date(record.occurredAt),
      outcome: record.outcome,
      reasonCode: record.reasonCode,
      targetId: record.targetId,
      targetType: record.targetType,
    },
  });
}

async function enqueueOutbox(
  transaction: TransactionClient,
  message: OutboxMessage,
): Promise<void> {
  await transaction.outboxEvent.create({
    data: {
      aggregateId: message.aggregateId,
      aggregateType: message.aggregateType,
      id: message.id,
      occurredAt: new Date(message.occurredAt),
      payload: message.payload as Prisma.InputJsonValue,
      topic: message.topic,
    },
  });
}

function mapAccount(row: {
  readonly id: string;
  readonly status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  readonly displayName: string;
  readonly sessionVersion: number;
}): AccountRecord {
  return Object.freeze({
    displayName: row.displayName,
    id: accountId(row.id),
    sessionVersion: row.sessionVersion,
    status: row.status,
  });
}

function mapProfile(row: {
  readonly id: string;
  readonly accountId: string;
  readonly displayName: string;
  readonly sellerLocationLabel: string;
  readonly deliverySummary: string;
  readonly rateSummary: string;
  readonly status: "ACTIVE" | "SUSPENDED";
}): JastipperProfileRecord {
  return Object.freeze({
    accountId: accountId(row.accountId),
    deliverySummary: row.deliverySummary,
    displayName: row.displayName,
    id: jastipperProfileId(row.id),
    rateSummary: row.rateSummary,
    sellerLocationLabel: row.sellerLocationLabel,
    status: row.status,
  });
}

function tripWriteData(offer: TripOffer) {
  return {
    departureAt: new Date(offer.departureAt),
    departureDate: dateOnly(offer.departureDate),
    destinationLabel: offer.destinationLabel,
    destinationTimeZone: offer.destinationTimeZone,
    estimatedArrivalAt: new Date(offer.estimatedArrivalAt),
    jastipperProfileId: offer.jastipperProfileId,
    moderationReason: offer.moderationReason ?? null,
    originLabel: offer.originLabel,
    originTimeZone: offer.originTimeZone,
    ownerAccountId: offer.ownerAccountId,
    publishedAt: offer.publishedAt ? new Date(offer.publishedAt) : null,
    remainingCapacityKg: offer.remainingCapacityKg,
    requestDeadline: new Date(offer.requestDeadline),
    requestOpenAt: new Date(offer.requestOpenAt),
    serviceModes: [...offer.serviceModes],
    serviceWindowEndAt: new Date(offer.serviceWindowEndAt),
    serviceWindowStartAt: new Date(offer.serviceWindowStartAt),
    status: offer.status,
    version: offer.version,
  };
}

function mapTripOffer(row: {
  readonly id: string;
  readonly ownerAccountId: string;
  readonly jastipperProfileId: string;
  readonly status:
    "DRAFT" | "PENDING_MODERATION" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  readonly version: number;
  readonly originLabel: string;
  readonly originTimeZone: string;
  readonly destinationLabel: string;
  readonly destinationTimeZone: string;
  readonly serviceWindowStartAt: Date;
  readonly serviceWindowEndAt: Date;
  readonly departureDate: Date;
  readonly departureAt: Date;
  readonly requestOpenAt: Date;
  readonly requestDeadline: Date;
  readonly estimatedArrivalAt: Date;
  readonly serviceModes: readonly string[];
  readonly remainingCapacityKg: { toNumber(): number };
  readonly moderationReason: string | null;
  readonly publishedAt: Date | null;
}): TripOffer {
  return Object.freeze({
    departureAt: row.departureAt.toISOString(),
    departureDate: row.departureDate.toISOString().slice(0, 10),
    destinationLabel: row.destinationLabel,
    destinationTimeZone: row.destinationTimeZone,
    estimatedArrivalAt: row.estimatedArrivalAt.toISOString(),
    id: tripId(row.id),
    jastipperProfileId: jastipperProfileId(row.jastipperProfileId),
    ...(row.moderationReason ? { moderationReason: row.moderationReason } : {}),
    originLabel: row.originLabel,
    originTimeZone: row.originTimeZone,
    ownerAccountId: accountId(row.ownerAccountId),
    ...(row.publishedAt ? { publishedAt: row.publishedAt.toISOString() } : {}),
    remainingCapacityKg: row.remainingCapacityKg.toNumber(),
    requestDeadline: row.requestDeadline.toISOString(),
    requestOpenAt: row.requestOpenAt.toISOString(),
    serviceModes: Object.freeze(row.serviceModes.map(serviceMode)),
    serviceWindowEndAt: row.serviceWindowEndAt.toISOString(),
    serviceWindowStartAt: row.serviceWindowStartAt.toISOString(),
    status: row.status,
    version: row.version,
  });
}

const publicProjectionInclude = {
  profile: true,
  questions: {
    include: { answer: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    where: { status: "VISIBLE" },
  },
} satisfies Prisma.TripOfferInclude;

function mapPublishedTrip(
  row: Prisma.TripOfferGetPayload<{
    include: typeof publicProjectionInclude;
  }>,
): PublishedTrip {
  const questions: PublicQuestion[] = row.questions.map((question) => ({
    authorDisplayName: question.authorDisplayName,
    createdAt: question.createdAt.toISOString(),
    id: question.id,
    message: question.message,
    ...(question.answer?.status === "VISIBLE"
      ? {
          answer: {
            authorDisplayName: question.answer.authorDisplayName,
            createdAt: question.answer.createdAt.toISOString(),
            message: question.answer.message,
          },
        }
      : {}),
  }));

  return createPublishedTrip({
    departureAt: row.departureAt.toISOString(),
    departureDate: row.departureDate.toISOString().slice(0, 10),
    deliverySummary: row.profile.deliverySummary,
    destinationLabel: row.destinationLabel,
    destinationTimeZone: row.destinationTimeZone,
    estimatedArrivalAt: row.estimatedArrivalAt.toISOString(),
    id: tripId(row.id),
    jastipperDisplayName: row.profile.displayName,
    originLabel: row.originLabel,
    originTimeZone: row.originTimeZone,
    publicQuestions: questions,
    rateSummary: row.profile.rateSummary,
    rating: { average: 0, count: 0 },
    remainingCapacityKg: row.remainingCapacityKg.toNumber(),
    requestDeadline: row.requestDeadline.toISOString(),
    requestOpenAt: row.requestOpenAt.toISOString(),
    sellerLocationLabel: row.profile.sellerLocationLabel,
    serviceModes: row.serviceModes.map(serviceMode),
    serviceWindowEndAt: row.serviceWindowEndAt.toISOString(),
    serviceWindowStartAt: row.serviceWindowStartAt.toISOString(),
  });
}

function mapSubmittedOrderRequest(row: {
  readonly id: string;
  readonly tripId: string;
  readonly customerAccountId: string;
  readonly sellerAccountId: string;
  readonly jastipperProfileId: string;
  readonly status: "SUBMITTED";
  readonly serviceMode: "SHOP_FOR_ME" | "CARRY_MY_ITEM";
  readonly sourceOfferVersion: number;
  readonly reservedCapacityKg: { times(value: number): { toNumber(): number } };
  readonly itemDescription: string;
  readonly quantity: number | null;
  readonly maximumBudgetIdr: number | null;
  readonly allowSubstitution: boolean | null;
  readonly variation: string | null;
  readonly declaredValueIdr: number | null;
  readonly declaredWeightKg: {
    times(value: number): { toNumber(): number };
  } | null;
  readonly lengthMillimeters: number | null;
  readonly widthMillimeters: number | null;
  readonly heightMillimeters: number | null;
  readonly handlingInstructions: string | null;
  readonly originLabel: string;
  readonly destinationLabel: string;
  readonly orderOpenAt: Date;
  readonly orderCloseAt: Date;
  readonly transportDepartureAt: Date;
  readonly estimatedArrivalAt: Date;
  readonly submittedAt: Date;
}): SubmittedOrderRequest {
  const reservedCapacityGrams = decimalKilogramsToGrams(row.reservedCapacityKg);
  const terms =
    row.serviceMode === "SHOP_FOR_ME"
      ? {
          allowSubstitution: requirePersisted(row.allowSubstitution),
          itemDescription: row.itemDescription,
          maximumBudgetIdr: requirePersisted(row.maximumBudgetIdr),
          quantity: requirePersisted(row.quantity),
          requestedCapacityGrams: reservedCapacityGrams,
          serviceMode: "SHOP_FOR_ME" as const,
          ...(row.variation ? { variation: row.variation } : {}),
        }
      : {
          declaredValueIdr: requirePersisted(row.declaredValueIdr),
          declaredWeightGrams: decimalKilogramsToGrams(
            requirePersisted(row.declaredWeightKg),
          ),
          heightMillimeters: requirePersisted(row.heightMillimeters),
          itemDescription: row.itemDescription,
          lengthMillimeters: requirePersisted(row.lengthMillimeters),
          serviceMode: "CARRY_MY_ITEM" as const,
          widthMillimeters: requirePersisted(row.widthMillimeters),
          ...(row.handlingInstructions
            ? { handlingInstructions: row.handlingInstructions }
            : {}),
        };

  return Object.freeze({
    customerAccountId: accountId(row.customerAccountId),
    destinationLabel: row.destinationLabel,
    estimatedArrivalAt: row.estimatedArrivalAt.toISOString(),
    id: orderRequestId(row.id),
    jastipperProfileId: jastipperProfileId(row.jastipperProfileId),
    orderCloseAt: row.orderCloseAt.toISOString(),
    orderOpenAt: row.orderOpenAt.toISOString(),
    originLabel: row.originLabel,
    reservedCapacityGrams,
    sellerAccountId: accountId(row.sellerAccountId),
    serviceMode: row.serviceMode,
    sourceOfferVersion: row.sourceOfferVersion,
    status: row.status,
    submittedAt: row.submittedAt.toISOString(),
    terms: Object.freeze(terms),
    transportDepartureAt: row.transportDepartureAt.toISOString(),
    tripId: tripId(row.tripId),
  });
}

function gramsToDecimalKilograms(grams: number): Prisma.Decimal {
  if (
    !Number.isSafeInteger(grams) ||
    grams < 10 ||
    grams > 100_000_000 ||
    grams % 10 !== 0
  ) {
    throw new Error("Capacity grams are outside the persisted contract.");
  }
  return new Prisma.Decimal(grams).dividedBy(1_000);
}

function decimalKilogramsToGrams(value: {
  times(multiplier: number): { toNumber(): number };
}): number {
  const grams = value.times(1_000).toNumber();
  if (!Number.isSafeInteger(grams)) {
    throw new Error("Persisted capacity is not an exact gram value.");
  }
  return grams;
}

function requirePersisted<T>(value: T | null): T {
  if (value === null) {
    throw new Error("Persisted order request violates its mode contract.");
  }
  return value;
}

function serviceMode(value: string): ServiceMode {
  if (value === "SHOP_FOR_ME" || value === "CARRY_MY_ITEM") {
    return value;
  }

  throw new Error("Persisted trip contains an unsupported service mode.");
}

function dateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Date-only value is invalid.");
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function isRetryableTransactionConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  return (
    error.code === "P2002" ||
    error.code === "P2034" ||
    (error.code === "P2010" && isRawTransactionWriteConflict(error.meta))
  );
}

function isRawTransactionWriteConflict(meta: unknown): boolean {
  if (!meta || typeof meta !== "object") {
    return false;
  }
  const driverAdapterError = Reflect.get(meta, "driverAdapterError");
  if (!driverAdapterError || typeof driverAdapterError !== "object") {
    return false;
  }
  const cause = Reflect.get(driverAdapterError, "cause");
  return (
    !!cause &&
    typeof cause === "object" &&
    Reflect.get(cause, "kind") === "TransactionWriteConflict" &&
    Reflect.get(cause, "originalCode") === "40001"
  );
}
