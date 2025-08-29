import { notFound } from "next/navigation";
import { getClientJourneyByToken } from "@/app/actions/journey-actions";
import { JourneyPageType } from "@/lib/supabase";
import { ClientJourneyPageView } from "../components/ClientJourneyPageView";

interface ClientJourneyPageTypeProps {
  params: Promise<{ 
    gToken: string; 
    pageType: string;
  }>;
}

const VALID_PAGE_TYPES: JourneyPageType[] = [
  'activation', 
  'agreement', 
  'confirmation', 
  'processing'
];

export default async function ClientJourneyPageType({
  params
}: ClientJourneyPageTypeProps) {
  const { gToken, pageType } = await params;

  // Validate page type
  if (!VALID_PAGE_TYPES.includes(pageType as JourneyPageType)) {
    notFound();
  }

  const result = await getClientJourneyByToken(gToken);
  
  if (!result.success || !result.client || !result.pages) {
    notFound();
  }

  // Find the specific page
  const currentPage = result.pages.find(page => page.page_type === pageType);
  
  if (!currentPage) {
    notFound();
  }

  return (
    <ClientJourneyPageView
      client={result.client}
      currentPage={currentPage}
      allPages={result.pages}
      progress={result.progress}
      gToken={gToken}
    />
  );
}

export async function generateMetadata({ params }: ClientJourneyPageTypeProps) {
  const { gToken, pageType } = await params;
  
  const result = await getClientJourneyByToken(gToken);
  
  if (!result.success || !result.client) {
    return {
      title: 'Journey Page Not Found'
    };
  }

  const currentPage = result.pages?.find(page => page.page_type === pageType);
  
  return {
    title: `${currentPage?.title || 'Journey Page'} - ${result.client.company}`,
    description: `${result.client.contact}'s personalized ${pageType} page`
  };
}