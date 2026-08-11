CREATE TYPE "OrderRequestStatus" AS ENUM ('SUBMITTED');
CREATE TYPE "OrderServiceMode" AS ENUM ('SHOP_FOR_ME', 'CARRY_MY_ITEM');

ALTER TABLE "trip_offer"
  ADD CONSTRAINT "trip_offer_id_owner_profile_key"
  UNIQUE ("id", "owner_account_id", "jastipper_profile_id");

CREATE TABLE "order_request" (
  "id" UUID NOT NULL,
  "trip_id" VARCHAR(64) NOT NULL,
  "customer_account_id" UUID NOT NULL,
  "seller_account_id" UUID NOT NULL,
  "jastipper_profile_id" UUID NOT NULL,
  "status" "OrderRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
  "service_mode" "OrderServiceMode" NOT NULL,
  "source_offer_version" INTEGER NOT NULL,
  "reserved_capacity_kg" DECIMAL(8,2) NOT NULL,
  "item_description" VARCHAR(500) NOT NULL,
  "quantity" INTEGER,
  "maximum_budget_idr" INTEGER,
  "allow_substitution" BOOLEAN,
  "variation" VARCHAR(200),
  "declared_value_idr" INTEGER,
  "declared_weight_kg" DECIMAL(8,2),
  "length_millimeters" INTEGER,
  "width_millimeters" INTEGER,
  "height_millimeters" INTEGER,
  "handling_instructions" VARCHAR(500),
  "origin_label" VARCHAR(160) NOT NULL,
  "destination_label" VARCHAR(160) NOT NULL,
  "order_open_at" TIMESTAMPTZ(3) NOT NULL,
  "order_close_at" TIMESTAMPTZ(3) NOT NULL,
  "transport_departure_at" TIMESTAMPTZ(3) NOT NULL,
  "estimated_arrival_at" TIMESTAMPTZ(3) NOT NULL,
  "submitted_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "order_request_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_request_id_customer_key" UNIQUE ("id", "customer_account_id"),
  CONSTRAINT "order_request_distinct_parties" CHECK ("customer_account_id" <> "seller_account_id"),
  CONSTRAINT "order_request_offer_version_positive" CHECK ("source_offer_version" > 0),
  CONSTRAINT "order_request_capacity_bounds" CHECK ("reserved_capacity_kg" >= 0.01 AND "reserved_capacity_kg" <= 100000.00),
  CONSTRAINT "order_request_item_description_bounds" CHECK (char_length(btrim("item_description")) BETWEEN 3 AND 500),
  CONSTRAINT "order_request_schedule_order" CHECK (
    "order_open_at" < "order_close_at"
    AND "order_close_at" < "transport_departure_at"
    AND "transport_departure_at" < "estimated_arrival_at"
  ),
  CONSTRAINT "order_request_submission_window" CHECK (
    "submitted_at" >= "order_open_at" AND "submitted_at" < "order_close_at"
  ),
  CONSTRAINT "order_request_mode_terms" CHECK (
    (
      "service_mode" = 'SHOP_FOR_ME'
      AND "quantity" BETWEEN 1 AND 100
      AND "maximum_budget_idr" BETWEEN 1 AND 2000000000
      AND "allow_substitution" IS NOT NULL
      AND ("variation" IS NULL OR char_length(btrim("variation")) BETWEEN 1 AND 200)
      AND "declared_value_idr" IS NULL
      AND "declared_weight_kg" IS NULL
      AND "length_millimeters" IS NULL
      AND "width_millimeters" IS NULL
      AND "height_millimeters" IS NULL
      AND "handling_instructions" IS NULL
    )
    OR
    (
      "service_mode" = 'CARRY_MY_ITEM'
      AND "quantity" IS NULL
      AND "maximum_budget_idr" IS NULL
      AND "allow_substitution" IS NULL
      AND "variation" IS NULL
      AND "declared_value_idr" BETWEEN 1 AND 2000000000
      AND "declared_weight_kg" = "reserved_capacity_kg"
      AND "length_millimeters" BETWEEN 1 AND 10000
      AND "width_millimeters" BETWEEN 1 AND 10000
      AND "height_millimeters" BETWEEN 1 AND 10000
      AND ("handling_instructions" IS NULL OR char_length(btrim("handling_instructions")) BETWEEN 1 AND 500)
    )
  )
);

CREATE TABLE "order_submission_idempotency" (
  "customer_account_id" UUID NOT NULL,
  "operation" VARCHAR(64) NOT NULL,
  "key_digest" CHAR(64) NOT NULL,
  "fingerprint" CHAR(64) NOT NULL,
  "request_id" UUID NOT NULL,
  "completed_at" TIMESTAMPTZ(3) NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "order_submission_idempotency_pk" PRIMARY KEY ("customer_account_id", "operation", "key_digest"),
  CONSTRAINT "order_submission_idempotency_request_key" UNIQUE ("request_id", "customer_account_id"),
  CONSTRAINT "order_submission_idempotency_operation" CHECK ("operation" = 'order.submit.v1'),
  CONSTRAINT "order_submission_idempotency_key_digest" CHECK ("key_digest" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "order_submission_idempotency_fingerprint" CHECK ("fingerprint" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "order_submission_idempotency_expiry" CHECK ("expires_at" > "completed_at")
);

CREATE INDEX "order_request_trip_status_idx" ON "order_request"("trip_id", "status", "submitted_at", "id");
CREATE INDEX "order_request_customer_status_idx" ON "order_request"("customer_account_id", "status", "submitted_at", "id");
CREATE INDEX "order_request_seller_status_idx" ON "order_request"("seller_account_id", "status", "submitted_at", "id");
CREATE INDEX "order_submission_idempotency_expiry_idx" ON "order_submission_idempotency"("expires_at");

ALTER TABLE "order_request"
  ADD CONSTRAINT "order_request_trip_fkey"
  FOREIGN KEY ("trip_id", "seller_account_id", "jastipper_profile_id")
  REFERENCES "trip_offer"("id", "owner_account_id", "jastipper_profile_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_request"
  ADD CONSTRAINT "order_request_customer_fkey"
  FOREIGN KEY ("customer_account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_request"
  ADD CONSTRAINT "order_request_seller_fkey"
  FOREIGN KEY ("seller_account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_request"
  ADD CONSTRAINT "order_request_profile_owner_fkey"
  FOREIGN KEY ("jastipper_profile_id", "seller_account_id")
  REFERENCES "jastipper_profile"("id", "account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_submission_idempotency"
  ADD CONSTRAINT "order_submission_idempotency_customer_fkey"
  FOREIGN KEY ("customer_account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_submission_idempotency"
  ADD CONSTRAINT "order_submission_idempotency_request_fkey"
  FOREIGN KEY ("request_id", "customer_account_id")
  REFERENCES "order_request"("id", "customer_account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
