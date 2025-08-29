"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Info } from "lucide-react";
import { Client, JourneyPage, JourneyProgress } from "@/lib/supabase";
import { ClientJourneyNavigation } from "./ClientJourneyNavigation";
import { ClientJourneyProgress } from "./ClientJourneyProgress";
import { ClientPageContent } from "./ClientPageContent";
import { advanceClientJourney, updateJourneyPageStatus } from "@/app/actions/journey-actions";
import { useRouter } from "next/navigation";

interface ClientJourneyPageViewProps {
  client: Client;
  currentPage: JourneyPage;
  allPages: JourneyPage[];
  progress?: JourneyProgress;
  gToken: string;
}

export function ClientJourneyPageView({
  client,
  currentPage,
  allPages,
  progress,
  gToken
}: ClientJourneyPageViewProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sortedPages = [...allPages].sort((a, b) => a.page_order - b.page_order);
  const currentIndex = sortedPages.findIndex(page => page.id === currentPage.id);
  const previousPage = currentIndex > 0 ? sortedPages[currentIndex - 1] : null;
  const nextPage = currentIndex < sortedPages.length - 1 ? sortedPages[currentIndex + 1] : null;

  const canProceed = currentPage.status === "active" || currentPage.status === "completed";
  const isLastPage = currentIndex === sortedPages.length - 1;

  const handlePageComplete = async () => {
    if (!canProceed) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Mark current page as completed if not already
      if (currentPage.status !== "completed") {
        const completeResult = await updateJourneyPageStatus(
          currentPage.id,
          "completed",
          {
            completed_by_client: true,
            completion_timestamp: new Date().toISOString()
          }
        );
        
        if (!completeResult.success) {
          throw new Error(completeResult.error || "Failed to complete page");
        }
      }

      // If there's a next page, advance to it
      if (nextPage && nextPage.status === "pending") {
        const advanceResult = await advanceClientJourney(client.id, {
          advanced_by_client: true,
          previous_page_type: currentPage.page_type
        });
        
        if (!advanceResult.success) {
          throw new Error(advanceResult.error || "Failed to advance journey");
        }
      }

      // Navigate to next page or back to overview
      if (nextPage) {
        router.push(`/journey/${gToken}/${nextPage.page_type}`);
      } else {
        router.push(`/journey/${gToken}`);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = (pageType: string) => {
    router.push(`/journey/${gToken}/${pageType}`);
  };

  const formatPageType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {progress && (
        <ClientJourneyProgress 
          progress={progress}
          currentPage={currentPage}
        />
      )}

      {/* Main Page Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <ClientJourneyNavigation
            pages={allPages}
            currentPage={currentPage}
            onPageSelect={handleNavigation}
            gToken={gToken}
          />
        </div>

        {/* Page Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {currentPage.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-600" />
                  )}
                  {currentPage.title}
                </CardTitle>
                <div className="text-sm text-gray-500">
                  Page {currentPage.page_order} of {sortedPages.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Page Status Alert */}
              {currentPage.status === "pending" && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Complete the previous steps to unlock this page.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Render Page Content */}
              <ClientPageContent
                client={client}
                page={currentPage}
                gToken={gToken}
              />

              {/* Page Navigation Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                {/* Previous Page Button */}
                {previousPage && (
                  <Button
                    variant="outline"
                    onClick={() => handleNavigation(previousPage.page_type)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to {formatPageType(previousPage.page_type)}
                  </Button>
                )}

                {/* Spacer */}
                <div className="flex-grow" />

                {/* Next/Complete Button */}
                {canProceed && (
                  <Button
                    onClick={handlePageComplete}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : isLastPage ? (
                      "Complete Journey"
                    ) : (
                      <>
                        Continue to {nextPage && formatPageType(nextPage.page_type)}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}