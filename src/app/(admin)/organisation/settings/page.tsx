"use client";

import { orgApi, taxonomyApi } from "@/lib/api/resources";
import { useMutation, useQuery } from "@/lib/hooks";
import { formatBytes, formatMinutes, percent, slugify } from "@/lib/format";
import { USING_MOCK, API_BASE } from "@/lib/api/http";
import type { Organisation } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Badge, Card, CardTitle, ErrorBox, ProgressBar, Skeleton } from "@/components/ui/Primitives";
import { Select, TextInput } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";

const TIMEZONES = [
  "Europe/Rome", "Europe/Paris", "Europe/London", "America/New_York", "Asia/Kolkata", "UTC",
].map((v) => ({ value: v, label: v }));

export default function OrganisationSettingsPage() {
  const toast = useToast();
  const { data: draft, loading, error, refresh, setData } = useQuery(() => orgApi.get(), []);
  const { data: taxonomies } = useQuery(() => taxonomyApi.all(), []);


  const save = useMutation((payload: Partial<Organisation>) => orgApi.update(payload));

  /** Edits are written straight into the query cache — no mirrored state. */
  const set = <K extends keyof Organisation>(key: K, value: Organisation[K]) =>
    setData((prev) => ({ ...(prev as Organisation), [key]: value }));

  if (loading || !draft || !taxonomies) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  const storagePct = percent(draft.storageUsedBytes, draft.storageQuotaBytes);
  const encodingPct = percent(draft.encodingUsedMin, draft.encodingQuotaMin);

  return (
    <>
      <PageHeader
        title="Organisation settings"
        crumbs={[{ label: "My organisation" }, { label: "Settings" }]}
        subtitle="Identity, defaults and quotas of your WeShort account."
        actions={
          <Button
            icon="check"
            loading={save.pending}
            onClick={async () => {
              const saved = await save.run(draft);
              if (saved) toast.success("Settings saved");
            }}
          >
            Save
          </Button>
        }
      />

      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle title="Identity" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              label="Organisation name"
              required
              value={draft.name}
              onChange={(e) => {
                set("name", e.target.value);
                set("slug", slugify(e.target.value));
              }}
            />
            <TextInput label="Billing email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
            <TextInput label="Slug" prefix="weshort.com/" value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
            <Select
              label="Country"
              options={taxonomies.countries}
              value={draft.country}
              onChange={(e) => set("country", e.target.value)}
            />
            <Select
              label="Timezone"
              options={TIMEZONES}
              value={draft.timezone}
              onChange={(e) => set("timezone", e.target.value)}
            />
            <Select
              label="Default content language"
              options={taxonomies.languages}
              value={draft.defaultLanguage}
              onChange={(e) => set("defaultLanguage", e.target.value)}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle title="Quotas" subtitle={`Plan: ${draft.plan}`} />
            <div className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="text-muted">Storage</span>
                  <span className="text-ink">
                    {formatBytes(draft.storageUsedBytes)} / {formatBytes(draft.storageQuotaBytes, 0)}
                  </span>
                </div>
                <ProgressBar value={storagePct} tone="info" />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="text-muted">Encoding</span>
                  <span className="text-ink">
                    {formatMinutes(draft.encodingUsedMin)} / {formatMinutes(draft.encodingQuotaMin)}
                  </span>
                </div>
                <ProgressBar value={encodingPct} />
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle title="API connection" subtitle="Where the CMS reads and writes its data" />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {USING_MOCK ? (
                  <Badge tone="warn" icon="bolt">
                    Mock data
                  </Badge>
                ) : (
                  <Badge tone="ok" icon="check">
                    Live backend
                  </Badge>
                )}
              </div>
              <p className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-3.5 py-3 text-[13px] text-muted">
                <Icon name="help" size={15} className="mt-0.5 shrink-0" />
                {USING_MOCK
                  ? "Set NEXT_PUBLIC_API_BASE_URL in .env.local to point every screen at the real API. No component change is needed."
                  : `Connected to ${API_BASE}`}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
