"use client";

import { useState } from "react";
import Rail from "@/components/layout/Rail";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import UploadManagerProvider from "@/components/uploads/UploadManager";
import UploadDock from "@/components/uploads/UploadDock";

/** Three-zone workspace: icon rail, detailed sidebar, content. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // The upload manager sits above the pages so transfers survive navigation.
    <UploadManagerProvider>
      <div className="min-h-screen bg-background">
        <Rail onOpenMenu={() => setSidebarOpen((v) => !v)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="lg:pl-[332px]">
          <Topbar onOpenMenu={() => setSidebarOpen(true)} />
          <main className="mx-auto w-full max-w-[1440px] px-4 py-5 lg:px-6">
            {children}
            {/* room for the floating upload dock, so it covers nothing */}
            <div aria-hidden style={{ height: "var(--upload-dock-space, 0px)" }} />
          </main>
        </div>

        <UploadDock />
      </div>
    </UploadManagerProvider>
  );
}
