"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Search,
  Filter,
  FileText,
  Clock,
  DollarSign,
  Target,
  AlertTriangle,
  Lightbulb,
  Building2,
  TrendingUp,
  Star,
} from "lucide-react";
import { getAllJourneyOutcomes } from "@/app/actions/outcome-actions";
import { Client } from "@/lib/supabase";

// Type for journey outcome with client data
interface JourneyOutcomeWithClient {
  id: number;
  client_id: number;
  journey_outcome: string;
  outcome_notes?: string;
  revenue_amount?: number;
  timeline_notes?: string;
  behavior_observations?: string;
  revenue_intelligence?: string;
  competitive_notes?: string;
  actionable_insights?: string;
  outcome_tags?: string;
  learning_priority?: string;
  recorded_at: string;
  clients: {
    company: string;
    contact: string;
    email: string;
    hypothesis?: string;
  };
  metadata?: {
    has_detailed_notes?: boolean;
    tags_array?: string[];
    notes_version?: string;
  };
}

interface NotesSearchPanelProps {
  className?: string;
}

export function NotesSearchPanel({ className = "" }: NotesSearchPanelProps) {
  const [outcomes, setOutcomes] = useState<JourneyOutcomeWithClient[]>([]);
  const [filteredOutcomes, setFilteredOutcomes] = useState<JourneyOutcomeWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedOutcome, setSelectedOutcome] = useState<JourneyOutcomeWithClient | null>(null);

  useEffect(() => {
    loadOutcomes();
  }, []);

  useEffect(() => {
    filterOutcomes();
  }, [searchQuery, outcomeFilter, priorityFilter, outcomes]);

  const loadOutcomes = async () => {
    try {
      setLoading(true);
      const result = await getAllJourneyOutcomes();
      
      if (result.success && result.outcomes) {
        // Filter to only outcomes with detailed notes (Story 2.3)
        const detailedOutcomes = result.outcomes.filter(outcome => 
          outcome.metadata?.has_detailed_notes || 
          outcome.timeline_notes || 
          outcome.behavior_observations || 
          outcome.revenue_intelligence ||
          outcome.competitive_notes ||
          outcome.actionable_insights
        ) as JourneyOutcomeWithClient[];
        
        setOutcomes(detailedOutcomes);
      }
    } catch (error) {
      console.error("Error loading outcomes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOutcomes = () => {
    let filtered = [...outcomes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(outcome => {
        const searchableText = [
          outcome.clients?.company,
          outcome.outcome_notes,
          outcome.timeline_notes,
          outcome.behavior_observations,
          outcome.revenue_intelligence,
          outcome.competitive_notes,
          outcome.actionable_insights,
          outcome.outcome_tags,
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(query);
      });
    }

    // Outcome filter
    if (outcomeFilter !== "all") {
      filtered = filtered.filter(outcome => outcome.journey_outcome === outcomeFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(outcome => outcome.learning_priority === priorityFilter);
    }

    setFilteredOutcomes(filtered);
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "ghosted":
        return "bg-red-100 text-red-800 border-red-200";
      case "declined":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "negotiating":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <Star className="w-4 h-4 text-red-500 fill-red-500" />;
      case "medium":
        return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
      default:
        return <Star className="w-4 h-4 text-gray-400" />;
    }
  };

  const highlightSearchTerm = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Notes Search & Pattern Recognition</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading detailed notes...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Notes Search & Pattern Recognition</span>
          <Badge variant="outline" className="ml-2">
            Story 2.3
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Search through detailed outcome notes to identify patterns and insights
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search in notes, company names, behaviors, insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
              Clear
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="ghosted">Ghosted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Search Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Search Results ({filteredOutcomes.length} of {outcomes.length})
            </h3>
          </div>

          {filteredOutcomes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery.trim() || outcomeFilter !== "all" || priorityFilter !== "all" 
                  ? "No notes match your search criteria" 
                  : "No detailed notes found"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredOutcomes.map((outcome) => (
                <Card key={outcome.id} className="border border-muted hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{outcome.clients?.company}</span>
                        <Badge className={getOutcomeColor(outcome.journey_outcome)} variant="outline">
                          {outcome.journey_outcome}
                        </Badge>
                        {getPriorityIcon(outcome.learning_priority || 'medium')}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(outcome.recorded_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Revenue Information */}
                    {outcome.revenue_amount && (
                      <div className="flex items-center space-x-1 mb-2">
                        <DollarSign className="w-3 h-3 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          ${outcome.revenue_amount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {outcome.outcome_tags && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {outcome.outcome_tags.split(',').map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {highlightSearchTerm(tag.trim(), searchQuery)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Preview of notes content */}
                    <div className="space-y-1">
                      {outcome.revenue_intelligence && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          <strong>Revenue Intelligence:</strong> {highlightSearchTerm(outcome.revenue_intelligence.substring(0, 100) + "...", searchQuery)}
                        </p>
                      )}
                      {outcome.behavior_observations && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          <strong>Behavior:</strong> {highlightSearchTerm(outcome.behavior_observations.substring(0, 100) + "...", searchQuery)}
                        </p>
                      )}
                      {outcome.actionable_insights && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          <strong>Insights:</strong> {highlightSearchTerm(outcome.actionable_insights.substring(0, 100) + "...", searchQuery)}
                        </p>
                      )}
                    </div>

                    {/* View Details Button */}
                    <div className="mt-3 pt-2 border-t">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            View Full Notes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <FileText className="w-5 h-5" />
                              <span>Detailed Notes - {outcome.clients?.company}</span>
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Client Summary */}
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Client Summary</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong>Company:</strong> {outcome.clients?.company}
                                  </div>
                                  <div>
                                    <strong>Contact:</strong> {outcome.clients?.contact}
                                  </div>
                                  <div>
                                    <strong>Outcome:</strong> 
                                    <Badge className={`ml-2 ${getOutcomeColor(outcome.journey_outcome)}`} variant="outline">
                                      {outcome.journey_outcome}
                                    </Badge>
                                  </div>
                                  <div>
                                    <strong>Revenue:</strong> {outcome.revenue_amount ? `$${outcome.revenue_amount.toLocaleString()}` : 'N/A'}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Detailed Notes Sections */}
                            {outcome.timeline_notes && (
                              <div className="space-y-2">
                                <Label className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4" />
                                  <span>Timeline of Events</span>
                                </Label>
                                <Card>
                                  <CardContent className="p-4">
                                    <pre className="whitespace-pre-wrap text-sm font-mono">
                                      {highlightSearchTerm(outcome.timeline_notes, searchQuery)}
                                    </pre>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {outcome.behavior_observations && (
                              <div className="space-y-2">
                                <Label className="flex items-center space-x-2">
                                  <Target className="w-4 h-4" />
                                  <span>Client Behavior & Patterns</span>
                                </Label>
                                <Card>
                                  <CardContent className="p-4">
                                    <p className="text-sm whitespace-pre-wrap">
                                      {highlightSearchTerm(outcome.behavior_observations, searchQuery)}
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {outcome.revenue_intelligence && (
                              <div className="space-y-2">
                                <Label className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4" />
                                  <span>Revenue Intelligence</span>
                                </Label>
                                <Card>
                                  <CardContent className="p-4">
                                    <pre className="whitespace-pre-wrap text-sm">
                                      {highlightSearchTerm(outcome.revenue_intelligence, searchQuery)}
                                    </pre>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {outcome.competitive_notes && (
                              <div className="space-y-2">
                                <Label className="flex items-center space-x-2">
                                  <TrendingUp className="w-4 h-4" />
                                  <span>Competitive Analysis</span>
                                </Label>
                                <Card>
                                  <CardContent className="p-4">
                                    <pre className="whitespace-pre-wrap text-sm">
                                      {highlightSearchTerm(outcome.competitive_notes, searchQuery)}
                                    </pre>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {outcome.actionable_insights && (
                              <div className="space-y-2">
                                <Label className="flex items-center space-x-2">
                                  <Lightbulb className="w-4 h-4" />
                                  <span>Actionable Insights</span>
                                </Label>
                                <Card>
                                  <CardContent className="p-4">
                                    <pre className="whitespace-pre-wrap text-sm">
                                      {highlightSearchTerm(outcome.actionable_insights, searchQuery)}
                                    </pre>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}