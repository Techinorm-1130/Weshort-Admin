"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { contentApi, taxonomyApi } from "@/lib/api/resources";
import { useMutation, useQuery } from "@/lib/hooks";
import type { ContentItem } from "@/types";
import {
  FIELD_STEP, errorsForStep, pendingUploads, validateContent, type ContentErrors,
} from "@/lib/content-validation";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Stepper, { type Step } from "@/components/ui/Stepper";
import Icon from "@/components/ui/Icon";
import { Badge, Card } from "@/components/ui/Primitives";
import { ConfirmDialog, Modal } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";
import BasicInfoStep from "@/components/content/steps/BasicInfoStep";
import MediaStep from "@/components/content/steps/MediaStep";
import AudioSubtitlesStep from "@/components/content/steps/AudioSubtitlesStep";
import SettingsStep from "@/components/content/steps/SettingsStep";
import ReviewStep from "@/components/content/steps/ReviewStep";

const STEPS: Step[] = [
  { id: "basic", label: "Basic information", hint: "Title, description, genre" },
  { id: "media", label: "Media upload", hint: "Artwork and video" },
  { id: "audio", label: "Audio & subtitles", hint: "Dubs and tracks" },
  { id: "settings", label: "OTT settings", hint: "Access and schedule" },
  { id: "review", label: "Review & publish", hint: "Final check" },
];

function emptyDraft(): ContentItem {
  return {
    id: "",
    type: "movie",
    // the signed-in member; the backend will stamp this server-side
    uploadedBy: { id: "usr_ws", name: "Sarin Kumar", initials: "SK", color: "#0d9488" },
    title: "",
    shortDescription: "",
    description: "",
    poster: null,
    thumbnail: null,
    banner: null,
    releaseDate: "",
    durationSec: 0,
    language: "",
    genres: [],
    category: "short-film",
    country: "",
    ageRating: "",
    video: null,
    trailer: null,
    audioLanguages: [],
    subtitles: [],
    access: "premium",
    status: "draft",
    publishAt: "",
    expiryAt: "",
    featured: false,
    allowDownload: false,
    seasons: [],
    createdAt: "",
    updatedAt: "",
  };
}

export default function ContentUploadPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: taxonomies } = useQuery(() => taxonomyApi.all(), []);

  const [draft, setDraft] = useState<ContentItem>(emptyDraft);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  /** Steps the admin has attempted to leave — errors only show after that. */
  const [visited, setVisited] = useState<number[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const save = useMutation((payload: Partial<ContentItem>, id: string | null) =>
    id ? contentApi.update(id, payload) : contentApi.create(payload),
  );
  const publish = useMutation((id: string) => contentApi.publish(id));

  const patch = (values: Partial<ContentItem>) => setDraft((prev) => ({ ...prev, ...values }));

  const errors: ContentErrors = useMemo(() => validateContent(draft), [draft]);
  const pending = pendingUploads(draft);
  const isLast = step === STEPS.length - 1;
  const blocking = Object.keys(errors).length;

  /** Errors are hidden until the admin has tried to move past that step. */
  const visibleErrors = (index: number): ContentErrors =>
    visited.includes(index) || isLast ? errorsForStep(errors, index) : {};

  const goTo = (index: number) => {
    setStep(index);
    setFurthest((f) => Math.max(f, index));
  };

  const next = () => {
    setVisited((v) => (v.includes(step) ? v : [...v, step]));
    const stepErrors = errorsForStep(errors, step);
    if (Object.keys(stepErrors).length) {
      toast.error(Object.values(stepErrors)[0] ?? "Please complete this step");
      return;
    }
    goTo(Math.min(STEPS.length - 1, step + 1));
  };

  const persist = async (status: ContentItem["status"]) => {
    const payload = { ...draft, status };
    const saved = await save.run(payload, savedId);
    if (saved) {
      setSavedId(saved.id);
      setDraft((prev) => ({ ...prev, id: saved.id, status: saved.status }));
    }
    return saved;
  };

  const onSaveDraft = async () => {
    const saved = await persist("draft");
    if (saved) toast.success("Saved as draft");
  };

  const onPublish = async () => {
    setVisited(STEPS.map((_, i) => i));
    if (blocking) {
      toast.error("Fix the highlighted fields before publishing");
      setStep(STEPS.length - 1);
      return;
    }
    if (pending) {
      toast.error("Wait for the uploads to finish processing");
      return;
    }
    const saved = await persist("draft");
    if (!saved) return;
    const published = await publish.run(saved.id);
    if (published) {
      setDraft((prev) => ({ ...prev, status: published.status }));
      toast.success(published.status === "scheduled" ? "Content scheduled" : "Content published");
      router.push("/content");
    }
  };

  return (
    <>
      <PageHeader
        title="Upload content"
        icon="upload"
        iconColor="#0d9488"
        crumbs={[{ label: "Catalogue" }, { label: "Upload content" }]}
        activeTab="upload"
        tabs={[
          { id: "library", label: "Library", icon: "layers", color: "#0369a1", href: "/content" },
          { id: "mine", label: "My uploads", icon: "user", color: "#0d9488", href: "/content" },
          { id: "upload", label: "New upload", icon: "upload", color: "#7c3aed", href: "/content/upload" },
        ]}
        subtitle="Movies, series and episodes — five steps from source file to live."
        backHref="/content"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmCancel(true)}>
              Cancel
            </Button>
            <Button variant="secondary" icon="eye" onClick={() => setPreview(true)}>
              Preview
            </Button>
            <Button variant="secondary" icon="file" loading={save.pending} onClick={onSaveDraft}>
              Save as draft
            </Button>
            <Button icon="check" loading={publish.pending} onClick={onPublish}>
              Publish
            </Button>
          </>
        }
      />

      {/* ------------------------------- stepper ------------------------------ */}
      <Card className="mb-4" padded={false}>
        <div className="px-4 py-3">
          <Stepper steps={STEPS} current={step} furthest={furthest} onSelect={goTo} />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-2 text-[12px] text-muted">
          <Badge tone={draft.status === "published" ? "ok" : "neutral"}>{draft.status}</Badge>
          {savedId ? <span>Draft saved</span> : <span>Not saved yet</span>}
          {pending ? (
            <span className="inline-flex items-center gap-1.5 text-accent">
              <Icon name="bolt" size={13} /> {pending} upload(s) in progress
            </span>
          ) : null}
          {blocking ? (
            <span className="ml-auto inline-flex items-center gap-1.5 text-warn">
              <Icon name="shield" size={13} /> {blocking} field(s) left before publishing
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1.5 text-ok">
              <Icon name="check" size={13} /> All required fields complete
            </span>
          )}
        </div>
      </Card>

      {/* -------------------------------- steps ------------------------------- */}
      <div className="relative z-10 animate-fade-up">
        {step === 0 ? (
          <BasicInfoStep draft={draft} patch={patch} errors={visibleErrors(0)} taxonomies={taxonomies} />
        ) : null}
        {step === 1 ? <MediaStep draft={draft} patch={patch} errors={visibleErrors(1)} /> : null}
        {step === 2 ? <AudioSubtitlesStep draft={draft} patch={patch} errors={visibleErrors(2)} /> : null}
        {step === 3 ? <SettingsStep draft={draft} patch={patch} errors={visibleErrors(3)} /> : null}
        {step === 4 ? (
          <ReviewStep
            draft={draft}
            errors={errors}
            taxonomies={taxonomies}
            pending={pending}
            onFix={(field) => goTo(FIELD_STEP[field] ?? 0)}
          />
        ) : null}
      </div>

      {/* ------------------------------ step nav ------------------------------ */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          icon="arrow-left"
          disabled={step === 0}
          onClick={() => goTo(Math.max(0, step - 1))}
        >
          Back
        </Button>

        <span className="text-[13px] text-muted">
          Step {step + 1} of {STEPS.length}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Button variant="subtle" loading={save.pending} onClick={onSaveDraft}>
            Save as draft
          </Button>
          {isLast ? (
            <Button icon="check" loading={publish.pending} onClick={onPublish}>
              Publish content
            </Button>
          ) : (
            <Button iconRight="chevron-right" onClick={next}>
              Continue
            </Button>
          )}
        </div>
      </div>

      {/* ------------------------------- preview ------------------------------ */}
      <Modal
        open={preview}
        onClose={() => setPreview(false)}
        title={draft.title || "Untitled content"}
        description="How the title reads on the content page"
        width="max-w-2xl"
        footer={
          <Button variant="secondary" onClick={() => setPreview(false)}>
            Close preview
          </Button>
        }
      >
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex aspect-video w-full items-center justify-center bg-black">
            {draft.banner || draft.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={(draft.banner ?? draft.thumbnail) as string} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-muted">
                <Icon name="play" size={30} />
                <span className="text-[13px]">No artwork yet</span>
              </span>
            )}
          </div>

          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={draft.access === "premium" ? "brand" : "ok"}>{draft.access}</Badge>
              {draft.ageRating ? <Badge>{draft.ageRating}</Badge> : null}
              {draft.genres.map((g) => (
                <Badge key={g}>{g}</Badge>
              ))}
            </div>
            <h3 className="mt-3 font-display text-2xl font-bold text-ink">{draft.title || "Untitled"}</h3>
            <p className="mt-2 text-sm text-muted">{draft.shortDescription}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-strong">
              {draft.description || "No description yet."}
            </p>
          </div>
        </div>
      </Modal>

      {/* ------------------------------- cancel ------------------------------- */}
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Discard this upload?"
        confirmLabel="Discard"
        message="Everything entered in the wizard is lost. Save as draft first if you want to come back to it."
        onConfirm={() => {
          setConfirmCancel(false);
          router.push("/content");
        }}
      />
    </>
  );
}
