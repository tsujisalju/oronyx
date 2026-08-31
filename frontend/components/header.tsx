"use client";

import dynamic from "next/dynamic";
import OronyxLogomark from "./icons/oronyx-logomark";
import { Button } from "./ui/button";
import Link from "next/link";

const ConnectButton = dynamic(
  () =>
    import("@/app/dapp-kit-client-provider").then((mod) => mod.ConnectButton),
  { ssr: false, loading: () => <Button disabled>Loading...</Button> },
);

export default function Header() {
  return (
    <header className="w-full max-w-7xl mx-auto sticky top-0 flex flex-row justify-between px-8 py-4 backdrop-blur-lg">
      <Link href={"/"}>
        <OronyxLogomark />
      </Link>
      <ConnectButton />
    </header>
  );
}
