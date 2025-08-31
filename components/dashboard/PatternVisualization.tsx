/**
 * Pattern Visualization Component
 * Epic 4, Story 4.1: Success Pattern Identification
 * 
 * Interactive visualization component for displaying success patterns and their statistics.
 * Shows pattern confidence, success rates, and detailed analysis.
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/card';
import { Badge } from '../shared/ui/badge';
import { Button } from '../shared/ui/button';
import { Progress } from '../shared/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../shared/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  Brain,
  TrendingUp,
  Target,
  Clock,
  Users,
  Award,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Mock data interfaces matching our pattern models
interface PatternVisualizationData {
  id: string;
  patternType: 'hypothesis' | 'content-element' | 'timing' | 'mixed';
  title: string;
  description: string;
  confidenceScore: number;
  successRate: number;
  sampleSize: number;
  statisticalSignificance: number;
  identifiedAt: string;
  trendIndicator: 'improving' | 'declining' | 'stable';
  elements?: {
    headline?: string;
    benefits?: string[];
    features?: string[];
  };
}

// Mock pattern data
const mockPatterns: PatternVisualizationData[] = [
  {
    id: 'pattern-hypothesis-abc123',
    patternType: 'hypothesis',
    title: 'Value-First Headlines',
    description: 'Headlines that emphasize immediate value and clear benefits show significantly higher conversion rates',
    confidenceScore: 0.87,
    successRate: 0.73,
    sampleSize: 12,
    statisticalSignificance: 0.03,
    identifiedAt: '2024-08-29',
    trendIndicator: 'improving',
    elements: {
      headline: 'Get Results in 24 Hours or Less',
      benefits: ['Immediate impact', 'Clear timeline', 'Risk-free guarantee']
    }
  },
  {
    id: 'pattern-content-def456',
    patternType: 'content-element',
    title: 'Pricing Display Format',
    description: 'Monthly subscription format "$X/month" outperforms alternative presentations',
    confidenceScore: 0.78,
    successRate: 0.65,
    sampleSize: 9,
    statisticalSignificance: 0.08,
    identifiedAt: '2024-08-28',
    trendIndicator: 'stable',
    elements: {
      features: ['Monthly format', 'Clear pricing', 'Payment transparency']
    }
  },
  {
    id: 'pattern-timing-ghi789',
    patternType: 'timing',
    title: 'Engagement Window',
    description: 'Optimal engagement time of 3-5 minutes before pricing reveal maximizes conversions',
    confidenceScore: 0.91,
    successRate: 0.82,
    sampleSize: 18,
    statisticalSignificance: 0.01,
    identifiedAt: '2024-08-27',
    trendIndicator: 'improving'
  },
  {
    id: 'pattern-mixed-jkl012',
    patternType: 'mixed',
    title: 'Social Proof + Urgency',
    description: 'Combination of client testimonials with time-limited offers creates compelling conversion drivers',
    confidenceScore: 0.82,
    successRate: 0.76,
    sampleSize: 15,
    statisticalSignificance: 0.02,
    identifiedAt: '2024-08-26',
    trendIndicator: 'stable',
    elements: {
      benefits: ['Social validation', 'Urgency motivation', 'Trust building']
    }
  }
];

// Chart data for pattern success rates
const successRateChartData = mockPatterns.map(pattern => ({
  name: pattern.title.substring(0, 20) + (pattern.title.length > 20 ? '...' : ''),
  successRate: Math.round(pattern.successRate * 100),
  confidence: Math.round(pattern.confidenceScore * 100),
  sampleSize: pattern.sampleSize,
  type: pattern.patternType
}));

// Chart data for confidence distribution
const confidenceDistribution = mockPatterns.reduce((acc, pattern) => {
  const bucket = pattern.confidenceScore >= 0.8 ? 'High (80%+)' : 
                 pattern.confidenceScore >= 0.6 ? 'Medium (60-80%)' : 'Low (<60%)';
  acc[bucket] = (acc[bucket] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const confidencePieData = Object.entries(confidenceDistribution).map(([name, value]) => ({
  name,
  value,
  color: name.includes('High') ? '#10b981' : name.includes('Medium') ? '#f59e0b' : '#ef4444'
}));

// Chart data for pattern trends over time
const trendData = mockPatterns.map((pattern, index) => ({
  date: new Date(pattern.identifiedAt).toLocaleDateString(),
  patterns: index + 1,
  avgConfidence: Math.round(mockPatterns.slice(0, index + 1)
    .reduce((sum, p) => sum + p.confidenceScore, 0) / (index + 1) * 100)
}));

function PatternTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'hypothesis':
      return <Brain className="h-4 w-4" />;
    case 'timing':
      return <Clock className="h-4 w-4" />;
    case 'content-element':
      return <Target className="h-4 w-4" />;
    case 'mixed':
      return <Award className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getPatternTypeColor(type: string): string {
  switch (type) {
    case 'hypothesis':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'timing':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'content-element':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'mixed':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="h-3 w-3 text-green-600" />;
    case 'declining':
      return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
    default:
      return <div className="h-3 w-3 bg-yellow-600 rounded-full" />;
  }
}

function PatternCard({ pattern, expanded, onToggle }: { 
  pattern: PatternVisualizationData; 
  expanded: boolean; 
  onToggle: () => void; 
}) {
  return (
    <Card className="mb-4 transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PatternTypeIcon type={pattern.patternType} />
            <div>
              <CardTitle className="text-lg">{pattern.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {pattern.description}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mt-3">
          <Badge className={getPatternTypeColor(pattern.patternType)}>
            {pattern.patternType.replace('-', ' ')}
          </Badge>
          <div className="flex items-center gap-1 text-sm">
            {getTrendIcon(pattern.trendIndicator)}
            <span className="text-muted-foreground">{pattern.trendIndicator}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {pattern.sampleSize} samples
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(pattern.successRate * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(pattern.confidenceScore * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              p&lt;{pattern.statisticalSignificance.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">Significance</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Confidence Score</span>
            <span>{Math.round(pattern.confidenceScore * 100)}%</span>
          </div>
          <Progress value={pattern.confidenceScore * 100} className="h-2" />
        </div>
        
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="text-sm">
              <div className="font-medium mb-2">Pattern Details:</div>
              <div className="text-muted-foreground">
                Identified: {new Date(pattern.identifiedAt).toLocaleDateString()}
              </div>
              <div className="text-muted-foreground">
                Statistical significance: p &lt; {pattern.statisticalSignificance.toFixed(3)}
              </div>
            </div>
            
            {pattern.elements && (
              <div className="text-sm">
                <div className="font-medium mb-2">Content Elements:</div>
                {pattern.elements.headline && (
                  <div className="mb-1">
                    <span className="text-muted-foreground">Headline:</span> {pattern.elements.headline}
                  </div>
                )}
                {pattern.elements.benefits && (
                  <div className="mb-1">
                    <span className="text-muted-foreground">Benefits:</span>
                    <ul className="list-disc list-inside ml-2">
                      {pattern.elements.benefits.map((benefit, idx) => (
                        <li key={idx} className="text-xs">{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {pattern.elements.features && (
                  <div className="mb-1">
                    <span className="text-muted-foreground">Features:</span>
                    <ul className="list-disc list-inside ml-2">
                      {pattern.elements.features.map((feature, idx) => (
                        <li key={idx} className="text-xs">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline">
                Apply to New Client
              </Button>
              <Button size="sm" variant="outline">
                Create A/B Test
              </Button>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PatternVisualization() {
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [selectedPatternType, setSelectedPatternType] = useState<string>('all');

  const filteredPatterns = useMemo(() => {
    if (selectedPatternType === 'all') return mockPatterns;
    return mockPatterns.filter(p => p.patternType === selectedPatternType);
  }, [selectedPatternType]);

  const handlePatternToggle = (patternId: string) => {
    setExpandedPattern(expandedPattern === patternId ? null : patternId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pattern Analysis Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive analysis of identified success patterns with statistical validation
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="success-rates" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="success-rates">Success Rates</TabsTrigger>
              <TabsTrigger value="confidence">Confidence Distribution</TabsTrigger>
              <TabsTrigger value="trends">Pattern Trends</TabsTrigger>
              <TabsTrigger value="correlation">Correlation Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="success-rates" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={successRateChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{label}</p>
                              <p className="text-green-600">
                                Success Rate: {payload[0]?.value}%
                              </p>
                              <p className="text-blue-600">
                                Confidence: {payload[1]?.value}%
                              </p>
                              <p className="text-muted-foreground text-sm">
                                Sample Size: {payload[0]?.payload?.sampleSize}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="successRate" fill="#10b981" name="Success Rate %" />
                    <Bar dataKey="confidence" fill="#3b82f6" name="Confidence %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="confidence" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={confidencePieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {confidencePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="trends" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="patterns" 
                      stroke="#8884d8" 
                      name="Cumulative Patterns"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgConfidence" 
                      stroke="#82ca9d" 
                      name="Average Confidence %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="correlation" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={successRateChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="confidence" 
                      name="Confidence %" 
                      domain={[0, 100]}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="successRate" 
                      name="Success Rate %" 
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0]?.payload;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.name}</p>
                              <p>Confidence: {data.confidence}%</p>
                              <p>Success Rate: {data.successRate}%</p>
                              <p>Sample Size: {data.sampleSize}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter 
                      dataKey="sampleSize" 
                      fill="#8884d8" 
                      name="Sample Size"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Identified Patterns</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by type:</span>
          <select 
            value={selectedPatternType}
            onChange={(e) => setSelectedPatternType(e.target.value)}
            className="border rounded px-3 py-1 text-sm bg-background"
          >
            <option value="all">All Types</option>
            <option value="hypothesis">Hypothesis</option>
            <option value="content-element">Content Element</option>
            <option value="timing">Timing</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredPatterns.map((pattern) => (
          <PatternCard
            key={pattern.id}
            pattern={pattern}
            expanded={expandedPattern === pattern.id}
            onToggle={() => handlePatternToggle(pattern.id)}
          />
        ))}
      </div>

      {filteredPatterns.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              No patterns found for the selected filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}