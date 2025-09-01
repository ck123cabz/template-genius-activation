/**
 * Side by Side Journey Visualization
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Component for displaying successful vs failed journeys side by side
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { CheckCircle, XCircle, ArrowRight, Clock, MousePointer, Eye } from 'lucide-react';

import { JourneySession } from '@/lib/data-models/journey-models';
import { JourneyComparisonResult } from '@/lib/data-models/journey-comparison-models';

interface SideBySideVisualizationProps {
  successfulJourney: JourneySession;
  failedJourney: JourneySession;
  comparisonResults: JourneyComparisonResult;
}

export default function SideBySideVisualization({
  successfulJourney,
  failedJourney,
  comparisonResults
}: SideBySideVisualizationProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Journey Overview Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Successful Journey */}
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center text-green-800">
              <CheckCircle className="mr-2 h-5 w-5" />
              Successful Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Client ID</span>
                <span className="font-medium">{successfulJourney.clientId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duration</span>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {formatDuration(successfulJourney.totalDuration)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pages Visited</span>
                <span className="font-medium">{successfulJourney.pageVisits.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Outcome</span>
                <Badge className="bg-green-100 text-green-800">Completed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Failed Journey */}
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center text-red-800">
              <XCircle className="mr-2 h-5 w-5" />
              Failed Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Client ID</span>
                <span className="font-medium">{failedJourney.clientId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duration</span>
                <Badge variant="outline" className="text-red-700 border-red-300">
                  {formatDuration(failedJourney.totalDuration)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pages Visited</span>
                <span className="font-medium">{failedJourney.pageVisits.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Exit Point</span>
                <Badge className="bg-red-100 text-red-800">
                  {failedJourney.exitPoint || 'Unknown'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journey Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Journey Flow Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Page Flow */}
            {['activation', 'agreement', 'confirmation', 'processing'].map((pageType, index) => (
              <div key={pageType} className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700 capitalize">
                    {pageType} Page
                  </div>
                  {index < 3 && (
                    <ArrowRight className="h-4 w-4 text-gray-400 absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10" 
                      style={{ top: '50%' }} />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {/* Successful Journey Page */}
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="outline" className="text-xs">Success</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {index < successfulJourney.pageVisits.length 
                          ? `${successfulJourney.pageVisits[index]?.timeOnPage || 0}s`
                          : 'N/A'}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Eye className="h-3 w-3 mr-1" />
                        {index < successfulJourney.pageVisits.length 
                          ? `${successfulJourney.pageVisits[index]?.scrollDepth || 0}% scroll`
                          : 'N/A'}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MousePointer className="h-3 w-3 mr-1" />
                        {index < successfulJourney.pageVisits.length 
                          ? `${successfulJourney.pageVisits[index]?.interactions || 0} interactions`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Failed Journey Page */}
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <Badge variant="outline" className="text-xs">
                        {failedJourney.exitPoint === pageType ? 'Exit Point' : 'Failed'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {index < failedJourney.pageVisits.length 
                          ? `${failedJourney.pageVisits[index]?.timeOnPage || 0}s`
                          : 'N/A'}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Eye className="h-3 w-3 mr-1" />
                        {index < failedJourney.pageVisits.length 
                          ? `${failedJourney.pageVisits[index]?.scrollDepth || 0}% scroll`
                          : 'N/A'}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MousePointer className="h-3 w-3 mr-1" />
                        {index < failedJourney.pageVisits.length 
                          ? `${failedJourney.pageVisits[index]?.interactions || 0} interactions`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}