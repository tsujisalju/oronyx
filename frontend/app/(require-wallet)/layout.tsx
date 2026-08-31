import ConnectGuard from "@/components/auth/connect-guard";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <ConnectGuard>{children}</ConnectGuard>;
}
