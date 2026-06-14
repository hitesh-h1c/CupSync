import { AuthError } from "@/lib/guard";

/** Standard return shape for server actions, so client forms can react. */
export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/**
 * Wrap a server action body so thrown AuthErrors / validation errors become a
 * clean `{ ok: false, error }` instead of an unhandled exception.
 */
export async function runAction(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }
    console.error("Action error:", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
