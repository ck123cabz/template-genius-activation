/**
 * Journey Selector Component
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Interface for selecting successful and failed journeys for comparison
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Badge } from '@/components/shared/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

import { JourneySession } from '@/lib/data-models/journey-models';

interface JourneySelectorProps {
  selectedSuccessfulJourney: JourneySession | null;
  selectedFailedJourney: JourneySession | null;
  onSelectionChange: (successful: JourneySession | null, failed: JourneySession | null) => void;
  isLoading?: boolean;
}

export default function JourneySelector({
  selectedSuccessfulJourney,
  selectedFailedJourney,
  onSelectionChange,
  isLoading = false
}: JourneySelectorProps) {
  const [successfulJourneys, setSuccessfulJourneys] = useState<JourneySession[]>([]);
  const [failedJourneys, setFailedJourneys] = useState<JourneySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data loading
    const loadJourneys = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockSuccessfulJourneys: JourneySession[] = [
        {
          id: 'success-1',
          clientId: 'client-1',
          sessionStart: new Date('2024-01-15'),
          totalDuration: 1800,
          pageVisits: [],
          finalOutcome: 'completed',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 'success-2', 
          clientId: 'client-2',
          sessionStart: new Date('2024-01-16'),
          totalDuration: 2400,
          pageVisits: [],
          finalOutcome: 'completed',
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-16')
        }
      ];

      const mockFailedJourneys: JourneySession[] = [
        {
          id: 'failed-1',
          clientId: 'client-3',
          sessionStart: new Date('2024-01-17'),
          totalDuration: 600,
          pageVisits: [],
          finalOutcome: 'dropped_off',
          exitPoint: 'agreement',
          createdAt: new Date('2024-01-17'),
          updatedAt: new Date('2024-01-17')
        },
        {
          id: 'failed-2',
          clientId: 'client-4', 
          sessionStart: new Date('2024-01-18'),
          totalDuration: 900,
          pageVisits: [],
          finalOutcome: 'dropped_off',
          exitPoint: 'confirmation',
          createdAt: new Date('2024-01-18'),
          updatedAt: new Date('2024-01-18')
        }
      ];

      setSuccessfulJourneys(mockSuccessfulJourneys);
      setFailedJourneys(mockFailedJourneys);
      setLoading(false);
    };

    loadJourneys();
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading journeys...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Successful Journey Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <CheckCircle className="mr-2 h-5 w-5" />
            Successful Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedSuccessfulJourney?.id || ""}
            onValueChange={(value) => {
              const journey = successfulJourneys.find(j => j.id === value);
              onSelectionChange(journey || null, selectedFailedJourney);
            }}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a successful journey..." />
            </SelectTrigger>
            <SelectContent>
              {successfulJourneys.map(journey => (
                <SelectItem key={journey.id} value={journey.id}>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-medium">Client {journey.clientId}</div>
                      <div className="text-sm text-gray-500">
                        {formatDuration(journey.totalDuration)} • {journey.sessionStart.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSuccessfulJourney && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Client {selectedSuccessfulJourney.clientId}</div>
                  <div className="text-sm text-gray-600">
                    Duration: {formatDuration(selectedSuccessfulJourney.totalDuration)}
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Completed
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failed Journey Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <XCircle className="mr-2 h-5 w-5" />
            Failed Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedFailedJourney?.id || ""}
            onValueChange={(value) => {
              const journey = failedJourneys.find(j => j.id === value);
              onSelectionChange(selectedSuccessfulJourney, journey || null);
            }}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a failed journey..." />
            </SelectTrigger>
            <SelectContent>
              {failedJourneys.map(journey => (
                <SelectItem key={journey.id} value={journey.id}>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-medium">Client {journey.clientId}</div>
                      <div className="text-sm text-gray-500">
                        {formatDuration(journey.totalDuration)} • Exited at {journey.exitPoint}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedFailedJourney && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Client {selectedFailedJourney.clientId}</div>
                  <div className="text-sm text-gray-600">
                    Duration: {formatDuration(selectedFailedJourney.totalDuration)}
                  </div>
                  {selectedFailedJourney.exitPoint && (
                    <div className="text-sm text-red-600">
                      Dropped off at {selectedFailedJourney.exitPoint}
                    </div>
                  )}
                </div>
                <Badge className="bg-red-100 text-red-800">
                  Failed
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}