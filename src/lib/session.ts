import { UPLOADERS } from "./api/seed-ott";
import type { Actor } from "@/types";

/**
 * The signed-in member. The backend supplies this once auth is connected —
 * every screen reads it from here so there is one place to swap.
 */
export const CURRENT_USER: Actor & { role: string } = UPLOADERS[0];

/** Owners and admins review what the rest of the team uploads. */
export const canReview = (role: string) => role === "owner" || role === "admin";

/** True when the signed-in member may approve or reject uploads. */
export const IS_REVIEWER = canReview(CURRENT_USER.role);
