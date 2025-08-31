/**
 * A/B Test Manager Component for Story 3.3
 * Interface for managing content variations and A/B testing campaigns
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Target,
  Play,
  Pause,
  Stop,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Plus,
  Settings,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

interface ContentVariation {
  id: string;
  variation_name: string;
  test_hypothesis: string;
  variation_description: string;
  test_status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  traffic_allocation: number;
  sample_size: number;
  confidence_level: number;
  statistical_significance?: number;
  is_winner: boolean;
  start_date?: Date;
  end_date?: Date;
  results: {
    impressions: number;
    conversions: number;
    conversion_rate: number;
    avg_time_to_payment: number;
    revenue_generated: number;
    statistical_significance: number;
  };
}

interface ABTestResults {
  test_id: string;
  baseline_performance: {
    conversion_rate: number;
    sample_size: number;
    revenue: number;
  };
  variation_performance: {
    conversion_rate: number;
    sample_size: number;
    revenue: number;
  };
  statistical_analysis: {
    p_value: number;
    is_statistically_significant: boolean;
    improvement_rate: number;
    winner: 'baseline' | 'variation' | 'no_winner';
  };
  recommendation: string;
}

export function ABTestManager() {
  const [variations, setVariations] = useState<ContentVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<ContentVariation | null>(null);
  const [testResults, setTestResults] = useState<ABTestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state for creating new variations
  const [newVariation, setNewVariation] = useState({
    variation_name: '',
    test_hypothesis: '',
    variation_description: '',
    traffic_allocation: 0.5,
    target_sample_size: 100,
    content_changes: {
      title: '',
      subtitle: '',
      benefits_changes: ''
    }
  });

  // Mock data for development - in production, fetch from API
  useEffect(() => {
    loadVariations();
  }, []);

  const loadVariations = async () => {
    // Mock data - replace with actual API call
    const mockVariations: ContentVariation[] = [
      {
        id: 'var-1',
        variation_name: 'Career Advancement Focus',
        test_hypothesis: 'Emphasizing career advancement will increase conversions by 15%',
        variation_description: 'Modified headlines and benefits to focus on career growth opportunities',
        test_status: 'active',
        traffic_allocation: 0.5,
        sample_size: 67,
        confidence_level: 0.95,
        statistical_significance: 0.12,
        is_winner: false,
        start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        results: {
          impressions: 134,
          conversions: 23,
          conversion_rate: 17.2,
          avg_time_to_payment: 5400000, // 1.5 hours
          revenue_generated: 11500,
          statistical_significance: 0.12
        }
      },
      {
        id: 'var-2',
        variation_name: 'Trust & Security Emphasis',
        test_hypothesis: 'Highlighting security and trust signals will improve conversion rates',
        variation_description: 'Added testimonials, security badges, and trust indicators',
        test_status: 'completed',
        traffic_allocation: 0.5,
        sample_size: 89,
        confidence_level: 0.95,
        statistical_significance: 0.03,
        is_winner: true,
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        results: {
          impressions: 178,
          conversions: 34,
          conversion_rate: 19.1,
          avg_time_to_payment: 4800000, // 1.3 hours
          revenue_generated: 17000,
          statistical_significance: 0.03
        }
      },
      {
        id: 'var-3',
        variation_name: 'Urgency & Scarcity',
        test_hypothesis: 'Adding urgency elements will reduce decision time and increase conversions',
        variation_description: 'Limited time offers and scarcity messaging',
        test_status: 'paused',
        traffic_allocation: 0.3,
        sample_size: 34,
        confidence_level: 0.95,
        statistical_significance: 0.67,
        is_winner: false,
        start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        results: {
          impressions: 68,
          conversions: 8,
          conversion_rate: 11.8,
          avg_time_to_payment: 3600000, // 1 hour
          revenue_generated: 4000,
          statistical_significance: 0.67
        }
      }
    ];

    setVariations(mockVariations);
  };

  const createVariation = async () => {
    setLoading(true);
    try {
      // Mock API call - implement actual creation
      const createdVariation: ContentVariation = {
        id: `var-${Date.now()}`,
        ...newVariation,
        test_status: 'draft',
        sample_size: 0,
        confidence_level: 0.95,
        is_winner: false,
        results: {
          impressions: 0,
          conversions: 0,
          conversion_rate: 0,
          avg_time_to_payment: 0,
          revenue_generated: 0,
          statistical_significance: 1
        }
      };

      setVariations([...variations, createdVariation]);
      setShowCreateDialog(false);
      
      // Reset form
      setNewVariation({
        variation_name: '',
        test_hypothesis: '',
        variation_description: '',
        traffic_allocation: 0.5,
        target_sample_size: 100,
        content_changes: {
          title: '',
          subtitle: '',
          benefits_changes: ''
        }
      });
      
    } catch (error) {
      console.error('Error creating variation:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (variationId: string) => {
    setLoading(true);
    try {
      // Mock API call - implement actual start test
      setVariations(variations.map(v => 
        v.id === variationId 
          ? { ...v, test_status: 'active', start_date: new Date() }
          : v
      ));
    } catch (error) {
      console.error('Error starting test:', error);
    } finally {
      setLoading(false);
    }
  };

  const pauseTest = async (variationId: string) => {
    setLoading(true);
    try {
      setVariations(variations.map(v => 
        v.id === variationId 
          ? { ...v, test_status: 'paused' }
          : v
      ));
    } catch (error) {
      console.error('Error pausing test:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopTest = async (variationId: string, declareWinner: boolean = false) => {
    setLoading(true);
    try {
      setVariations(variations.map(v => 
        v.id === variationId 
          ? { ...v, test_status: 'completed', is_winner: declareWinner, end_date: new Date() }
          : v
      ));
    } catch (error) {
      console.error('Error stopping test:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      case 'archived': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (startDate?: Date, endDate?: Date) => {
    if (!startDate) return 'Not started';
    const end = endDate || new Date();
    const days = Math.floor((end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  const getSignificanceLevel = (pValue: number) => {
    if (pValue < 0.01) return 'Highly Significant';
    if (pValue < 0.05) return 'Significant';
    if (pValue < 0.1) return 'Marginally Significant';
    return 'Not Significant';
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">A/B Test Management</h3>
          <p className="text-sm text-muted-foreground">
            Create, manage, and analyze content variations
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New A/B Test</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="variation_name">Variation Name</Label>
                  <Input
                    id="variation_name"
                    value={newVariation.variation_name}
                    onChange={(e) => setNewVariation({ ...newVariation, variation_name: e.target.value })}
                    placeholder="e.g., Career Focus Variant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="traffic_allocation">Traffic Split</Label>
                  <Select 
                    value={newVariation.traffic_allocation.toString()} 
                    onValueChange={(value) => setNewVariation({ ...newVariation, traffic_allocation: parseFloat(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.1">10% Traffic</SelectItem>
                      <SelectItem value="0.25">25% Traffic</SelectItem>
                      <SelectItem value="0.5">50% Traffic</SelectItem>
                      <SelectItem value="0.75">75% Traffic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test_hypothesis">Test Hypothesis</Label>
                <Textarea
                  id="test_hypothesis"
                  value={newVariation.test_hypothesis}
                  onChange={(e) => setNewVariation({ ...newVariation, test_hypothesis: e.target.value })}
                  placeholder="What do you expect this variation to achieve?"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="variation_description">Description</Label>
                <Textarea
                  id="variation_description"
                  value={newVariation.variation_description}
                  onChange={(e) => setNewVariation({ ...newVariation, variation_description: e.target.value })}
                  placeholder="Describe the changes in this variation"
                  rows={3}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Content Changes</h4>
                <div className="space-y-2">
                  <Label htmlFor="title_change">New Title (optional)</Label>
                  <Input
                    id="title_change"
                    value={newVariation.content_changes.title}
                    onChange={(e) => setNewVariation({ 
                      ...newVariation, 
                      content_changes: { ...newVariation.content_changes, title: e.target.value }
                    })}
                    placeholder="Modified headline"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle_change">New Subtitle (optional)</Label>
                  <Input
                    id="subtitle_change"
                    value={newVariation.content_changes.subtitle}
                    onChange={(e) => setNewVariation({ 
                      ...newVariation, 
                      content_changes: { ...newVariation.content_changes, subtitle: e.target.value }
                    })}
                    placeholder="Modified subtitle"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createVariation} disabled={!newVariation.variation_name || loading}>
                Create Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Tests Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {variations.filter(v => v.test_status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {variations.reduce((sum, v) => sum + v.results.impressions, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all tests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Winning Variations</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {variations.filter(v => v.is_winner).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Statistically significant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +12.3%
            </div>
            <p className="text-xs text-muted-foreground">
              From winning tests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Variation Cards */}
      <div className="space-y-4">
        {variations.map((variation) => (
          <Card key={variation.id} className="border-l-4" style={{
            borderLeftColor: variation.is_winner ? '#10b981' : 
                           variation.test_status === 'active' ? '#3b82f6' : 
                           '#6b7280'
          }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{variation.variation_name}</CardTitle>
                    <Badge className={`text-white ${getStatusBadgeColor(variation.test_status)}`}>
                      {variation.test_status}
                    </Badge>
                    {variation.is_winner && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <Award className="w-3 h-3 mr-1" />
                        Winner
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {variation.test_hypothesis}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {variation.test_status === 'draft' && (
                    <Button size="sm" onClick={() => startTest(variation.id)}>
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {variation.test_status === 'active' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => pauseTest(variation.id)}>
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => stopTest(variation.id)}>
                        <Stop className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    </>
                  )}
                  {variation.test_status === 'paused' && (
                    <Button size="sm" onClick={() => startTest(variation.id)}>
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {variation.results.conversion_rate.toFixed(1)}%
                    </span>
                    {variation.results.conversion_rate > 15 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Sample Size</p>
                  <div className="space-y-1">
                    <span className="text-lg font-bold">{variation.results.conversions}</span>
                    <div className="text-xs text-muted-foreground">
                      of {variation.results.impressions} impressions
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <span className="text-lg font-bold">
                    ${variation.results.revenue_generated.toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDuration(variation.start_date, variation.end_date)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Significance</p>
                  <div className="space-y-1">
                    <Badge 
                      variant="outline" 
                      className={
                        variation.results.statistical_significance < 0.05 
                          ? 'text-green-600 border-green-600' 
                          : 'text-gray-600 border-gray-600'
                      }
                    >
                      {getSignificanceLevel(variation.results.statistical_significance)}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      p = {variation.results.statistical_significance.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>

              {variation.test_status === 'active' && variation.sample_size < 100 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Need more data for statistical significance
                    </span>
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={(variation.sample_size / 100) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-yellow-700 mt-1">
                      {variation.sample_size}/100 minimum sample size
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {variations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No A/B Tests Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first content variation to start optimizing conversion rates
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Test
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}