"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type PageType = 'activation' | 'agreement' | 'confirmation' | 'processing';

interface JourneyNavigationTabsProps {
  currentPage: PageType;
  onPageChange: (pageType: PageType) => void;
  hasUnsavedChanges: boolean;
  disabled?: boolean;
}

const PAGE_CONFIG = {
  activation: { label: "Activation", order: 1 },
  agreement: { label: "Agreement", order: 2 },
  confirmation: { label: "Confirmation", order: 3 },
  processing: { label: "Processing", order: 4 }
} as const;

export default function JourneyNavigationTabs({
  currentPage,
  onPageChange,
  hasUnsavedChanges,
  disabled = false
}: JourneyNavigationTabsProps) {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingPageChange, setPendingPageChange] = useState<PageType | null>(null);

  const handleTabChange = (newPageType: string) => {
    const pageType = newPageType as PageType;
    
    // If no unsaved changes or same page, navigate directly
    if (!hasUnsavedChanges || pageType === currentPage) {
      onPageChange(pageType);
      return;
    }

    // Show confirmation dialog for unsaved changes
    setPendingPageChange(pageType);
    setShowUnsavedDialog(true);
  };

  const handleConfirmNavigation = () => {
    if (pendingPageChange) {
      onPageChange(pendingPageChange);
      setPendingPageChange(null);
    }
    setShowUnsavedDialog(false);
  };

  const handleCancelNavigation = () => {
    setPendingPageChange(null);
    setShowUnsavedDialog(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Journey Editor</h3>
            <p className="text-sm text-muted-foreground">
              Navigate between different pages of the client journey
            </p>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="destructive" className="animate-pulse">
              Unsaved Changes
            </Badge>
          )}
        </div>

        <Tabs value={currentPage} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(PAGE_CONFIG).map(([key, config]) => (
              <TabsTrigger 
                key={key} 
                value={key} 
                disabled={disabled}
                className="flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {config.order}
                </span>
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost if you navigate away. 
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}