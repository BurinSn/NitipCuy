import { describe, expect, it } from "vitest";

import {
  formatCapacity,
  formatTripCode,
  orderingWindowLabel,
  orderingWindowState,
  serviceModeLabel,
} from "./presentation";

describe("marketplace presentation", () => {
  it("keeps the two product service labels explicit", () => {
    expect(serviceModeLabel("SHOP_FOR_ME")).toBe("Belikan barang");
    expect(serviceModeLabel("CARRY_MY_ITEM")).toBe("Bawakan barang");
  });

  it("formats exact capacity without inventing availability", () => {
    expect(formatCapacity(6.5)).toBe("6,5 kg");
  });

  it("formats one shared public trip code", () => {
    expect(formatTripCode("guangzhou-jakarta-august")).toBe("NC–GUST");
  });

  it("maps ordering windows at their exact boundaries", () => {
    const opensAt = "2026-08-17T09:00:00+07:00";
    const closesAt = "2026-08-17T18:00:00+07:00";

    expect(
      orderingWindowState(opensAt, closesAt, new Date("2026-08-17T01:59Z")),
    ).toBe("SCHEDULED");
    expect(
      orderingWindowState(opensAt, closesAt, new Date("2026-08-17T02:00Z")),
    ).toBe("OPEN");
    expect(
      orderingWindowState(opensAt, closesAt, new Date("2026-08-17T11:00Z")),
    ).toBe("CLOSED");
  });

  it("uses plain Indonesian ordering labels", () => {
    expect(orderingWindowLabel("OPEN")).toBe("Pesanan dibuka");
    expect(orderingWindowLabel("SCHEDULED")).toBe("Segera dibuka");
    expect(orderingWindowLabel("CLOSED")).toBe("Pesanan ditutup");
  });
});
