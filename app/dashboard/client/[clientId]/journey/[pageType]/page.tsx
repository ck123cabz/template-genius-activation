import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getClientJourneyPages } from "@/app/actions/journey-actions";
import { supabase } from "@/lib/supabase";
import { JourneyPageEditor } from "@/app/dashboard/components/JourneyPageEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface JourneyEditPageProps {
  params: {
    clientId: string;
    pageType: string;
  };
}

// Valid page types from the journey system
const VALID_PAGE_TYPES = ['activation', 'agreement', 'confirmation', 'processing'];

async function getClientAndJourneyData(clientId: number, pageType: string) {
  // Fetch client data
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!client) {
    return { client: null, pages: [], currentPage: null };
  }

  // Fetch journey pages
  const journeyResult = await getClientJourneyPages(clientId);
  
  // If journey_pages table doesn't exist or no pages found, create mock pages for development
  if (!journeyResult.success || !journeyResult.pages || journeyResult.pages.length === 0) {
    // Import mock journey page templates
    const { mockJourneyPageTemplates } = await import("@/lib/supabase");
    
    // Create mock pages for this client
    const mockPages = mockJourneyPageTemplates.map((template, index) => ({
      id: index + 1,
      client_id: clientId,
      page_type: template.page_type,
      page_order: template.page_order,
      title: template.title,
      content: template.content,
      status: template.status,
      metadata: template.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null as string | null
    }));
    
    const currentPage = mockPages.find(page => page.page_type === pageType);
    return { client, pages: mockPages, currentPage };
  }

  const pages = journeyResult.pages;
  const currentPage = pages.find(page => page.page_type === pageType);

  return { client, pages, currentPage };
}

export default async function JourneyEditPage({ params }: JourneyEditPageProps) {
  const { clientId: clientIdParam, pageType } = await params;
  const clientId = parseInt(clientIdParam);

  // Validate page type
  if (!VALID_PAGE_TYPES.includes(pageType)) {
    notFound();
  }

  // Validate client ID
  if (isNaN(clientId)) {
    notFound();
  }

  const { client, pages, currentPage } = await getClientAndJourneyData(clientId, pageType);

  if (!client) {
    notFound();
  }

  if (!currentPage) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-4">Journey Page Not Found</h1>
            <p className="text-muted-foreground">
              The {pageType} page for client {client.company} does not exist yet.
              Journey pages are created automatically when a client is set up.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<JourneyEditPageSkeleton />}>
        <JourneyPageEditor 
          client={client}
          pages={pages}
          currentPage={currentPage}
          pageType={pageType}
        />
      </Suspense>
    </div>
  );
}

function JourneyEditPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: JourneyEditPageProps) {
  const { clientId: clientIdParam, pageType } = await params;
  const clientId = parseInt(clientIdParam);

  if (isNaN(clientId) || !VALID_PAGE_TYPES.includes(pageType)) {
    return {
      title: 'Journey Editor - Template Genius',
    };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("company")
    .eq("id", clientId)
    .single();

  const companyName = client?.company || `Client ${clientId}`;
  const pageTitle = pageType.charAt(0).toUpperCase() + pageType.slice(1);

  return {
    title: `${pageTitle} - ${companyName} | Journey Editor - Template Genius`,
    description: `Edit the ${pageType} page for ${companyName}'s journey`,
  };
}