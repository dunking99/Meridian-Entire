import { notFound } from "next/navigation";
import PortfolioApp from "@/components/portfolio-app";

const sections = ["holdings", "performance", "exposure", "plan", "activity"] as const;
type Section = (typeof sections)[number];

export default async function PortfolioSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as Section)) notFound();
  return <PortfolioApp section={section as Section} />;
}
