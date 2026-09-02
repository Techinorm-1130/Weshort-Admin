"use client";

import { useState } from "react";
import { landingApi } from "@/lib/api/resources";
import { useMutation, useQuery } from "@/lib/hooks";
import { timeAgo } from "@/lib/format";
import type { LandingPage, LandingSection, SectionType, SectionValue } from "@/types";
import { SECTION_LIBRARY, SECTION_MAP, createSection } from "@/lib/landing-sections";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Badge, Card, CardTitle, ErrorBox, Skeleton } from "@/components/ui/Primitives";
import { ConfirmDialog, Modal } from "@/components/ui/Overlays";
import { TextArea, TextInput } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";
import FieldEditor from "@/components/landing/FieldEditor";

const PAGE_ID = "page_home";

export default function LandingBuilderPage() {
  const toast = useToast();
  // The query cache is the working draft — no mirrored state, no sync effect.
  const { data: draft, loading, error, refresh, setData } = useQuery(() => landingApi.get(PAGE_ID), []);

  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toRemove, setToRemove] = useState<LandingSection | null>(null);
  const [showSeo, setShowSeo] = useState(false);
  const [payloadOpen, setPayloadOpen] = useState(false);

  const update = (patch: Partial<LandingPage>) =>
    setData((prev) => ({ ...(prev as LandingPage), ...patch }));

  const save = useMutation((payload: Partial<LandingPage>) => landingApi.saveDraft(PAGE_ID, payload));
  const publish = useMutation(() => landingApi.publish(PAGE_ID));

  if (loading || !draft) {
    return (
      <>
        <PageHeader title="Landing page" crumbs={[{ label: "Site", icon: "globe" }]} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Skeleton className="h-96 rounded-lg xl:col-span-4" />
          <Skeleton className="h-96 rounded-lg xl:col-span-8" />
        </div>
      </>
    );
  }

  const activeId = selected ?? draft.sections[0]?.id ?? null;
  const section = draft.sections.find((s) => s.id === activeId) ?? null;
  const definition = section ? SECTION_MAP[section.type] : null;

  const setSections = (sections: LandingSection[]) => {
    update({ sections });
    setDirty(true);
  };

  const patchSection = (id: string, patch: Partial<LandingSection>) =>
    setSections(draft.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const patchProp = (id: string, key: string, value: SectionValue) =>
    setSections(draft.sections.map((s) => (s.id === id ? { ...s, props: { ...s.props, [key]: value } } : s)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= draft.sections.length) return;
    const next = [...draft.sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  };

  const addSection = (type: SectionType) => {
    const created = createSection(type);
    setSections([...draft.sections, created]);
    setSelected(created.id);
    setAdding(false);
    toast.success(`${SECTION_MAP[type].label} section added`);
  };

  const duplicate = (source: LandingSection) => {
    const copy: LandingSection = {
      ...structuredClone(source),
      id: `${source.id}_copy_${draft.sections.length}`,
      name: `${source.name} copy`,
    };
    const index = draft.sections.findIndex((s) => s.id === source.id);
    const next = [...draft.sections];
    next.splice(index + 1, 0, copy);
    setSections(next);
    setSelected(copy.id);
  };

  const onSave = async () => {
    const saved = await save.run({ sections: draft.sections, seo: draft.seo });
    if (saved) {
      update({ status: saved.status, updatedAt: saved.updatedAt });
      setDirty(false);
      toast.success("Draft saved — the live site is unchanged until you publish");
    }
  };

  const onPublish = async () => {
    if (dirty) {
      const saved = await save.run({ sections: draft.sections, seo: draft.seo });
      if (!saved) return;
      setDirty(false);
    }
    const published = await publish.run();
    if (published) {
      update(published);
      toast.success(`Published — version ${published.version} is live on weshort.com`);
    }
  };

  const liveVersion = draft.published?.version ?? 0;

  return (
    <>
      <PageHeader
        title="Landing page"
        icon="globe"
        iconColor="#7c3aed"
        crumbs={[{ label: "Site" }, { label: "Landing page" }]}
        activeTab="builder"
        tabs={[
          { id: "builder", label: "Builder", icon: "layers", color: "#7c3aed", onSelect: () => undefined },
          { id: "seo", label: "SEO", icon: "search", color: "#0d9488", onSelect: () => setShowSeo(true) },
          { id: "payload", label: "API payload", icon: "file", color: "#0369a1", onSelect: () => setPayloadOpen(true) },
        ]}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={dirty ? "warn" : draft.status === "published" ? "ok" : "neutral"}>
              {dirty ? "Unsaved changes" : draft.status}
            </Badge>
            <span>
              v{liveVersion} live · updated {timeAgo(draft.updatedAt)}
            </span>
          </span>
        }
        actions={
          <>
            <Button variant="ghost" icon="file" onClick={() => setPayloadOpen(true)}>
              API payload
            </Button>
            <Button variant="secondary" icon="settings" onClick={() => setShowSeo(true)}>
              SEO
            </Button>
            <Button variant="secondary" icon="check" loading={save.pending} onClick={onSave} disabled={!dirty}>
              Save draft
            </Button>
            <Button icon="bolt" loading={publish.pending} onClick={onPublish}>
              Publish
            </Button>
          </>
        }
      />

      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* ---------------------------- section list ---------------------------- */}
        <Card className="xl:col-span-4" padded={false}>
          <div className="px-4 pt-4">
            <CardTitle
              title="Sections"
              subtitle={`${draft.sections.filter((s) => s.visible).length} of ${draft.sections.length} visible`}
              action={
                <Button size="sm" icon="plus" onClick={() => setAdding(true)}>
                  Add
                </Button>
              }
            />
          </div>

          <ul className="space-y-1 px-4 pb-4">
            {draft.sections.map((item, index) => {
              const active = item.id === activeId;
              const meta = SECTION_MAP[item.type];
              return (
                <li key={item.id}>
                  <div
                    className={`rounded-lg border transition ${
                      active
                        ? "border-accent/40 bg-accent-soft"
                        : "border-transparent hover:border-border hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 p-2">
                      <button
                        type="button"
                        onClick={() => setSelected(item.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                            active ? "bg-accent text-white" : "bg-surface-2 text-muted"
                          }`}
                        >
                          <Icon name={meta.icon} size={15} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold text-ink">{item.name}</span>
                          <span className="block truncate text-[11px] text-muted">
                            {meta.label}
                            {item.visible ? "" : " · hidden"}
                          </span>
                        </span>
                      </button>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-surface-2 hover:text-ink disabled:opacity-25"
                        >
                          <Icon name="chevron-down" size={13} className="rotate-180" />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          onClick={() => move(index, 1)}
                          disabled={index === draft.sections.length - 1}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-surface-2 hover:text-ink disabled:opacity-25"
                        >
                          <Icon name="chevron-down" size={13} />
                        </button>
                        <button
                          type="button"
                          aria-label={item.visible ? "Hide section" : "Show section"}
                          onClick={() => patchSection(item.id, { visible: !item.visible })}
                          className={`flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-surface-2 hover:text-ink ${
                            item.visible ? "" : "opacity-40"
                          }`}
                        >
                          <Icon name="eye" size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* ------------------------------- editor ------------------------------- */}
        <div className="xl:col-span-8">
          {section && definition ? (
            <Card>
              <CardTitle
                title={section.name}
                subtitle={definition.description}
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="subtle" icon="layers" onClick={() => duplicate(section)}>
                      Duplicate
                    </Button>
                    <Button size="sm" variant="danger" icon="trash" onClick={() => setToRemove(section)}>
                      Remove
                    </Button>
                  </div>
                }
              />

              <div className="space-y-4">
                <TextInput
                  label="Section label (admin only)"
                  value={section.name}
                  onChange={(e) => patchSection(section.id, { name: e.target.value })}
                />

                <div className="border-t border-line pt-4">
                  <div className="space-y-4">
                    {definition.fields.map((field) => (
                      <FieldEditor
                        key={field.key}
                        field={field}
                        value={section.props[field.key]}
                        onChange={(next) => patchProp(section.id, field.key, next)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="py-10 text-center text-sm text-muted">Select a section on the left to edit it.</p>
            </Card>
          )}
        </div>
      </div>

      {/* ----------------------------- add section ----------------------------- */}
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a section"
        description="Each block maps to a component on the WeShort landing page."
        width="max-w-2xl"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SECTION_LIBRARY.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => addSection(item.type)}
              className="flex items-start gap-3 rounded-lg border border-border p-3 text-left transition hover:border-brand/40 hover:bg-surface-2"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted">
                <Icon name={item.icon} size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-ink">{item.label}</span>
                <span className="mt-0.5 block text-[11px] text-muted">{item.description}</span>
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* --------------------------------- SEO --------------------------------- */}
      <Modal
        open={showSeo}
        onClose={() => setShowSeo(false)}
        title="SEO and sharing"
        footer={
          <Button onClick={() => setShowSeo(false)}>Done</Button>
        }
      >
        <div className="space-y-4">
          <TextInput
            label="Page title"
            value={draft.seo.title}
            onChange={(e) => {
              update({ seo: { ...draft.seo, title: e.target.value } });
              setDirty(true);
            }}
          />
          <TextArea
            label="Meta description"
            rows={3}
            value={draft.seo.description}
            onChange={(e) => {
              update({ seo: { ...draft.seo, description: e.target.value } });
              setDirty(true);
            }}
          />
        </div>
      </Modal>

      {/* ------------------------------ payload -------------------------------- */}
      <Modal
        open={payloadOpen}
        onClose={() => setPayloadOpen(false)}
        title="What the site receives"
        description="GET /landing/published/home — the published snapshot, hidden sections stripped."
        width="max-w-3xl"
        footer={<Button onClick={() => setPayloadOpen(false)}>Close</Button>}
      >
        <pre className="max-h-[50vh] overflow-auto rounded-lg border border-border bg-surface-2 p-3 text-[12px] leading-relaxed text-muted-strong">
          {JSON.stringify(
            {
              slug: draft.slug,
              version: liveVersion,
              seo: draft.published?.seo ?? draft.seo,
              sections: (draft.published?.sections ?? draft.sections)
                .filter((s) => s.visible)
                .map((s) => ({ id: s.id, type: s.type, props: s.props })),
            },
            null,
            2,
          )}
        </pre>
      </Modal>

      {/* --------------------------- remove section ---------------------------- */}
      <ConfirmDialog
        open={!!toRemove}
        onClose={() => setToRemove(null)}
        title="Remove section"
        confirmLabel="Remove"
        message={`"${toRemove?.name}" is removed from the draft. The live page keeps it until you publish.`}
        onConfirm={() => {
          if (!toRemove) return;
          const next = draft.sections.filter((s) => s.id !== toRemove.id);
          setSections(next);
          setSelected(next[0]?.id ?? null);
          setToRemove(null);
          toast.success("Section removed from the draft");
        }}
      />
    </>
  );
}
