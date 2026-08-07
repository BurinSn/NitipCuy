import {
  accountId,
  approveTripOffer,
  createTripOffer,
  DomainValidationError,
  googleIssuer,
  hasCapability,
  jastipperProfileId,
  normalizeDiscussionMessage,
  normalizeDisplayName,
  normalizePublicTerms,
  rejectTripOffer,
  submitTripOffer,
  type AccountId,
  type AccountStatus,
  type AuthenticatedActor,
  type Capability,
  type JastipperProfileId,
  type JastipperPublicTerms,
  type PublicDiscussionEntry,
  type TripOffer,
  type TripScheduleInput,
  type TripId,
} from "@nitipcuy/domain";

import type {
  AuditPort,
  ClockPort,
  IdentifierPort,
  OutboxPort,
  VerifiedExternalIdentity,
} from "./ports/platform-services";

export type MarketplaceErrorCode =
  | "ACCOUNT_INACTIVE"
  | "ANSWER_ALREADY_EXISTS"
  | "GOOGLE_EMAIL_UNVERIFIED"
  | "IDENTITY_INVALID"
  | "INSUFFICIENT_ASSURANCE"
  | "MISSING_CAPABILITY"
  | "PROFILE_INACTIVE"
  | "PROFILE_ALREADY_EXISTS"
  | "PROFILE_NOT_FOUND"
  | "RESOURCE_NOT_FOUND"
  | "RESOURCE_NOT_OWNED"
  | "SESSION_INACTIVE"
  | "TRIP_NOT_PUBLISHED";

export class MarketplaceUseCaseError extends Error {
  constructor(
    readonly code: MarketplaceErrorCode,
    message = "The requested operation is not available.",
  ) {
    super(message);
    this.name = "MarketplaceUseCaseError";
  }
}

export interface AccountRecord {
  readonly id: AccountId;
  readonly status: AccountStatus;
  readonly displayName: string;
  readonly sessionVersion: number;
}

export interface JastipperProfileRecord extends JastipperPublicTerms {
  readonly id: JastipperProfileId;
  readonly accountId: AccountId;
  readonly status: "ACTIVE" | "SUSPENDED";
}

export interface StoredPublicQuestion extends PublicDiscussionEntry {
  readonly tripId: TripId;
  readonly status: "VISIBLE" | "HIDDEN";
  readonly answer?: PublicDiscussionEntry & {
    readonly status: "VISIBLE" | "HIDDEN";
  };
}

export interface ResolveGoogleIdentityInput {
  readonly identityId: string;
  readonly accountId: AccountId;
  readonly identity: VerifiedExternalIdentity;
}

export interface ResolveGoogleIdentityResult {
  readonly account: AccountRecord;
  readonly created: boolean;
}

export interface AccountRepository {
  resolveGoogleIdentity(
    input: ResolveGoogleIdentityInput,
  ): Promise<ResolveGoogleIdentityResult>;
  findById(id: AccountId): Promise<AccountRecord | null>;
  isSessionActive(
    actor: AuthenticatedActor,
    observedAt: string,
  ): Promise<boolean>;
  capabilitiesFor(id: AccountId): Promise<ReadonlySet<Capability>>;
}

export interface JastipperProfileRepository {
  create(profile: JastipperProfileRecord): Promise<void>;
  findByAccountId(id: AccountId): Promise<JastipperProfileRecord | null>;
  findById(id: JastipperProfileId): Promise<JastipperProfileRecord | null>;
}

export interface TripOfferRepository {
  create(offer: TripOffer): Promise<void>;
  findById(id: TripId): Promise<TripOffer | null>;
  save(offer: TripOffer, expectedVersion: number): Promise<void>;
  recordModerationDecision(input: {
    readonly id: string;
    readonly tripId: TripId;
    readonly moderatorAccountId: AccountId;
    readonly decision: "APPROVED" | "REJECTED";
    readonly reasonCode: string;
    readonly createdAt: string;
  }): Promise<void>;
}

export interface PublicDiscussionRepository {
  createQuestion(question: StoredPublicQuestion): Promise<void>;
  findQuestionById(id: string): Promise<StoredPublicQuestion | null>;
  createAnswer(input: {
    readonly id: string;
    readonly questionId: string;
    readonly answer: PublicDiscussionEntry;
  }): Promise<void>;
}

export interface MarketplaceTransactionContext {
  readonly accounts: AccountRepository;
  readonly profiles: JastipperProfileRepository;
  readonly trips: TripOfferRepository;
  readonly discussions: PublicDiscussionRepository;
  readonly audit: AuditPort;
  readonly outbox: OutboxPort;
}

export interface MarketplaceUnitOfWork {
  execute<T>(
    work: (context: MarketplaceTransactionContext) => Promise<T>,
  ): Promise<T>;
}

interface UseCaseDependencies {
  readonly clock: ClockPort;
  readonly identifiers: IdentifierPort;
  readonly unitOfWork: MarketplaceUnitOfWork;
}

interface CommandMetadata {
  readonly correlationId: string;
}

export class ResolveGoogleAccount {
  constructor(private readonly dependencies: UseCaseDependencies) {}

  execute(
    identityInput: VerifiedExternalIdentity,
    metadata: CommandMetadata,
  ): Promise<ResolveGoogleIdentityResult> {
    const identity = normalizeGoogleIdentity(identityInput);
    const correlationId = normalizeCorrelationId(metadata.correlationId);
    const candidateAccountId = accountId(
      this.dependencies.identifiers.next("account"),
    );
    const identityId = requireUuid(
      this.dependencies.identifiers.next("external-identity"),
      "External identity ID",
    );

    return this.dependencies.unitOfWork.execute(async (transaction) => {
      const result = await transaction.accounts.resolveGoogleIdentity({
        accountId: candidateAccountId,
        identity,
        identityId,
      });

      requireActiveAccount(result.account);

      await transaction.audit.append({
        action: result.created ? "account.create" : "account.authenticate",
        actorId: result.account.id,
        correlationId,
        occurredAt: identity.authenticatedAt,
        outcome: "SUCCEEDED",
        reasonCode: result.created
          ? "GOOGLE_IDENTITY_CREATED"
          : "GOOGLE_IDENTITY_MATCHED",
        targetId: result.account.id,
        targetType: "account",
      });

      if (result.created) {
        await transaction.outbox.enqueue({
          aggregateId: result.account.id,
          aggregateType: "account",
          id: this.dependencies.identifiers.next("outbox"),
          occurredAt: identity.authenticatedAt,
          payload: Object.freeze({ accountId: result.account.id }),
          topic: "account.created",
        });
      }

      return result;
    });
  }
}

export class CreateJastipperProfile {
  constructor(private readonly dependencies: UseCaseDependencies) {}

  execute(
    actor: AuthenticatedActor,
    termsInput: JastipperPublicTerms,
    metadata: CommandMetadata,
  ): Promise<JastipperProfileRecord> {
    const terms = normalizePublicTerms(termsInput);
    const correlationId = normalizeCorrelationId(metadata.correlationId);
    const profile: JastipperProfileRecord = Object.freeze({
      ...terms,
      accountId: actor.accountId,
      id: jastipperProfileId(
        this.dependencies.identifiers.next("jastipper-profile"),
      ),
      status: "ACTIVE",
    });
    const occurredAt = this.dependencies.clock.now();

    return this.dependencies.unitOfWork.execute(async (transaction) => {
      await requireCurrentActor(transaction, actor, occurredAt);
      if (await transaction.profiles.findByAccountId(actor.accountId)) {
        throw new MarketplaceUseCaseError("PROFILE_ALREADY_EXISTS");
      }
      await transaction.profiles.create(profile);
      await transaction.audit.append({
        action: "jastipper-profile.create",
        actorId: actor.accountId,
        correlationId,
        occurredAt,
        outcome: "SUCCEEDED",
        reasonCode: "OWNER_CREATED",
        targetId: profile.id,
        targetType: "jastipper-profile",
      });
      await transaction.outbox.enqueue({
        aggregateId: profile.id,
        aggregateType: "jastipper-profile",
        id: this.dependencies.identifiers.next("outbox"),
        occurredAt,
        payload: Object.freeze({ accountId: actor.accountId }),
        topic: "jastipper-profile.created",
      });

      return profile;
    });
  }
}

export class CreateTripDraft {
  constructor(private readonly dependencies: UseCaseDependencies) {}

  execute(
    actor: AuthenticatedActor,
    input: TripScheduleInput & { readonly id: TripId },
    metadata: CommandMetadata,
  ): Promise<TripOffer> {
    const correlationId = normalizeCorrelationId(metadata.correlationId);
    const occurredAt = this.dependencies.clock.now();

    return this.dependencies.unitOfWork.execute(async (transaction) => {
      await requireCurrentActor(transaction, actor, occurredAt);
      const profile = await requireActiveProfile(transaction, actor.accountId);
      const offer = createTripOffer(
        {
          ...input,
          jastipperProfileId: profile.id,
          ownerAccountId: actor.accountId,
        },
        profile,
      );

      await transaction.trips.create(offer);
      await transaction.audit.append({
        action: "trip-draft.create",
        actorId: actor.accountId,
        correlationId,
        occurredAt,
        outcome: "SUCCEEDED",
        reasonCode: "OWNER_CREATED",
        targetId: offer.id,
        targetType: "trip-offer",
      });

      return offer;
    });
  }
}

export class SubmitTripForModeration {
  constructor(private readonly dependencies: UseCaseDependencies) {}

  execute(
    actor: AuthenticatedActor,
    targetTripId: TripId,
    metadata: CommandMetadata,
  ): Promise<TripOffer> {
    const correlationId = normalizeCorrelationId(metadata.correlationId);
    const occurredAt = this.dependencies.clock.now();

    return this.dependencies.unitOfWork.execute(async (transaction) => {
      await requireCurrentActor(transaction, actor, occurredAt);
      const current = await requireOwnedTrip(transaction, actor, targetTripId);
      const submitted = submitTripOffer(current);

      await transaction.trips.save(submitted, current.version);
      await transaction.audit.append({
        action: "trip.submit-for-moderation",
        actorId: actor.accountId,
        correlationId,
        occurredAt,
        outcome: "SUCCEEDED",
        reasonCode: "OWNER_SUBMITTED",
        targetId: targetTripId,
        targetType: "trip-offer",
      });
      await transaction.outbox.enqueue({
        aggregateId: targetTripId,
        aggregateType: "trip-offer",
        id: this.dependencies.identifiers.next("outbox"),
        occurredAt,
        payload: Object.freeze({ ownerAccountId: actor.accountId }),
        topic: "trip.moderation-requested",
      });

      return submitted;
    });
  }
}

export class ModerateTrip {
  constructor(private readonly dependencies: UseCaseDependencies) {}

  execute(
    actor: AuthenticatedActor,
    input: {
      readonly tripId: TripId;
      readonly decision: "APPROVED" | "REJECTED";
      readonly reasonCode: string;
    },
    metadata: CommandMetadata,
  ): Promise<TripOffer> {
    const correlationId = normalizeCorrelationId(metadata.correlationId);
    const reasonCode = normalizeReasonCode(input.reasonCode);
    const occurredAt = this.dependencies.clock.now();

    return this.dependencies.unitOfWork.execute(async (transaction) => {
      await requireCurrentActor(transaction, actor, occurredAt);
      const persistedCapabilities = await transaction.accounts.capabilitiesFor(
        actor.accountId,
      );

      if (
        !hasCapability(actor, "MODERATE_TRIPS") ||
        !persistedCapabilities.has("MODERATE_TRIPS")
      ) {
        throw new MarketplaceUseCaseError("MISSING_CAPABILITY");
      }

      if (actor.assurance !== "PHISHING_RESISTANT") {
        throw new MarketplaceUseCaseError("INSUFFICIENT_ASSURANCE");
      }

      const current = await transaction.trips.findById(input.tripId);

      if (!current) {
        throw new MarketplaceUseCaseError("RESOURCE_NOT_FOUND");
      }

      const moderated =
        input.decision === "APPROVED"
          ? approveTripOffer(current, occurredAt)
          : rejectTripOffer(current, reasonCode);

      await transaction.trips.save(moderated, current.version);
      await transaction.trips.recordModerationDecision({
        createdAt: occurredAt,
        decision: input.decision,
        id: requireUuid(
          this.dependencies.identifiers.next("moderation-decision"),
          "Moderation decision ID",
        ),
        moderatorAccountId: actor.accountId,
        reasonCode,
        tripId: input.tripId,
      });
      await transaction.audit.append({
        action: "trip.moderate",
        actorId: actor.accountId,
        correlationId,
        occurredAt,
        outcome: "SUCCEEDED",
        reasonCode,
        targetId: input.tripId,
        targetType: "trip-offer",
      });
      await transaction.outbox.enqueue({
        aggregateId: input.tripId,
        aggregateType: "trip-offer",
        id: this.dependencies.identifiers.next("outbox"),
        occurredAt,
        payload: Object.freeze({ decision: input.decision }),
        topic:
          input.decision === "APPROVED" ? "trip.published" : "trip.rejected",
      });

      return moderated;
    });
  }
}

export class AskPublicQuestion {
  constructor(private readonly dependencies: UseCaseDependencies) {}

  execute(
    actor: AuthenticatedActor,
    input: { readonly tripId: TripId; readonly message: string },
    metadata: CommandMetadata,
  ): Promise<StoredPublicQuestion> {
    const correlationId = normalizeCorrelationId(metadata.correlationId);
    const message = normalizeDiscussionMessage(input.message);
    const occurredAt = this.dependencies.clock.now();

    return this.dependencies.unitOfWork.execute(async (transaction) => {
      const account = await requireCurrentActor(transaction, actor, occurredAt);
      const trip = await transaction.trips.findById(input.tripId);

      if (!trip) {
        throw new MarketplaceUseCaseError("RESOURCE_NOT_FOUND");
      }

      if (trip.status !== "PUBLISHED") {
        throw new MarketplaceUseCaseError("TRIP_NOT_PUBLISHED");
      }

      const question: StoredPublicQuestion = Object.freeze({
        authorAccountId: actor.accountId,
        authorDisplayName: normalizeDisplayName(account.displayName),
        createdAt: occurredAt,
        id: requireUuid(
          this.dependencies.identifiers.next("public-question"),
          "Public question ID",
        ),
        message,
        status: "VISIBLE",
        tripId: input.tripId,
      });

      await transaction.discussions.createQuestion(question);
      await transaction.audit.append({
        action: "public-question.create",
        actorId: actor.accountId,
        correlationId,
        occurredAt: question.createdAt,
        outcome: "SUCCEEDED",
        reasonCode: "AUTHENTICATED_CUSTOMER_CREATED",
        targetId: question.id,
        targetType: "public-question",
      });

      return question;
    });
  }
}

export class AnswerPublicQuestion {
  constructor(private readonly dependencies: UseCaseDependencies) {}

  execute(
    actor: AuthenticatedActor,
    input: { readonly questionId: string; readonly message: string },
    metadata: CommandMetadata,
  ): Promise<PublicDiscussionEntry> {
    const correlationId = normalizeCorrelationId(metadata.correlationId);
    const message = normalizeDiscussionMessage(input.message);
    const occurredAt = this.dependencies.clock.now();

    return this.dependencies.unitOfWork.execute(async (transaction) => {
      await requireCurrentActor(transaction, actor, occurredAt);
      const question = await transaction.discussions.findQuestionById(
        input.questionId,
      );

      if (!question) {
        throw new MarketplaceUseCaseError("RESOURCE_NOT_FOUND");
      }

      if (question.status !== "VISIBLE") {
        throw new MarketplaceUseCaseError("RESOURCE_NOT_FOUND");
      }

      if (question.answer) {
        throw new MarketplaceUseCaseError("ANSWER_ALREADY_EXISTS");
      }

      const trip = await requireOwnedTrip(transaction, actor, question.tripId);
      if (trip.status !== "PUBLISHED") {
        throw new MarketplaceUseCaseError("TRIP_NOT_PUBLISHED");
      }
      const profile = await transaction.profiles.findById(
        trip.jastipperProfileId,
      );

      if (!profile || profile.status !== "ACTIVE") {
        throw new MarketplaceUseCaseError("PROFILE_INACTIVE");
      }

      const answer: PublicDiscussionEntry = Object.freeze({
        authorAccountId: actor.accountId,
        authorDisplayName: profile.displayName,
        createdAt: occurredAt,
        id: requireUuid(
          this.dependencies.identifiers.next("public-answer"),
          "Public answer ID",
        ),
        message,
      });

      await transaction.discussions.createAnswer({
        answer,
        id: answer.id,
        questionId: question.id,
      });
      await transaction.audit.append({
        action: "public-question.answer",
        actorId: actor.accountId,
        correlationId,
        occurredAt: answer.createdAt,
        outcome: "SUCCEEDED",
        reasonCode: "TRIP_OWNER_ANSWERED",
        targetId: question.id,
        targetType: "public-question",
      });

      return answer;
    });
  }
}

function normalizeGoogleIdentity(
  identity: VerifiedExternalIdentity,
): VerifiedExternalIdentity {
  const subject = identity.subject.trim();
  const email = identity.email?.trim().toLowerCase();

  if (
    identity.provider !== "GOOGLE" ||
    identity.issuer !== googleIssuer ||
    subject.length < 1 ||
    subject.length > 255 ||
    Number.isNaN(Date.parse(identity.authenticatedAt))
  ) {
    throw new MarketplaceUseCaseError("IDENTITY_INVALID");
  }

  if (!identity.emailVerified || !email || !isEmail(email)) {
    throw new MarketplaceUseCaseError("GOOGLE_EMAIL_UNVERIFIED");
  }

  return Object.freeze({
    ...identity,
    displayName: normalizeDisplayName(identity.displayName),
    email,
    subject,
  });
}

async function requireCurrentActor(
  transaction: MarketplaceTransactionContext,
  actor: AuthenticatedActor,
  observedAt: string,
): Promise<AccountRecord> {
  const account = await transaction.accounts.findById(actor.accountId);

  if (!account) {
    throw new MarketplaceUseCaseError("RESOURCE_NOT_FOUND");
  }

  requireActiveAccount(account);
  if (!(await transaction.accounts.isSessionActive(actor, observedAt))) {
    throw new MarketplaceUseCaseError("SESSION_INACTIVE");
  }
  return account;
}

function requireActiveAccount(account: AccountRecord): void {
  if (account.status !== "ACTIVE") {
    throw new MarketplaceUseCaseError("ACCOUNT_INACTIVE");
  }
}

async function requireActiveProfile(
  transaction: MarketplaceTransactionContext,
  ownerAccountId: AccountId,
): Promise<JastipperProfileRecord> {
  const profile = await transaction.profiles.findByAccountId(ownerAccountId);

  if (!profile) {
    throw new MarketplaceUseCaseError("PROFILE_NOT_FOUND");
  }

  if (profile.status !== "ACTIVE") {
    throw new MarketplaceUseCaseError("PROFILE_INACTIVE");
  }

  return profile;
}

async function requireOwnedTrip(
  transaction: MarketplaceTransactionContext,
  actor: AuthenticatedActor,
  id: TripId,
): Promise<TripOffer> {
  const trip = await transaction.trips.findById(id);

  if (!trip) {
    throw new MarketplaceUseCaseError("RESOURCE_NOT_FOUND");
  }

  if (trip.ownerAccountId !== actor.accountId) {
    throw new MarketplaceUseCaseError("RESOURCE_NOT_OWNED");
  }

  return trip;
}

function normalizeCorrelationId(value: string): string {
  const normalized = value.trim();

  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,119}$/.test(normalized)) {
    throw new Error("Correlation ID is invalid.");
  }

  return normalized;
}

function normalizeReasonCode(value: string): string {
  const normalized = value.trim().toUpperCase();

  if (!/^[A-Z][A-Z0-9_]{1,79}$/.test(normalized)) {
    throw new DomainValidationError("Reason code is invalid.");
  }

  return normalized;
}

function requireUuid(value: string, field: string): string {
  const normalized = value.trim().toLowerCase();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      normalized,
    )
  ) {
    throw new Error(`${field} must be a UUID.`);
  }

  return normalized;
}

function isEmail(value: string): boolean {
  return (
    value.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}
