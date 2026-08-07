BEGIN;

CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');
CREATE TYPE "AssuranceLevel" AS ENUM ('BASE', 'STRONG', 'PHISHING_RESISTANT');
CREATE TYPE "AccountCapability" AS ENUM ('MODERATE_TRIPS');
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED');
CREATE TYPE "OAuthAttemptStatus" AS ENUM ('PENDING', 'CONSUMED', 'EXPIRED');
CREATE TYPE "JastipperProfileStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "TripOfferStatus" AS ENUM ('DRAFT', 'PENDING_MODERATION', 'PUBLISHED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "DiscussionStatus" AS ENUM ('VISIBLE', 'HIDDEN');

CREATE TABLE "account" (
  "id" UUID PRIMARY KEY,
  "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "session_version" INTEGER NOT NULL DEFAULT 1,
  "display_name" VARCHAR(120) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_session_version_positive" CHECK ("session_version" > 0),
  CONSTRAINT "account_display_name_bounded" CHECK (char_length(btrim("display_name")) BETWEEN 2 AND 120)
);

CREATE TABLE "external_identity" (
  "id" UUID PRIMARY KEY,
  "account_id" UUID NOT NULL,
  "provider" VARCHAR(32) NOT NULL,
  "issuer" VARCHAR(255) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "assurance" "AssuranceLevel" NOT NULL DEFAULT 'BASE',
  "last_authenticated_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "external_identity_account_fk" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT,
  CONSTRAINT "external_identity_google_only" CHECK ("provider" = 'GOOGLE'),
  CONSTRAINT "external_identity_google_issuer" CHECK ("issuer" = 'https://accounts.google.com'),
  CONSTRAINT "external_identity_subject_bounded" CHECK (char_length("subject") BETWEEN 1 AND 255)
);

CREATE UNIQUE INDEX "external_identity_issuer_subject_key" ON "external_identity"("issuer", "subject");
CREATE UNIQUE INDEX "external_identity_account_provider_key" ON "external_identity"("account_id", "provider");
CREATE INDEX "external_identity_account_idx" ON "external_identity"("account_id");

CREATE TABLE "account_capability_grant" (
  "account_id" UUID NOT NULL,
  "capability" "AccountCapability" NOT NULL,
  "granted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("account_id", "capability"),
  CONSTRAINT "account_capability_account_fk" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE
);

CREATE TABLE "browser_session" (
  "id" UUID PRIMARY KEY,
  "account_id" UUID NOT NULL,
  "family_id" UUID NOT NULL,
  "parent_session_id" UUID,
  "token_digest" CHAR(64) NOT NULL,
  "account_session_version" INTEGER NOT NULL,
  "assurance" "AssuranceLevel" NOT NULL DEFAULT 'BASE',
  "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMPTZ(3) NOT NULL,
  "idle_expires_at" TIMESTAMPTZ(3) NOT NULL,
  "absolute_expires_at" TIMESTAMPTZ(3) NOT NULL,
  "revoked_at" TIMESTAMPTZ(3),
  "revocation_reason" VARCHAR(80),
  CONSTRAINT "browser_session_account_fk" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE,
  CONSTRAINT "browser_session_parent_fk" FOREIGN KEY ("parent_session_id") REFERENCES "browser_session"("id") ON DELETE RESTRICT,
  CONSTRAINT "browser_session_digest_format" CHECK ("token_digest" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "browser_session_version_positive" CHECK ("account_session_version" > 0),
  CONSTRAINT "browser_session_expiry_order" CHECK ("created_at" < "idle_expires_at" AND "idle_expires_at" <= "absolute_expires_at"),
  CONSTRAINT "browser_session_revocation_consistency" CHECK (("revoked_at" IS NULL) = ("revocation_reason" IS NULL))
);

CREATE UNIQUE INDEX "browser_session_parent_key" ON "browser_session"("parent_session_id") WHERE "parent_session_id" IS NOT NULL;
CREATE UNIQUE INDEX "browser_session_token_digest_key" ON "browser_session"("token_digest");
CREATE INDEX "browser_session_account_status_idx" ON "browser_session"("account_id", "status");
CREATE INDEX "browser_session_family_idx" ON "browser_session"("family_id");

CREATE TABLE "oauth_attempt" (
  "id" UUID PRIMARY KEY,
  "state_digest" CHAR(64) NOT NULL,
  "browser_binding_digest" CHAR(64) NOT NULL,
  "sealed_nonce" TEXT NOT NULL,
  "sealed_code_verifier" TEXT NOT NULL,
  "return_to" VARCHAR(512) NOT NULL,
  "status" "OAuthAttemptStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "consumed_at" TIMESTAMPTZ(3),
  CONSTRAINT "oauth_attempt_digest_format" CHECK ("state_digest" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "oauth_attempt_browser_binding_digest_format" CHECK ("browser_binding_digest" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "oauth_attempt_expiry_order" CHECK ("created_at" < "expires_at"),
  CONSTRAINT "oauth_attempt_consumed_consistency" CHECK (("status" = 'CONSUMED') = ("consumed_at" IS NOT NULL)),
  CONSTRAINT "oauth_attempt_return_to_local" CHECK ("return_to" ~ '^/[A-Za-z0-9/_?=&.%-]*$' AND "return_to" !~ '^//')
);

CREATE UNIQUE INDEX "oauth_attempt_state_digest_key" ON "oauth_attempt"("state_digest");
CREATE INDEX "oauth_attempt_expiry_idx" ON "oauth_attempt"("expires_at", "status");

CREATE TABLE "jastipper_profile" (
  "id" UUID PRIMARY KEY,
  "account_id" UUID NOT NULL,
  "display_name" VARCHAR(120) NOT NULL,
  "seller_location_label" VARCHAR(160) NOT NULL,
  "delivery_summary" VARCHAR(500) NOT NULL,
  "rate_summary" VARCHAR(500) NOT NULL,
  "status" "JastipperProfileStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "jastipper_profile_account_fk" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT,
  CONSTRAINT "jastipper_profile_display_name_bounded" CHECK (char_length(btrim("display_name")) BETWEEN 2 AND 120),
  CONSTRAINT "jastipper_profile_location_bounded" CHECK (char_length(btrim("seller_location_label")) BETWEEN 2 AND 160),
  CONSTRAINT "jastipper_profile_delivery_bounded" CHECK (char_length(btrim("delivery_summary")) BETWEEN 2 AND 500),
  CONSTRAINT "jastipper_profile_rate_bounded" CHECK (char_length(btrim("rate_summary")) BETWEEN 2 AND 500)
);

CREATE UNIQUE INDEX "jastipper_profile_account_key" ON "jastipper_profile"("account_id");
CREATE UNIQUE INDEX "jastipper_profile_id_account_key" ON "jastipper_profile"("id", "account_id");

CREATE TABLE "trip_offer" (
  "id" VARCHAR(64) PRIMARY KEY,
  "owner_account_id" UUID NOT NULL,
  "jastipper_profile_id" UUID NOT NULL,
  "status" "TripOfferStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "origin_label" VARCHAR(160) NOT NULL,
  "origin_time_zone" VARCHAR(80) NOT NULL,
  "destination_label" VARCHAR(160) NOT NULL,
  "destination_time_zone" VARCHAR(80) NOT NULL,
  "service_window_start_at" TIMESTAMPTZ(3) NOT NULL,
  "service_window_end_at" TIMESTAMPTZ(3) NOT NULL,
  "departure_date" DATE NOT NULL,
  "departure_at" TIMESTAMPTZ(3) NOT NULL,
  "request_open_at" TIMESTAMPTZ(3) NOT NULL,
  "request_deadline" TIMESTAMPTZ(3) NOT NULL,
  "estimated_arrival_at" TIMESTAMPTZ(3) NOT NULL,
  "service_modes" TEXT[] NOT NULL,
  "remaining_capacity_kg" DECIMAL(8,2) NOT NULL,
  "moderation_reason" VARCHAR(500),
  "published_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trip_offer_owner_fk" FOREIGN KEY ("owner_account_id") REFERENCES "account"("id") ON DELETE RESTRICT,
  CONSTRAINT "trip_offer_profile_owner_fk" FOREIGN KEY ("jastipper_profile_id", "owner_account_id") REFERENCES "jastipper_profile"("id", "account_id") ON DELETE RESTRICT,
  CONSTRAINT "trip_offer_version_positive" CHECK ("version" > 0),
  CONSTRAINT "trip_offer_route_distinct" CHECK (lower(btrim("origin_label")) <> lower(btrim("destination_label"))),
  CONSTRAINT "trip_offer_service_window_order" CHECK ("service_window_start_at" < "service_window_end_at"),
  CONSTRAINT "trip_offer_request_window_order" CHECK ("request_open_at" < "request_deadline"),
  CONSTRAINT "trip_offer_request_before_service_end" CHECK ("request_deadline" <= "service_window_end_at"),
  CONSTRAINT "trip_offer_service_before_departure" CHECK ("service_window_end_at" <= "departure_at"),
  CONSTRAINT "trip_offer_arrival_after_departure" CHECK ("estimated_arrival_at" >= "departure_at"),
  CONSTRAINT "trip_offer_capacity_nonnegative" CHECK ("remaining_capacity_kg" >= 0),
  CONSTRAINT "trip_offer_service_modes_nonempty" CHECK (cardinality("service_modes") > 0),
  CONSTRAINT "trip_offer_service_modes_allowed" CHECK ("service_modes" <@ ARRAY['SHOP_FOR_ME', 'CARRY_MY_ITEM']::TEXT[]),
  CONSTRAINT "trip_offer_publish_consistency" CHECK (("status" = 'PUBLISHED') = ("published_at" IS NOT NULL))
);

CREATE INDEX "trip_offer_owner_status_idx" ON "trip_offer"("owner_account_id", "status");
CREATE INDEX "trip_offer_public_search_idx" ON "trip_offer"("status", "departure_date", "id");

CREATE TABLE "moderation_decision" (
  "id" UUID PRIMARY KEY,
  "trip_id" VARCHAR(64) NOT NULL,
  "moderator_account_id" UUID NOT NULL,
  "decision" VARCHAR(32) NOT NULL,
  "reason_code" VARCHAR(80) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "moderation_decision_trip_fk" FOREIGN KEY ("trip_id") REFERENCES "trip_offer"("id") ON DELETE RESTRICT,
  CONSTRAINT "moderation_decision_moderator_fk" FOREIGN KEY ("moderator_account_id") REFERENCES "account"("id") ON DELETE RESTRICT,
  CONSTRAINT "moderation_decision_allowed" CHECK ("decision" IN ('APPROVED', 'REJECTED'))
);

CREATE INDEX "moderation_decision_trip_idx" ON "moderation_decision"("trip_id", "created_at");

CREATE TABLE "public_question" (
  "id" UUID PRIMARY KEY,
  "trip_id" VARCHAR(64) NOT NULL,
  "author_account_id" UUID NOT NULL,
  "author_display_name" VARCHAR(120) NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "status" "DiscussionStatus" NOT NULL DEFAULT 'VISIBLE',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_question_trip_fk" FOREIGN KEY ("trip_id") REFERENCES "trip_offer"("id") ON DELETE RESTRICT,
  CONSTRAINT "public_question_author_fk" FOREIGN KEY ("author_account_id") REFERENCES "account"("id") ON DELETE RESTRICT,
  CONSTRAINT "public_question_message_bounded" CHECK (char_length(btrim("message")) BETWEEN 5 AND 500),
  CONSTRAINT "public_question_author_bounded" CHECK (char_length(btrim("author_display_name")) BETWEEN 2 AND 120)
);

CREATE INDEX "public_question_trip_idx" ON "public_question"("trip_id", "status", "created_at", "id");

CREATE TABLE "public_answer" (
  "id" UUID PRIMARY KEY,
  "question_id" UUID NOT NULL,
  "author_account_id" UUID NOT NULL,
  "author_display_name" VARCHAR(120) NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "status" "DiscussionStatus" NOT NULL DEFAULT 'VISIBLE',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_answer_question_fk" FOREIGN KEY ("question_id") REFERENCES "public_question"("id") ON DELETE RESTRICT,
  CONSTRAINT "public_answer_author_fk" FOREIGN KEY ("author_account_id") REFERENCES "account"("id") ON DELETE RESTRICT,
  CONSTRAINT "public_answer_message_bounded" CHECK (char_length(btrim("message")) BETWEEN 5 AND 500),
  CONSTRAINT "public_answer_author_bounded" CHECK (char_length(btrim("author_display_name")) BETWEEN 2 AND 120)
);

CREATE UNIQUE INDEX "public_answer_question_key" ON "public_answer"("question_id");

CREATE TABLE "audit_event" (
  "id" UUID PRIMARY KEY,
  "actor_account_id" UUID,
  "action" VARCHAR(120) NOT NULL,
  "target_type" VARCHAR(80) NOT NULL,
  "target_id" VARCHAR(160) NOT NULL,
  "outcome" VARCHAR(32) NOT NULL,
  "reason_code" VARCHAR(80) NOT NULL,
  "correlation_id" VARCHAR(120) NOT NULL,
  "occurred_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "audit_event_outcome_allowed" CHECK ("outcome" IN ('SUCCEEDED', 'DENIED', 'FAILED'))
);

CREATE INDEX "audit_event_target_idx" ON "audit_event"("target_type", "target_id", "occurred_at");
CREATE INDEX "audit_event_actor_idx" ON "audit_event"("actor_account_id", "occurred_at");

CREATE TABLE "outbox_event" (
  "id" UUID PRIMARY KEY,
  "topic" VARCHAR(120) NOT NULL,
  "aggregate_type" VARCHAR(80) NOT NULL,
  "aggregate_id" VARCHAR(160) NOT NULL,
  "occurred_at" TIMESTAMPTZ(3) NOT NULL,
  "payload" JSONB NOT NULL,
  "claimed_at" TIMESTAMPTZ(3),
  "published_at" TIMESTAMPTZ(3)
);

CREATE INDEX "outbox_event_unpublished_idx" ON "outbox_event"("published_at", "occurred_at");

COMMIT;
