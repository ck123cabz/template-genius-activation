"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Circle } from "lucide-react";
import { JourneyPage, JourneyProgress } from "@/lib/supabase";

interface ClientJourneyProgressProps {
  progress: JourneyProgress;
  currentPage: JourneyPage;
}

export function ClientJourneyProgress({
  progress,
  currentPage
}: ClientJourneyProgressProps) {
  const getStatusIcon = (status: string) => {
    const baseClasses = "h-4 w-4";
    switch (status) {
      case "completed":
        return <CheckCircle className={`${baseClasses} text-green-600`} />;
      case "active":
        return <Clock className={`${baseClasses} text-blue-600`} />;
      default:
        return <Circle className={`${baseClasses} text-gray-400`} />;
    }
  };

  const formatPageType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getProgressMessage = () => {
    if (progress.progress_percentage === 100) {
      return "🎉 Congratulations! You've completed your journey.";
    } else if (progress.progress_percentage > 50) {
      return "🚀 Great progress! You're more than halfway there.";
    } else if (progress.progress_percentage > 0) {
      return "👏 Nice work! Keep moving forward.";
    } else {
      return "🌟 Welcome! Let's start your personalized journey.";
    }
  };

  const getProgressColor = () => {
    if (progress.progress_percentage === 100) return "text-green-700";
    if (progress.progress_percentage > 50) return "text-blue-700";
    return "text-gray-700";
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Progress Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(currentPage.status)}
              <h3 className="font-semibold text-gray-900">
                {formatPageType(currentPage.page_type)}
              </h3>
            </div>
            <Badge 
              variant="outline"
              className="bg-white/50 border-blue-300 text-blue-700"
            >
              Step {progress.current_step} of {progress.total_pages}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">Journey Progress</span>
              <span className="text-gray-600">
                {progress.completed_pages}/{progress.total_pages} completed
              </span>
            </div>
            <Progress 
              value={progress.progress_percentage} 
              className="h-3 bg-white/60"
            />
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>{progress.progress_percentage}%</span>
              <span>
                {progress.total_pages - progress.completed_pages} steps remaining
              </span>
            </div>
          </div>

          {/* Motivational Message */}
          <div className={`text-sm font-medium ${getProgressColor()}`}>
            {getProgressMessage()}
          </div>

          {/* Mobile-friendly step indicators */}
          <div className="flex justify-center gap-2 mt-4 md:hidden">
            {Array.from({ length: progress.total_pages }, (_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-all ${
                  index < progress.completed_pages
                    ? "bg-green-500"
                    : index === progress.current_step - 1
                    ? "bg-blue-500"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}