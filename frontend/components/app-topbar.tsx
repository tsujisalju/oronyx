"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const ConnectButton = dynamic(
  () =>
    import("@/app/dapp-kit-client-provider").then((mod) => mod.ConnectButton),
  {
    ssr: false,
    loading: () => <Button disabled>Loading...</Button>,
  },
);

export default function AppTopbar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-end border-b border-border/40 px-8">
      <ConnectButton />
    </header>
  );
}
