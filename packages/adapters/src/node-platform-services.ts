import { randomUUID } from "node:crypto";

import type { ClockPort, IdentifierPort } from "@nitipcuy/application";

export class SystemClock implements ClockPort {
  now(): string {
    return new Date().toISOString();
  }
}

export class UuidIdentifier implements IdentifierPort {
  next(namespace: string): string {
    if (!/^[a-z][a-z0-9-]{1,31}$/.test(namespace)) {
      throw new Error("Identifier namespace is invalid.");
    }

    return randomUUID();
  }
}
