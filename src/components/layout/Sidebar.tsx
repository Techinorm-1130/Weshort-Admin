"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { APP_VERSION, NAV } from "@/lib/nav";
import { orgApi } from "@/lib/api/resources";
import { useQuery } from "@/lib/hooks";
import Icon from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Primitives";
import Logo from "./Logo";

export default function Sidebar({
  open, collapsed, onClose,
}: {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: org } = useQuery(() => orgApi.get(), []);

  const logout = () => {
    window.localStorage.removeItem("weshort.admin.token");
    router.push("/login");
  };

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden" onClick={onClose} />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-background transition-[width,transform] duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-[268px] lg:w-[92px]" : "w-[268px]"}`}
      >
        {/* brand */}
        <div className={`flex h-[92px] shrink-0 items-center justify-between px-6 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <Link href="/users" className="flex items-center">
            <Logo height={22} wordmark={!collapsed} showCms={false} />
          </Link>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted transition hover:text-ink lg:hidden"
            aria-label="Close menu"
          >
            <Icon name="close" size={17} />
          </button>
        </div>

        {/* navigation */}
        <nav className="flex-1 overflow-y-auto px-4 pb-4">
          {NAV.map((section) => (
            <div key={section.id} className="mb-6">
              {section.label ? (
                <p
                  className={`mb-2.5 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted/70 ${
                    collapsed ? "lg:hidden" : ""
                  }`}
                >
                  {section.label}
                </p>
              ) : null}

              <ul className="space-y-1.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        title={item.label}
                        className={`group flex items-center gap-3 rounded-full py-2.5 pl-2.5 pr-4 text-sm font-semibold transition ${
                          collapsed ? "lg:justify-center lg:px-0" : ""
                        } ${
                          active
                            ? "bg-ink text-on-ink"
                            : "text-muted hover:bg-surface hover:text-ink"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                            active ? "bg-on-ink/10 text-on-ink" : "bg-surface text-muted group-hover:text-ink"
                          }`}
                        >
                          <Icon name={item.icon} size={17} />
                        </span>
                        <span className={`flex-1 truncate ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* account */}
        <div className="shrink-0 px-4 pb-6">
          <div className={`card-premium flex items-center gap-3 p-3 ${collapsed ? "lg:justify-center lg:bg-transparent lg:p-0 lg:shadow-none" : ""}`}>
            <Avatar initials="WS" color="#e50914" size={38} ring={false} />
            <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-bold text-ink">{org?.name ?? "WeShort Srl"}</p>
              <p className="truncate text-xs text-muted">{org?.email ?? "-"}</p>
            </div>
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-muted transition hover:text-ink ${
                collapsed ? "lg:hidden" : ""
              }`}
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
          <p className={`mt-3 px-3 text-[11px] text-muted/60 ${collapsed ? "lg:hidden" : ""}`}>
            Version {APP_VERSION}
          </p>
        </div>
      </aside>
    </>
  );
}
