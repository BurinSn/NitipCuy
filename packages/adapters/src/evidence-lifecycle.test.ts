import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { IdempotencyConflictError } from "@nitipcuy/application";

import { InMemoryEvidenceLifecycle } from "./index";

const startAt = Date.parse("2026-08-05T09:00:00+07:00");
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

function createFixture() {
  const clock = { now: startAt };
  const lifecycle = new InMemoryEvidenceLifecycle({
    policy: {
      allowedMediaTypes: ["image/jpeg", "image/png"],
      maximumByteLength: 32,
      uploadIntentTtlSeconds: 300,
      acceptedRetentionSeconds: 3_600,
    },
    nowMilliseconds: () => clock.now,
  });

  return { clock, lifecycle };
}

function sha256(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

async function createIntent(
  lifecycle: InMemoryEvidenceLifecycle,
  suffix = "001",
) {
  return lifecycle.createUploadIntent({
    idempotencyKey: `intent-key-${suffix}`,
    evidenceId: `evidence-${suffix}`,
    ownerAccountId: "account-001",
    classification: "PURCHASE",
  });
}

describe("in-memory evidence lifecycle", () => {
  it("replays an exact upload intent and rejects changed idempotency payloads", async () => {
    const { lifecycle } = createFixture();
    const command = {
      idempotencyKey: "intent-key-001",
      evidenceId: "evidence-001",
      ownerAccountId: "account-001",
      classification: "PURCHASE" as const,
    };

    const first = await lifecycle.createUploadIntent(command);
    const replay = await lifecycle.createUploadIntent({ ...command });

    expect(replay).toEqual(first);
    await expect(
      lifecycle.createUploadIntent({
        ...command,
        evidenceId: "evidence-002",
      }),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
    await expect(
      lifecycle.createUploadIntent({
        ...command,
        classification: "DELIVERY",
      }),
    ).rejects.toMatchObject({
      code: "EVIDENCE_VALIDATION_FAILED",
    });
    await expect(
      lifecycle.createUploadIntent({
        ...command,
        idempotencyKey: "intent-key-unsupported-classification",
        evidenceId: "evidence-unsupported-classification",
        classification: "UNSUPPORTED" as never,
      }),
    ).rejects.toMatchObject({ code: "EVIDENCE_VALIDATION_FAILED" });
  });

  it("uses observed bytes instead of caller MIME and digest claims", async () => {
    const { lifecycle } = createFixture();
    const intent = await createIntent(lifecycle);

    lifecycle.uploadToQuarantine({
      uploadReference: intent.uploadReference,
      content: jpeg,
      claimedMediaType: "image/png",
      claimedSha256: "0".repeat(64),
    });

    const result = await lifecycle.inspect({
      evidenceId: intent.evidenceId,
      ownerAccountId: "account-001",
      quarantineObjectReference: intent.quarantineObjectReference,
    });

    expect(result).toMatchObject({
      status: "VERIFICATION_PENDING",
      scanStatus: "PENDING",
      reasonCode: "SCAN_PENDING",
      observedSha256: sha256(jpeg),
      observedByteLength: jpeg.byteLength,
      detectedMediaType: "image/jpeg",
    });
    expect(() =>
      lifecycle.recordScanResult({
        quarantineObjectReference: intent.quarantineObjectReference,
        status: "UNKNOWN" as never,
        scanReference: "scan-invalid-status",
        scannedSha256: sha256(jpeg),
      }),
    ).toThrow(expect.objectContaining({ code: "EVIDENCE_VALIDATION_FAILED" }));
    await expect(
      lifecycle.inspect({
        evidenceId: intent.evidenceId,
        ownerAccountId: "account-001",
        quarantineObjectReference: intent.quarantineObjectReference,
      }),
    ).resolves.toMatchObject({
      status: "VERIFICATION_PENDING",
      scanStatus: "PENDING",
    });
  });

  it("clones quarantine bytes and prevents object replacement", async () => {
    const { lifecycle } = createFixture();
    const intent = await createIntent(lifecycle);
    const content = new Uint8Array(jpeg);

    lifecycle.uploadToQuarantine({
      uploadReference: intent.uploadReference,
      content,
    });
    content[3] = 0;

    const result = await lifecycle.inspect({
      evidenceId: intent.evidenceId,
      ownerAccountId: "account-001",
      quarantineObjectReference: intent.quarantineObjectReference,
    });

    expect(result.observedSha256).toBe(sha256(jpeg));
    expect(() =>
      lifecycle.uploadToQuarantine({
        uploadReference: intent.uploadReference,
        content: new Uint8Array(jpeg),
      }),
    ).toThrow(
      expect.objectContaining({
        code: "EVIDENCE_UPLOAD_IMMUTABLE",
      }),
    );
  });

  it.each([
    {
      label: "empty",
      content: new Uint8Array(),
      reasonCode: "EMPTY_FILE",
    },
    {
      label: "oversized",
      content: new Uint8Array([0xff, 0xd8, 0xff, ...new Array(30).fill(1)]),
      reasonCode: "FILE_TOO_LARGE",
    },
    {
      label: "unsupported",
      content: new Uint8Array([1, 2, 3, 4]),
      reasonCode: "UNSUPPORTED_MEDIA_TYPE",
    },
  ])(
    "rejects $label quarantine content from server observations",
    async ({ content, reasonCode }) => {
      const { lifecycle } = createFixture();
      const intent = await createIntent(lifecycle);

      lifecycle.uploadToQuarantine({
        uploadReference: intent.uploadReference,
        content,
      });

      await expect(
        lifecycle.inspect({
          evidenceId: intent.evidenceId,
          ownerAccountId: "account-001",
          quarantineObjectReference: intent.quarantineObjectReference,
        }),
      ).resolves.toMatchObject({ status: "REJECTED", reasonCode });
    },
  );

  it("fails closed through scanner outage and permits acceptance only after a clean retry", async () => {
    const { lifecycle } = createFixture();
    const intent = await createIntent(lifecycle);
    lifecycle.uploadToQuarantine({
      uploadReference: intent.uploadReference,
      content: jpeg,
    });
    lifecycle.recordScanResult({
      quarantineObjectReference: intent.quarantineObjectReference,
      status: "UNAVAILABLE",
      scanReference: "scan-unavailable-001",
      scannedSha256: null,
    });

    const command = {
      idempotencyKey: "accept-key-001",
      evidenceId: intent.evidenceId,
      ownerAccountId: "account-001",
      quarantineObjectReference: intent.quarantineObjectReference,
    };

    await expect(lifecycle.inspect(command)).resolves.toMatchObject({
      status: "VERIFICATION_PENDING",
      scanStatus: "UNAVAILABLE",
      reasonCode: "SCAN_UNAVAILABLE",
    });
    await expect(lifecycle.accept(command)).rejects.toMatchObject({
      code: "EVIDENCE_NOT_VERIFIED",
    });

    lifecycle.recordScanResult({
      quarantineObjectReference: intent.quarantineObjectReference,
      status: "CLEAN",
      scanReference: "scan-clean-001",
      scannedSha256: sha256(jpeg),
    });

    await expect(lifecycle.accept(command)).resolves.toMatchObject({
      evidenceId: intent.evidenceId,
      sha256: sha256(jpeg),
      mediaType: "image/jpeg",
    });
  });

  it("rejects a scan digest that does not match the observed object", async () => {
    const { lifecycle } = createFixture();
    const intent = await createIntent(lifecycle);
    lifecycle.uploadToQuarantine({
      uploadReference: intent.uploadReference,
      content: jpeg,
    });
    lifecycle.recordScanResult({
      quarantineObjectReference: intent.quarantineObjectReference,
      status: "CLEAN",
      scanReference: "scan-clean-wrong-object",
      scannedSha256: "0".repeat(64),
    });

    await expect(
      lifecycle.inspect({
        evidenceId: intent.evidenceId,
        ownerAccountId: "account-001",
        quarantineObjectReference: intent.quarantineObjectReference,
      }),
    ).resolves.toMatchObject({
      status: "REJECTED",
      reasonCode: "SCAN_DIGEST_MISMATCH",
    });
  });

  it("rejects content that the scanner marks unsafe", async () => {
    const { lifecycle } = createFixture();
    const intent = await createIntent(lifecycle);
    lifecycle.uploadToQuarantine({
      uploadReference: intent.uploadReference,
      content: jpeg,
    });
    lifecycle.recordScanResult({
      quarantineObjectReference: intent.quarantineObjectReference,
      status: "REJECTED",
      scanReference: "scan-rejected-001",
      scannedSha256: sha256(jpeg),
    });

    await expect(
      lifecycle.inspect({
        evidenceId: intent.evidenceId,
        ownerAccountId: "account-001",
        quarantineObjectReference: intent.quarantineObjectReference,
      }),
    ).resolves.toMatchObject({
      status: "REJECTED",
      reasonCode: "SCAN_REJECTED",
    });
  });

  it("accepts clean matching evidence into a server reference with exact replay", async () => {
    const { lifecycle } = createFixture();
    const intent = await createIntent(lifecycle);
    lifecycle.uploadToQuarantine({
      uploadReference: intent.uploadReference,
      content: jpeg,
    });
    lifecycle.recordScanResult({
      quarantineObjectReference: intent.quarantineObjectReference,
      status: "CLEAN",
      scanReference: "scan-clean-001",
      scannedSha256: sha256(jpeg),
    });
    const command = {
      idempotencyKey: "accept-key-001",
      evidenceId: intent.evidenceId,
      ownerAccountId: "account-001",
      quarantineObjectReference: intent.quarantineObjectReference,
    };

    const accepted = await lifecycle.accept(command);
    const replay = await lifecycle.accept({ ...command });

    expect(replay).toEqual(accepted);
    expect(accepted.objectReference).toMatch(/^mock-private-evidence-/);
    expect(accepted.scanReference).toBe("scan-clean-001");
    expect(lifecycle.hasPrivateObject(accepted.objectReference)).toBe(true);
    await expect(lifecycle.inspect(command)).resolves.toMatchObject({
      status: "ACCEPTED",
      scanReference: "scan-clean-001",
      acceptedEvidence: accepted,
    });
    expect(() =>
      lifecycle.uploadToQuarantine({
        uploadReference: intent.uploadReference,
        content: new Uint8Array(jpeg),
      }),
    ).toThrow(expect.objectContaining({ code: "EVIDENCE_UPLOAD_IMMUTABLE" }));
    expect(() =>
      lifecycle.recordScanResult({
        quarantineObjectReference: intent.quarantineObjectReference,
        status: "CLEAN",
        scanReference: "scan-after-acceptance",
        scannedSha256: sha256(jpeg),
      }),
    ).toThrow(expect.objectContaining({ code: "EVIDENCE_NOT_FOUND" }));
  });

  it("denies cross-owner and mismatched quarantine references", async () => {
    const { lifecycle } = createFixture();
    const intent = await createIntent(lifecycle);

    await expect(
      lifecycle.inspect({
        evidenceId: intent.evidenceId,
        ownerAccountId: "account-002",
        quarantineObjectReference: intent.quarantineObjectReference,
      }),
    ).rejects.toMatchObject({ code: "EVIDENCE_NOT_FOUND" });
    await expect(
      lifecycle.inspect({
        evidenceId: intent.evidenceId,
        ownerAccountId: "account-001",
        quarantineObjectReference: "mock-quarantine-wrong",
      }),
    ).rejects.toMatchObject({ code: "EVIDENCE_OBJECT_MISMATCH" });
  });

  it("deletes the private object only after retention and replays deletion", async () => {
    const { clock, lifecycle } = createFixture();
    const intent = await createIntent(lifecycle);
    lifecycle.uploadToQuarantine({
      uploadReference: intent.uploadReference,
      content: jpeg,
    });
    lifecycle.recordScanResult({
      quarantineObjectReference: intent.quarantineObjectReference,
      status: "CLEAN",
      scanReference: "scan-clean-001",
      scannedSha256: sha256(jpeg),
    });
    const accepted = await lifecycle.accept({
      idempotencyKey: "accept-key-001",
      evidenceId: intent.evidenceId,
      ownerAccountId: "account-001",
      quarantineObjectReference: intent.quarantineObjectReference,
    });
    const deletion = {
      idempotencyKey: "delete-key-001",
      evidenceId: intent.evidenceId,
      ownerAccountId: "account-001",
      objectReference: accepted.objectReference,
    };

    await expect(lifecycle.deleteExpired(deletion)).rejects.toMatchObject({
      code: "EVIDENCE_RETENTION_ACTIVE",
    });

    clock.now += 3_600_000;
    const deleted = await lifecycle.deleteExpired(deletion);

    expect(await lifecycle.deleteExpired({ ...deletion })).toEqual(deleted);
    expect(lifecycle.hasPrivateObject(accepted.objectReference)).toBe(false);
    await expect(
      lifecycle.inspect({
        evidenceId: intent.evidenceId,
        ownerAccountId: "account-001",
        quarantineObjectReference: intent.quarantineObjectReference,
      }),
    ).resolves.toMatchObject({
      status: "DELETED",
      deletedAt: deleted.deletedAt,
    });
  });

  it("rejects upload after intent expiry and reports the expired gate", async () => {
    const { clock, lifecycle } = createFixture();
    const intent = await createIntent(lifecycle);
    clock.now += 300_000;

    expect(() =>
      lifecycle.uploadToQuarantine({
        uploadReference: intent.uploadReference,
        content: jpeg,
      }),
    ).toThrow(expect.objectContaining({ code: "EVIDENCE_UPLOAD_EXPIRED" }));
    await expect(
      lifecycle.inspect({
        evidenceId: intent.evidenceId,
        ownerAccountId: "account-001",
        quarantineObjectReference: intent.quarantineObjectReference,
      }),
    ).resolves.toMatchObject({
      status: "REJECTED",
      reasonCode: "UPLOAD_EXPIRED",
    });
  });

  it("rejects unsupported runtime media policy values", () => {
    expect(
      () =>
        new InMemoryEvidenceLifecycle({
          policy: {
            allowedMediaTypes: ["text/html" as never],
            maximumByteLength: 32,
            uploadIntentTtlSeconds: 300,
            acceptedRetentionSeconds: 3_600,
          },
        }),
    ).toThrow(expect.objectContaining({ code: "EVIDENCE_VALIDATION_FAILED" }));
  });
});
