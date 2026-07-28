const tripIdPattern = /^[a-z0-9][a-z0-9-]{2,63}$/;
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTimePattern =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(Z|([+-])(\d{2}):(\d{2}))$/;
const supportedServiceModes = new Set<ServiceMode>([
  "SHOP_FOR_ME",
  "CARRY_MY_ITEM",
]);

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

/**
 * Read-only public discovery projection.
 *
 * This is not the future authoritative TripOffer aggregate and must never be
 * accepted as mutation, capacity-reservation, checkout, or authorization input.
 */
export interface PublishedTrip {
  readonly id: TripId;
  readonly jastipperDisplayName: string;
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
  const originTimeZone = requireTimeZone(
    input.originTimeZone,
    "Origin timezone",
  );
  const destinationTimeZone = requireTimeZone(
    input.destinationTimeZone,
    "Destination timezone",
  );
  requireIsoDateTime(input.serviceWindowStartAt, "Service-window start");
  requireIsoDateTime(input.serviceWindowEndAt, "Service-window end");
  requireIsoDateTime(input.departureAt, "Departure timestamp");
  requireIsoDateTime(input.requestOpenAt, "Request opening");
  requireIsoDateTime(input.requestDeadline, "Request deadline");
  requireIsoDateTime(input.estimatedArrivalAt, "Estimated arrival");

  if (
    dateInTimeZone(input.departureAt, originTimeZone) !== input.departureDate
  ) {
    throw new DomainValidationError(
      "Departure date must match the local date in the departure timestamp.",
    );
  }

  const serviceWindowStart = Date.parse(input.serviceWindowStartAt);
  const serviceWindowEnd = Date.parse(input.serviceWindowEndAt);
  const requestOpen = Date.parse(input.requestOpenAt);
  const requestDeadline = Date.parse(input.requestDeadline);
  const departure = Date.parse(input.departureAt);
  const estimatedArrival = Date.parse(input.estimatedArrivalAt);

  if (serviceWindowStart >= serviceWindowEnd) {
    throw new DomainValidationError(
      "Service-window start must be before its end.",
    );
  }

  if (requestOpen >= requestDeadline) {
    throw new DomainValidationError(
      "Request opening must be before the request deadline.",
    );
  }

  if (requestDeadline > serviceWindowEnd) {
    throw new DomainValidationError(
      "Request deadline cannot be after the service window ends.",
    );
  }

  if (serviceWindowEnd > departure) {
    throw new DomainValidationError(
      "Service window cannot end after departure.",
    );
  }

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

  const serviceModes = [...new Set(input.serviceModes)];

  if (serviceModes.length === 0) {
    throw new DomainValidationError(
      "A published trip must support at least one service mode.",
    );
  }

  if (serviceModes.some((mode) => !supportedServiceModes.has(mode))) {
    throw new DomainValidationError(
      "A published trip contains an unsupported service mode.",
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

  const publicQuestions = [...input.publicQuestions].map((question) =>
    normalizeQuestion(question),
  );
  const questionIds = new Set<string>();

  for (const question of publicQuestions) {
    if (questionIds.has(question.id)) {
      throw new DomainValidationError(
        "Public question IDs must be unique within a trip.",
      );
    }

    questionIds.add(question.id);
  }

  publicQuestions.sort(
    (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt),
  );

  return Object.freeze({
    ...input,
    originLabel,
    originTimeZone,
    destinationLabel,
    destinationTimeZone,
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
    serviceModes: Object.freeze(serviceModes),
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
  if (!isValidDateOnly(value)) {
    throw new DomainValidationError(`${field} must be an ISO date.`);
  }

  return value;
}

function requireIsoDateTime(value: string, field: string): string {
  const match = isoDateTimePattern.exec(value);

  if (!match) {
    throw new DomainValidationError(
      `${field} must include an ISO date, time, and timezone.`,
    );
  }

  const [
    ,
    date,
    hourText,
    minuteText,
    secondText,
    ,
    timezone,
    ,
    offsetHourText,
    offsetMinuteText,
  ] = match;
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText ?? "0");
  const offsetHour = Number(offsetHourText ?? "0");
  const offsetMinute = Number(offsetMinuteText ?? "0");
  const validOffset =
    timezone === "Z" ||
    (offsetHour <= 14 &&
      offsetMinute <= 59 &&
      (offsetHour < 14 || offsetMinute === 0));

  if (
    !date ||
    !isValidDateOnly(date) ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    !validOffset ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new DomainValidationError(
      `${field} must include an ISO date, time, and timezone.`,
    );
  }

  return value;
}

function requireTimeZone(value: string, field: string): string {
  const normalized = value.trim();

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: normalized }).format(0);
  } catch {
    throw new DomainValidationError(`${field} must be a valid IANA timezone.`);
  }

  return normalized;
}

function dateInTimeZone(value: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isValidDateOnly(value: string): boolean {
  if (!dateOnlyPattern.test(value)) {
    return false;
  }

  const parsed = Date.parse(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(parsed) &&
    new Date(parsed).toISOString().slice(0, 10) === value
  );
}
