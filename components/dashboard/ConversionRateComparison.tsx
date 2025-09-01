/**
 * Conversion Rate Comparison Component
 * Epic 4, Story 4.2: Drop-off Point Analysis
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ConversionRateComparison() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Rate Comparison</CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare conversion rates across different segments and time periods
        </p>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Conversion comparison charts will be displayed here</p>
        </div>
      </CardContent>
    </Card>
  );
}