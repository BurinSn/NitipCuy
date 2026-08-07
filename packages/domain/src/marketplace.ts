import type { AccountId, JastipperProfileId } from "./account";
import {
  DomainValidationError,
  createPublishedTrip,
  type PublishedTrip,
  type ServiceMode,
  type TripId,
} from "./trip";

export class MarketplaceStateConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketplaceStateConflictError";
  }
}

export type TripOfferStatus =
  "DRAFT" | "PENDING_MODERATION" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

export interface JastipperPublicTerms {
  readonly displayName: string;
  readonly sellerLocationLabel: string;
  readonly deliverySummary: string;
  readonly rateSummary: string;
}

export interface TripScheduleInput {
  readonly originLabel: string;
  readonly originTimeZone: string;
  readonly destinationLabel: string;
  readonly destinationTimeZone: string;
  readonly serviceWindowStartAt: string;
  readonly serviceWindowEndAt: string;
  readonly departureDate: string;
  readonly departureAt: string;
  readonly requestOpenAt: string;
  readonly requestDeadline: string;
  readonly estimatedArrivalAt: string;
  readonly serviceModes: readonly ServiceMode[];
  readonly remainingCapacityKg: number;
}

export interface TripOffer extends TripScheduleInput {
  readonly id: TripId;
  readonly ownerAccountId: AccountId;
  readonly jastipperProfileId: JastipperProfileId;
  readonly status: TripOfferStatus;
  readonly version: number;
  readonly moderationReason?: string;
  readonly publishedAt?: string;
}

export interface PublicDiscussionEntry {
  readonly id: string;
  readonly authorAccountId: AccountId;
  readonly authorDisplayName: string;
  readonly message: string;
  readonly createdAt: string;
}

export function createTripOffer(
  input: Omit<TripOffer, "status" | "version">,
  publicTerms: JastipperPublicTerms,
): TripOffer {
  validateProjectionShape(input, publicTerms);

  return Object.freeze({
    ...input,
    serviceModes: Object.freeze([...new Set(input.serviceModes)]),
    status: "DRAFT",
    version: 1,
  });
}

export function submitTripOffer(offer: TripOffer): TripOffer {
  requireStatus(offer, "DRAFT", "submit");

  return Object.freeze({
    ...offer,
    status: "PENDING_MODERATION",
    version: offer.version + 1,
  });
}

export function approveTripOffer(
  offer: TripOffer,
  publishedAt: string,
): TripOffer {
  requireStatus(offer, "PENDING_MODERATION", "approve");
  requireInstant(publishedAt, "Publication timestamp");

  return Object.freeze({
    ...offer,
    publishedAt,
    status: "PUBLISHED",
    version: offer.version + 1,
  });
}

export function rejectTripOffer(
  offer: TripOffer,
  moderationReason: string,
): TripOffer {
  requireStatus(offer, "PENDING_MODERATION", "reject");

  return Object.freeze({
    ...offer,
    moderationReason: boundedText(
      moderationReason,
      "Moderation reason",
      2,
      500,
    ),
    status: "REJECTED",
    version: offer.version + 1,
  });
}

export function toPublishedTrip(
  offer: TripOffer,
  publicTerms: JastipperPublicTerms,
  publicQuestions: PublishedTrip["publicQuestions"],
): PublishedTrip {
  requireStatus(offer, "PUBLISHED", "project");

  return createPublishedTrip({
    ...scheduleOf(offer),
    deliverySummary: publicTerms.deliverySummary,
    id: offer.id,
    jastipperDisplayName: publicTerms.displayName,
    publicQuestions,
    rateSummary: publicTerms.rateSummary,
    rating: { average: 0, count: 0 },
    sellerLocationLabel: publicTerms.sellerLocationLabel,
  });
}

export function normalizeDiscussionMessage(value: string): string {
  return boundedText(value, "Public discussion message", 5, 500);
}

export function normalizeDisplayName(value: string): string {
  return boundedText(value, "Display name", 2, 120);
}

export function normalizePublicTerms(
  input: JastipperPublicTerms,
): JastipperPublicTerms {
  return Object.freeze({
    deliverySummary: boundedText(
      input.deliverySummary,
      "Delivery summary",
      2,
      500,
    ),
    displayName: normalizeDisplayName(input.displayName),
    rateSummary: boundedText(input.rateSummary, "Rate summary", 2, 500),
    sellerLocationLabel: boundedText(
      input.sellerLocationLabel,
      "Seller location",
      2,
      160,
    ),
  });
}

function validateProjectionShape(
  input: Omit<TripOffer, "status" | "version">,
  publicTerms: JastipperPublicTerms,
): void {
  createPublishedTrip({
    ...scheduleOf(input),
    deliverySummary: publicTerms.deliverySummary,
    id: input.id,
    jastipperDisplayName: publicTerms.displayName,
    publicQuestions: [],
    rateSummary: publicTerms.rateSummary,
    rating: { average: 0, count: 0 },
    sellerLocationLabel: publicTerms.sellerLocationLabel,
  });
}

function scheduleOf(input: TripScheduleInput): TripScheduleInput {
  return {
    departureAt: input.departureAt,
    departureDate: input.departureDate,
    destinationLabel: input.destinationLabel,
    destinationTimeZone: input.destinationTimeZone,
    estimatedArrivalAt: input.estimatedArrivalAt,
    originLabel: input.originLabel,
    originTimeZone: input.originTimeZone,
    remainingCapacityKg: input.remainingCapacityKg,
    requestDeadline: input.requestDeadline,
    requestOpenAt: input.requestOpenAt,
    serviceModes: input.serviceModes,
    serviceWindowEndAt: input.serviceWindowEndAt,
    serviceWindowStartAt: input.serviceWindowStartAt,
  };
}

function requireStatus(
  offer: TripOffer,
  expected: TripOfferStatus,
  operation: string,
): void {
  if (offer.status !== expected) {
    throw new MarketplaceStateConflictError(
      `Cannot ${operation} a trip in ${offer.status} state.`,
    );
  }
}

function requireInstant(value: string, field: string): string {
  if (Number.isNaN(Date.parse(value))) {
    throw new DomainValidationError(`${field} must be an ISO timestamp.`);
  }

  return value;
}

function boundedText(
  value: string,
  field: string,
  minimum: number,
  maximum: number,
): string {
  const normalized = value.trim();

  if (normalized.length < minimum || normalized.length > maximum) {
    throw new DomainValidationError(
      `${field} must contain ${minimum} to ${maximum} characters.`,
    );
  }

  return normalized;
}
