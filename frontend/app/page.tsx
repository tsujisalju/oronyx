"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import OronyxLogomark from "@/components/icons/oronyx-logomark";
import { useWalletConnection } from "@mysten/dapp-kit-react";
import { ConnectButton } from "./dapp-kit-client-provider";

export default function Home() {
  const connection = useWalletConnection();
  return (
    <main>
      <div className="mx-auto grid h-full max-w-7xl place-items-center px-8 py-16 lg:px-16">
        <Card className="w-full max-w-4xl border-border/70 bg-card/70 shadow-xl">
          <CardContent className="grid gap-8 p-8 md:p-12">
            <OronyxLogomark />
            <div className="max-w-3xl">
              <h1 className="font-display text-4xl tracking-tight md:text-6xl">
                Agentic DeFi on Your Terms
              </h1>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Oronyx enables autonomous asset management on Sui with scoped,
                policy-enforced agent wallets and a comprehensive audit trail.
              </p>
            </div>

            {connection.status == "connected" ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/agents"
                  className={cn(buttonVariants({ size: "lg" }), "rounded-lg")}
                >
                  Manage Agents
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-lg",
                  )}
                >
                  Open Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <ConnectButton>
                  <span>Get Started</span>
                </ConnectButton>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
