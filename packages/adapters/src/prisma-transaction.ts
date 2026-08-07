import { Prisma } from "./generated/prisma/client";

export const serializableTransactionOptions = Object.freeze({
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 2_000,
  timeout: 5_000,
});
