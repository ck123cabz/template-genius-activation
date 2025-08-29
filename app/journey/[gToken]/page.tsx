import { notFound, redirect } from "next/navigation";
import { getClientJourneyByToken } from "@/app/actions/journey-actions";
import { ClientJourneyOverview } from "./components/ClientJourneyOverview";

interface ClientJourneyPageProps {
  params: Promise<{ gToken: string }>;
}

export default async function ClientJourneyPage({
  params
}: ClientJourneyPageProps) {
  const { gToken } = await params;

  const result = await getClientJourneyByToken(gToken);
  
  if (!result.success || !result.client || !result.pages) {
    notFound();
  }

  // Check if there's an active page to redirect to
  const activePage = result.pages.find(page => page.status === "active");
  const nextPendingPage = result.pages
    .filter(page => page.status === "pending")
    .sort((a, b) => a.page_order - b.page_order)[0];
  
  // If there's an active page, redirect there
  if (activePage) {
    redirect(`/journey/${gToken}/${activePage.page_type}`);
  }
  
  // If there's a pending page and no active page, redirect to first pending
  if (nextPendingPage) {
    redirect(`/journey/${gToken}/${nextPendingPage.page_type}`);
  }

  // Otherwise show journey overview
  return (
    <ClientJourneyOverview
      client={result.client}
      pages={result.pages}
      progress={result.progress}
      gToken={gToken}
    />
  );
}