import type { ReactNode } from "react";
import WebsiteCheckerNav from "@/components/website-checker/WebsiteCheckerNav";
import FloatingAiAssistant from "@/components/website-checker/FloatingAiAssistant";

export default function WebsiteCheckerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-white">
      <WebsiteCheckerNav />
      <main className="pt-24">{children}</main>
      <FloatingAiAssistant />
    </div>
  );
}