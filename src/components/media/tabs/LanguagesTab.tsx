"use client";

import { useState } from "react";
import type { Media, Taxonomies, Translation } from "@/types";
import { labelOf, slugify } from "@/lib/format";
import { Card, CardTitle } from "@/components/ui/Primitives";
import { Select, TextInput } from "@/components/ui/Fields";
import RichText from "@/components/ui/RichText";
import { ImageDrop } from "@/components/ui/Uploader";
import Icon from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Overlays";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const RATIOS: (keyof Translation["images"])[] = ["16:6", "16:9", "3:4", "1:1", "2:3"];

export default function LanguagesTab({
  media, onChange, taxonomies,
}: {
  media: Media;
  onChange: (patch: Partial<Media>) => void;
  taxonomies: Taxonomies;
}) {
  const toast = useToast();
  const [active, setActive] = useState(media.translations[0]?.language ?? media.defaultLanguage);
  const [adding, setAdding] = useState(false);
  const [newLang, setNewLang] = useState("");

  const translation =
    media.translations.find((t) => t.language === active) ?? media.translations[0];

  const patchTranslation = (values: Partial<Translation>) =>
    onChange({
      translations: media.translations.map((t) =>
        t.language === translation.language ? { ...t, ...values } : t,
      ),
    });

  const addLanguage = () => {
    if (!newLang || media.translations.some((t) => t.language === newLang)) return;
    onChange({
      translations: [
        ...media.translations,
        { language: newLang, title: "", slug: "", shortHook: "", description: "", images: {} },
      ],
    });
    setActive(newLang);
    setAdding(false);
    setNewLang("");
    toast.success(`${labelOf(taxonomies.languages, newLang)} added`);
  };

  const removeLanguage = (lang: string) => {
    if (media.translations.length === 1) return;
    onChange({ translations: media.translations.filter((t) => t.language !== lang) });
    setActive(media.translations[0].language);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle
          title="Language management"
          subtitle={
            <span>
              Content in <strong className="text-ink">{labelOf(taxonomies.languages, translation.language)}</strong>
              {translation.language === media.defaultLanguage ? (
                <span className="ml-2 rounded-md bg-surface-3 px-2 py-0.5 text-xs">Default language</span>
              ) : null}
            </span>
          }
          action={
            <div className="flex items-center gap-2">
              {media.translations.map((t) => {
                const isActive = t.language === translation.language;
                return (
                  <button
                    key={t.language}
                    onClick={() => setActive(t.language)}
                    className={`relative rounded-lg border px-3.5 py-2 text-center transition ${
                      isActive ? "border-brand bg-brand/10 text-ink" : "border-line text-muted hover:text-ink"
                    }`}
                  >
                    <span className="block text-sm font-bold uppercase">{t.language}</span>
                    <span className="block text-[10px] text-muted">
                      {t.language === media.defaultLanguage ? "Default" : "Translation"}
                    </span>
                    {t.title ? (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-ok" />
                    ) : null}
                  </button>
                );
              })}
              <button
                onClick={() => setAdding(true)}
                aria-label="Add a language"
                className="flex h-12 w-11 items-center justify-center rounded-lg border border-line text-muted transition hover:border-brand hover:text-ink"
              >
                <Icon name="plus" size={18} />
              </button>
            </div>
          }
        />

        <div className="space-y-4">
          <TextInput
            label="Title"
            required
            value={translation.title}
            onChange={(e) => {
              patchTranslation({ title: e.target.value, slug: slugify(e.target.value) });
            }}
          />

          <TextInput
            label="Slug"
            prefix="https://your-project/content/"
            value={translation.slug}
            onChange={(e) => patchTranslation({ slug: slugify(e.target.value) })}
          />

          <RichText
            label="Short hook"
            rows={3}
            value={translation.shortHook}
            onChange={(v) => patchTranslation({ shortHook: v })}
          />

          <RichText
            label="Description"
            rows={9}
            value={translation.description}
            onChange={(v) => patchTranslation({ description: v })}
          />

          <div>
            <p className="mb-3 text-[13px] font-medium text-muted-strong">
              Illustrations (each image must be under 15 MB)
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {RATIOS.map((ratio) => (
                <ImageDrop
                  key={ratio}
                  ratio={ratio}
                  value={translation.images[ratio]}
                  onChange={(dataUrl) =>
                    patchTranslation({ images: { ...translation.images, [ratio]: dataUrl } })
                  }
                />
              ))}
            </div>
          </div>

          {media.translations.length > 1 && translation.language !== media.defaultLanguage ? (
            <div className="flex justify-end border-t border-line pt-4">
              <Button variant="danger" size="sm" icon="trash" onClick={() => removeLanguage(translation.language)}>
                Remove this language
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a language"
        description="Create a new translation for this media."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={addLanguage} disabled={!newLang}>
              Add language
            </Button>
          </>
        }
      >
        <Select
          label="Language"
          options={taxonomies.languages.filter((l) => !media.translations.some((t) => t.language === l.value))}
          value={newLang}
          onChange={(e) => setNewLang(e.target.value)}
        />
      </Modal>
    </div>
  );
}
