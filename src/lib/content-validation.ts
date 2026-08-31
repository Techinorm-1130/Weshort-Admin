import type { ContentItem } from "@/types";

export type ContentErrors = Partial<Record<string, string>>;

/** Which wizard step each field belongs to, so the stepper can flag problems. */
export const FIELD_STEP: Record<string, number> = {
  type: 0,
  title: 0,
  description: 0,
  releaseDate: 0,
  language: 0,
  genres: 0,
  ageRating: 0,
  poster: 1,
  video: 1,
  seasons: 1,
  audioLanguages: 2,
  publishAt: 3,
};

/**
 * Validates the whole draft at once. The wizard shows only the messages that
 * belong to the step being edited, and everything on the review step.
 */
export function validateContent(draft: ContentItem): ContentErrors {
  const errors: ContentErrors = {};

  if (!draft.type) errors.type = "Choose a content type";
  if (!draft.title.trim()) errors.title = "Title is required";
  if (!draft.description.trim()) errors.description = "Full description is required";
  if (!draft.releaseDate) errors.releaseDate = "Release date is required";
  if (!draft.language) errors.language = "Original language is required";
  if (draft.genres.length === 0) errors.genres = "Pick at least one genre";
  if (!draft.ageRating) errors.ageRating = "Age rating is required";
  if (!draft.poster) errors.poster = "Poster image is required";

  if (draft.type === "series") {
    const episodes = draft.seasons.reduce((sum, season) => sum + season.episodes.length, 0);
    if (draft.seasons.length === 0) errors.seasons = "Add at least one season";
    else if (episodes === 0) errors.seasons = "Add at least one episode";
    else {
      const untitled = draft.seasons.some((s) => s.episodes.some((e) => !e.title.trim()));
      if (untitled) errors.seasons = "Every episode needs a title";
    }
  } else if (!draft.video) {
    errors.video = "Main video is required";
  }

  if (draft.audioLanguages.length === 0) errors.audioLanguages = "Select at least one audio language";

  if (draft.expiryAt && draft.publishAt && draft.expiryAt < draft.publishAt) {
    errors.publishAt = "Expiry date must be after the publish date";
  }

  return errors;
}

/** Errors that belong to a given step. */
export function errorsForStep(errors: ContentErrors, step: number): ContentErrors {
  const out: ContentErrors = {};
  for (const [field, message] of Object.entries(errors)) {
    if (FIELD_STEP[field] === step && message) out[field] = message;
  }
  return out;
}

/** True when nothing in this step (or any earlier one) is invalid. */
export function stepIsValid(errors: ContentErrors, step: number): boolean {
  return Object.keys(errorsForStep(errors, step)).length === 0;
}

/** Uploads still running anywhere in the draft — publishing must wait for them. */
export function pendingUploads(draft: ContentItem): number {
  const assets = [
    draft.video,
    draft.trailer,
    ...draft.seasons.flatMap((s) => s.episodes.map((e) => e.video)),
  ];
  return assets.filter((a) => a && a.state !== "ready" && a.state !== "idle").length;
}
