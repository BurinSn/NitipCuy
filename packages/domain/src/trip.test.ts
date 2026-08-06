import { describe, expect, it } from "vitest";

import {
  DomainValidationError,
  createPublishedTrip,
  tripId,
  type PublishedTrip,
  type ServiceMode,
} from "./index";

function validTrip(overrides: Partial<PublishedTrip> = {}): PublishedTrip {
  return {
    id: tripId("trip-jakarta-001"),
    jastipperDisplayName: "Rani",
    originLabel: "Guangzhou",
    originTimeZone: "Asia/Shanghai",
    destinationLabel: "Jakarta",
    destinationTimeZone: "Asia/Jakarta",
    serviceWindowStartAt: "2026-08-10T09:00:00+08:00",
    serviceWindowEndAt: "2026-08-19T18:00:00+08:00",
    departureDate: "2026-08-20",
    departureAt: "2026-08-20T10:00:00+08:00",
    requestOpenAt: "2026-08-01T09:00:00+07:00",
    requestDeadline: "2026-08-18T18:00:00+08:00",
    estimatedArrivalAt: "2026-08-21T16:00:00+07:00",
    serviceModes: ["SHOP_FOR_ME", "CARRY_MY_ITEM"],
    remainingCapacityKg: 12,
    sellerLocationLabel: "Jakarta Selatan",
    deliverySummary: "Pickup or domestic courier after arrival",
    rateSummary: "Seller-defined rate shown before commitment",
    rating: { average: 4.9, count: 23 },
    publicQuestions: [],
    ...overrides,
  };
}

describe("createPublishedTrip", () => {
  it("keeps public questions in chronological order", () => {
    const trip = createPublishedTrip(
      validTrip({
        publicQuestions: [
          {
            id: "question-2",
            authorDisplayName: "Dina",
            message: "Can you visit a specific store?",
            createdAt: "2026-08-11T11:00:00+07:00",
          },
          {
            id: "question-1",
            authorDisplayName: "Bayu",
            message: "Is cosmetic packaging accepted?",
            createdAt: "2026-08-10T09:00:00+07:00",
          },
        ],
      }),
    );

    expect(trip.publicQuestions.map(({ id }) => id)).toEqual([
      "question-1",
      "question-2",
    ]);
  });

  it("sorts public questions by instant across timezone offsets", () => {
    const trip = createPublishedTrip(
      validTrip({
        publicQuestions: [
          {
            id: "question-later",
            authorDisplayName: "Dina",
            message: "This question happened later.",
            createdAt: "2026-08-10T09:00:00+07:00",
          },
          {
            id: "question-earlier",
            authorDisplayName: "Bayu",
            message: "This question happened earlier.",
            createdAt: "2026-08-10T09:30:00+08:00",
          },
        ],
      }),
    );

    expect(trip.publicQuestions.map(({ id }) => id)).toEqual([
      "question-earlier",
      "question-later",
    ]);
  });

  it("rejects a request deadline on or after departure", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          requestDeadline: "2026-08-20T02:00:00Z",
        }),
      ),
    ).toThrow(DomainValidationError);
  });

  it("allows advance ordering before the service window begins", () => {
    const trip = createPublishedTrip(
      validTrip({
        requestOpenAt: "2026-07-20T09:00:00+07:00",
      }),
    );

    expect(trip.requestOpenAt).toBe("2026-07-20T09:00:00+07:00");
  });

  it("rejects an inverted source-service window", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          serviceWindowStartAt: "2026-08-19T18:00:00+08:00",
        }),
      ),
    ).toThrow("Service-window start must be before its end.");
  });

  it("rejects an inverted ordering window", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          requestOpenAt: "2026-08-18T18:00:00+08:00",
        }),
      ),
    ).toThrow("Request opening must be before the request deadline.");
  });

  it("rejects requests closing after source availability ends", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          requestDeadline: "2026-08-19T19:00:00+08:00",
        }),
      ),
    ).toThrow("Request deadline cannot be after the service window ends.");
  });

  it("rejects a service window ending after departure", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          serviceWindowEndAt: "2026-08-20T11:00:00+08:00",
        }),
      ),
    ).toThrow("Service window cannot end after departure.");
  });

  it("rejects invalid IANA timezones", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          originTimeZone: "Asia/Not-A-Place",
        }),
      ),
    ).toThrow("Origin timezone must be a valid IANA timezone.");
  });

  it("rejects a local departure date that disagrees with its timestamp", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          departureDate: "2026-08-21",
        }),
      ),
    ).toThrow(
      "Departure date must match the local date in the departure timestamp.",
    );
  });

  it("compares question and answer timestamps as instants across offsets", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          publicQuestions: [
            {
              id: "question-timezone",
              authorDisplayName: "Dina",
              message: "Can you bring this?",
              createdAt: "2026-08-10T09:00:00+07:00",
              answer: {
                authorDisplayName: "Rani",
                message: "I will check it.",
                createdAt: "2026-08-10T09:30:00+08:00",
              },
            },
          ],
        }),
      ),
    ).toThrow("A public answer cannot predate its question.");
  });

  it("rejects identical origins and destinations", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          originLabel: "Jakarta",
          destinationLabel: " jakarta ",
        }),
      ),
    ).toThrow("Trip origin and destination must be different.");
  });

  it("rejects unsupported service modes at runtime", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          serviceModes: ["UNSUPPORTED" as ServiceMode],
        }),
      ),
    ).toThrow("A published trip contains an unsupported service mode.");
  });

  it("rejects impossible calendar dates", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          departureDate: "2026-02-30",
          departureAt: "2026-02-30T10:00:00+08:00",
          requestDeadline: "2026-02-28T18:00:00+08:00",
          estimatedArrivalAt: "2026-03-03T16:00:00+07:00",
        }),
      ),
    ).toThrow("Departure date must be an ISO date.");
  });

  it("rejects impossible times and timezone offsets", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          departureDate: "2026-03-02",
          departureAt: "2026-02-30T10:00:00+08:00",
        }),
      ),
    ).toThrow(
      "Departure timestamp must include an ISO date, time, and timezone.",
    );

    expect(() =>
      createPublishedTrip(
        validTrip({
          departureAt: "2026-08-20T24:00:00+08:00",
        }),
      ),
    ).toThrow(
      "Departure timestamp must include an ISO date, time, and timezone.",
    );

    expect(() =>
      createPublishedTrip(
        validTrip({
          departureAt: "2026-08-20T10:00:00+14:30",
        }),
      ),
    ).toThrow(
      "Departure timestamp must include an ISO date, time, and timezone.",
    );
  });

  it("rejects duplicate public question IDs within a trip", () => {
    expect(() =>
      createPublishedTrip(
        validTrip({
          publicQuestions: [
            {
              id: "question-duplicate",
              authorDisplayName: "Dina",
              message: "First question.",
              createdAt: "2026-08-10T09:00:00+07:00",
            },
            {
              id: "question-duplicate",
              authorDisplayName: "Bayu",
              message: "Second question.",
              createdAt: "2026-08-10T10:00:00+07:00",
            },
          ],
        }),
      ),
    ).toThrow("Public question IDs must be unique within a trip.");
  });
});
