"use client";

import dynamic from "next/dynamic";
import OronyxLogomark from "../icons/oronyx-logomark";
import { Button } from "./button";

const ConnectButton = dynamic(
  () =>
    import("@/app/dapp-kit-client-provider").then((mod) => mod.ConnectButton),
  { ssr: false, loading: () => <Button disabled>Loading...</Button> },
);

export default function Header() {
  return (
    <header className="w-full max-w-5xl mx-auto sticky top-0 flex flex-row justify-between p-4">
      <OronyxLogomark />
      <ConnectButton />
    </header>
  );
}
