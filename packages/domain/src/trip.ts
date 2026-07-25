const tripIdPattern = /^[a-z0-9][a-z0-9-]{2,63}$/;
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(?:\.\d{3})?)?(Z|[+-]\d{2}:\d{2})$/;

declare const tripIdBrand: unique symbol;

export type TripId = string & { readonly [tripIdBrand]: "TripId" };

export type ServiceMode = "SHOP_FOR_ME" | "CARRY_MY_ITEM";

export interface RatingSummary {
  readonly average: number;
  readonly count: number;
}

export interface PublicAnswer {
  readonly authorDisplayName: string;
  readonly message: string;
  readonly createdAt: string;
}

export interface PublicQuestion {
  readonly id: string;
  readonly authorDisplayName: string;
  readonly message: string;
  readonly createdAt: string;
  readonly answer?: PublicAnswer;
}

export interface PublishedTrip {
  readonly id: TripId;
  readonly jastipperDisplayName: string;
  readonly originLabel: string;
  readonly destinationLabel: string;
  readonly departureDate: string;
  readonly departureAt: string;
  readonly requestDeadline: string;
  readonly estimatedArrivalAt: string;
  readonly serviceModes: readonly ServiceMode[];
  readonly remainingCapacityKg: number;
  readonly sellerLocationLabel: string;
  readonly deliverySummary: string;
  readonly rateSummary: string;
  readonly rating: RatingSummary;
  readonly publicQuestions: readonly PublicQuestion[];
}

export class DomainValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainValidationError";
  }
}

export function tripId(value: string): TripId {
  const normalized = value.trim().toLowerCase();

  if (!tripIdPattern.test(normalized)) {
    throw new DomainValidationError(
      "Trip ID must contain 3 to 64 lowercase letters, numbers, or hyphens.",
    );
  }

  return normalized as TripId;
}

export function createPublishedTrip(input: PublishedTrip): PublishedTrip {
  const originLabel = requireLabel(input.originLabel, "Origin");
  const destinationLabel = requireLabel(input.destinationLabel, "Destination");

  if (
    originLabel.toLocaleLowerCase() === destinationLabel.toLocaleLowerCase()
  ) {
    throw new DomainValidationError(
      "Trip origin and destination must be different.",
    );
  }

  requireDateOnly(input.departureDate, "Departure date");
  requireIsoDateTime(input.departureAt, "Departure timestamp");
  requireIsoDateTime(input.requestDeadline, "Request deadline");
  requireIsoDateTime(input.estimatedArrivalAt, "Estimated arrival");

  if (input.departureAt.slice(0, 10) !== input.departureDate) {
    throw new DomainValidationError(
      "Departure date must match the local date in the departure timestamp.",
    );
  }

  const requestDeadline = Date.parse(input.requestDeadline);
  const departure = Date.parse(input.departureAt);
  const estimatedArrival = Date.parse(input.estimatedArrivalAt);

  if (requestDeadline >= departure) {
    throw new DomainValidationError(
      "Request deadline must be before departure.",
    );
  }

  if (estimatedArrival < departure) {
    throw new DomainValidationError(
      "Estimated arrival cannot be before departure.",
    );
  }

  if (input.serviceModes.length === 0) {
    throw new DomainValidationError(
      "A published trip must support at least one service mode.",
    );
  }

  if (
    !Number.isFinite(input.remainingCapacityKg) ||
    input.remainingCapacityKg < 0
  ) {
    throw new DomainValidationError(
      "Remaining capacity must be a non-negative number.",
    );
  }

  if (
    !Number.isFinite(input.rating.average) ||
    input.rating.average < 0 ||
    input.rating.average > 5 ||
    !Number.isInteger(input.rating.count) ||
    input.rating.count < 0
  ) {
    throw new DomainValidationError("Rating summary is invalid.");
  }

  const publicQuestions = [...input.publicQuestions]
    .map((question) => normalizeQuestion(question))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  return Object.freeze({
    ...input,
    originLabel,
    destinationLabel,
    jastipperDisplayName: requireLabel(
      input.jastipperDisplayName,
      "Jastipper display name",
    ),
    sellerLocationLabel: requireLabel(
      input.sellerLocationLabel,
      "Seller location",
    ),
    deliverySummary: requireLabel(input.deliverySummary, "Delivery summary"),
    rateSummary: requireLabel(input.rateSummary, "Rate summary"),
    serviceModes: Object.freeze([...new Set(input.serviceModes)]),
    rating: Object.freeze({ ...input.rating }),
    publicQuestions: Object.freeze(publicQuestions),
  });
}

function normalizeQuestion(question: PublicQuestion): PublicQuestion {
  requireIsoDateTime(question.createdAt, "Question timestamp");

  const answer = question.answer
    ? Object.freeze({
        authorDisplayName: requireLabel(
          question.answer.authorDisplayName,
          "Answer author",
        ),
        message: requireLabel(question.answer.message, "Answer"),
        createdAt: requireIsoDateTime(
          question.answer.createdAt,
          "Answer timestamp",
        ),
      })
    : undefined;

  if (answer && Date.parse(answer.createdAt) < Date.parse(question.createdAt)) {
    throw new DomainValidationError(
      "A public answer cannot predate its question.",
    );
  }

  return Object.freeze({
    id: requireLabel(question.id, "Question ID"),
    authorDisplayName: requireLabel(
      question.authorDisplayName,
      "Question author",
    ),
    message: requireLabel(question.message, "Question"),
    createdAt: question.createdAt,
    ...(answer ? { answer } : {}),
  });
}

function requireLabel(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length < 2) {
    throw new DomainValidationError(
      `${field} must contain at least 2 characters.`,
    );
  }

  return normalized;
}

function requireDateOnly(value: string, field: string): string {
  if (
    !dateOnlyPattern.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  ) {
    throw new DomainValidationError(`${field} must be an ISO date.`);
  }

  return value;
}

function requireIsoDateTime(value: string, field: string): string {
  if (!isoDateTimePattern.test(value) || Number.isNaN(Date.parse(value))) {
    throw new DomainValidationError(
      `${field} must include an ISO date, time, and timezone.`,
    );
  }

  return value;
}
