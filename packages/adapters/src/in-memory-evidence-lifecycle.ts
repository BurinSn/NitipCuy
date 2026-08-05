import { createHash } from "node:crypto";

import {
  EvidenceLifecycleError,
  executeIdempotently,
} from "@nitipcuy/application";
import type {
  AcceptEvidenceCommand,
  AcceptedEvidence,
  CreateEvidenceUploadIntentCommand,
  DeleteExpiredEvidenceCommand,
  DeletedEvidence,
  EvidenceClassification,
  EvidenceLifecyclePort,
  EvidenceMediaType,
  EvidenceObservation,
  EvidenceScanStatus,
  EvidenceUploadIntent,
  IdempotencyStorePort,
  InspectEvidenceQuery,
} from "@nitipcuy/application";

import {
  commandFingerprint,
  InMemoryIdempotencyStore,
} from "./idempotency-support";

const EVIDENCE_IDEMPOTENCY_RETENTION_SECONDS = 30 * 24 * 60 * 60;
const evidenceClassifications = new Set<EvidenceClassification>([
  "PURCHASE",
  "COLLECTION",
  "WEIGHT",
  "DISPATCH",
  "DELIVERY",
]);
const evidenceMediaTypes = new Set<EvidenceMediaType>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const evidenceScanStatuses = new Set<EvidenceScanFixture["status"]>([
  "CLEAN",
  "REJECTED",
  "UNAVAILABLE",
]);

export interface InMemoryEvidencePolicy {
  readonly allowedMediaTypes: readonly EvidenceMediaType[];
  readonly maximumByteLength: number;
  readonly uploadIntentTtlSeconds: number;
  readonly acceptedRetentionSeconds: number;
}

export interface InMemoryEvidenceLifecycleOptions {
  readonly policy: InMemoryEvidencePolicy;
  readonly nowMilliseconds?: () => number;
  readonly idempotencyStore?: IdempotencyStorePort;
}

export interface QuarantineUploadFixture {
  readonly uploadReference: string;
  readonly content: Uint8Array;
  readonly claimedMediaType?: string;
  readonly claimedSha256?: string;
}

export interface EvidenceScanFixture {
  readonly quarantineObjectReference: string;
  readonly status: Exclude<EvidenceScanStatus, "NOT_STARTED" | "PENDING">;
  readonly scanReference: string;
  readonly scannedSha256: string | null;
}

interface QuarantineUpload {
  readonly content: Uint8Array;
}

interface ScanRecord {
  readonly status: "CLEAN" | "REJECTED" | "UNAVAILABLE";
  readonly scanReference: string;
  readonly scannedSha256: string | null;
}

interface EvidenceRecord {
  readonly evidenceId: string;
  readonly ownerAccountId: string;
  readonly classification: EvidenceClassification;
  readonly intent: EvidenceUploadIntent;
  upload: QuarantineUpload | null;
  scan: ScanRecord | null;
  accepted: AcceptedEvidence | null;
  deletedAt: string | null;
  deletedObjectReference: string | null;
}

/**
 * Test-only evidence lifecycle.
 *
 * Fixture upload and scan methods simulate external private object storage and
 * scanning. Raw bytes and client claims never cross the application port.
 * Production composition must replace this process-local adapter with private
 * quarantine storage, a reviewed scanner, durable metadata, authorization,
 * and verified retention/deletion behavior.
 */
export class InMemoryEvidenceLifecycle implements EvidenceLifecyclePort {
  private readonly records = new Map<string, EvidenceRecord>();
  private readonly uploadReferences = new Map<string, string>();
  private readonly quarantineReferences = new Map<string, string>();
  private readonly acceptedObjects = new Map<string, Uint8Array>();
  private readonly nowMilliseconds: () => number;
  private readonly idempotencyStore: IdempotencyStorePort;
  private referenceSequence = 0;

  constructor(private readonly options: InMemoryEvidenceLifecycleOptions) {
    validatePolicy(options.policy);
    this.nowMilliseconds = options.nowMilliseconds ?? Date.now;
    this.idempotencyStore =
      options.idempotencyStore ??
      new InMemoryIdempotencyStore(this.nowMilliseconds);
  }

  async createUploadIntent(
    command: CreateEvidenceUploadIntentCommand,
  ): Promise<EvidenceUploadIntent> {
    validateIdentity(command.evidenceId, "Evidence ID");
    validateIdentity(command.ownerAccountId, "Evidence owner account ID");

    if (!evidenceClassifications.has(command.classification)) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_VALIDATION_FAILED",
        "Evidence classification is unsupported.",
      );
    }

    const recordKey = toRecordKey(command.ownerAccountId, command.evidenceId);
    const existing = this.records.get(recordKey);

    if (existing && existing.classification !== command.classification) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_VALIDATION_FAILED",
        "Evidence classification cannot change after an upload intent exists.",
      );
    }

    return executeIdempotently(
      this.idempotencyStore,
      {
        scope: `account:${command.ownerAccountId}`,
        operation: "evidence.upload-intent.create",
        key: command.idempotencyKey,
        fingerprint: commandFingerprint({
          evidenceId: command.evidenceId,
          ownerAccountId: command.ownerAccountId,
          classification: command.classification,
        }),
        retentionSeconds: EVIDENCE_IDEMPOTENCY_RETENTION_SECONDS,
      },
      () => {
        const current = this.records.get(recordKey);

        if (current) {
          return Promise.resolve(cloneIntent(current.intent));
        }

        this.referenceSequence += 1;
        const referenceSuffix = this.referenceSequence
          .toString()
          .padStart(4, "0");
        const uploadReference = `mock-upload-${referenceSuffix}`;
        const quarantineObjectReference = `mock-quarantine-${referenceSuffix}`;
        const intent = Object.freeze({
          evidenceId: command.evidenceId,
          uploadReference,
          quarantineObjectReference,
          allowedMediaTypes: Object.freeze([
            ...this.options.policy.allowedMediaTypes,
          ]),
          maximumByteLength: this.options.policy.maximumByteLength,
          expiresAt: toIsoInstant(
            addSeconds(
              this.nowMilliseconds(),
              this.options.policy.uploadIntentTtlSeconds,
            ),
          ),
        });

        this.records.set(recordKey, {
          evidenceId: command.evidenceId,
          ownerAccountId: command.ownerAccountId,
          classification: command.classification,
          intent,
          upload: null,
          scan: null,
          accepted: null,
          deletedAt: null,
          deletedObjectReference: null,
        });
        this.uploadReferences.set(uploadReference, recordKey);
        this.quarantineReferences.set(quarantineObjectReference, recordKey);

        return Promise.resolve(cloneIntent(intent));
      },
    );
  }

  uploadToQuarantine(fixture: QuarantineUploadFixture): void {
    const record = this.recordByUploadReference(fixture.uploadReference);

    if (record.upload || record.accepted || record.deletedAt) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_UPLOAD_IMMUTABLE",
        "A quarantine upload cannot be replaced or reused after it is written.",
      );
    }

    if (this.nowMilliseconds() >= Date.parse(record.intent.expiresAt)) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_UPLOAD_EXPIRED",
        "Evidence upload intent has expired.",
      );
    }

    record.upload = {
      content: new Uint8Array(fixture.content),
    };
  }

  recordScanResult(fixture: EvidenceScanFixture): void {
    const record = this.recordByQuarantineReference(
      fixture.quarantineObjectReference,
    );

    if (!record.upload) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_NOT_FOUND",
        "Evidence cannot be scanned before a quarantine object exists.",
      );
    }

    if (!evidenceScanStatuses.has(fixture.status)) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_VALIDATION_FAILED",
        "Evidence scan status is unsupported.",
      );
    }

    if (fixture.status !== "UNAVAILABLE" && !isSha256(fixture.scannedSha256)) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_VALIDATION_FAILED",
        "A completed evidence scan must identify the scanned SHA-256 bytes.",
      );
    }

    if (fixture.status === "UNAVAILABLE" && fixture.scannedSha256 !== null) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_VALIDATION_FAILED",
        "An unavailable evidence scan cannot claim a scanned digest.",
      );
    }

    validateIdentity(fixture.scanReference, "Evidence scan reference");
    record.scan = Object.freeze({
      status: fixture.status,
      scanReference: fixture.scanReference,
      scannedSha256: fixture.scannedSha256,
    });
  }

  async inspect(query: InspectEvidenceQuery): Promise<EvidenceObservation> {
    return this.inspectRecord(query);
  }

  async accept(command: AcceptEvidenceCommand): Promise<AcceptedEvidence> {
    const initial = this.inspectRecord(command);

    if (initial.status !== "VERIFIED" && initial.status !== "ACCEPTED") {
      throw new EvidenceLifecycleError(
        "EVIDENCE_NOT_VERIFIED",
        "Evidence must have matching server observations and a clean scan before acceptance.",
      );
    }

    return executeIdempotently(
      this.idempotencyStore,
      {
        scope: `account:${command.ownerAccountId}`,
        operation: "evidence.accept",
        key: command.idempotencyKey,
        fingerprint: commandFingerprint({
          evidenceId: command.evidenceId,
          ownerAccountId: command.ownerAccountId,
          quarantineObjectReference: command.quarantineObjectReference,
        }),
        retentionSeconds: EVIDENCE_IDEMPOTENCY_RETENTION_SECONDS,
      },
      () => {
        const record = this.recordForQuery(command);

        if (record.accepted) {
          return Promise.resolve(cloneAcceptedEvidence(record.accepted));
        }

        const observation = this.inspectRecord(command);

        if (
          observation.status !== "VERIFIED" ||
          !record.upload ||
          !observation.observedSha256 ||
          !observation.observedByteLength ||
          !observation.detectedMediaType ||
          !observation.scanReference
        ) {
          return Promise.reject(
            new EvidenceLifecycleError(
              "EVIDENCE_NOT_VERIFIED",
              "Evidence verification changed before acceptance.",
            ),
          );
        }

        this.referenceSequence += 1;
        const objectReference = `mock-private-evidence-${this.referenceSequence
          .toString()
          .padStart(4, "0")}`;
        const acceptedAtMilliseconds = this.nowMilliseconds();
        const accepted = Object.freeze({
          evidenceId: record.evidenceId,
          ownerAccountId: record.ownerAccountId,
          classification: record.classification,
          objectReference,
          sha256: observation.observedSha256,
          byteLength: observation.observedByteLength,
          mediaType: observation.detectedMediaType,
          scanReference: observation.scanReference,
          acceptedAt: toIsoInstant(acceptedAtMilliseconds),
          retentionExpiresAt: toIsoInstant(
            addSeconds(
              acceptedAtMilliseconds,
              this.options.policy.acceptedRetentionSeconds,
            ),
          ),
        });

        this.acceptedObjects.set(
          objectReference,
          new Uint8Array(record.upload.content),
        );
        record.accepted = accepted;
        record.upload = null;

        return Promise.resolve(cloneAcceptedEvidence(accepted));
      },
    );
  }

  async deleteExpired(
    command: DeleteExpiredEvidenceCommand,
  ): Promise<DeletedEvidence> {
    const record = this.recordForOwner(
      command.ownerAccountId,
      command.evidenceId,
    );

    if (record.deletedAt) {
      if (record.deletedObjectReference !== command.objectReference) {
        throw new EvidenceLifecycleError(
          "EVIDENCE_OBJECT_MISMATCH",
          "Evidence deletion reference does not match the accepted object.",
        );
      }
    } else if (!record.accepted) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_NOT_VERIFIED",
        "Only accepted evidence can enter retention deletion.",
      );
    } else {
      if (record.accepted.objectReference !== command.objectReference) {
        throw new EvidenceLifecycleError(
          "EVIDENCE_OBJECT_MISMATCH",
          "Evidence deletion reference does not match the accepted object.",
        );
      }

      if (
        this.nowMilliseconds() < Date.parse(record.accepted.retentionExpiresAt)
      ) {
        throw new EvidenceLifecycleError(
          "EVIDENCE_RETENTION_ACTIVE",
          "Evidence retention has not expired.",
        );
      }
    }

    return executeIdempotently(
      this.idempotencyStore,
      {
        scope: `account:${command.ownerAccountId}`,
        operation: "evidence.delete-expired",
        key: command.idempotencyKey,
        fingerprint: commandFingerprint({
          evidenceId: command.evidenceId,
          ownerAccountId: command.ownerAccountId,
          objectReference: command.objectReference,
        }),
        retentionSeconds: EVIDENCE_IDEMPOTENCY_RETENTION_SECONDS,
      },
      () => {
        if (record.deletedAt) {
          return Promise.resolve({
            evidenceId: record.evidenceId,
            deletedAt: record.deletedAt,
          });
        }

        const deletedAt = toIsoInstant(this.nowMilliseconds());
        this.acceptedObjects.delete(command.objectReference);
        record.deletedObjectReference = command.objectReference;
        record.deletedAt = deletedAt;

        return Promise.resolve({ evidenceId: record.evidenceId, deletedAt });
      },
    );
  }

  hasPrivateObject(objectReference: string): boolean {
    return this.acceptedObjects.has(objectReference);
  }

  private inspectRecord(query: InspectEvidenceQuery): EvidenceObservation {
    const record = this.recordForQuery(query);

    if (record.deletedAt) {
      return observation(record, {
        status: "DELETED",
        scanStatus: "NOT_STARTED",
        reasonCode: null,
        deletedAt: record.deletedAt,
      });
    }

    if (record.accepted) {
      return observation(record, {
        status: "ACCEPTED",
        scanStatus: "CLEAN",
        reasonCode: null,
        scanReference: record.accepted.scanReference,
        acceptedEvidence: cloneAcceptedEvidence(record.accepted),
      });
    }

    if (!record.upload) {
      if (this.nowMilliseconds() >= Date.parse(record.intent.expiresAt)) {
        return observation(record, {
          status: "REJECTED",
          scanStatus: "NOT_STARTED",
          reasonCode: "UPLOAD_EXPIRED",
        });
      }

      return observation(record, {
        status: "AWAITING_UPLOAD",
        scanStatus: "NOT_STARTED",
        reasonCode: null,
      });
    }

    const observedByteLength = record.upload.content.byteLength;
    const observedSha256 = digest(record.upload.content);
    const detectedMediaType = detectMediaType(record.upload.content);
    const metadata = {
      observedByteLength,
      observedSha256,
      detectedMediaType,
    };

    if (observedByteLength === 0) {
      return observation(record, {
        ...metadata,
        status: "REJECTED",
        scanStatus: "NOT_STARTED",
        reasonCode: "EMPTY_FILE",
      });
    }

    if (observedByteLength > this.options.policy.maximumByteLength) {
      return observation(record, {
        ...metadata,
        status: "REJECTED",
        scanStatus: "NOT_STARTED",
        reasonCode: "FILE_TOO_LARGE",
      });
    }

    if (
      !detectedMediaType ||
      !this.options.policy.allowedMediaTypes.includes(detectedMediaType)
    ) {
      return observation(record, {
        ...metadata,
        status: "REJECTED",
        scanStatus: "NOT_STARTED",
        reasonCode: "UNSUPPORTED_MEDIA_TYPE",
      });
    }

    if (!record.scan) {
      return observation(record, {
        ...metadata,
        status: "VERIFICATION_PENDING",
        scanStatus: "PENDING",
        reasonCode: "SCAN_PENDING",
      });
    }

    if (record.scan.status === "UNAVAILABLE") {
      return observation(record, {
        ...metadata,
        status: "VERIFICATION_PENDING",
        scanStatus: "UNAVAILABLE",
        reasonCode: "SCAN_UNAVAILABLE",
        scanReference: record.scan.scanReference,
      });
    }

    if (record.scan.scannedSha256 !== observedSha256) {
      return observation(record, {
        ...metadata,
        status: "REJECTED",
        scanStatus: record.scan.status,
        reasonCode: "SCAN_DIGEST_MISMATCH",
        scanReference: record.scan.scanReference,
      });
    }

    if (record.scan.status === "REJECTED") {
      return observation(record, {
        ...metadata,
        status: "REJECTED",
        scanStatus: "REJECTED",
        reasonCode: "SCAN_REJECTED",
        scanReference: record.scan.scanReference,
      });
    }

    return observation(record, {
      ...metadata,
      status: "VERIFIED",
      scanStatus: "CLEAN",
      reasonCode: null,
      scanReference: record.scan.scanReference,
    });
  }

  private recordForQuery(query: InspectEvidenceQuery): EvidenceRecord {
    validateIdentity(query.evidenceId, "Evidence ID");
    validateIdentity(query.ownerAccountId, "Evidence owner account ID");
    const record = this.recordForOwner(query.ownerAccountId, query.evidenceId);

    if (
      record.intent.quarantineObjectReference !==
      query.quarantineObjectReference
    ) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_OBJECT_MISMATCH",
        "Evidence quarantine reference does not match the upload intent.",
      );
    }

    return record;
  }

  private recordForOwner(
    ownerAccountId: string,
    evidenceId: string,
  ): EvidenceRecord {
    validateIdentity(evidenceId, "Evidence ID");
    validateIdentity(ownerAccountId, "Evidence owner account ID");
    const record = this.records.get(toRecordKey(ownerAccountId, evidenceId));

    if (!record) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_NOT_FOUND",
        "Evidence lifecycle record was not found.",
      );
    }

    return record;
  }

  private recordByUploadReference(uploadReference: string): EvidenceRecord {
    const recordKey = this.uploadReferences.get(uploadReference);
    const record = recordKey ? this.records.get(recordKey) : undefined;

    if (!record) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_NOT_FOUND",
        "Evidence upload reference was not found.",
      );
    }

    return record;
  }

  private recordByQuarantineReference(
    quarantineObjectReference: string,
  ): EvidenceRecord {
    const recordKey = this.quarantineReferences.get(quarantineObjectReference);
    const record = recordKey ? this.records.get(recordKey) : undefined;

    if (!record) {
      throw new EvidenceLifecycleError(
        "EVIDENCE_NOT_FOUND",
        "Evidence quarantine reference was not found.",
      );
    }

    return record;
  }
}

interface ObservationValues {
  readonly status: EvidenceObservation["status"];
  readonly scanStatus: EvidenceObservation["scanStatus"];
  readonly reasonCode: EvidenceObservation["reasonCode"];
  readonly observedSha256?: string;
  readonly observedByteLength?: number;
  readonly detectedMediaType?: EvidenceMediaType | null;
  readonly scanReference?: string;
  readonly acceptedEvidence?: AcceptedEvidence;
  readonly deletedAt?: string;
}

function observation(
  record: EvidenceRecord,
  values: ObservationValues,
): EvidenceObservation {
  return Object.freeze({
    evidenceId: record.evidenceId,
    ownerAccountId: record.ownerAccountId,
    classification: record.classification,
    quarantineObjectReference: record.intent.quarantineObjectReference,
    status: values.status,
    scanStatus: values.scanStatus,
    reasonCode: values.reasonCode,
    observedSha256: values.observedSha256 ?? null,
    observedByteLength: values.observedByteLength ?? null,
    detectedMediaType: values.detectedMediaType ?? null,
    scanReference: values.scanReference ?? null,
    acceptedEvidence: values.acceptedEvidence
      ? cloneAcceptedEvidence(values.acceptedEvidence)
      : null,
    deletedAt: values.deletedAt ?? null,
  });
}

function validatePolicy(policy: InMemoryEvidencePolicy): void {
  if (
    !Number.isSafeInteger(policy.maximumByteLength) ||
    policy.maximumByteLength < 1 ||
    policy.maximumByteLength > 100 * 1024 * 1024
  ) {
    throw new EvidenceLifecycleError(
      "EVIDENCE_VALIDATION_FAILED",
      "Evidence maximum byte length must be between 1 byte and 100 MiB.",
    );
  }

  if (
    !Number.isSafeInteger(policy.uploadIntentTtlSeconds) ||
    policy.uploadIntentTtlSeconds < 60 ||
    policy.uploadIntentTtlSeconds > 86_400
  ) {
    throw new EvidenceLifecycleError(
      "EVIDENCE_VALIDATION_FAILED",
      "Evidence upload intent lifetime must be between 60 seconds and one day.",
    );
  }

  if (
    !Number.isSafeInteger(policy.acceptedRetentionSeconds) ||
    policy.acceptedRetentionSeconds < 60 ||
    policy.acceptedRetentionSeconds > 31_536_000
  ) {
    throw new EvidenceLifecycleError(
      "EVIDENCE_VALIDATION_FAILED",
      "Evidence retention must be between 60 seconds and 365 days.",
    );
  }

  if (
    policy.allowedMediaTypes.length === 0 ||
    new Set(policy.allowedMediaTypes).size !==
      policy.allowedMediaTypes.length ||
    policy.allowedMediaTypes.some(
      (mediaType) => !evidenceMediaTypes.has(mediaType),
    )
  ) {
    throw new EvidenceLifecycleError(
      "EVIDENCE_VALIDATION_FAILED",
      "Evidence policy requires supported unique media types.",
    );
  }
}

function validateIdentity(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(value)) {
    throw new EvidenceLifecycleError(
      "EVIDENCE_VALIDATION_FAILED",
      `${label} must contain 3-128 safe visible characters.`,
    );
  }
}

function toRecordKey(ownerAccountId: string, evidenceId: string): string {
  return `${ownerAccountId}\u0000${evidenceId}`;
}

function addSeconds(nowMilliseconds: number, seconds: number): number {
  const result = nowMilliseconds + seconds * 1_000;

  if (!Number.isSafeInteger(result)) {
    throw new EvidenceLifecycleError(
      "EVIDENCE_VALIDATION_FAILED",
      "Evidence timestamp exceeds the supported clock range.",
    );
  }

  return result;
}

function toIsoInstant(milliseconds: number): string {
  const value = new Date(milliseconds);

  if (Number.isNaN(value.getTime())) {
    throw new EvidenceLifecycleError(
      "EVIDENCE_VALIDATION_FAILED",
      "Evidence clock produced an invalid timestamp.",
    );
  }

  return value.toISOString();
}

function digest(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function isSha256(value: string | null): value is string {
  return value !== null && /^[a-f0-9]{64}$/.test(value);
}

function detectMediaType(content: Uint8Array): EvidenceMediaType | null {
  if (
    content.length >= 3 &&
    content[0] === 0xff &&
    content[1] === 0xd8 &&
    content[2] === 0xff
  ) {
    return "image/jpeg";
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  if (
    content.length >= pngSignature.length &&
    pngSignature.every((byte, index) => content[index] === byte)
  ) {
    return "image/png";
  }

  if (
    content.length >= 12 &&
    ascii(content, 0, 4) === "RIFF" &&
    ascii(content, 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function ascii(content: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...content.slice(start, end));
}

function cloneIntent(intent: EvidenceUploadIntent): EvidenceUploadIntent {
  return {
    ...intent,
    allowedMediaTypes: [...intent.allowedMediaTypes],
  };
}

function cloneAcceptedEvidence(evidence: AcceptedEvidence): AcceptedEvidence {
  return { ...evidence };
}
