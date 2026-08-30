import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Roboto,
  Stack_Sans_Headline,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const stackSansHeadline = Stack_Sans_Headline({
  subsets: ["latin"],
  variable: "--font-stack-sans-headline",
});

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Oronyx",
  description: "Scoped Agent Wallets on Sui Blockchain",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        roboto.variable,
        stackSansHeadline.variable,
        "dark",
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
