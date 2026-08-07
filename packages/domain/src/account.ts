const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

declare const accountIdBrand: unique symbol;
declare const profileIdBrand: unique symbol;
declare const sessionIdBrand: unique symbol;

export type AccountId = string & { readonly [accountIdBrand]: "AccountId" };
export type JastipperProfileId = string & {
  readonly [profileIdBrand]: "JastipperProfileId";
};
export type SessionId = string & { readonly [sessionIdBrand]: "SessionId" };

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";
export type AssuranceLevel = "BASE" | "STRONG" | "PHISHING_RESISTANT";
export type Capability = "MODERATE_TRIPS";

export interface AuthenticatedActor {
  readonly accountId: AccountId;
  readonly sessionId: SessionId;
  readonly assurance: AssuranceLevel;
  readonly capabilities: ReadonlySet<Capability>;
}

export const googleIssuer = "https://accounts.google.com";

export function accountId(value: string): AccountId {
  return brandedUuid(value, "Account ID") as AccountId;
}

export function jastipperProfileId(value: string): JastipperProfileId {
  return brandedUuid(value, "Jastipper profile ID") as JastipperProfileId;
}

export function sessionId(value: string): SessionId {
  return brandedUuid(value, "Session ID") as SessionId;
}

export function hasCapability(
  actor: AuthenticatedActor,
  capability: Capability,
): boolean {
  return actor.capabilities.has(capability);
}

function brandedUuid(value: string, field: string): string {
  const normalized = value.trim().toLowerCase();

  if (!uuidPattern.test(normalized)) {
    throw new Error(`${field} must be a UUID.`);
  }

  return normalized;
}
