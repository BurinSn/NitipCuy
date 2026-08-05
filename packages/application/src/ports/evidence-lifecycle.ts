export type EvidenceClassification =
  "PURCHASE" | "COLLECTION" | "WEIGHT" | "DISPATCH" | "DELIVERY";

export type EvidenceMediaType = "image/jpeg" | "image/png" | "image/webp";

export interface CreateEvidenceUploadIntentCommand {
  readonly idempotencyKey: string;
  readonly evidenceId: string;
  readonly ownerAccountId: string;
  readonly classification: EvidenceClassification;
}

export interface EvidenceUploadIntent {
  readonly evidenceId: string;
  readonly uploadReference: string;
  readonly quarantineObjectReference: string;
  readonly allowedMediaTypes: readonly EvidenceMediaType[];
  readonly maximumByteLength: number;
  readonly expiresAt: string;
}

export interface InspectEvidenceQuery {
  readonly evidenceId: string;
  readonly ownerAccountId: string;
  readonly quarantineObjectReference: string;
}

export type EvidenceLifecycleStatus =
  | "AWAITING_UPLOAD"
  | "VERIFICATION_PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "ACCEPTED"
  | "DELETED";

export type EvidenceScanStatus =
  "NOT_STARTED" | "PENDING" | "CLEAN" | "REJECTED" | "UNAVAILABLE";

export type EvidenceVerificationReason =
  | "UPLOAD_EXPIRED"
  | "EMPTY_FILE"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "SCAN_PENDING"
  | "SCAN_UNAVAILABLE"
  | "SCAN_REJECTED"
  | "SCAN_DIGEST_MISMATCH";

export interface AcceptedEvidence {
  readonly evidenceId: string;
  readonly ownerAccountId: string;
  readonly classification: EvidenceClassification;
  readonly objectReference: string;
  readonly sha256: string;
  readonly byteLength: number;
  readonly mediaType: EvidenceMediaType;
  readonly scanReference: string;
  readonly acceptedAt: string;
  readonly retentionExpiresAt: string;
}

export interface EvidenceObservation {
  readonly evidenceId: string;
  readonly ownerAccountId: string;
  readonly classification: EvidenceClassification;
  readonly quarantineObjectReference: string;
  readonly status: EvidenceLifecycleStatus;
  readonly scanStatus: EvidenceScanStatus;
  readonly reasonCode: EvidenceVerificationReason | null;
  readonly observedSha256: string | null;
  readonly observedByteLength: number | null;
  readonly detectedMediaType: EvidenceMediaType | null;
  readonly scanReference: string | null;
  readonly acceptedEvidence: AcceptedEvidence | null;
  readonly deletedAt: string | null;
}

export interface AcceptEvidenceCommand {
  readonly idempotencyKey: string;
  readonly evidenceId: string;
  readonly ownerAccountId: string;
  readonly quarantineObjectReference: string;
}

export interface DeleteExpiredEvidenceCommand {
  readonly idempotencyKey: string;
  readonly evidenceId: string;
  readonly ownerAccountId: string;
  readonly objectReference: string;
}

export interface DeletedEvidence {
  readonly evidenceId: string;
  readonly deletedAt: string;
}

export interface EvidenceLifecyclePort {
  createUploadIntent(
    command: CreateEvidenceUploadIntentCommand,
  ): Promise<EvidenceUploadIntent>;
  inspect(query: InspectEvidenceQuery): Promise<EvidenceObservation>;
  accept(command: AcceptEvidenceCommand): Promise<AcceptedEvidence>;
  deleteExpired(
    command: DeleteExpiredEvidenceCommand,
  ): Promise<DeletedEvidence>;
}

export type EvidenceLifecycleErrorCode =
  | "EVIDENCE_VALIDATION_FAILED"
  | "EVIDENCE_NOT_FOUND"
  | "EVIDENCE_UPLOAD_EXPIRED"
  | "EVIDENCE_UPLOAD_IMMUTABLE"
  | "EVIDENCE_NOT_VERIFIED"
  | "EVIDENCE_OBJECT_MISMATCH"
  | "EVIDENCE_RETENTION_ACTIVE";

export class EvidenceLifecycleError extends Error {
  constructor(
    readonly code: EvidenceLifecycleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "EvidenceLifecycleError";
  }
}
