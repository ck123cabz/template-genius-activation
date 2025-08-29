"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Route, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  Clock,
  Circle,
  AlertTriangle
} from "lucide-react";
import { Client, JourneyPage } from "@/lib/supabase";

interface JourneyNavigationProps {
  pages: JourneyPage[];
  currentPage: JourneyPage;
  client: Client;
  hasUnsavedChanges?: boolean;
}

export function JourneyNavigation({
  pages,
  currentPage,
  client,
  hasUnsavedChanges = false
}: JourneyNavigationProps) {
  const router = useRouter();
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const sortedPages = [...pages].sort((a, b) => a.page_order - b.page_order);
  const currentIndex = sortedPages.findIndex(page => page.id === currentPage.id);
  
  const previousPage = currentIndex > 0 ? sortedPages[currentIndex - 1] : null;
  const nextPage = currentIndex < sortedPages.length - 1 ? sortedPages[currentIndex + 1] : null;

  const formatPageType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "active":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "skipped":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const handleNavigation = (pageType: string) => {
    const targetUrl = `/dashboard/client/${client.id}/journey/${pageType}`;
    
    if (hasUnsavedChanges) {
      setPendingNavigation(targetUrl);
      setShowUnsavedDialog(true);
    } else {
      router.push(targetUrl);
    }
  };

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Route className="h-4 w-4" />
            Journey Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Page Context */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(currentPage.status)}
                <span className="font-medium text-blue-900">
                  {formatPageType(currentPage.page_type)}
                </span>
              </div>
              <Badge className={getStatusColor(currentPage.status)}>
                Current
              </Badge>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Page {currentPage.page_order} of {pages.length}
            </p>
          </div>

          {/* Unsaved Changes Warning */}
          {hasUnsavedChanges && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700 text-sm">
                You have unsaved changes. Save before navigating to avoid losing work.
              </AlertDescription>
            </Alert>
          )}

          {/* Page Navigation Buttons */}
          <div className="space-y-2">
            {previousPage && (
              <Button
                variant="outline"
                onClick={() => handleNavigation(previousPage.page_type)}
                className="w-full justify-between text-left"
                disabled={hasUnsavedChanges}
              >
                <div className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  <div>
                    <div className="font-medium">
                      {formatPageType(previousPage.page_type)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Page {previousPage.page_order}
                    </div>
                  </div>
                </div>
                {getStatusIcon(previousPage.status)}
              </Button>
            )}

            {nextPage && (
              <Button
                variant="outline"
                onClick={() => handleNavigation(nextPage.page_type)}
                className="w-full justify-between text-left"
                disabled={hasUnsavedChanges}
              >
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  <div>
                    <div className="font-medium">
                      {formatPageType(nextPage.page_type)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Page {nextPage.page_order}
                    </div>
                  </div>
                </div>
                {getStatusIcon(nextPage.status)}
              </Button>
            )}
          </div>

          {/* All Pages Overview */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              All Pages
            </h4>
            <div className="space-y-2">
              {sortedPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleNavigation(page.page_type)}
                  disabled={page.id === currentPage.id || hasUnsavedChanges}
                  className="w-full p-2 text-left rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(page.status)}
                      <div>
                        <div className="font-medium text-sm">
                          {formatPageType(page.page_type)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Page {page.page_order}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(page.status)}`}
                      >
                        {formatPageType(page.status)}
                      </Badge>
                      {page.id === currentPage.id && (
                        <span className="text-xs text-blue-600 font-medium">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes that will be lost if you navigate away. 
              Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelNavigation}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmNavigation}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}