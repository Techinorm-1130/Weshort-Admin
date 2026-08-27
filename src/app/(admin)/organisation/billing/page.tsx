"use client";

import { orgApi } from "@/lib/api/resources";
import { useQuery } from "@/lib/hooks";
import { formatBytes, formatMinutes, percent } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Badge, Card, CardTitle, ProgressBar, Skeleton } from "@/components/ui/Primitives";
import { DonutChart } from "@/components/charts/Charts";
import { useToast } from "@/components/ui/Toast";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "€149",
    features: ["1 project", "500 GB bandwidth", "20 h encoding", "Email support"],
  },
  {
    id: "studio",
    name: "Studio",
    price: "€490",
    features: ["5 projects", "5 TB bandwidth", "100 h encoding", "FAST channels", "Priority support"],
    current: true,
  },
  {
    id: "network",
    name: "Network",
    price: "Custom",
    features: ["Unlimited projects", "Custom CDN", "Unlimited encoding", "SSO and audit log", "Dedicated manager"],
  },
];

const INVOICES = [
  { id: "INV-2026-08", period: "August 2026", amount: "€490.00", status: "paid" },
  { id: "INV-2026-07", period: "July 2026", amount: "€490.00", status: "paid" },
  { id: "INV-2026-06", period: "June 2026", amount: "€490.00", status: "paid" },
  { id: "INV-2026-05", period: "May 2026", amount: "€390.00", status: "paid" },
];

export default function BillingPage() {
  const toast = useToast();
  const { data: org, loading } = useQuery(() => orgApi.get(), []);

  if (loading || !org) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  const storagePct = percent(org.storageUsedBytes, org.storageQuotaBytes);
  const encodingPct = percent(org.encodingUsedMin, org.encodingQuotaMin);

  return (
    <>
      <PageHeader
        title="Plan and billing"
        crumbs={[{ label: "My organisation" }, { label: "Plan and billing" }]}
        subtitle={`You are on the ${org.plan} plan.`}
        actions={
          <Button variant="secondary" icon="download" onClick={() => toast.success("Invoices exported")}>
            Download invoices
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle title="Usage this period" subtitle="Resets on the 1st of each month" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted">Storage</span>
                <span className="text-ink">
                  {formatBytes(org.storageUsedBytes)} / {formatBytes(org.storageQuotaBytes, 0)}
                </span>
              </div>
              <ProgressBar value={storagePct} tone="info" />
              <p className="mt-1.5 text-xs text-muted">{storagePct}% consumed</p>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted">Encoding minutes</span>
                <span className="text-ink">
                  {formatMinutes(org.encodingUsedMin)} / {formatMinutes(org.encodingQuotaMin)}
                </span>
              </div>
              <ProgressBar value={encodingPct} />
              <p className="mt-1.5 text-xs text-muted">{encodingPct}% consumed</p>
            </div>
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <DonutChart
              size={180}
              thickness={28}
              segments={[
                { label: "Encoding used", value: org.encodingUsedMin, color: "#e50914" },
                { label: "Encoding left", value: org.encodingQuotaMin - org.encodingUsedMin, color: "rgba(255,255,255,0.14)" },
              ]}
              centerValue={`${encodingPct}%`}
              centerLabel="of plan"
            />
          </div>
        </Card>

        <Card padded={false}>
          <div className="px-5 pt-5">
            <CardTitle title="Invoices" />
          </div>
          <ul className="divide-y divide-line">
            {INVOICES.map((invoice) => (
              <li key={invoice.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted">
                  <Icon name="file" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{invoice.period}</p>
                  <p className="text-xs text-muted">{invoice.id}</p>
                </div>
                <span className="text-sm text-ink">{invoice.amount}</span>
                <Badge tone="ok">{invoice.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={plan.current ? "border-brand/50" : ""}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">{plan.name}</h3>
                <p className="mt-1 font-display text-2xl font-bold text-ink">
                  {plan.price}
                  {plan.price !== "Custom" ? <span className="text-sm font-normal text-muted"> / month</span> : null}
                </p>
              </div>
              {plan.current ? <Badge tone="brand">Current plan</Badge> : null}
            </div>

            <ul className="mt-5 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-muted-strong">
                  <Icon name="check" size={15} className="text-ok" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button
                variant={plan.current ? "secondary" : "primary"}
                disabled={plan.current}
                className="w-full"
                onClick={() => toast.info(`Contact sales to move to ${plan.name}`)}
              >
                {plan.current ? "Your plan" : "Choose this plan"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
