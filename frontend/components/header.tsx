"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";

import OronyxLogomark from "./icons/oronyx-logomark";
import { Button } from "./ui/button";

const ConnectButton = dynamic(
  () =>
    import("@/app/dapp-kit-client-provider").then((mod) => mod.ConnectButton),
  {
    ssr: false,
    loading: () => <Button disabled>Loading...</Button>,
  },
);

export default function Header() {
  const pathname = usePathname();

  const isAppRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/agents") ||
    pathname.startsWith("/audit");

  if (isAppRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-4">
        <Link href="/">
          <OronyxLogomark />
        </Link>

        <ConnectButton />
      </div>
    </header>
  );
}