"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { contentApi, taxonomyApi } from "@/lib/api/resources";
import { CURRENT_USER, IS_REVIEWER } from "@/lib/session";
import { formatDate } from "@/lib/format";
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
import { DrawerRow } from "@/components/ui/Drawer";
import { APPROVAL_TONES, approvalLabel } from "@/components/content/contentMeta";
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
    uploadedBy: {
      id: CURRENT_USER.id,
      name: CURRENT_USER.name,
      initials: CURRENT_USER.initials,
      color: CURRENT_USER.color,
    },
    approval: { state: "draft", submittedAt: "", reviewedAt: "", reviewedBy: null, note: "" },
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
  /** The top of the step body, so a step change can bring it into view. */
  const stepsTop = useRef<HTMLDivElement>(null);
  const [furthest, setFurthest] = useState(0);
  /** Steps the admin has attempted to leave — errors only show after that. */
  const [visited, setVisited] = useState<number[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const save = useMutation((payload: Partial<ContentItem>, id: string | null) =>
    id ? contentApi.update(id, payload) : contentApi.create(payload),
  );
  const publish = useMutation((id: string) => contentApi.publish(id));
  const submit = useMutation((id: string) => contentApi.submit(id));

  /**
   * Choosing "series" opens season 1 straight away, so adding episodes is just
   * pressing + on the season — no separate step to create the season first.
   */
  const patch = (values: Partial<ContentItem>) => {
    const seasonId = `sea_${Date.now().toString(36)}`;
    setDraft((prev) => {
      const next = { ...prev, ...values };
      if (next.type === "series" && next.seasons.length === 0) {
        return { ...next, seasons: [{ id: seasonId, number: 1, title: "Season 1", episodes: [] }] };
      }
      return next;
    });
  };

  const errors: ContentErrors = useMemo(() => validateContent(draft), [draft]);
  const pending = pendingUploads(draft);
  const isLast = step === STEPS.length - 1;
  const blocking = Object.keys(errors).length;

  /** Errors are hidden until the admin has tried to move past that step. */
  const visibleErrors = (index: number): ContentErrors =>
    visited.includes(index) || isLast ? errorsForStep(errors, index) : {};

  /**
   * Moves to a step and puts its start back under the eye. Without the scroll,
   * pressing Continue at the foot of a long step opens the next one already
   * scrolled to its bottom.
   */
  const goTo = (index: number) => {
    setStep(index);
    setFurthest((f) => Math.max(f, index));

    const el = stepsTop.current;
    if (!el || typeof window === "undefined") return;

    // the topbar is sticky, so stopping at the exact top would tuck it under
    const TOPBAR = 60;
    const top = el.getBoundingClientRect().top + window.scrollY - TOPBAR;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
  };

  /**
   * Handing the title to review replaces the whole form rather than moving
   * between steps, so it never passes through `goTo`. Without this the waiting
   * screen opens at whatever depth the last step was left at.
   */
  useEffect(() => {
    if (!submitted || typeof window === "undefined") return;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [submitted]);

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

  /**
   * Owners and admins publish straight from the wizard. Everyone else hands the
   * title to review, and sees the waiting screen instead of the catalogue.
   */
  const onFinish = async () => {
    setVisited(STEPS.map((_, i) => i));
    if (blocking) {
      toast.error(`Fix the highlighted fields before ${IS_REVIEWER ? "publishing" : "submitting"}`);
      goTo(STEPS.length - 1);
      return;
    }
    if (pending) {
      toast.error("Wait for the uploads to finish processing");
      return;
    }
    const saved = await persist("draft");
    if (!saved) return;

    if (IS_REVIEWER) {
      const published = await publish.run(saved.id);
      if (published) {
        setDraft((prev) => ({ ...prev, status: published.status, approval: published.approval }));
        toast.success(published.status === "scheduled" ? "Content scheduled" : "Content published");
        router.push("/content");
      }
      return;
    }

    const sent = await submit.run(saved.id);
    if (sent) {
      setDraft((prev) => ({ ...prev, approval: sent.approval, status: sent.status }));
      setSubmitted(true);
      toast.success("Sent for admin approval");
    }
  };

  const finishing = IS_REVIEWER ? publish.pending : submit.pending;

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
            <Button icon="check" loading={finishing} onClick={onFinish}>
              {IS_REVIEWER ? "Publish" : "Submit for approval"}
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
          {IS_REVIEWER ? (
            <Badge tone={draft.status === "published" ? "ok" : "neutral"}>{draft.status}</Badge>
          ) : (
            <Badge tone={APPROVAL_TONES[draft.approval.state]}>{approvalLabel(draft.approval.state)}</Badge>
          )}
          {savedId ? <span>Draft saved</span> : <span>Not saved yet</span>}
          {pending ? (
            <span className="inline-flex items-center gap-1.5 text-accent">
              <Icon name="bolt" size={13} /> {pending} upload(s) in progress
            </span>
          ) : null}
          {blocking ? (
            <span className="ml-auto inline-flex items-center gap-1.5 text-warn">
              <Icon name="shield" size={13} /> {blocking} field(s) left before{" "}
              {IS_REVIEWER ? "publishing" : "submitting"}
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1.5 text-ok">
              <Icon name="check" size={13} /> All required fields complete
            </span>
          )}
        </div>
      </Card>

      {submitted ? (
        <Card className="animate-fade-up">
          <div className="flex flex-col items-center py-8 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warn/12 text-warn">
              <Icon name="clock" size={26} />
            </span>
            <h2 className="font-display text-[19px] font-bold text-ink">Waiting for admin approval</h2>
            <p className="mt-2 max-w-md text-[13px] text-muted">
              <strong className="text-ink">{draft.title}</strong> was sent for review. It stays out of the
              catalogue until an admin approves it — you can follow its status in the library.
            </p>

            <div className="mt-5 w-full max-w-md rounded-lg border border-border px-3">
              <DrawerRow label="Submitted">{formatDate(draft.approval.submittedAt, true)}</DrawerRow>
              <DrawerRow label="Uploaded by">{draft.uploadedBy.name}</DrawerRow>
              <DrawerRow label="Review state">{approvalLabel(draft.approval.state)}</DrawerRow>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button variant="secondary" icon="layers" onClick={() => router.push("/content")}>
                Open the library
              </Button>
              <Button
                icon="plus"
                onClick={() => {
                  setDraft(emptyDraft());
                  setSavedId(null);
                  setVisited([]);
                  goTo(0);
                  setFurthest(0);
                  setSubmitted(false);
                }}
              >
                Upload another
              </Button>
            </div>
          </div>
        </Card>
      ) : (
      <>
      {/* -------------------------------- steps ------------------------------- */}
      <div ref={stepsTop} className="relative z-10 scroll-mt-16 animate-fade-up">
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
            <Button icon="check" loading={finishing} onClick={onFinish}>
              {IS_REVIEWER ? "Publish content" : "Submit for approval"}
            </Button>
          ) : (
            <Button iconRight="chevron-right" onClick={next}>
              Continue
            </Button>
          )}
        </div>
      </div>
      </>
      )}

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
