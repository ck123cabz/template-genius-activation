/**
 * Realtime Journey Metrics Component
 * Epic 4, Story 4.2: Drop-off Point Analysis
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, Target } from 'lucide-react';

const mockRealtimeData = {
  activeSessions: 47,
  liveConversionRate: 68.2,
  recentDropOffs: [
    { page: 'activation', count: 3, time: '2 min ago' },
    { page: 'agreement', count: 2, time: '4 min ago' },
    { page: 'confirmation', count: 1, time: '6 min ago' }
  ]
};

export function RealtimeJourneyMetrics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-3xl font-bold">{mockRealtimeData.activeSessions}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-4">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Live tracking</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Live Conversion</p>
                <p className="text-3xl font-bold">{mockRealtimeData.liveConversionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-4">
              <Badge variant="secondary">Real-time</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Status</p>
                <p className="text-lg font-semibold text-green-600">Operational</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-4">
              <span className="text-sm text-muted-foreground">All systems running</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Drop-offs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Live monitoring of journey exit events
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockRealtimeData.recentDropOffs.map((dropOff, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium capitalize">{dropOff.page} Page</p>
                  <p className="text-sm text-muted-foreground">{dropOff.count} users dropped off</p>
                </div>
                <Badge variant="outline">{dropOff.time}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}