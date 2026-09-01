import { ReactNode } from "react";

import AppSidebar from "@/components/app-sidebar";
import AppTopbar from "@/components/app-topbar";
import ConnectGuard from "@/components/auth/connect-guard";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConnectGuard>
      <div className="flex min-h-screen">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />

          <main className="min-w-0 flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ConnectGuard>
  );
}