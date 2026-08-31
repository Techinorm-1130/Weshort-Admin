"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/layout/Logo";
import Icon, { type IconName } from "@/components/ui/Icon";
import { CardHead, EntityCard, OpenAction } from "@/components/ui/EntityCard";

const HIGHLIGHTS: { icon: IconName; title: string; text: string; color: string }[] = [
  {
    icon: "film",
    title: "One catalogue",
    text: "Medias, FAST channels and partner contributions in a single library.",
    color: "#e50914",
  },
  {
    icon: "bolt",
    title: "Encode and publish",
    text: "Send a source file to the encoder and push it live on any project.",
    color: "#2f6bff",
  },
  {
    icon: "shield",
    title: "Rights under control",
    text: "Territories, windows and monetisation models tracked per title.",
    color: "#3ddc84",
  },
];

/**
 * Two-column auth screen: the brand story on the left, the form in the same
 * notched card used across the CMS on the right.
 */
export default function AuthShell({
  eyebrow, title, subtitle, children, footer,
}: {
  /** Small label in the card header tab. */
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background px-4 py-8 lg:px-10 lg:py-12">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* ------------------------------ brand side ------------------------- */}
        <section className="hidden lg:block">
          <Link href="/users" className="inline-flex">
            <Logo height={30} />
          </Link>

          <h1 className="display-title mt-10 text-[54px] text-ink">
            Publish
            <br />
            every short
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            The WeShort back office: your catalogue, your encoding plan and your projects, in one place.
          </p>

          <ul className="mt-10 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex items-start gap-4 rounded-[22px] bg-surface p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                  style={{ background: `${item.color}1f`, color: item.color }}
                >
                  <Icon name={item.icon} size={19} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">{item.title}</span>
                  <span className="mt-0.5 block text-[13px] text-muted">{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------- form side ------------------------- */}
        <section>
          <div className="mb-6 flex lg:hidden">
            <Logo height={24} />
          </div>

          <EntityCard
            head={
              <CardHead
                avatar={
                  <span className="grad-brand flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white">
                    WS
                  </span>
                }
                title="WeShort CMS"
                subtitle={eyebrow}
              />
            }
            actions={<OpenAction label="Back to the site" onClick={() => window.open("https://weshort.com", "_blank")} />}
          >
            <h2 className="display-title text-[30px] text-ink">{title}</h2>
            <p className="mt-3 text-[13px] text-muted">{subtitle}</p>

            <div className="mt-7 space-y-4">{children}</div>

            <div className="mt-7 border-t border-line pt-5 text-center text-[13px] text-muted">{footer}</div>
          </EntityCard>

          <p className="mt-5 text-center text-xs text-muted/70">
            Demo mode — the mock API accepts any credentials while the backend is not connected.
          </p>
        </section>
      </div>
    </div>
  );
}
