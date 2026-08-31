"use client";

import { useState } from "react";
import Link from "next/link";
import { BotOff, Plus, Wallet } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Agent, loadMockAgents } from "@/lib/agents";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useWalletConnection } from "@mysten/dapp-kit-react";
import { ConnectButton } from "../../dapp-kit-client-provider";
import AgentCard from "./agent-card";

function AgentsList({ agents }: { agents: Agent[] }) {
  return (
    <>
      {agents.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {agents.map((agent, index) => (
            <AgentCard key={`agent-${index}`} agent={agent} />
          ))}
        </div>
      ) : (
        <Empty className="border border-dashed mt-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BotOff />
            </EmptyMedia>
            <EmptyTitle>No Agents Yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any agents yet. Start automating your
              finances by creating your first agent.
            </EmptyDescription>
            <EmptyContent className="flex flex-row justify-center gap-2">
              <Link
                href="/agents/new"
                className={cn(buttonVariants({ size: "lg" }), "rounded-lg")}
              >
                <Plus className="size-4" />
                Create Agent
              </Link>
            </EmptyContent>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
}

export default function AgentsPage() {
  const connection = useWalletConnection();
  const [agents] = useState<Agent[]>(loadMockAgents);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-display">Agents</h1>
            <p className="mt-2 text-muted-foreground">
              Manage autonomous agents, policies, and vaults.
            </p>
          </div>

          {connection.status === "connected" && (
            <Link
              href="/agents/new"
              className={cn(buttonVariants({ size: "lg" }), "rounded-lg")}
            >
              <Plus className="size-4" />
              Create Agent
            </Link>
          )}
        </div>

        {connection.status === "connected" ? (
          <AgentsList agents={agents} />
        ) : (
          <Empty className="border border-dashed mt-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wallet />
              </EmptyMedia>
              <EmptyTitle>Not Connected</EmptyTitle>
              <EmptyDescription>
                You need a wallet to use Oronyx. Connect a wallet or log in to
                get started.
              </EmptyDescription>
              <EmptyContent className="flex flex-row justify-center gap-2">
                <ConnectButton />
              </EmptyContent>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </main>
  );
}
