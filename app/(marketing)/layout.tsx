import { Header } from "@/components/layout/Header";


export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {

return (
  <>
    <Header />
    <main className="pt-16">{children}</main>
  </>
);
}
