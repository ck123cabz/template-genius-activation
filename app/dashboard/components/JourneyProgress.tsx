"use client";

import React from "react";
import { JourneyProgress as JourneyProgressType, JourneyPage } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Clock, ArrowRight } from "lucide-react";

interface JourneyProgressProps {
  progress: JourneyProgressType;
  pages: JourneyPage[];
  showDetails?: boolean;
  className?: string;
}

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
      return "bg-green-100 text-green-800 border-green-200";
    case "active":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "skipped":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

const formatPageType = (pageType: string) => {
  return pageType.charAt(0).toUpperCase() + pageType.slice(1);
};

export function JourneyProgress({ 
  progress, 
  pages, 
  showDetails = false, 
  className = "" 
}: JourneyProgressProps) {
  const sortedPages = [...pages].sort((a, b) => a.page_order - b.page_order);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Journey Progress</CardTitle>
            <CardDescription>
              Step {progress.current_step} of {progress.total_pages} • {progress.progress_percentage}% Complete
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm font-medium">
            {progress.completed_pages}/{progress.total_pages} Complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress.progress_percentage} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Started</span>
            <span>{progress.progress_percentage}%</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Journey Steps */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Journey Steps
            </h4>
            <div className="space-y-2">
              {sortedPages.map((page, index) => (
                <div key={page.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getStatusIcon(page.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {page.page_order}. {formatPageType(page.page_type)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {page.title}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(page.status)}`}
                      >
                        {formatPageType(page.status)}
                      </Badge>
                    </div>
                  </div>
                  {index < sortedPages.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Page Info */}
        {progress.active_page && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Currently Active: {formatPageType(progress.active_page.page_type)}
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              {progress.active_page.title}
            </p>
            {progress.active_page.metadata?.estimated_time && (
              <p className="text-xs text-blue-600 mt-1">
                Est. time: {progress.active_page.metadata.estimated_time}
              </p>
            )}
          </div>
        )}

        {/* Completion Status */}
        {progress.progress_percentage === 100 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Journey Complete!
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              All journey steps have been completed successfully.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for table/list views
export function JourneyProgressCompact({ 
  progress, 
  className = "" 
}: Omit<JourneyProgressProps, 'pages' | 'showDetails'>) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex-1 min-w-0">
        <Progress value={progress.progress_percentage} className="h-1.5" />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {progress.completed_pages}/{progress.total_pages}
      </span>
      <Badge variant="outline" className="text-xs">
        {progress.progress_percentage}%
      </Badge>
    </div>
  );
}

// Journey status badge component
export function JourneyStatusBadge({ 
  progress, 
  className = "" 
}: Omit<JourneyProgressProps, 'pages' | 'showDetails'>) {
  if (progress.progress_percentage === 100) {
    return (
      <Badge className={`bg-green-100 text-green-800 border-green-200 ${className}`}>
        <CheckCircle className="h-3 w-3 mr-1" />
        Complete
      </Badge>
    );
  } else if (progress.active_page) {
    return (
      <Badge className={`bg-blue-100 text-blue-800 border-blue-200 ${className}`}>
        <Clock className="h-3 w-3 mr-1" />
        Step {progress.current_step}
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className={className}>
        <Circle className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  }
}