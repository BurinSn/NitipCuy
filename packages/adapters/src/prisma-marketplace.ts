import { randomUUID } from "node:crypto";

import type {
  AccountRecord,
  AccountRepository,
  JastipperProfileRecord,
  JastipperProfileRepository,
  MarketplaceTransactionContext,
  MarketplaceUnitOfWork,
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
  tripId,
  type AccountId,
  type Capability,
  type JastipperProfileId,
  type PublishedTrip,
  type PublicQuestion,
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
    profiles: new PrismaJastipperProfileRepository(transaction),
    trips: new PrismaTripOfferRepository(transaction),
  });
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

  return error.code === "P2002" || error.code === "P2034";
}
