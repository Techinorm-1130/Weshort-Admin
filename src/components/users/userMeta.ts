import type { SubscriptionPlan, ViewerStatus } from "@/types";

/* Shared labels and tones so the table, drawer and edit modal stay in sync. */

export const STATUS_TONES: Record<ViewerStatus, "ok" | "neutral" | "danger"> = {
  active: "ok",
  inactive: "neutral",
  suspended: "danger",
};

export const PLAN_TONES: Record<SubscriptionPlan, "neutral" | "accent" | "brand"> = {
  free: "neutral",
  basic: "neutral",
  standard: "accent",
  premium: "brand",
};

const STATUS_LABELS: Record<ViewerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
};

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "Free",
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};

export const statusLabel = (status: ViewerStatus) => STATUS_LABELS[status];
export const planLabel = (plan: SubscriptionPlan) => PLAN_LABELS[plan];

export const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];
