BEGIN;

CREATE TYPE "AbuseRateLimitAxis" AS ENUM ('NETWORK', 'ACCOUNT', 'SESSION', 'DEVICE', 'TARGET');

CREATE TABLE "abuse_rate_limit_bucket" (
  "policy" VARCHAR(80) NOT NULL,
  "axis" "AbuseRateLimitAxis" NOT NULL,
  "subject_digest" CHAR(64) NOT NULL,
  "window_started_at" TIMESTAMPTZ(3) NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 1,
  "denial_audited" BOOLEAN NOT NULL DEFAULT FALSE,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "abuse_rate_limit_bucket_pk" PRIMARY KEY ("policy", "axis", "subject_digest", "window_started_at"),
  CONSTRAINT "abuse_rate_limit_policy_format" CHECK ("policy" ~ '^[a-z][a-z0-9.-]{1,79}$'),
  CONSTRAINT "abuse_rate_limit_subject_digest_format" CHECK ("subject_digest" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "abuse_rate_limit_window_order" CHECK ("window_started_at" < "expires_at"),
  CONSTRAINT "abuse_rate_limit_attempt_count_positive" CHECK ("attempt_count" > 0)
);

CREATE INDEX "abuse_rate_limit_bucket_expiry_idx" ON "abuse_rate_limit_bucket"("expires_at");

COMMIT;
