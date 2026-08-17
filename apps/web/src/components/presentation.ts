import type { ServiceMode } from "@nitipcuy/domain";

export function serviceModeLabel(mode: ServiceMode): string {
  return mode === "SHOP_FOR_ME" ? "Belikan barang" : "Bawakan barang";
}

export function serviceModeShortLabel(mode: ServiceMode): string {
  return mode === "SHOP_FOR_ME" ? "Belikan" : "Bawakan";
}

export function formatCapacity(value: number): string {
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value)} kg`;
}

export function formatDateTime(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone,
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTimeRange(
  start: string,
  end: string,
  timeZone: string,
): string {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone,
    year: "numeric",
  });

  return `${formatter.format(new Date(start))}–${formatter.format(
    new Date(end),
  )}`;
}

export type OrderingWindowState = "OPEN" | "SCHEDULED" | "CLOSED";

export function orderingWindowState(
  opensAt: string,
  closesAt: string,
  now = new Date(),
): OrderingWindowState {
  if (now < new Date(opensAt)) {
    return "SCHEDULED";
  }

  return now < new Date(closesAt) ? "OPEN" : "CLOSED";
}

export function orderingWindowLabel(state: OrderingWindowState): string {
  if (state === "OPEN") {
    return "Pesanan dibuka";
  }

  return state === "SCHEDULED" ? "Segera dibuka" : "Pesanan ditutup";
}
