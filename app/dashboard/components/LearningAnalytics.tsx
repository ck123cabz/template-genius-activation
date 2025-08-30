"use client";

import { useState, useEffect } from "react";
import { learningService, ContentHypothesis } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Search, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Brain,
  Lightbulb
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AnalyticsSummary {
  total_hypotheses: number;
  validated_count: number;
  invalidated_count: number;
  active_count: number;
  avg_confidence: number;
  total_conversion_lift: number;
  success_rate: number;
  recent_learnings: number;
}

interface ConversionPatterns {
  by_page_type: Record<string, { success_rate: number; avg_lift: number; hypothesis_count: number }>;
  by_change_type: Record<string, { success_rate: number; avg_lift: number; hypothesis_count: number }>;
  success_factors: Array<{ factor: string; impact: number; confidence: number }>;
}

export default function LearningAnalytics() {
  const [hypotheses, setHypotheses] = useState<ContentHypothesis[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [patterns, setPatterns] = useState<ConversionPatterns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filteredHypotheses, setFilteredHypotheses] = useState<ContentHypothesis[]>([]);
  const { toast } = useToast();

  // Load analytics data
  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const [hypothesesData, summaryData, patternsData] = await Promise.all([
          learningService.getAllHypotheses(),
          learningService.getAnalyticsSummary(),
          learningService.getConversionPatterns(),
        ]);

        setHypotheses(hypothesesData);
        setSummary(summaryData);
        setPatterns(patternsData);
        setFilteredHypotheses(hypothesesData);
      } catch (error) {
        console.error("Error loading analytics:", error);
        toast({
          title: "Error loading analytics",
          description: "Using mock data for demonstration",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, [toast]);

  // Filter hypotheses based on search and status
  useEffect(() => {
    let filtered = hypotheses;

    if (searchTerm) {
      filtered = filtered.filter(h => 
        h.hypothesis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.actual_outcome?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(h => h.status === statusFilter);
    }

    setFilteredHypotheses(filtered);
  }, [hypotheses, searchTerm, statusFilter]);

  const handleExportData = async () => {
    try {
      const data = await learningService.exportLearningData('json');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learning-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: "Learning analytics data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export analytics data",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalidated': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'active': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'validated': return 'default';
      case 'invalidated': return 'destructive';
      case 'active': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading learning analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Learning Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Transform learning data into actionable revenue intelligence
          </p>
        </div>
        <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hypotheses</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_hypotheses}</div>
              <p className="text-xs text-muted-foreground">
                {summary.recent_learnings} new this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(summary.success_rate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.validated_count} validated, {summary.invalidated_count} invalidated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Lift</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_conversion_lift > 0 ? '+' : ''}
                {(summary.total_conversion_lift * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Total cumulative impact
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avg_confidence.toFixed(1)}/10</div>
              <p className="text-xs text-muted-foreground">
                Hypothesis confidence level
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Content */}
      <Tabs defaultValue="hypotheses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hypotheses">All Hypotheses</TabsTrigger>
          <TabsTrigger value="patterns">Conversion Patterns</TabsTrigger>
          <TabsTrigger value="insights">Success Factors</TabsTrigger>
        </TabsList>

        {/* Hypotheses List */}
        <TabsContent value="hypotheses" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hypotheses and outcomes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="validated">Validated</SelectItem>
                <SelectItem value="invalidated">Invalidated</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredHypotheses.map((hypothesis) => (
              <Card key={hypothesis.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(hypothesis.status)}
                        <Badge variant={getStatusBadgeVariant(hypothesis.status)}>
                          {hypothesis.status}
                        </Badge>
                        <Badge variant="outline">
                          {hypothesis.change_type}
                        </Badge>
                        {hypothesis.confidence_level && (
                          <Badge variant="outline">
                            Confidence: {hypothesis.confidence_level}/10
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{hypothesis.hypothesis}</CardTitle>
                      {hypothesis.predicted_outcome && (
                        <CardDescription className="mt-2">
                          <strong>Predicted:</strong> {hypothesis.predicted_outcome}
                        </CardDescription>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(hypothesis.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                {hypothesis.actual_outcome && (
                  <CardContent className="pt-0">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {hypothesis.status === 'validated' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <strong>Actual Outcome:</strong>
                      </div>
                      <p>{hypothesis.actual_outcome}</p>
                      {hypothesis.conversion_impact && Object.keys(hypothesis.conversion_impact).length > 0 && (
                        <div className="mt-2 text-sm">
                          <strong>Impact:</strong> {JSON.stringify(hypothesis.conversion_impact)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {filteredHypotheses.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hypotheses found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Start creating hypotheses to see learning analytics"}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Conversion Patterns */}
        <TabsContent value="patterns" className="space-y-4">
          {patterns && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Page Type</CardTitle>
                  <CardDescription>
                    Conversion patterns across journey stages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {Object.entries(patterns.by_page_type).map(([pageType, data]) => (
                      <div key={pageType} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold capitalize">{pageType}</h4>
                          <p className="text-sm text-muted-foreground">
                            {data.hypothesis_count} hypotheses tested
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {(data.success_rate * 100).toFixed(1)}% success
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {data.avg_lift > 0 ? '+' : ''}{(data.avg_lift * 100).toFixed(1)}% avg lift
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance by Change Type</CardTitle>
                  <CardDescription>
                    Effectiveness of different change approaches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {Object.entries(patterns.by_change_type).map(([changeType, data]) => (
                      <div key={changeType} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold capitalize">{changeType} Changes</h4>
                          <p className="text-sm text-muted-foreground">
                            {data.hypothesis_count} hypotheses tested
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {(data.success_rate * 100).toFixed(1)}% success
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {data.avg_lift > 0 ? '+' : ''}{(data.avg_lift * 100).toFixed(1)}% avg lift
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Success Factors */}
        <TabsContent value="insights" className="space-y-4">
          {patterns && (
            <Card>
              <CardHeader>
                <CardTitle>Key Success Factors</CardTitle>
                <CardDescription>
                  Patterns that consistently drive conversion improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {patterns.success_factors.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Lightbulb className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{factor.factor}</h4>
                          <p className="text-sm text-muted-foreground">
                            {(factor.confidence * 100).toFixed(0)}% confidence level
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          +{(factor.impact * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          conversion impact
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}