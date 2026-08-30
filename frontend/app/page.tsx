import OronyxLogo from "@/components/icons/oronyx-logo";

export default function Home() {
  return (
    <div className="w-full h-screen grid place-content-center px-8 lg:px-16">
      <div className="flex flex-col gap-6 text-center lg:text-left">
        <div className="flex flex-row gap-2 items-center justify-center lg:justify-start">
          <OronyxLogo className="size-10" />
          <p className="font-display font-light text-2xl">Oronyx</p>
        </div>
        <h1 className="font-black text-4xl">Agentic DeFi on Your Terms</h1>
        <p className="text-muted-foreground text-lg">
          Oronyx enables autonomous asset management on Sui with scoped,
          policy-enforced agent wallets and comprehensive audit trail, making
          agentic DeFi safer and more accessible for all.
        </p>
      </div>
    </div>
  );
}
