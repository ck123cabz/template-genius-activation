/**
 * Exit Patterns Component
 * Epic 4, Story 4.2: Drop-off Point Analysis
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ExitPatterns() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exit Patterns</CardTitle>
        <p className="text-sm text-muted-foreground">
          Analysis of exit patterns and triggers
        </p>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Exit patterns analysis will be displayed here</p>
        </div>
      </CardContent>
    </Card>
  );
}