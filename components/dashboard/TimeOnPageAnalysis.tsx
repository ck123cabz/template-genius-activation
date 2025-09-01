/**
 * Time On Page Analysis Component
 * Epic 4, Story 4.2: Drop-off Point Analysis
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TimeOnPageAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time On Page Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Time-based engagement metrics across journey steps
        </p>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Time analysis charts will be displayed here</p>
        </div>
      </CardContent>
    </Card>
  );
}