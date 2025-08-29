"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  Circle, 
  ArrowRight,
  User,
  Building,
  Mail
} from "lucide-react";
import { Client, JourneyPage, JourneyProgress } from "@/lib/supabase";

interface ClientJourneyOverviewProps {
  client: Client;
  pages: JourneyPage[];
  progress?: JourneyProgress;
  gToken: string;
}

export function ClientJourneyOverview({
  client,
  pages,
  progress,
  gToken
}: ClientJourneyOverviewProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const sortedPages = [...pages].sort((a, b) => a.page_order - b.page_order);

  const formatPageType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStatusIcon = (status: string, size = "h-5 w-5") => {
    switch (status) {
      case "completed":
        return <CheckCircle className={`${size} text-green-600`} />;
      case "active":
        return <Clock className={`${size} text-blue-600`} />;
      default:
        return <Circle className={`${size} text-gray-400`} />;
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

  const handlePageNavigation = async (pageType: string) => {
    setIsNavigating(true);
    router.push(`/journey/${gToken}/${pageType}`);
  };

  const nextAvailablePage = sortedPages.find(
    page => page.status === "active" || page.status === "pending"
  );

  return (
    <div className="space-y-6">
      {/* Client Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{client.company}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{client.email}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Position: {client.position}</p>
            <p className="text-sm text-gray-600">Salary Range: {client.salary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Journey Progress Card */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle>Your Journey Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.completed_pages} of {progress.total_pages} completed</span>
              </div>
              <Progress 
                value={progress.progress_percentage} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">
                {progress.progress_percentage}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Journey Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Your Journey Steps</CardTitle>
          <p className="text-sm text-gray-600">
            Complete each step to move forward in your personalized experience
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedPages.map((page, index) => (
            <div 
              key={page.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getStatusIcon(page.status)}
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium">{formatPageType(page.page_type)}</h3>
                  <p className="text-sm text-gray-600 mt-1">{page.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant="outline"
                      className={`text-xs ${getStatusColor(page.status)}`}
                    >
                      {formatPageType(page.status)}
                    </Badge>
                    {page.metadata?.estimated_time && (
                      <span className="text-xs text-gray-500">
                        ⏱ {page.metadata.estimated_time}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button
                  onClick={() => handlePageNavigation(page.page_type)}
                  disabled={
                    isNavigating || 
                    (page.status === "pending" && index > 0 && sortedPages[index - 1].status !== "completed")
                  }
                  variant={page.status === "completed" ? "outline" : "default"}
                  className="ml-4"
                >
                  {page.status === "completed" ? "Review" : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Continue Button */}
      {nextAvailablePage && (
        <div className="text-center">
          <Button 
            onClick={() => handlePageNavigation(nextAvailablePage.page_type)}
            disabled={isNavigating}
            size="lg"
            className="w-full md:w-auto"
          >
            {nextAvailablePage.status === "active" ? "Continue" : "Start"} with{" "}
            {formatPageType(nextAvailablePage.page_type)}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}