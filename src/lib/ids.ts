import { Types } from "mongoose";

/**
 * Guards against NoSQL-injection via client-supplied IDs: returns the string
 * only if it's a valid Mongo ObjectId, else null. Use before placing any
 * client value into a query so an object like `{ $ne: null }` can never reach
 * the database as an `_id`/ref filter.
 */
export function asObjectId(value: unknown): string | null {
  return typeof value === "string" && Types.ObjectId.isValid(value) ? value : null;
}
