/**
 * Journey Funnel Chart Component
 * Epic 4, Story 4.2: Drop-off Point Analysis
 * 
 * Interactive funnel visualization showing conversion rates at each journey step
 * with detailed metrics and drop-off analysis.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell
} from 'recharts';
import {
  Users,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  ArrowDown,
  Percent,
  Timer
} from 'lucide-react';

// Mock data for funnel analysis
const mockFunnelData = [
  {
    name: 'Activation',
    value: 2847,
    converted: 2456,
    conversionRate: 86.3,
    dropOff: 391,
    dropOffRate: 13.7,
    avgTimeOnPage: 127,
    fill: '#3b82f6'
  },
  {
    name: 'Agreement',
    value: 2456,
    converted: 2187,
    conversionRate: 89.0,
    dropOff: 269,
    dropOffRate: 11.0,
    avgTimeOnPage: 203,
    fill: '#06b6d4'
  },
  {
    name: 'Confirmation',
    value: 2187,
    converted: 2034,
    conversionRate: 93.0,
    dropOff: 153,
    dropOffRate: 7.0,
    avgTimeOnPage: 89,
    fill: '#10b981'
  },
  {
    name: 'Processing',
    value: 2034,
    converted: 1924,
    conversionRate: 94.6,
    dropOff: 110,
    dropOffRate: 5.4,
    avgTimeOnPage: 67,
    fill: '#8b5cf6'
  }
];

const mockConversionTrends = [
  { month: 'Jan', activation: 82.1, agreement: 85.4, confirmation: 91.2, processing: 93.8 },
  { month: 'Feb', activation: 84.3, agreement: 87.1, confirmation: 92.0, processing: 94.1 },
  { month: 'Mar', activation: 85.7, agreement: 88.2, confirmation: 92.8, processing: 94.3 },
  { month: 'Apr', activation: 86.3, agreement: 89.0, confirmation: 93.0, processing: 94.6 }
];

const mockSegmentComparison = [
  { segment: 'New Clients', activation: 84.2, agreement: 86.5, confirmation: 91.8, processing: 93.2 },
  { segment: 'Returning Clients', activation: 91.7, agreement: 94.3, confirmation: 96.1, processing: 97.8 },
  { segment: 'Enterprise', activation: 78.9, agreement: 82.1, confirmation: 89.4, processing: 91.6 },
  { segment: 'SMB', activation: 88.1, agreement: 90.8, confirmation: 94.5, processing: 96.1 }
];

interface FunnelTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function FunnelTooltip({ active, payload }: FunnelTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <h3 className="font-medium mb-2">{data.name} Page</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Visitors:</span>
            <span className="font-medium">{data.value.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Converted:</span>
            <span className="font-medium text-green-600">{data.converted.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Conversion Rate:</span>
            <span className="font-medium text-blue-600">{data.conversionRate}%</span>
          </div>
          <div className="flex justify-between">
            <span>Drop-off:</span>
            <span className="font-medium text-red-600">{data.dropOff.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Time:</span>
            <span className="font-medium">{data.avgTimeOnPage}s</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function FunnelStepCard({ step, index, isLast }: { 
  step: any; 
  index: number; 
  isLast: boolean;
}) {
  const getTrendColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (rate: number) => {
    if (rate >= 90) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (rate >= 80) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="relative">
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-full text-sm font-medium">
                {index + 1}
              </div>
              <div>
                <h3 className="font-semibold">{step.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.value.toLocaleString()} visitors
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(step.conversionRate)}
              <span className={`text-lg font-bold ${getTrendColor(step.conversionRate)}`}>
                {step.conversionRate}%
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Conversion Progress</span>
                <span>{step.converted.toLocaleString()} converted</span>
              </div>
              <Progress value={step.conversionRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3 w-3 text-green-600" />
                  <span className="text-muted-foreground">Converted</span>
                </div>
                <p className="font-medium text-green-600">{step.converted.toLocaleString()}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-muted-foreground">Dropped Off</span>
                </div>
                <p className="font-medium text-red-600">{step.dropOff.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span>Avg time: {step.avgTimeOnPage}s</span>
              </div>
              <div className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                <span>Drop rate: {step.dropOffRate}%</span>
              </div>
            </div>

            {step.dropOffRate > 15 && (
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded text-sm">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-600">High drop-off rate - needs attention</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {!isLast && (
        <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10">
          <div className="bg-background border rounded-full p-2 shadow-sm">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonChart({ data, title }: { data: any[]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="activation" fill="#3b82f6" name="Activation" />
              <Bar dataKey="agreement" fill="#06b6d4" name="Agreement" />
              <Bar dataKey="confirmation" fill="#10b981" name="Confirmation" />
              <Bar dataKey="processing" fill="#8b5cf6" name="Processing" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function JourneyFunnelChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  const overallConversion = Math.round(
    (mockFunnelData[mockFunnelData.length - 1].converted / mockFunnelData[0].value) * 100
  );

  const totalDropOffs = mockFunnelData.reduce((sum, step) => sum + step.dropOff, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Journey Funnel Analysis</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Conversion rates and drop-off points across the client journey
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{overallConversion}%</div>
                <div className="text-sm text-muted-foreground">Overall Conversion</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">{totalDropOffs.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Drop-offs</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as any)}>
            <TabsList className="mb-6">
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="quarter">This Quarter</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedTimeframe} className="space-y-6">
              {/* Interactive Funnel Steps */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {mockFunnelData.map((step, index) => (
                  <FunnelStepCard 
                    key={step.name} 
                    step={step} 
                    index={index}
                    isLast={index === mockFunnelData.length - 1}
                  />
                ))}
              </div>

              {/* Funnel Chart Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>Funnel Visualization</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Visual representation of user flow through journey steps
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <FunnelChart>
                        <Tooltip content={<FunnelTooltip />} />
                        <Funnel 
                          dataKey="value" 
                          data={mockFunnelData}
                          isAnimationActive
                        >
                          <LabelList position="center" fill="#fff" stroke="none" />
                          {mockFunnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Funnel>
                      </FunnelChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="segments">Segment Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends">
          <ComparisonChart 
            data={mockConversionTrends} 
            title="Conversion Rate Trends Over Time" 
          />
        </TabsContent>
        
        <TabsContent value="segments">
          <ComparisonChart 
            data={mockSegmentComparison} 
            title="Conversion Rates by Client Segment" 
          />
        </TabsContent>
      </Tabs>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-600">What's Working Well</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Processing Page Excellence</p>
                    <p className="text-sm text-muted-foreground">94.6% conversion rate - highest performing step</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Confirmation Flow</p>
                    <p className="text-sm text-muted-foreground">93% conversion with short time on page</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-red-600">Areas for Improvement</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Activation Page</p>
                    <p className="text-sm text-muted-foreground">13.7% drop-off rate - optimize loading and content</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Agreement Page</p>
                    <p className="text-sm text-muted-foreground">11% drop-off rate - simplify terms and conditions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Recommended Next Actions</h4>
                <p className="text-sm text-muted-foreground">High-impact improvements to boost conversions</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Export Analysis
                </Button>
                <Button size="sm">
                  View Detailed Report
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}