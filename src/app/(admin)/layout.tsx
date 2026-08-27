"use client";

import { useState } from "react";
import { currentYear } from "@/lib/format";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={menuOpen} collapsed={collapsed} onClose={() => setMenuOpen(false)} />

      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[92px]" : "lg:pl-[268px]"}`}>
        <Topbar onOpenMenu={() => setMenuOpen(true)} onToggleCollapse={() => setCollapsed((v) => !v)} />

        <main className="mx-auto w-full max-w-[1560px] px-4 pb-10 pt-4 lg:px-6">{children}</main>

        <footer className="px-4 pb-8 text-center text-[13px] text-muted lg:px-6">
          Copyright © {currentYear()} WeShort Srl. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
