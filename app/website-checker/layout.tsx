import type { ReactNode } from "react";
import WebsiteCheckerNav from "@/components/website-checker/WebsiteCheckerNav";

export default function WebsiteCheckerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-950">
      <WebsiteCheckerNav />
      <main className="pt-24">{children}</main>
    </div>
  );
}

