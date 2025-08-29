"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Clock, 
  Circle, 
  Route,
  Lock
} from "lucide-react";
import { JourneyPage } from "@/lib/supabase";

interface ClientJourneyNavigationProps {
  pages: JourneyPage[];
  currentPage: JourneyPage;
  onPageSelect: (pageType: string) => void;
  gToken: string;
}

export function ClientJourneyNavigation({
  pages,
  currentPage,
  onPageSelect,
  gToken
}: ClientJourneyNavigationProps) {
  const sortedPages = [...pages].sort((a, b) => a.page_order - b.page_order);
  const currentIndex = sortedPages.findIndex(page => page.id === currentPage.id);

  const formatPageType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStatusIcon = (status: string, pageIndex: number) => {
    const baseClasses = "h-4 w-4";
    
    switch (status) {
      case "completed":
        return <CheckCircle className={`${baseClasses} text-green-600`} />;
      case "active":
        return <Clock className={`${baseClasses} text-blue-600`} />;
      case "pending":
        // Check if this page is accessible (previous page is completed)
        if (pageIndex === 0 || sortedPages[pageIndex - 1].status === "completed") {
          return <Circle className={`${baseClasses} text-gray-400`} />;
        } else {
          return <Lock className={`${baseClasses} text-gray-300`} />;
        }
      default:
        return <Circle className={`${baseClasses} text-gray-400`} />;
    }
  };

  const getStatusColor = (status: string, pageIndex: number) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        // Check if accessible
        if (pageIndex === 0 || sortedPages[pageIndex - 1].status === "completed") {
          return "bg-gray-100 text-gray-600 border-gray-200";
        } else {
          return "bg-gray-50 text-gray-400 border-gray-100";
        }
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const isPageAccessible = (page: JourneyPage, pageIndex: number) => {
    // First page is always accessible
    if (pageIndex === 0) return true;
    
    // Page is accessible if it's completed, active, or if the previous page is completed
    return page.status === "completed" || 
           page.status === "active" || 
           (page.status === "pending" && sortedPages[pageIndex - 1].status === "completed");
  };

  const handlePageClick = (page: JourneyPage, pageIndex: number) => {
    if (isPageAccessible(page, pageIndex)) {
      onPageSelect(page.page_type);
    }
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Route className="h-4 w-4" />
          Your Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Page Indicator */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(currentPage.status, currentIndex)}
              <span className="font-medium text-blue-900 text-sm">
                {formatPageType(currentPage.page_type)}
              </span>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
              Current
            </Badge>
          </div>
        </div>

        {/* All Pages List */}
        <div className="space-y-2">
          {sortedPages.map((page, index) => {
            const isAccessible = isPageAccessible(page, index);
            const isCurrent = page.id === currentPage.id;
            
            return (
              <button
                key={page.id}
                onClick={() => handlePageClick(page, index)}
                disabled={!isAccessible}
                className={`
                  w-full p-3 text-left rounded-lg border transition-all duration-200
                  ${isCurrent 
                    ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" 
                    : "hover:bg-gray-50 border-gray-200"
                  }
                  ${!isAccessible 
                    ? "opacity-50 cursor-not-allowed" 
                    : "cursor-pointer"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getStatusIcon(page.status, index)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {formatPageType(page.page_type)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Step {page.page_order}
                        {page.metadata?.estimated_time && (
                          <span className="ml-2">
                            ⏱ {page.metadata.estimated_time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(page.status, index)}`}
                    >
                      {formatPageType(page.status === "pending" && !isAccessible ? "locked" : page.status)}
                    </Badge>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Journey Progress Summary */}
        <div className="pt-3 border-t text-xs text-gray-500 text-center">
          {sortedPages.filter(p => p.status === "completed").length} of {sortedPages.length} steps completed
        </div>
      </CardContent>
    </Card>
  );
}