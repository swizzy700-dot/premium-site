import { ReactNode } from "react";
import { Header } from "@/components/layout/Header";

export default function ServicesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Header />  {/* 🔵 WebIntel header ONLY here */}
      {children}
    </>
  );
}